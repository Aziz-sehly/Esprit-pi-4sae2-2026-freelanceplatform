# ProLance - Project Explanation & Oral Preparation
## SAE Sprint 1 - Spring-Angular Evaluation Grid

**Author:** Mohamed Sadok Slimen | **Class:** 4SAE2 | **Academic Year:** 2025-2026

---

# PART 1: FULL PROJECT EXPLANATION

## 1. Project Overview

**ProLance** is a full-stack messaging and dispute management application for a freelance platform. It consists of:

- **Frontend:** Angular 19 application (port 4200)
- **Backend:** 4 Spring Boot microservices (Eureka, API Gateway, Message Service, Dispute Service)
- **Authentication:** Keycloak (OAuth2/JWT)

---

## 2. Architecture (AA2 - C2)

### Microservices

| Service | Port | Role |
|---------|------|------|
| **Eureka Server** | 8761 | Service registry – all services register here |
| **API Gateway** | 8080 | Single entry point, routes requests to microservices |
| **Message Service** | 8082 | Messages CRUD, WebSocket, reactions, tags, blocking |
| **Dispute Service** | 8083 | Disputes CRUD, calls message-service via OpenFeign |

### Flow

```
Angular (4200) 
    → Proxy (/messages, /disputes) 
    → API Gateway (8080) 
    → Eureka (finds message-service or dispute-service)
    → Target microservice (8082 or 8083)
```

### Gateway Routes

- `/messages/**` → `lb://message-service` (rewrite to `/api/messages/**`)
- `/disputes/**` → `lb://dispute-service` (rewrite to `/api/disputes/**`)
- `/ws/**` → `lb://message-service` (WebSocket, no rewrite)

`lb://` = load balancing via Eureka (service discovery).

---

## 3. CRUD & Business Logic (AA1 - C1)

### Message Service – CRUD

| Operation | HTTP | Endpoint | Description |
|-----------|------|----------|-------------|
| Create | POST | `/api/messages` | Create message |
| Read | GET | `/api/messages/{id}` | Get by ID |
| Read | GET | `/api/messages` | List (filter by contractId, userId) |
| Update | PUT | `/api/messages/{id}` | Edit content |
| Update | PATCH | `/api/messages/{id}/read` | Mark as read |
| Delete | DELETE | `/api/messages/{id}` | Delete message |

### Dispute Service – CRUD

| Operation | HTTP | Endpoint |
|-----------|------|----------|
| Create | POST | `/api/disputes` |
| Read | GET | `/api/disputes/{id}` |
| Read | GET | `/api/disputes` |
| Update | PUT | `/api/disputes/{id}` |
| Delete | DELETE | `/api/disputes/{id}` |

### Advanced Features (entirely coded)

- **WebSocket:** Real-time typing, presence, new messages (STOMP/SockJS)
- **Emoji reactions:** Add/remove reactions on messages
- **Threads:** Reply to messages, view thread
- **User blocking:** Block/unblock users
- **Conversation tags:** Tag conversations
- **Message audit:** Log CREATE, READ, UPDATE, DELETE
- **Ephemeral messages:** Auto-delete after X seconds
- **Scheduled messages:** Send at a future time
- **File upload:** Images, audio, voice messages
- **Offline mode:** Queue messages when offline, send when back online
- **Translation:** EN/FR via MyMemory API (external)
- **Admin analytics:** Stats on messages, reactions, attachments

---

## 4. Angular – API Integration (AA3 - C3)

### Request Flow

1. **Angular** calls `MessageService.create(request)` (HttpClient)
2. Request goes to `/messages` (proxy in dev)
3. **Proxy** forwards to `http://localhost:8080/messages`
4. **API Gateway** receives, rewrites to `/api/messages`, forwards to message-service
5. **Message-service** processes, returns JSON
6. **Angular** receives response and updates UI

### Key Frontend Services

- **MessageService:** HTTP calls to `/messages` (CRUD, reactions, tags, translate)
- **MessageWebSocketService:** STOMP over SockJS to `/ws/messages` (typing, presence, new messages)
- **DisputeService:** HTTP calls to `/disputes`
- **AuthService:** Keycloak (login, logout, token)

### Proxy Configuration (`proxy.conf.json`)

- `/messages` → Gateway 8080
- `/disputes` → Gateway 8080
- `/ws` → Message-service 8082 (WebSocket)
- `/messages-upload` → Message-service 8082 (direct upload)

---

## 5. Inter-Service Communication

**OpenFeign** in dispute-service:

```java
@FeignClient(name = "message-service")
public interface MessageClient {
    @GetMapping("/api/messages/contracts/{contractId}")
    List<MessageDto> getMessagesByContractId(@PathVariable Long contractId);
}
```

Used for `GET /api/disputes/{id}/details` to enrich dispute with linked messages.

---

## 6. Technologies

| Layer | Technologies |
|-------|--------------|
| Frontend | Angular 19, RxJS, Keycloak Angular |
| Backend | Spring Boot, Spring Data JPA, Spring Cloud |
| Discovery | Eureka |
| Gateway | Spring Cloud Gateway |
| Inter-service | OpenFeign |
| Database | H2 (file-based, development) |
| Auth | Keycloak (OAuth2, JWT) |

---

# PART 2: ORAL QUESTIONS & ANSWERS

## AA1 – Business Logic & Analysis (C1)

### Q1: Describe the CRUD operations for messages.

**Answer:** Messages support Create (POST), Read (GET by id or list with filters), Update (PUT for content, PATCH for read status), and Delete (DELETE). All go through MessageController in message-service, which delegates to MessageService and MessageRepository.

