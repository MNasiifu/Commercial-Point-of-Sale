import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'

const TIMEOUT_MS = Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MS ?? 600_000)
const WARNING_MS = 60_000  // show warning 1 min before logout

const ACTIVITY_EVENTS = [
  'mousedown', 'mousemove', 'keydown',
  'scroll', 'touchstart', 'click', 'wheel',
] as const

export function useInactivityLogout() {
  const { isAuthenticated, clearAuth } = useAuthStore()
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(60)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (timeoutRef.current)  clearTimeout(timeoutRef.current)
    if (warningRef.current)  clearTimeout(warningRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const logout = useCallback(async () => {
    clearTimers()
    setShowWarning(false)
    await supabase.auth.signOut()
    clearAuth()
    queryClient.clear()
  }, [clearTimers, clearAuth])

  const resetTimer = useCallback(() => {
    if (!isAuthenticated()) return
    clearTimers()
    setShowWarning(false)
    setSecondsLeft(60)

    warningRef.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsLeft(60)
      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }, TIMEOUT_MS - WARNING_MS)

    timeoutRef.current = setTimeout(logout, TIMEOUT_MS)
  }, [isAuthenticated, clearTimers, logout])

  useEffect(() => {
    if (!isAuthenticated()) {
      clearTimers()
      return
    }

    resetTimer()

    const handleActivity = () => resetTimer()
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }))

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity))
      clearTimers()
    }
  }, [isAuthenticated, resetTimer, clearTimers])

  const stayLoggedIn = useCallback(() => {
    setShowWarning(false)
    resetTimer()
  }, [resetTimer])

  return { showWarning, secondsLeft, stayLoggedIn, logout }
}
