export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getPeriodRange, getMonthKey } from '@/lib/utils/date'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import BalanceHero from '@/components/dashboard/BalanceHero'
import SpendingChartClient from './SpendingChartClient'
import BudgetProgress from '@/components/dashboard/BudgetProgress'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import SpendingBars from '@/components/dashboard/SpendingBars'
import BalanceTrend from '@/components/dashboard/BalanceTrend'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const range = getPeriodRange('month')
  const month = getMonthKey()

  const [txResult, budgetsResult, recentResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, category, date')
      .eq('user_id', user.id)
      .gte('date', range.start)
      .lte('date', range.end),
    supabase
      .from('budgets')
      .select('id, category, limit_amount')
      .eq('user_id', user.id)
      .eq('month', month),
    supabase
      .from('transactions')
      .select('id, amount, type, category, note, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5),
  ])

  const txRows = txResult.data ?? []
  const income = txRows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const expense = txRows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  const expenseByCategory: Record<string, number> = {}
  txRows.filter((r) => r.type === 'expense').forEach((r) => {
    expenseByCategory[r.category] = (expenseByCategory[r.category] ?? 0) + r.amount
  })

  const spendingChartData = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount }))

  // Daily aggregation for trend chart — group by date
  const dailyMap: Record<string, { expense: number; income: number }> = {}
  for (const r of txRows) {
    if (!dailyMap[r.date]) dailyMap[r.date] = { expense: 0, income: 0 }
    if (r.type === 'expense') dailyMap[r.date].expense += r.amount
    else dailyMap[r.date].income += r.amount
  }
  const dailyTrend = Object.entries(dailyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, val]) => {
      const d = new Date(date)
      const label = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`
      return { label, ...val }
    })

  const budgets = (budgetsResult.data ?? []).map((b) => ({
    ...b,
    used: expenseByCategory[b.category] ?? 0,
    percent: b.limit_amount > 0 ? ((expenseByCategory[b.category] ?? 0) / b.limit_amount) * 100 : 0,
  }))

  return {
    income,
    expense,
    balance: income - expense,
    spendingChartData,
    dailyTrend,
    budgets,
    recentTransactions: recentResult.data ?? [],
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <PageTransition>
      <TopBar title="Dashboard" />

      {/* Desktop: page header */}
      <div className="hidden lg:flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bulan ini</p>
      </div>

      <div className="pb-6 lg:p-6 lg:max-w-5xl lg:mx-auto">
        {/* Balance hero — full width on mobile, full width on desktop too but inside container */}
        <div className="lg:mb-6">
          <BalanceHero
            income={data?.income ?? 0}
            expense={data?.expense ?? 0}
            balance={data?.balance ?? 0}
          />
        </div>

        {/* Desktop: two-column grid */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-5 lg:space-y-0 mt-5 lg:mt-0 mx-4 lg:mx-0">

          {/* Spending chart (pie/donut) */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Distribusi Pengeluaran
            </h3>
            <SpendingChartClient data={data?.spendingChartData ?? []} />
          </div>

          {/* Spending bars — category breakdown with animated bars */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Pengeluaran per Kategori
            </h3>
            <SpendingBars data={data?.spendingChartData ?? []} />
          </div>

          {/* Balance trend sparkline — full width */}
          <div
            className="rounded-2xl p-4 lg:col-span-2"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Tren Keuangan Bulan Ini
            </h3>
            <BalanceTrend points={data?.dailyTrend ?? []} />
          </div>

          {/* Recent transactions */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Transaksi Terbaru
            </h3>
            <RecentTransactions transactions={data?.recentTransactions ?? []} />
          </div>

          {/* Budget progress */}
          {data?.budgets && data.budgets.length > 0 && (
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Anggaran Bulan Ini
              </h3>
              <BudgetProgress budgets={data.budgets} />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
