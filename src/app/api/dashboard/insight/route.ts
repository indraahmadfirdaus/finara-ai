import { createClient } from '@/lib/supabase/server'
import { getDeepseekClient } from '@/lib/deepseek/client'
import { getPeriodRange, getMonthKey } from '@/lib/utils/date'
import type { InsightCard, InsightResponse } from '@/lib/dashboard/insightTypes'

const SYSTEM_PROMPT = `Kamu adalah analis keuangan pribadi yang komunikatif dan to-the-point.
User memberikanmu ringkasan data keuangan bulan ini.
Tugasmu: hasilkan 3-5 insight yang paling actionable dan relevan.

PENTING — balas HANYA dengan JSON array valid, tidak ada teks lain sebelum atau sesudah:
[
  {
    "icon": "<emoji tunggal>",
    "title": "<max 50 karakter>",
    "description": "<max 100 karakter, 1-2 kalimat, bahasa Indonesia casual>",
    "tag": "<warning|danger|good|info>",
    "viz_type": "<bar|progress|sparkline|donut|null>",
    "viz_data": <object sesuai viz_type, atau null>
  }
]

Aturan viz_data per viz_type:
- "bar": { "items": [{ "label": string, "value": number, "percent": number }] } — max 5 items, sorted descending
- "progress": { "label": string, "value": number, "max": number, "percent": number }
- "sparkline": { "points": [number] } — array angka harian, max 14 points, urutan lama ke baru
- "donut": { "segments": [{ "label": string, "value": number, "color": "green"|"red"|"purple"|"amber" }], "center_label": string } — max 3 segments
- null: viz_data harus null

Tag rules:
- "danger": budget > 85%, hutang menumpuk, pengeluaran > income
- "warning": budget 60-85%, satu kategori dominan >35% pengeluaran
- "good": goal on track, income surplus besar, hutang terlunasi
- "info": saran proaktif, observasi menarik

Prioritaskan insight yang membutuhkan tindakan user. Jangan ulangi topik yang sama.`

function buildSummary(
  txRows: { amount: number; type: string; category: string; date: string }[],
  budgetRows: { category: string; limit_amount: number }[],
  goalRows: { name: string; target_amount: number; current_amount: number; deadline: string | null }[],
  debtRows: { person: string; amount: number; type: string }[],
  period: string,
) {
  const income = txRows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const expense = txRows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  const expenseByCategory: Record<string, number> = {}
  txRows.filter(r => r.type === 'expense').forEach(r => {
    expenseByCategory[r.category] = (expenseByCategory[r.category] ?? 0) + r.amount
  })

  const dailyMap: Record<string, number> = {}
  txRows.filter(r => r.type === 'expense').forEach(r => {
    dailyMap[r.date] = (dailyMap[r.date] ?? 0) + r.amount
  })
  const dailyPoints = Object.entries(dailyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([, v]) => v)

  const budgets = budgetRows.map(b => ({
    category: b.category,
    limit: b.limit_amount,
    used: expenseByCategory[b.category] ?? 0,
    percent: b.limit_amount > 0
      ? Math.round(((expenseByCategory[b.category] ?? 0) / b.limit_amount) * 100)
      : 0,
  }))

  const goals = goalRows.map(g => ({
    name: g.name,
    target: g.target_amount,
    current: g.current_amount,
    percent: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
    deadline: g.deadline,
  }))

  return {
    period,
    income,
    expense,
    balance: income - expense,
    expense_by_category: expenseByCategory,
    daily_expense_points: dailyPoints,
    budgets,
    goals,
    debts_owed: debtRows.filter(d => d.type === 'owe').map(d => ({ person: d.person, amount: d.amount })),
    debts_lent: debtRows.filter(d => d.type === 'lent').map(d => ({ person: d.person, amount: d.amount })),
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  const userId = user?.id
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const range = getPeriodRange('month')
  const month = getMonthKey()
  const period = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  const [txResult, budgetResult, goalResult, debtResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, category, date')
      .eq('user_id', userId)
      .gte('date', range.start)
      .lte('date', range.end)
      .is('deleted_at', null),
    supabase
      .from('budgets')
      .select('category, limit_amount')
      .eq('user_id', userId)
      .eq('month', month)
      .is('deleted_at', null),
    supabase
      .from('goals')
      .select('name, target_amount, current_amount, deadline')
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('debts')
      .select('person, amount, type')
      .eq('user_id', userId)
      .eq('settled', false),
  ])

  const txRows = txResult.data ?? []
  const budgetRows = budgetResult.data ?? []
  const goalRows = goalResult.data ?? []
  const debtRows = debtResult.data ?? []

  if (txRows.length === 0 && goalRows.length === 0 && debtRows.length === 0) {
    const emptyResponse: InsightResponse = {
      insights: [{
        icon: '👋',
        title: 'Belum ada data keuangan',
        description: 'Mulai catat transaksi pertamamu di Chat, dan Finara siap menganalisis keuanganmu!',
        tag: 'info',
        viz_type: null,
        viz_data: null,
      }],
      generated_at: new Date().toISOString(),
    }
    return Response.json(emptyResponse)
  }

  const summary = buildSummary(txRows, budgetRows, goalRows, debtRows, period)

  try {
    const client = getDeepseekClient()
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(summary) },
      ],
      temperature: 0.4,
      max_tokens: 1200,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]'
    const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    const parsed: InsightCard[] = JSON.parse(cleaned)

    const response: InsightResponse = {
      insights: parsed.slice(0, 5),
      generated_at: new Date().toISOString(),
    }
    return Response.json(response)
  } catch {
    return Response.json({
      insights: [],
      generated_at: new Date().toISOString(),
      error: 'Finara gagal menganalisis saat ini, coba lagi.',
    } satisfies InsightResponse)
  }
}
