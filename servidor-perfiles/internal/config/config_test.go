package config

import (
	"os"
	"testing"
)

func TestLoadConfigDefaults(t *testing.T) {
	// Clear environment variables to test defaults
	vars := []string{"PORT", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET", "RABBITMQ_HOST", "RABBITMQ_PORT", "RABBITMQ_USER", "RABBITMQ_PASSWORD"}
	oldVars := make(map[string]string)
	for _, v := range vars {
		oldVars[v] = os.Getenv(v)
		os.Unsetenv(v)
	}
	defer func() {
		for k, v := range oldVars {
			if v != "" {
				os.Setenv(k, v)
			}
		}
	}()

	config := Load()

	if config.Port != "8082" {
		t.Errorf("Expected Port 8082, got %s", config.Port)
	}
	if config.DBHost != "localhost" {
		t.Errorf("Expected DBHost localhost, got %s", config.DBHost)
	}
	if config.DBPort != 5432 {
		t.Errorf("Expected DBPort 5432, got %d", config.DBPort)
	}
	if config.DBUser != "postgres" {
		t.Errorf("Expected DBUser postgres, got %s", config.DBUser)
	}
	if config.DBName != "perfiles_db" {
		t.Errorf("Expected DBName perfiles_db, got %s", config.DBName)
	}
	if config.RabbitMQ.Host != "localhost" {
		t.Errorf("Expected RabbitMQ Host localhost, got %s", config.RabbitMQ.Host)
	}
	if config.RabbitMQ.Port != 5672 {
		t.Errorf("Expected RabbitMQ Port 5672, got %d", config.RabbitMQ.Port)
	}
}

func TestLoadConfigFromEnv(t *testing.T) {
	// Save old values
	oldPort := os.Getenv("PORT")
	oldDBHost := os.Getenv("DB_HOST")
	oldDBPort := os.Getenv("DB_PORT")
	oldRabbitHost := os.Getenv("RABBITMQ_HOST")

	defer func() {
		os.Setenv("PORT", oldPort)
		os.Setenv("DB_HOST", oldDBHost)
		os.Setenv("DB_PORT", oldDBPort)
		os.Setenv("RABBITMQ_HOST", oldRabbitHost)
	}()

	// Set test values
	os.Setenv("PORT", "9000")
	os.Setenv("DB_HOST", "test-db-host")
	os.Setenv("DB_PORT", "5433")
	os.Setenv("RABBITMQ_HOST", "test-rabbit-host")

	config := Load()

	if config.Port != "9000" {
		t.Errorf("Expected Port 9000, got %s", config.Port)
	}
	if config.DBHost != "test-db-host" {
		t.Errorf("Expected DBHost test-db-host, got %s", config.DBHost)
	}
	if config.DBPort != 5433 {
		t.Errorf("Expected DBPort 5433, got %d", config.DBPort)
	}
	if config.RabbitMQ.Host != "test-rabbit-host" {
		t.Errorf("Expected RabbitMQ Host test-rabbit-host, got %s", config.RabbitMQ.Host)
	}
}

func TestServerAddr(t *testing.T) {
	oldPort := os.Getenv("PORT")
	defer os.Setenv("PORT", oldPort)

	os.Setenv("PORT", "8080")
	config := Load()

	expected := ":8080"
	if config.ServerAddr() != expected {
		t.Errorf("Expected ServerAddr %s, got %s", expected, config.ServerAddr())
	}
}

func TestDatabaseDSN(t *testing.T) {
	oldVars := map[string]string{
		"DB_USER":     os.Getenv("DB_USER"),
		"DB_PASSWORD": os.Getenv("DB_PASSWORD"),
		"DB_HOST":     os.Getenv("DB_HOST"),
		"DB_PORT":     os.Getenv("DB_PORT"),
		"DB_NAME":     os.Getenv("DB_NAME"),
	}
	defer func() {
		for k, v := range oldVars {
			if v != "" {
				os.Setenv(k, v)
			} else {
				os.Unsetenv(k)
			}
		}
	}()

	os.Setenv("DB_USER", "testuser")
	os.Setenv("DB_PASSWORD", "testpass")
	os.Setenv("DB_HOST", "testhost")
	os.Setenv("DB_PORT", "5432")
	os.Setenv("DB_NAME", "testdb")

	config := Load()
	dsn := config.DatabaseDSN()

	if dsn != "postgres://testuser:testpass@testhost:5432/testdb?sslmode=disable" {
		t.Errorf("Expected DSN postgres://testuser:testpass@testhost:5432/testdb?sslmode=disable, got %s", dsn)
	}
}

func TestRabbitMQConfig(t *testing.T) {
	oldVars := map[string]string{
		"RABBITMQ_HOST":     os.Getenv("RABBITMQ_HOST"),
		"RABBITMQ_PORT":     os.Getenv("RABBITMQ_PORT"),
		"RABBITMQ_USER":     os.Getenv("RABBITMQ_USER"),
		"RABBITMQ_PASSWORD": os.Getenv("RABBITMQ_PASSWORD"),
	}
	defer func() {
		for k, v := range oldVars {
			if v != "" {
				os.Setenv(k, v)
			} else {
				os.Unsetenv(k)
			}
		}
	}()

	os.Setenv("RABBITMQ_HOST", "rabbit.example.com")
	os.Setenv("RABBITMQ_PORT", "5673")
	os.Setenv("RABBITMQ_USER", "rabbituser")
	os.Setenv("RABBITMQ_PASSWORD", "rabbitpass")

	config := Load()

	if config.RabbitMQ.Host != "rabbit.example.com" {
		t.Errorf("Expected RabbitMQ Host rabbit.example.com, got %s", config.RabbitMQ.Host)
	}
	if config.RabbitMQ.Port != 5673 {
		t.Errorf("Expected RabbitMQ Port 5673, got %d", config.RabbitMQ.Port)
	}
	if config.RabbitMQ.User != "rabbituser" {
		t.Errorf("Expected RabbitMQ User rabbituser, got %s", config.RabbitMQ.User)
	}
	if config.RabbitMQ.Password != "rabbitpass" {
		t.Errorf("Expected RabbitMQ Password rabbitpass, got %s", config.RabbitMQ.Password)
	}
}

func TestInvalidPortFallback(t *testing.T) {
	oldPort := os.Getenv("DB_PORT")
	defer os.Setenv("DB_PORT", oldPort)

	os.Setenv("DB_PORT", "not-a-number")
	config := Load()

	if config.DBPort != 5432 {
		t.Errorf("Expected DBPort fallback to 5432 for invalid value, got %d", config.DBPort)
	}
}

func TestInvalidRabbitMQPortFallback(t *testing.T) {
	oldPort := os.Getenv("RABBITMQ_PORT")
	defer os.Setenv("RABBITMQ_PORT", oldPort)

	os.Setenv("RABBITMQ_PORT", "invalid")
	config := Load()

	if config.RabbitMQ.Port != 5672 {
		t.Errorf("Expected RabbitMQ Port fallback to 5672 for invalid value, got %d", config.RabbitMQ.Port)
	}
}
