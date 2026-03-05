import { createAuthGuard } from 'keycloak-angular';

/** Guard : redirige vers Keycloak login si non authentifié */
export const authGuard = createAuthGuard(
  async (_, __, { authenticated, keycloak }) => {
    if (authenticated) return true;
    await keycloak?.login({ redirectUri: window.location.href });
    return false;
  }
);

/** Guard admin : rôle admin requis, sinon redirige vers login */
export const adminGuard = createAuthGuard(
  async (_, __, { authenticated, grantedRoles, keycloak }) => {
    if (!authenticated) {
      await keycloak?.login({ redirectUri: window.location.href });
      return false;
    }
    const hasAdmin = grantedRoles.realmRoles.includes('admin') ||
      Object.values(grantedRoles.resourceRoles).some(roles => roles.includes('admin'));
    return hasAdmin;
  }
);
