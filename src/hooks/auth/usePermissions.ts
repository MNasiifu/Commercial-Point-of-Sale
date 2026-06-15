import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/database.types'

export function usePermissions() {
  const role = useAuthStore((s) => s.profile?.role ?? null)

  const is = (...roles: UserRole[]) => role !== null && roles.includes(role)

  return {
    role,
    isAdmin:          is('admin'),
    isManager:        is('manager'),
    isTeller:         is('teller'),
    isAdminOrManager: is('admin', 'manager'),

    // Feature-level gates
    canManageUsers:     is('admin'),
    canManageProducts:  is('admin', 'manager'),
    canManageInventory: is('admin', 'manager'),
    canViewAllReports:  is('admin', 'manager'),
    canVoidSale:        is('admin', 'manager'),
    canProcessReturn:   is('admin', 'manager'),
    canReconcile:       is('admin', 'manager'),
    canViewDashboard:   is('admin', 'manager', 'teller'),
    canUsePOS:          is('admin', 'manager', 'teller'),
    canManageDeliveries: is('admin', 'manager', 'teller'),
    canManageCustomers:  is('admin', 'manager', 'teller'),
    canManageCatalog:    is('admin', 'manager', 'teller'),
    canDeactivateCatalog: is('admin', 'manager'),

    // Teller sees limited dashboard (own data only)
    hasTellerDashboard: is('teller'),
    hasFullDashboard:   is('admin', 'manager'),
  }
}
