const prolanceGatewayUrl = 'http://localhost:8080';
const businessApiGatewayUrl = 'http://localhost:8765';

export const environment = {
  production: true,
  prolanceGatewayUrl,
  businessApiGatewayUrl,
  apiGateway: businessApiGatewayUrl,
  communicationApi: prolanceGatewayUrl,
};
