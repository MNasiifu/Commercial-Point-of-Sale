/**
 * useAuth
 *
 * Provides auth state reads and action callbacks (signIn, signOut, changePassword).
 *
 * Responsibilities:
 *  - Read auth state from the Zustand store (single source of truth).
 *  - Expose stable action callbacks (signIn, signOut, changePassword).
 *  - Manage branchDetails via a typed storage helper — never raw localStorage access.
 *
 * Not responsible for:
 *  - Session bootstrapping (handled once in useAuthBootstrap, called from App.tsx).
 *  - Redirect logic (handled by ProtectedRoute).
 */
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase }       from '@/lib/supabase'
import { useAuthStore }   from '@/store/authStore'
import { queryClient }    from '@/lib/queryClient'
import { notify }         from '@/store/notificationStore'
import {
  fetchProfile,
  fetchBranchDetails,
  updateMustChangePassword,
} from '@/services/authService'
import type { Profile } from '@/types/database.types'
import { branchStorage } from '@/store/localStorage'

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const {
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    setSession,
    setProfile,
    setLoading,
    clearAuth,
    isAuthenticated,
    mustChangePassword,
    role,
    branchId,
    fullName,
  } = useAuthStore()

  const navigate = useNavigate()

  // Derived synchronously from storage — stable between renders because the
  // underlying localStorage value only changes inside signIn / signOut.
  const branchDetails = branchStorage.get()

  // ── signIn ──────────────────────────────────────────────────────────────────

  const signIn = useCallback(
    async (email: string, password: string): Promise<Profile> => {
      setLoading(true)
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)

        const profile = await fetchProfile(data.user.id)
        if (!profile) throw new Error('Profile not found.')
        if (!profile.is_active) throw new Error('This account has been deactivated.')

        const branch = await fetchBranchDetails(profile.branch_id)
        if (!branch) throw new Error('Active branch not found.')

        // Commit to store and storage only after all fetches succeed — no
        // partial state is ever persisted on failure.
        setSession(data.session, data.user)
        setProfile(profile)
        branchStorage.set(branch)

        return profile
      } catch (err) {
        // Guarantee no stale branch data survives a failed sign-in attempt.
        branchStorage.clear()
        throw err
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setSession, setProfile],
  )

  // ── signOut ─────────────────────────────────────────────────────────────────

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
      clearAuth()
      branchStorage.clear()
      queryClient.clear()
      notify.info('You have been signed out.')
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('[useAuth] signOut error:', err)
      notify.error(err instanceof Error ? err.message : 'Sign out failed.')
    }
  }, [clearAuth, navigate])

  // ── changePassword ──────────────────────────────────────────────────────────

  const changePassword = useCallback(
    async (newPassword: string): Promise<void> => {
      if (!user) throw new Error('No authenticated user.')

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(error.message)

      await updateMustChangePassword(user.id)

      // Keep store in sync — optimistic update after confirmed DB write.
      setProfile({ ...profile!, must_change_password: false })
      notify.success('Password changed successfully.')
    },
    [user, profile, setProfile],
  )

  // ── Return ──────────────────────────────────────────────────────────────────

  return {
    session,
    user,
    profile,
    branchDetails,
    isLoading,
    isInitialized,
    isAuthenticated:    isAuthenticated(),
    mustChangePassword: mustChangePassword(),
    role:               role(),
    branchId:           branchId(),
    fullName:           fullName(),
    signIn,
    signOut,
    changePassword,
  }
}

// ─── useRequireAuth ────────────────────────────────────────────────────────────

/**
 * Lightweight convenience hook for components that only need to inspect auth
 * state without triggering any side-effects.  Redirect enforcement lives in
 * ProtectedRoute — not here.
 */
export function useRequireAuth() {
  const { isAuthenticated, isInitialized, mustChangePassword } = useAuth()
  return { isAuthenticated, isInitialized, mustChangePassword }
}