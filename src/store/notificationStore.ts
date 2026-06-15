import { create } from 'zustand'

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  message: string
  severity: NotificationSeverity
  duration?: number
}

interface NotificationState {
  notifications: Notification[]
  push: (message: string, severity?: NotificationSeverity, duration?: number) => void
  remove: (id: string) => void
  clear: () => void
}

let counter = 0

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  push: (message, severity = 'info', duration = 4000) => {
    const id = `notif-${++counter}`
    set((s) => ({ notifications: [...s.notifications, { id, message, severity, duration }] }))
  },
  remove: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  clear: () => set({ notifications: [] }),
}))

// Convenience helpers used throughout the app
export const notify = {
  success: (msg: string) => useNotificationStore.getState().push(msg, 'success'),
  error:   (msg: string) => useNotificationStore.getState().push(msg, 'error', 6000),
  warning: (msg: string) => useNotificationStore.getState().push(msg, 'warning'),
  info:    (msg: string) => useNotificationStore.getState().push(msg, 'info'),
}
