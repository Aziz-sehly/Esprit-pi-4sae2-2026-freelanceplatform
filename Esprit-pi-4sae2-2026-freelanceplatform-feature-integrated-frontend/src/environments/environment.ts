/**
 * Tout passe par l’API Gateway (CORS activé), pas par les ports directs des MS.
 *
 * Gateway Eureka (`pidev_4/gateway`, port 8085) : routes automatiques
 *   /{service-id}/** → le microservice (service-id en minuscules).
 *   milestone-service + context-path /milestone → préfixe complet ci-dessous.
 *
 * Variante `api-gateway` (port 8089) avec routes explicites : utiliser plutôt
 *   milestoneApiBase: 'http://localhost:8089/milestone'
 *   paymentApiBase: 'http://localhost:8089/payment'
 *   milestonePublicOrigin: 'http://localhost:8089'
 */
export const environment = {
  production: false,

  /**
   * Si true, l’auth utilise `/microservice-user/...` (même origine que `ng serve`) + `proxy.conf.json`
   * → évite CORS / `net::ERR_FAILED` sur login/register.
   * Mettre false si l’UI est servie avec accès direct cross-origin au gateway.
   */
  authApiSameOriginProxy: true,

  /** Base du gateway (CORS + routage) */
  gatewayBaseUrl: 'http://localhost:8085',

  /** Contrats : microservice dédié (créés automatiquement à l'acceptation d'une proposition). */
  contractApiBase: 'http://localhost:8085/microservice-contract/api/contracts',

  /**
   * HTTP API milestone via gateway + Eureka.
   * Chemin = /milestone-service + context-path du MS (/milestone) + /api/...
   */
  milestoneApiBase: 'http://localhost:8085/milestone-service/api/milestones',

  /** Idem : /payment-service + context-path /payment */
  paymentApiBase: 'http://localhost:8085/payment-service/payment',

  /** Litiges : microservice dédié (pas milestone). */
  disputeApiBase: 'http://localhost:8085/dispute-service',

  /** Messagerie contrat : microservice dédié. */
  messageApiBase: 'http://localhost:8085/message-service',

  /** Analyse technique des pièces jointes (PDF, image, texte) via Eureka + gateway. */
  mediaAnalysisApiBase: 'http://localhost:8085/media-analysis-service',

  /**
   * Préfixe pour les URLs relatives renvoyées par l’API (ex. /milestone/api/resources/.../file).
   */
  milestonePublicOrigin: 'http://localhost:8085/milestone-service',

  /** WebSocket : souvent non proxifié par le gateway ; ports directs des MS. */
  milestoneWsUrl: 'ws://localhost:8081/milestone/ws-notifications',
  paymentWsUrl: 'ws://localhost:8082/payment/ws-notifications',

  /** STOMP brut sur message-service (sans SockJS), aligné avec WebSocketConfig /ws/messages-native. */
  messageWsUrl: 'ws://localhost:8099/ws/messages-native',
};
