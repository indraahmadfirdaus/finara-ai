const LOCALE = 'id-ID'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (target.getTime() === today.getTime()) return 'Hari ini'
  if (target.getTime() === yesterday.getTime()) return 'Kemarin'

  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) return `${diffDays} hari lalu`

  return formatDateShort(d)
}

export function getMonthKey(date?: Date): string {
  const d = date ?? new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, 1)
  return d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
}

// Returns YYYY-MM-DD in WIB (UTC+7) — server runs UTC, toISOString() would give wrong date before 07:00 WIB
function toWIBDateString(date: Date): string {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().split('T')[0]
}

export function getTodayKey(): string {
  return toWIBDateString(new Date())
}

export function getPeriodRange(period: 'today' | 'week' | 'month' | 'year'): {
  start: string
  end: string
} {
  const now = new Date()
  const end = toWIBDateString(now)

  if (period === 'today') {
    return { start: end, end }
  }
  if (period === 'week') {
    const start = new Date(now)
    start.setDate(start.getDate() - 7)
    return { start: toWIBDateString(start), end }
  }
  if (period === 'month') {
    const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    const start = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), 1))
    return { start: start.toISOString().split('T')[0], end }
  }
  // year
  const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const start = new Date(Date.UTC(wibNow.getUTCFullYear(), 0, 1))
  return { start: start.toISOString().split('T')[0], end }
}
