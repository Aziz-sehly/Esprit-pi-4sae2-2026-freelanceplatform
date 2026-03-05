# ProLance - Messaging & Disputes Application

Full-stack messaging and dispute management application for the ProLance platform.

**Author:** Mohamed Sadok Slimen  
**Class:** 4SAE2  
**Academic Year:** 2025-2026

---

## Architecture

- **Frontend (Angular):** User interface (this project root)
- **Backend (Spring Boot):** Microservices in `/backend` folder
  - Eureka Server (8761)
  - API Gateway (8080)
  - Message Service (8082)
  - Dispute Service (8083)

---

## Prerequisites

- Node.js 18+
- npm or yarn
- Java 17+ (for backend)
- Maven (for backend)

---

## Quick Start

### 1. Start the Backend

From the `backend` folder, start services in this order:

```bash
cd backend

# Terminal 1 - Eureka
cd eureka-server && mvn spring-boot:run

# Terminal 2 - Message Service
cd message-service && mvn spring-boot:run

# Terminal 3 - Dispute Service
cd dispute-service && mvn spring-boot:run

# Terminal 4 - API Gateway
cd api-gateway && mvn spring-boot:run
```

Eureka dashboard: `http://localhost:8761`

### 2. Start the Frontend

```bash
npm install
ng serve
```

Open `http://localhost:4200`

---

## Proxy Configuration

The proxy (`proxy.conf.json`) routes requests to:

- `/messages` → API Gateway (8080)
- `/disputes` → API Gateway (8080)
- `/ws` → Message Service (8082) - WebSocket
- `/messages-upload` → Message Service (8082)

---

## Features

### Messaging
- Real-time messages (WebSocket)
- Online/offline presence indicator
- Emoji reactions
- Thread replies
- Attachments (images, audio)
- Voice messages
- Translation (EN/FR)
- Conversation tags
- User blocking
- Offline mode

### Disputes
- Create and manage disputes
- Dispute details with linked messages

### Administration
- Message analytics
- Block management
- Message audit

---

## Gateway Routes

- `http://localhost:8080/messages/**` → message-service
- `http://localhost:8080/disputes/**` → dispute-service

---

## Technologies

- **Frontend:** Angular 19, Keycloak (authentication)
- **Backend:** Spring Boot, Eureka, Spring Cloud Gateway, OpenFeign
- **Database:** H2 (development)
