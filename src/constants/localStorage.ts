/**
 * storageKeys
 *
 * Single source of truth for every localStorage / sessionStorage key used in
 * the application.  Import from here — never hard-code key strings elsewhere.
 */
export const STORAGE_KEYS = {
  BRANCH: 'infra-medik-branch',
} as const