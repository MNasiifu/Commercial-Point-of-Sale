import { useEffect, useRef } from 'react'

const SCAN_TIMEOUT_MS  = 80   // max ms between chars considered part of a scan
const MIN_BARCODE_LEN  = 4    // ignore accidental Enter presses

interface Options {
  onScan:   (barcode: string) => void
  enabled?: boolean
}

// Listens for rapid keydown sequences that USB HID scanners produce.
// Scanners fire chars in < SCAN_TIMEOUT_MS intervals then send Enter.
export function useBarcodeScanner({ onScan, enabled = true }: Options) {
  const buffer    = useRef('')
  const lastKey   = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    const handleKey = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input / textarea / select
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const now = Date.now()

      if (e.key === 'Enter') {
        const code = buffer.current.trim()
        buffer.current = ''
        lastKey.current = 0
        if (code.length >= MIN_BARCODE_LEN) onScan(code)
        return
      }

      // If gap between keystrokes is too large, reset (user typing, not scanner)
      if (lastKey.current && now - lastKey.current > SCAN_TIMEOUT_MS) {
        buffer.current = ''
      }

      if (e.key.length === 1) {
        buffer.current += e.key
      }

      lastKey.current = now
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onScan, enabled])
}
