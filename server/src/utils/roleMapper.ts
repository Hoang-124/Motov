/**
 * Shared role-mapping utilities between auth and user controllers.
 * Avoids duplication and keeps role mapping logic in one place.
 */

type BackendRole = 'Admin' | 'Staff' | 'Owner' | 'Customer';
type FrontendRole = 'admin' | 'staff' | 'owner' | 'customer';

/**
 * Maps a backend roles array to a single frontend role string (uses first role).
 */
export const mapBackendRoleToFrontend = (backendRoles: string[]): FrontendRole => {
  const primaryRole = backendRoles[0] || 'Customer';
  switch (primaryRole) {
    case 'Admin': return 'admin';
    case 'Staff': return 'staff';
    case 'Owner': return 'owner';
    case 'Customer':
    default:
      return 'customer';
  }
};

/**
 * Maps a frontend role string to the canonical backend enum value.
 */
export const mapFrontendRoleToBackend = (frontendRole: string): BackendRole => {
  switch (frontendRole) {
    case 'admin': return 'Admin';
    case 'staff': return 'Staff';
    case 'owner': return 'Owner';
    case 'customer':
    default:
      return 'Customer';
  }
};

/**
 * Escape a user-supplied string for safe use inside a RegExp.
 * Prevents ReDoS attacks in search queries.
 */
export const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
