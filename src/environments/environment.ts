export const environment = {
  production: false,
  apiGateway: 'http://localhost:8765',
  /** API Communication (Messages + Disputes) - port 8080 */
  communicationApi: 'http://localhost:8080',
  /** Keycloak - port 8180 (éviter conflit avec API Gateway 8080) */
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'prolance',
    clientId: 'prolance-frontend'
  }
};
