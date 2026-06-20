import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ASSET_TYPES = ['bank', 'investment', 'property', 'vehicle', 'other'] as const

const CreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ASSET_TYPES),
  institution: z.string().optional(),
  value: z.number().int().min(0),
  note: z.string().optional(),
})

const UpdateSchema = z.object({
  id: z.string().uuid(),
  value: z.number().int().min(0).optional(),
  name: z.string().min(1).optional(),
  institution: z.string().optional(),
  note: z.string().optional(),
  log_note: z.string().optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', user.id)
    .order('type', { ascending: true })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total = (data ?? []).reduce((s, a) => s + a.value, 0)
  return NextResponse.json({ assets: data ?? [], total })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('assets')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ asset: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { id, log_note, ...fields } = parsed.data
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // If updating value, fetch old value first for the log
  let oldValue: number | null = null
  if (fields.value !== undefined) {
    const { data: current } = await supabase
      .from('assets')
      .select('value')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (!current) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    oldValue = current.value
  }

  const { data, error } = await supabase
    .from('assets')
    .update(fields)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  // Insert value log only when value actually changed
  if (fields.value !== undefined && oldValue !== null && oldValue !== fields.value) {
    await supabase.from('asset_value_logs').insert({
      asset_id: id,
      user_id: user.id,
      old_value: oldValue,
      new_value: fields.value,
      note: log_note ?? null,
    })
  }

  return NextResponse.json({ asset: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
