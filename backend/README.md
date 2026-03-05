# ProLance Communication Backend

Spring Boot microservices for **Messages** and **Disputes**.

## Services

| Service        | Port |
|----------------|------|
| eureka-server  | 8761 |
| api-gateway    | 8080 |
| message-service| 8082 |
| dispute-service| 8083 |

## Start Order

1. eureka-server
2. message-service
3. dispute-service
4. api-gateway

## Run Each Service

```bash
cd eureka-server && mvn spring-boot:run
cd message-service && mvn spring-boot:run
cd dispute-service && mvn spring-boot:run
cd api-gateway && mvn spring-boot:run
```

## Gateway Routes

- `/messages/**` → message-service
- `/disputes/**` → dispute-service
