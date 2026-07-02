import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getPeriodRange, getMonthKey } from '@/lib/utils/date'

const UpsertSchema = z.object({
  category: z.string().min(1),
  limit_amount: z.number().int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') ?? getMonthKey()
  const range = getPeriodRange('month')

  const [budgetsResult, txResult] = await Promise.all([
    supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', month).is('deleted_at', null),
    supabase
      .from('transactions')
      .select('amount, category')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', range.start)
      .lte('date', range.end),
  ])

  if (budgetsResult.error) return NextResponse.json({ error: budgetsResult.error.message }, { status: 500 })

  const txRows = txResult.data ?? []
  const spendingByCategory: Record<string, number> = {}
  txRows.forEach((r) => {
    spendingByCategory[r.category] = (spendingByCategory[r.category] ?? 0) + r.amount
  })

  const budgets = (budgetsResult.data ?? []).map((b) => ({
    ...b,
    used: spendingByCategory[b.category] ?? 0,
    percent: b.limit_amount > 0 ? ((spendingByCategory[b.category] ?? 0) / b.limit_amount) * 100 : 0,
  }))

  return NextResponse.json({ budgets, month })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = UpsertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const month = parsed.data.month ?? getMonthKey()
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { user_id: user.id, category: parsed.data.category, limit_amount: parsed.data.limit_amount, month, source: 'manual' },
      { onConflict: 'user_id,category,month' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ budget: data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const uuidParsed = z.string().uuid().safeParse(id)
  if (!uuidParsed.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const { error } = await supabase
    .from('budgets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
