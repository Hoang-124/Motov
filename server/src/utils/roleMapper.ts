/**
 * Shared role-mapping utilities between auth and user controllers.
 * Avoids duplication and keeps role mapping logic in one place.
 */

type BackendRole = 'Admin' | 'Staff' | 'Owner' | 'Customer';
type FrontendRole = 'admin' | 'staff' | 'owner' | 'customer';

export const mapBackendRoleToFrontend = (backendRoles: string[]): FrontendRole => {
  if (!backendRoles || backendRoles.length === 0) return 'customer';
  const rolesLower = backendRoles.map(r => r.toLowerCase());
  if (rolesLower.includes('admin')) return 'admin';
  if (rolesLower.includes('staff')) return 'staff';
  if (rolesLower.includes('owner')) return 'owner';
  return 'customer';
};

export const mapFrontendRoleToBackend = (frontendRole: string): BackendRole =>
  (frontendRole ? (frontendRole.charAt(0).toUpperCase() + frontendRole.slice(1).toLowerCase()) as BackendRole : 'Customer');

/**
 * Escape a user-supplied string for safe use inside a RegExp.
 * Prevents ReDoS attacks in search queries.
 */
export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
