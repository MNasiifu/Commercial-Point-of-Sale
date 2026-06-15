/**
 * branchStorage
 *
 * Typed, safe wrappers around the branch entry in localStorage.
 * All reads return `null` on any parse failure — never throw.
 */
import { STORAGE_KEYS } from '@/constants/localStorage'
import type { Branch } from '@/types/database.types'

interface BranchStorageValue {
  branchDetails: Branch
}

export const branchStorage = {
  get(): Branch | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BRANCH)
      if (!raw) return null
      const parsed = JSON.parse(raw) as BranchStorageValue
      return parsed?.branchDetails ?? null
    } catch {
      return null
    }
  },

  set(branch: Branch): void {
    const value: BranchStorageValue = { branchDetails: branch }
    localStorage.setItem(STORAGE_KEYS.BRANCH, JSON.stringify(value))
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.BRANCH)
  },
}