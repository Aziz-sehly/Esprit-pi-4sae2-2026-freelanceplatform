/**
 * Backend ProLance-Communication-MS (dépôt local) :
 * C:\Users\LeGion\Desktop\ProLance-Communication-MS
 *
 * Démarrer : eureka-server (8761), api-gateway (8080), user-service, message-service, dispute-service.
 * En dev Angular (`ng serve`), les préfixes /messages, /users, /disputes, /ws sont proxifiés vers cette gateway.
 */
const prolanceGatewayUrl = 'http://localhost:8080';

/** Autres microservices (projet, propositions, paiement…) — non inclus dans ProLance-Communication-MS */
const businessApiGatewayUrl = 'http://localhost:8765';

export const environment = {
  production: false,
  /** Gateway unique pour auth JWT, users, messages, disputes, upload, WebSocket (ProLance) */
  prolanceGatewayUrl,
  /** Gateway optionnel pour les modules métier hors dépôt ProLance */
  businessApiGatewayUrl,
  /** @deprecated Préférer businessApiGatewayUrl */
  apiGateway: businessApiGatewayUrl,
  /** Alias de prolanceGatewayUrl — utilisé par auth, messages, disputes */
  communicationApi: prolanceGatewayUrl,
};
