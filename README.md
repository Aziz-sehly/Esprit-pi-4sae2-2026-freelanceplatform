# ProLance - Application de messagerie et litiges

Application full-stack de messagerie et gestion des litiges pour la plateforme ProLance.

**Auteur :** Mohamed Sadok Slimen  
**Classe :** 4SAE2  
**Année Universitaire :** 2025-2026

---

## Architecture

- **Frontend (Angular)** : Interface utilisateur (ce projet)
- **Backend (Spring Boot)** : Microservices ProLance-Communication-MS
  - Eureka Server (8761)
  - API Gateway (8080)
  - Message Service (8082)
  - Dispute Service (8083)

---

## Prérequis

- Node.js 18+
- npm ou yarn
- Backend ProLance-Communication-MS démarré (voir section Backend)

---

## Installation

```bash
npm install
```

---

## Démarrage

1. Démarrer le backend (Eureka, message-service, dispute-service, api-gateway)
2. Lancer le frontend :

```bash
ng serve
```

3. Ouvrir `http://localhost:4200`

---

## Configuration du proxy

Le proxy (`proxy.conf.json`) redirige vers :

- `/messages` → API Gateway (8080)
- `/disputes` → API Gateway (8080)
- `/ws` → Message Service (8082) - WebSocket
- `/messages-upload` → Message Service (8082)

---

## Fonctionnalités

### Messagerie
- Messages en temps réel (WebSocket)
- Indicateur de présence (en ligne / hors ligne)
- Réactions emoji
- Fils de discussion (threads)
- Pièces jointes (images, audio)
- Messages vocaux
- Traduction (EN/FR)
- Tags de conversation
- Blocage d'utilisateurs
- Mode hors ligne

### Litiges
- Création et gestion des litiges
- Détail des litiges avec messages liés

### Administration
- Analytics des messages
- Gestion des blocages
- Audit des messages

---

## Backend

Le backend est dans le projet **ProLance-Communication-MS**. Ordre de démarrage :

1. `eureka-server` (port 8761)
2. `message-service` (port 8082)
3. `dispute-service` (port 8083)
4. `api-gateway` (port 8080)

---

## Technologies

- **Frontend :** Angular 19, Angular CLI, Keycloak (authentification)
- **Backend :** Spring Boot, Eureka, Spring Cloud Gateway, OpenFeign
- **Base de données :** H2 (développement)
