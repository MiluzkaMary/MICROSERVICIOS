package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"

	"servidor-perfiles/internal/api"
	"servidor-perfiles/internal/config"
	"servidor-perfiles/internal/rabbitmq"
	"servidor-perfiles/internal/repository"
	"servidor-perfiles/internal/service"
	"servidor-perfiles/internal/telemetry"
)

func main() {
	cfg := config.Load()
	shutdownTelemetry := telemetry.Init(context.Background())
	defer func() {
		if err := shutdownTelemetry(context.Background()); err != nil {
			log.Printf("error cerrando telemetria: %v", err)
		}
	}()

	db, err := sql.Open("pgx", cfg.DatabaseDSN())
	if err != nil {
		log.Fatalf("error abriendo base de datos: %v", err)
	}
	defer db.Close()

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)

	repo := repository.NewPostgreSQLRepository(db)
	perfilService := service.NewPerfilService(repo)
	router := api.NewRouter(perfilService, cfg.JWTSecret)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	consumer := rabbitmq.NewConsumer(rabbitmq.Config{
		Host:     cfg.RabbitMQ.Host,
		Port:     cfg.RabbitMQ.Port,
		User:     cfg.RabbitMQ.User,
		Password: cfg.RabbitMQ.Password,
	}, perfilService)
	go func() {
		if err := consumer.Start(ctx); err != nil && ctx.Err() == nil {
			log.Printf("error en RabbitMQ: %v", err)
		}
	}()

	server := &http.Server{Addr: cfg.ServerAddr(), Handler: router}
	go func() {
		log.Printf("Servidor de Perfiles corriendo en %s", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("error iniciando servidor: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("cerrando servidor de perfiles")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("error cerrando servidor: %v", err)
	}
	if err := consumer.Close(); err != nil {
		log.Printf("error cerrando RabbitMQ: %v", err)
	}
}
