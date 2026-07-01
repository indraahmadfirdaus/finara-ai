import { createClient } from '@/lib/supabase/server'
import { getPeriodRange, getMonthKey } from '@/lib/utils/date'

export interface DailyBarItem {
  label: string   // day name e.g. 'Sen'
  value: number   // total expense
  percent: number // relative to max day
  isMax: boolean
}

export interface BudgetLinePoint {
  label: string   // 'M1'..'M4'
  used: number    // total spent in that week-range
  limit: number   // total budget limit
  percent: number // used/limit * 100
}

export interface AnalyticsResponse {
  daily_bar: DailyBarItem[]        // last 7 days expense by day
  budget_line: BudgetLinePoint[]   // 4 weekly budget usage snapshots (current month)
  has_data: boolean
}

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const range = getPeriodRange('month')
  const month = getMonthKey()

  const [txResult, budgetResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, date')
      .eq('user_id', user.id)
      .gte('date', range.start)
      .lte('date', range.end)
      .eq('type', 'expense')
      .is('deleted_at', null),
    supabase
      .from('budgets')
      .select('limit_amount')
      .eq('user_id', user.id)
      .eq('month', month)
      .is('deleted_at', null),
  ])

  const txRows = txResult.data ?? []
  const budgetRows = budgetResult.data ?? []

  const has_data = txRows.length > 0

  // --- Daily bar: last 7 days ---
  const today = new Date()
  // Shift to WIB (UTC+7)
  const todayWIB = new Date(today.getTime() + 7 * 60 * 60 * 1000)
  const days: DailyBarItem[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayWIB)
    d.setUTCDate(d.getUTCDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayOfWeek = d.getUTCDay()
    const value = txRows
      .filter(r => r.date === dateStr)
      .reduce((s, r) => s + r.amount, 0)
    days.push({ label: DAY_NAMES[dayOfWeek], value, percent: 0, isMax: false })
  }
  const maxVal = Math.max(...days.map(d => d.value), 1)
  days.forEach(d => {
    d.percent = Math.round((d.value / maxVal) * 100)
    d.isMax = d.value === maxVal && d.value > 0
  })

  // --- Budget line: 4 weeks of current month ---
  const totalLimit = budgetRows.reduce((s, b) => s + b.limit_amount, 0)
  const [year, mon] = month.split('-').map(Number)
  const budget_line: BudgetLinePoint[] = []

  for (let week = 0; week < 4; week++) {
    const weekStart = new Date(Date.UTC(year, mon - 1, week * 7 + 1))
    const weekEnd = new Date(Date.UTC(year, mon - 1, Math.min((week + 1) * 7, 31)))
    const startStr = weekStart.toISOString().slice(0, 10)
    // Clamp to actual month end
    const actualEnd = new Date(Date.UTC(year, mon, 0)).toISOString().slice(0, 10)
    const endStr = weekEnd.toISOString().slice(0, 10) > actualEnd ? actualEnd : weekEnd.toISOString().slice(0, 10)

    const used = txRows
      .filter(r => r.date >= startStr && r.date <= endStr)
      .reduce((s, r) => s + r.amount, 0)

    const percent = totalLimit > 0 ? Math.round((used / totalLimit) * 100) : 0

    budget_line.push({ label: `M${week + 1}`, used, limit: totalLimit, percent })
  }

  const response: AnalyticsResponse = { daily_bar: days, budget_line, has_data }
  return Response.json(response)
}
