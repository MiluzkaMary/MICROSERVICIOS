package rabbitmq

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"

	"servidor-perfiles/internal/domain"
)

type Config struct {
	Host     string
	Port     int
	User     string
	Password string
}

type PerfilProcessor interface {
	CreateProfileFromEvent(context.Context, domain.EventoEmpleadoCreado) domain.APIResponse
	DeactivateProfile(context.Context, string) domain.APIResponse
	ReactivateProfile(context.Context, string) domain.APIResponse
}

type Consumer struct {
	cfg     Config
	service PerfilProcessor
	conn    *amqp.Connection
	ch      *amqp.Channel
}

const (
	exchangeName              = "empleados_events"
	queueEmpleadoCreado       = "perfiles.empleado_creado"
	queueEmpleadoEliminado    = "perfiles.empleado_eliminado"
	queueEmpleadoReactivado   = "perfiles.empleado_reactivado"
	routingEmpleadoCreado     = "empleado.creado"
	routingEmpleadoEliminado  = "empleado.eliminado"
	routingEmpleadoReactivado = "empleado.reactivado"
)

func NewConsumer(cfg Config, service PerfilProcessor) *Consumer {
	return &Consumer{cfg: cfg, service: service}
}

func (c *Consumer) Start(ctx context.Context) error {
	var err error
	for attempt := 0; attempt < 5; attempt++ {
		c.conn, err = amqp.Dial(c.url())
		if err == nil {
			break
		}
		log.Printf("RabbitMQ intento %d falló: %v", attempt+1, err)
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		return err
	}

	c.ch, err = c.conn.Channel()
	if err != nil {
		return err
	}

	if err := c.ch.ExchangeDeclare(exchangeName, "topic", true, false, false, false, nil); err != nil {
		return err
	}

	queues := []struct {
		name       string
		routingKey string
		handler    func(context.Context, []byte) error
	}{
		{queueEmpleadoCreado, routingEmpleadoCreado, c.handleEmpleadoCreado},
		{queueEmpleadoEliminado, routingEmpleadoEliminado, c.handleEmpleadoEliminado},
		{queueEmpleadoReactivado, routingEmpleadoReactivado, c.handleEmpleadoReactivado},
	}

	for _, q := range queues {
		if _, err := c.ch.QueueDeclare(q.name, true, false, false, false, nil); err != nil {
			return err
		}
		if err := c.ch.QueueBind(q.name, q.routingKey, exchangeName, false, nil); err != nil {
			return err
		}
		msgs, err := c.ch.Consume(q.name, "", false, false, false, false, nil)
		if err != nil {
			return err
		}
		go c.consumeLoop(ctx, msgs, q.handler)
	}

	<-ctx.Done()
	return c.Close()
}

func (c *Consumer) consumeLoop(ctx context.Context, msgs <-chan amqp.Delivery, handler func(context.Context, []byte) error) {
	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-msgs:
			if !ok {
				return
			}
			if err := handler(ctx, msg.Body); err != nil {
				log.Printf("error procesando mensaje: %v", err)
				_ = msg.Nack(false, true)
				continue
			}
			_ = msg.Ack(false)
		}
	}
}

func (c *Consumer) handleEmpleadoCreado(ctx context.Context, body []byte) error {
	var event domain.EventoEmpleadoCreado
	if err := json.Unmarshal(body, &event); err != nil {
		return err
	}
	result := c.service.CreateProfileFromEvent(ctx, event)
	if !result.Success {
		return fmt.Errorf(result.Message)
	}
	return nil
}

func (c *Consumer) handleEmpleadoEliminado(ctx context.Context, body []byte) error {
	var event domain.EventoEmpleadoCreado
	if err := json.Unmarshal(body, &event); err != nil {
		return err
	}
	result := c.service.DeactivateProfile(ctx, event.EmpleadoID)
	if !result.Success {
		return fmt.Errorf(result.Message)
	}
	return nil
}

func (c *Consumer) handleEmpleadoReactivado(ctx context.Context, body []byte) error {
	var event domain.EventoEmpleadoCreado
	if err := json.Unmarshal(body, &event); err != nil {
		return err
	}
	result := c.service.ReactivateProfile(ctx, event.EmpleadoID)
	if !result.Success {
		return fmt.Errorf(result.Message)
	}
	return nil
}

func (c *Consumer) Close() error {
	if c.ch != nil {
		if err := c.ch.Close(); err != nil {
			return err
		}
	}
	if c.conn != nil {
		if err := c.conn.Close(); err != nil {
			return err
		}
	}
	return nil
}

func (c *Consumer) url() string {
	return fmt.Sprintf("amqp://%s:%s@%s:%d/", c.cfg.User, c.cfg.Password, c.cfg.Host, c.cfg.Port)
}
