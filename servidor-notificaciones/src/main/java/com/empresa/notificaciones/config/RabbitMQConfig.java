package com.empresa.notificaciones.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de RabbitMQ para el Servicio de Notificaciones.
 * Equivalente a src/config/rabbitmq.js.
 *
 * Exchange: empleados_events (topic)
 * Routing keys:
 *   - empleado.creado       -> notificaciones.empleado_creado
 *   - empleado.eliminado    -> notificaciones.empleado_eliminado
 *   - empleado.reactivado   -> notificaciones.empleado_reactivado
 *   - usuario.creado        -> notificaciones.usuario_creado
 *   - usuario.recuperacion  -> notificaciones.usuario_recuperacion
 */
@Configuration
public class RabbitMQConfig {

    // ── Exchange ──────────────────────────────────────────────────────────────
    public static final String EXCHANGE_NAME = "empleados_events";

    // ── Queues ────────────────────────────────────────────────────────────────
    public static final String QUEUE_CREADO         = "notificaciones.empleado_creado";
    public static final String QUEUE_ELIMINADO      = "notificaciones.empleado_eliminado";
    public static final String QUEUE_REACTIVADO     = "notificaciones.empleado_reactivado";
    public static final String QUEUE_USUARIO_CREADO = "notificaciones.usuario_creado";
    public static final String QUEUE_USUARIO_RECUP  = "notificaciones.usuario_recuperacion";

    // ── Routing Keys ──────────────────────────────────────────────────────────
    public static final String RK_CREADO         = "empleado.creado";
    public static final String RK_ELIMINADO      = "empleado.eliminado";
    public static final String RK_REACTIVADO     = "empleado.reactivado";
    public static final String RK_USUARIO_CREADO = "usuario.creado";
    public static final String RK_USUARIO_RECUP  = "usuario.recuperacion";

    // ── Exchange Bean ─────────────────────────────────────────────────────────
    @Bean
    public TopicExchange empleadosExchange() {
        return ExchangeBuilder.topicExchange(EXCHANGE_NAME).durable(true).build();
    }

    // ── Queue Beans ───────────────────────────────────────────────────────────
    @Bean public Queue queueCreado()        { return QueueBuilder.durable(QUEUE_CREADO).build(); }
    @Bean public Queue queueEliminado()     { return QueueBuilder.durable(QUEUE_ELIMINADO).build(); }
    @Bean public Queue queueReactivado()    { return QueueBuilder.durable(QUEUE_REACTIVADO).build(); }
    @Bean public Queue queueUsuarioCreado() { return QueueBuilder.durable(QUEUE_USUARIO_CREADO).build(); }
    @Bean public Queue queueUsuarioRecup()  { return QueueBuilder.durable(QUEUE_USUARIO_RECUP).build(); }

    // ── Bindings ──────────────────────────────────────────────────────────────
    @Bean
    public Binding bindingCreado(Queue queueCreado, TopicExchange empleadosExchange) {
        return BindingBuilder.bind(queueCreado).to(empleadosExchange).with(RK_CREADO);
    }

    @Bean
    public Binding bindingEliminado(Queue queueEliminado, TopicExchange empleadosExchange) {
        return BindingBuilder.bind(queueEliminado).to(empleadosExchange).with(RK_ELIMINADO);
    }

    @Bean
    public Binding bindingReactivado(Queue queueReactivado, TopicExchange empleadosExchange) {
        return BindingBuilder.bind(queueReactivado).to(empleadosExchange).with(RK_REACTIVADO);
    }

    @Bean
    public Binding bindingUsuarioCreado(Queue queueUsuarioCreado, TopicExchange empleadosExchange) {
        return BindingBuilder.bind(queueUsuarioCreado).to(empleadosExchange).with(RK_USUARIO_CREADO);
    }

    @Bean
    public Binding bindingUsuarioRecup(Queue queueUsuarioRecup, TopicExchange empleadosExchange) {
        return BindingBuilder.bind(queueUsuarioRecup).to(empleadosExchange).with(RK_USUARIO_RECUP);
    }

    // ── Serialización JSON ────────────────────────────────────────────────────
    @Bean
    public MessageConverter jacksonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jacksonMessageConverter());
        return template;
    }
}
