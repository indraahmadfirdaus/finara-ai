export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getPeriodRange } from '@/lib/utils/date'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import BalanceHero from '@/components/dashboard/BalanceHero'
import InsightSection from '@/components/dashboard/InsightSection'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userId = user?.id ?? (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true' ? process.env.DEV_USER_ID : null)
  if (!userId) return null

  const range = getPeriodRange('month')

  const { data: txRows } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('date', range.start)
    .lte('date', range.end)
    .is('deleted_at', null)

  const rows = txRows ?? []
  const income = rows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  return { income, expense, balance: income - expense }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <PageTransition>
      <TopBar title="Dashboard" />

      <div className="hidden lg:flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bulan ini</p>
      </div>

      <div className="pb-24 lg:p-6 lg:max-w-2xl lg:mx-auto">
        <div className="lg:mb-4">
          <BalanceHero
            income={data?.income ?? 0}
            expense={data?.expense ?? 0}
            balance={data?.balance ?? 0}
          />
        </div>
        <InsightSection />
      </div>
    </PageTransition>
  )
}
