// UGX currency formatter
const ugxFormatter = new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatUGX(amount: number): string {
  return ugxFormatter.format(amount)
}

export function formatUGXCompact(amount: number): string {
  if (amount >= 1_000_000) return `UGX ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `UGX ${(amount / 1_000).toFixed(0)}K`
  return formatUGX(amount)
}

// Date formatters
const dateFormatter = new Intl.DateTimeFormat('en-UG', {
  day: '2-digit', month: 'short', year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-UG', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: true,
})

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return dateFormatter.format(new Date(dateStr))
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return dateTimeFormatter.format(new Date(dateStr))
}

export function formatDateInput(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

export function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const diff = new Date(expiryDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getExpiryLabel(days: number | null): string {
  if (days === null) return 'No expiry'
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  if (days <= 30) return `Expires in ${days} days`
  return formatDate(new Date(Date.now() + days * 86400000).toISOString())
}

export function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    mtn_momo: 'MTN MoMo',
    airtel_money: 'Airtel Money',
  }
  return labels[method] ?? method
}

export function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}
