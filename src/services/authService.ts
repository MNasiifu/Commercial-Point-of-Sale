/**
 * authService
 *
 * Pure async data-fetching functions for auth-related Supabase queries.
 * Keeping these outside hooks makes them independently testable and prevents
 * accidental re-creation on every render.
 */
import { supabase } from '@/lib/supabase'
import type { Branch, Profile } from '@/types/database.types'

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('[authService] fetchProfile error:', error.message)
    return null
  }
  return data
}

export async function fetchBranchDetails(branchId: string): Promise<Branch | null> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', branchId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('[authService] fetchBranchDetails error:', error.message)
    return null
  }
  return data
}

export async function updateMustChangePassword(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}