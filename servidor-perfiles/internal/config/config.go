package config

import (
	"fmt"
	"os"
	"strconv"
)

type RabbitMQConfig struct {
	Host     string
	Port     int
	User     string
	Password string
}

type Config struct {
	Port      string
	DBHost    string
	DBPort    int
	DBUser    string
	DBPass    string
	DBName    string
	JWTSecret string
	RabbitMQ  RabbitMQConfig
}

func Load() Config {
	return Config{
		Port:      getEnv("PORT", "8082"),
		DBHost:    getEnv("DB_HOST", "localhost"),
		DBPort:    getEnvInt("DB_PORT", 5432),
		DBUser:    getEnv("DB_USER", "postgres"),
		DBPass:    getEnv("DB_PASSWORD", "postgres"),
		DBName:    getEnv("DB_NAME", "perfiles_db"),
		JWTSecret: getEnv("JWT_SECRET", "secret-key-cambiar-en-produccion"),
		RabbitMQ: RabbitMQConfig{
			Host:     getEnv("RABBITMQ_HOST", "localhost"),
			Port:     getEnvInt("RABBITMQ_PORT", 5672),
			User:     getEnv("RABBITMQ_USER", "guest"),
			Password: getEnv("RABBITMQ_PASSWORD", "guest"),
		},
	}
}

func (c Config) ServerAddr() string {
	return ":" + c.Port
}

func (c Config) DatabaseDSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable", c.DBUser, c.DBPass, c.DBHost, c.DBPort, c.DBName)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