### Q2: What advanced features did you implement and how do they work?

**Answer:**  
- **WebSocket:** STOMP over SockJS. Typing and presence are sent to `/app/typing` and `/app/presence`, then broadcast to `/topic/conv/...` and `/topic/presence/{userId}`.  
- **Reactions:** Stored in `message_reactions` table. Endpoints: POST to add, DELETE to remove.  
- **Threads:** Messages have `parentId` and `threadId`. `/replies` and `/thread` return nested messages.  
- **Blocking:** `UserBlock` entity. Blocked users cannot send messages (checked in MessageService.create).

### Q3: How does the frontend call the backend?

**Answer:** Angular uses HttpClient. For example, `MessageService.create(request)` does `this.http.post<Message>(this.baseUrl, request)`. In dev, `baseUrl` is `/messages`, which the proxy forwards to the API Gateway. The Gateway routes to message-service, which returns JSON. Angular receives the Observable and updates the UI.

---

## AA2 – Architecture (C2)

### Q4: Explain the role of Eureka.

**Answer:** Eureka is the service registry. message-service, dispute-service, and api-gateway register at startup. The Gateway uses `lb://message-service` to discover the message-service instance(s) and load-balance requests. Without Eureka, the Gateway would not know where to send requests.

### Q5: Why use an API Gateway?

**Answer:**  
- Single entry point for clients  
- Centralized routing and load balancing  
- Security (JWT validation) in one place  
- Path rewriting (e.g. `/messages` → `/api/messages`)  
- Clients only need to know the Gateway URL

### Q6: How does the Gateway route `/messages` to message-service?

**Answer:** The route uses `Path=/messages/**`, `uri: lb://message-service`, and a filter `RewritePath=/messages(?<segment>.*), /api/messages${segment}`. So `GET /messages/contracts/1` becomes `GET /api/messages/contracts/1` on message-service. `lb://` means Eureka resolves the service name to an instance URL.

---

## AA3 – Presentation & Angular-API Link (C3)

### Q7: Trace a complete flow from clicking "Send" to the message appearing.

**Answer:**  
1. User clicks Send → `MessagesComponent` calls `MessageService.create(request)`.  
2. Angular sends `POST /messages` with JWT in Authorization header.  
3. Proxy forwards to Gateway (8080).  
4. Gateway validates JWT, rewrites path, forwards to message-service.  
5. Message-service saves to H2, returns the created message.  
6. Angular receives the response and adds the message to the list.  
7. WebSocket broadcasts the new message to other clients subscribed to the conversation topic.

### Q8: What is the difference between HTTP and WebSocket in your project?

**Answer:** HTTP is used for CRUD (create, read, update, delete). WebSocket is used for real-time events: typing indicator, online/offline presence, and new message notifications. HTTP is request-response; WebSocket keeps a connection open for bidirectional communication.

### Q9: How does authentication work between Angular and the backend?

**Answer:** Keycloak handles login. Angular gets a JWT and adds it to the `Authorization: Bearer <token>` header for each HTTP request. The API Gateway validates the JWT (issuer-uri, jwk-set-uri) before forwarding. If the token is invalid, the Gateway returns 401.

---

## AA4 – Professional Practices (C4)

### Q10: How did you use Git for this project?

**Answer:** The project is on GitHub (Aziz-sehly/Pi_4Sae), branch `mohamed-sadok-slimen-4sae2`. Commits follow a clear convention (e.g. "Add backend microservices", "Update README to English"). The repo includes frontend and backend in a single structure.

### Q11: Describe your project structure and naming conventions.

**Answer:**  
- Backend: `com.prolance.message`, `com.prolance.dispute`, `com.prolance.gateway`  
- Services: `message-service`, `dispute-service`, `api-gateway`, `eureka-server`  
- Frontend: `front/services`, `front/components/messages`, `admin/`  
- REST: `/api/messages`, `/api/disputes`  
- Naming is consistent and follows common Spring/Angular conventions.

---

## AA5 – Excellence (C5)

### Q12: What innovations or advanced features did you add?

**Answer:**  
- Real-time WebSocket (typing, presence, new messages)  
- Emoji reactions (Slack-style)  
- Offline mode with message queue  
- Voice message recording (MediaRecorder)  
- Translation (MyMemory API)  
- Conversation tags  
- User blocking  
- Message audit trail  
- Ephemeral and scheduled messages  
- Admin analytics dashboard  

### Q13: How does the offline mode work?

**Answer:** The frontend listens to `window.addEventListener('offline')`. When offline, messages are pushed to `offlineQueue` instead of being sent. When `online` fires, `flushOfflineQueue()` sends all queued messages via `MessageService.create()`.

---

# PART 3: DEMO SCENARIO (for oral)

**Suggested order:**

1. Start backend (Eureka → message-service → dispute-service → api-gateway)  
2. Start frontend (`ng serve`)  
3. Log in with Keycloak  
4. Send a message (show HTTP in DevTools)  
5. Show typing indicator (WebSocket)  
6. Add emoji reaction  
7. Show dispute creation and details (OpenFeign)  
8. Show admin analytics  

---

# QUICK REFERENCE

| Topic | Key Point |
|-------|-----------|
| Eureka | Service registry, port 8761 |
| Gateway | Entry point, port 8080, routes + JWT |
| OpenFeign | dispute-service → message-service |
| WebSocket | STOMP/SockJS, typing + presence + new messages |
| Proxy | /messages → 8080, /ws → 8082 |
| Auth | Keycloak JWT, Gateway validates |
