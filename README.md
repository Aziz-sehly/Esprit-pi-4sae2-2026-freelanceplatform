# ProLance Communication Backend (Microservices)

Spring Boot microservices backend for **Messages** and **Disputes**, modeled after the AWD-Training workshop style (Eureka + service-to-service communication).

## Services

- `eureka-server` (port `8761`)
- `api-gateway` (port `8080`)
- `message-service` (port `8082`)
- `dispute-service` (port `8083`)

`dispute-service` uses **OpenFeign** to call `message-service` and expose an enriched endpoint:

- `GET /api/disputes/{id}/details`

## Quick Start

1. Start `eureka-server`
2. Start `message-service`
3. Start `dispute-service`
4. Start `api-gateway`

Then open Eureka dashboard: `http://localhost:8761`

## Gateway Routes

- `http://localhost:8080/messages/**` -> `message-service` (`/api/messages/**`)
- `http://localhost:8080/disputes/**` -> `dispute-service` (`/api/disputes/**`)

Examples:

- `GET http://localhost:8080/messages/contracts/10`
- `GET http://localhost:8080/disputes/1/details`

## Notes

- Database: H2 in-memory per service (easy local dev)
- Discovery: Eureka service registry
- Inter-service: OpenFeign (`dispute-service` -> `message-service`)
- Entry point for clients: `api-gateway`
