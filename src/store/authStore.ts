import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database.types'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean

  setSession: (session: Session | null, user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  clearAuth: () => void

  // Derived selectors (call as functions)
  isAuthenticated: () => boolean
  mustChangePassword: () => boolean
  role: () => Profile['role'] | null
  branchId: () => string | null
  fullName: () => string
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     true,
  isInitialized: false,

  setSession: (session, user) => set({ session, user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  clearAuth: () => {
    set({ session: null, user: null, profile: null });
    localStorage.removeItem('infra-medik-auth');
    localStorage.removeItem('infra-medik-branch');
  },

  isAuthenticated: () => get().session !== null && get().user !== null,
  mustChangePassword: () => get().profile?.must_change_password ?? false,
  role: () => get().profile?.role ?? null,
  branchId: () => get().profile?.branch_id ?? null,
  fullName: () => get().profile?.full_name ?? get().user?.email ?? 'User',
}))
