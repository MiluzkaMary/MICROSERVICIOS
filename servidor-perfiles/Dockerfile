FROM golang:1.23-alpine AS builder

WORKDIR /app

RUN i=0; \
    until [ $i -ge 5 ]; do \
      apk add --no-cache git ca-certificates && break; \
      i=$((i+1)); \
      echo "[retry] apk add intento ${i}/5"; \
      sleep 3; \
    done; \
    [ $i -lt 5 ]

COPY go.mod go.sum ./
COPY vendor ./vendor

COPY . ./

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -mod=vendor -o /bin/perfiles ./cmd/perfiles

FROM alpine:3.20

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

WORKDIR /app

COPY --from=builder /bin/perfiles /app/perfiles

EXPOSE 8082

ENV PORT=8082 \
    DB_HOST=database-perfiles \
    DB_PORT=5432 \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    DB_NAME=perfiles_db \
    RABBITMQ_HOST=rabbitmq \
    RABBITMQ_PORT=5672 \
    RABBITMQ_USER=guest \
    RABBITMQ_PASSWORD=guest

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8082/health >/dev/null 2>&1 || exit 1

USER app

CMD ["/app/perfiles"]

