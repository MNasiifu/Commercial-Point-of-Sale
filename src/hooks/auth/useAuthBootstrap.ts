/**
 * useAuthBootstrap
 *
 * Owns the one-time session restore on hard reload and listens for live
 * auth events (sign-out, token refresh). It does NOT handle SIGNED_IN —
 * that is exclusively managed by signIn() in useAuth.ts which calls
 * fetchProfile() AFTER signInWithPassword() resolves (i.e. after the SDK
 * has committed the token to its internal PostgREST auth-header state).
 *
 * WHY we can't call fetchProfile() inside onAuthStateChange's SIGNED_IN:
 *   Supabase fires SIGNED_IN synchronously DURING signInWithPassword(),
 *   before the SDK commits the access token to its PostgREST header state.
 *   Any supabase.from() call inside that callback therefore has no
 *   Authorization header → the query is silently dropped → nothing in the
 *   network tab → the app hangs on CircularProgress forever.
 *
 * WHY getSession() works for the reload case:
 *   getSession() fully hydrates the SDK's internal auth state (reads the
 *   stored JWT and sets it on the PostgREST client) before returning, so
 *   the fetchProfile() call that follows has a valid auth header.
 */
import { useEffect }    from 'react'
import { supabase }     from '@/lib/supabase'
import { queryClient }  from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types/database.types'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()
  if (error) {
    console.error('[Auth] fetchProfile error:', error.message)
    return null
  }
  return data
}

export function useAuthBootstrap() {
  const { setSession, setProfile, setLoading, setInitialized, clearAuth } =
    useAuthStore()

  useEffect(() => {
    let mounted = true

    // ── Hard-reload restore ────────────────────────────────────────────────
    // getSession() hydrates the SDK auth state fully before we query the DB.
    const init = async () => {
      try {
        setLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[Auth] getSession error:', error.message)
          return // finally still runs → setInitialized(true)
        }

        if (session && mounted) {
          const p = await fetchProfile(session.user.id)
          if (!mounted) return
          setSession(session, session.user)
          setProfile(p)
        }
      } catch (err) {
        console.error('[Auth] Bootstrap error:', err)
      } finally {
        // Always called — the app can never hang on the spinner
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    init()

    // ── Live auth events ───────────────────────────────────────────────────
    // SIGNED_IN is intentionally omitted: signIn() in useAuth.ts already
    // calls fetchProfile() + setSession() + setProfile() after the SDK
    // commits the token. Handling it here too would race with unfixed headers.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          clearAuth()
          queryClient.clear()
          if (mounted) {
            setLoading(false)
            setInitialized(true)
          }

        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Only the session tokens change; the profile data stays the same
          setSession(session, session.user)
        }
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
