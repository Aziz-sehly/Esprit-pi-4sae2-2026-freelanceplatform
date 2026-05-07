# Configuration Keycloak pour ProLance

## 1. Démarrer Keycloak

Keycloak est installé dans `D:\Coding\keycloak-26.3.1`.

### Port 8180 (éviter conflit avec API Gateway sur 8080)

```powershell
cd D:\Coding\keycloak-26.3.1\bin
.\kc.bat start --http-port=8180
```

Ou modifier `conf/keycloak.conf` :
```
http-port=8180
```

Puis :
```powershell
.\kc.bat start
```

### Accès Admin

- URL : http://localhost:8180
- Créer un admin au premier démarrage : `.\kc.bat start-dev` puis suivre les instructions
- Ou utiliser : utilisateur `admin` / mot de passe défini au premier lancement

---

## 2. Créer le Realm

1. Se connecter à la console Admin : http://localhost:8180/admin
2. Créer un realm : **prolance**
   - Realm name : `prolance`
   - Enabled : ON

---

## 3. Créer le Client (Frontend Angular)

1. Dans le realm **prolance** : Clients → Create client
2. **General settings** :
   - Client type : `OpenID Connect`
   - Client ID : `prolance-frontend`
3. **Capability config** :
   - Client authentication : **OFF** (client public)
   - Authorization : OFF
   - Standard flow : **ON**
   - Direct access grants : ON (optionnel)
   - Implicit flow : OFF
4. **Login settings** (IMPORTANT pour éviter l'erreur CORS) :
   - Root URL : `http://localhost:4200`
   - Home URL : `http://localhost:4200/front`
   - Valid redirect URIs : 
     - `http://localhost:4200/*`
     - `http://localhost:4200`
   - Valid post logout redirect URIs : `http://localhost:4200/*` et `http://localhost:4200/front` (obligatoire pour éviter "Invalid redirect uri" à la déconnexion)
   - **Web origins** : `http://localhost:4200` ← **OBLIGATOIRE** (sans cela : erreur CORS "No 'Access-Control-Allow-Origin' header")

---

## 4. Créer le rôle Admin

1. Realm roles → Create role
   - Role name : `admin`
2. Assigner le rôle à un utilisateur de test :
   - Users → créer un utilisateur (ex: `admin@prolance.com`)
   - Role mapping → Assign role → `admin`

---

## 5. Activer l'inscription (Sign-up)

1. Realm settings → Login
2. User registration : **ON**

---

## 6. Variables d'environnement (optionnel)

Si Keycloak tourne sur un autre port ou URL, modifier :

- `src/environments/environment.ts` :
```ts
keycloak: {
  url: 'http://localhost:8180',  // ou votre URL Keycloak
  realm: 'prolance',
  clientId: 'prolance-frontend'
}
```

---

## 7. Erreur "Invalid redirect uri" à la déconnexion

Si l’erreur apparaît en cliquant sur **Déconnexion** :

1. Console Admin Keycloak → Realm **prolance** → **Clients** → **prolance-frontend**
2. Onglet **Settings**
3. **Valid post logout redirect URIs** : ajouter ces valeurs (une par ligne) :
   - `http://localhost:4200/*`
   - `http://localhost:4200/front`
   - `http://localhost:4200`
4. **Save**

---

## 8. Erreur CORS "No 'Access-Control-Allow-Origin' header"

Si l’erreur apparaît dans la console du navigateur :

1. Ouvrir la console Admin Keycloak : http://localhost:8180/admin
2. Realm **prolance** → **Clients** → **prolance-frontend**
3. Onglet **Settings** (ou **Access settings**)
4. Champ **Web origins** : saisir **`http://localhost:4200`**
5. Cliquer sur **Save**

---

## 9. Client Backend (pour lister les utilisateurs Keycloak)

Pour que la messagerie affiche les utilisateurs créés dans Keycloak :

1. Dans le realm **prolance** : Clients → Create client
2. **General settings** :
   - Client type : `OpenID Connect`
   - Client ID : `prolance-backend`
3. **Capability config** :
   - Client authentication : **ON** (confidential)
   - Standard flow : OFF
   - Direct access grants : ON
4. **Save**
5. Onglet **Credentials** : copier le **Client secret**
6. **Service account roles** : Clients → prolance-backend → Service account roles
   - Client roles : sélectionner `realm-management`
   - Assign : `view-users` (pour lister les utilisateurs du realm)

7. Configurer le message-service (variable d'environnement ou `application.yml`) :
```yaml
keycloak:
  admin:
    enabled: true
    client-id: prolance-backend
    client-secret: <VOTRE_CLIENT_SECRET>
```

Ou en variable d'environnement :
```
KEYCLOAK_ADMIN_CLIENT_SECRET=<votre_secret>
```

---

## 10. Backend (API Gateway)

L'API Gateway (ProLance-Communication-MS) est configuré pour valider les JWT Keycloak sur `/messages/**` et `/disputes/**`.

**Important** : Keycloak doit être démarré avant l'API Gateway, car il récupère les clés JWT au démarrage.

Pour désactiver la validation JWT (tests sans Keycloak) :
- Commenter/supprimer la dépendance `spring-boot-starter-oauth2-resource-server` dans `api-gateway/pom.xml`
- Supprimer `SecurityConfig.java` et la config `spring.security.oauth2` dans `application.yml`

---

## 11. Résumé des URLs

| Service        | URL                    |
|----------------|------------------------|
| Keycloak       | http://localhost:8180  |
| Frontend       | http://localhost:4200  |
| API Gateway    | http://localhost:8080  |
