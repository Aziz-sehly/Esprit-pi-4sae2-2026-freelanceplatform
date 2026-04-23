'use strict';

/**
 * Proxy Angular → gateway :8080
 *
 * - Par défaut : gateway ProLance du dépôt (chemins /users, /messages, /disputes sur :8080).
 * - Si ta gateway est Eureka avec préfixes /user-service, etc. :
 *   PowerShell: $env:NG_PROXY_EUREKA='true'; npx ng serve
 */
const target = process.env.NG_PROXY_TARGET || 'http://localhost:8080';
const eureka = process.env.NG_PROXY_EUREKA === 'true';

const common = { target, secure: false, changeOrigin: true };

/** Business API (hors dépôt ProLance) */
const business = {
  '/project': { ...common, target: 'http://localhost:8765', logLevel: 'debug' },
  '/proposal': { ...common, target: 'http://localhost:8765', logLevel: 'debug' },
  '/milestone': { ...common, target: 'http://localhost:8765', logLevel: 'debug' },
  '/payment': { ...common, target: 'http://localhost:8765', logLevel: 'debug' },
  '/candidature': { ...common, target: 'http://localhost:8765', logLevel: 'debug' },
};

const prolance = eureka
  ? {
      '/ws': { ...common, ws: true, pathRewrite: { '^/ws': '/message-service/ws' } },
      '/messages': { ...common, logLevel: 'debug', pathRewrite: { '^/messages': '/message-service/api/messages' } },
      '/disputes': { ...common, logLevel: 'debug', pathRewrite: { '^/disputes': '/dispute-service/api/disputes' } },
      '/users': { ...common, logLevel: 'debug', pathRewrite: { '^/users': '/user-service/api/users' } },
    }
  : {
      '/ws': { ...common, ws: true },
      '/messages': { ...common, logLevel: 'debug' },
      '/disputes': { ...common, logLevel: 'debug' },
      '/users': { ...common, logLevel: 'debug' },
    };

/**
 * Compat clients qui appellent /api/auth/login (ancien template).
 */
const apiAuth = eureka
  ? {
      '/api/auth': {
        ...common,
        pathRewrite: { '^/api/auth': '/user-service/api/users/auth' },
      },
    }
  : {
      '/api/auth': {
        ...common,
        pathRewrite: { '^/api/auth': '/users/auth' },
      },
    };

module.exports = { ...business, ...prolance, ...apiAuth };
