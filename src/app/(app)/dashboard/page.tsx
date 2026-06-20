import { createClient } from '@/lib/supabase/server'
import { getPeriodRange, getMonthKey } from '@/lib/utils/date'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import BalanceHero from '@/components/dashboard/BalanceHero'
import SpendingChartClient from './SpendingChartClient'
import BudgetProgress from '@/components/dashboard/BudgetProgress'
import RecentTransactions from '@/components/dashboard/RecentTransactions'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const range = getPeriodRange('month')
  const month = getMonthKey()

  const [txResult, budgetsResult, recentResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, category')
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
    budgets,
    recentTransactions: recentResult.data ?? [],
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <PageTransition>
      <TopBar title="Dashboard" />
      <div className="pb-4 space-y-5">
        <BalanceHero
          income={data?.income ?? 0}
          expense={data?.expense ?? 0}
          balance={data?.balance ?? 0}
        />

        <section className="mx-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Pengeluaran per Kategori
            </h3>
            <SpendingChartClient data={data?.spendingChartData ?? []} />
          </div>
        </section>

        {data?.budgets && data.budgets.length > 0 && (
          <section className="mx-4">
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Anggaran Bulan Ini
              </h3>
              <BudgetProgress budgets={data.budgets} />
            </div>
          </section>
        )}

        <section className="mx-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Transaksi Terbaru
            </h3>
            <RecentTransactions transactions={data?.recentTransactions ?? []} />
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
