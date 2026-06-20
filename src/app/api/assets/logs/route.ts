import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const assetId = searchParams.get('asset_id')
  if (!assetId) return NextResponse.json({ error: 'Missing asset_id' }, { status: 400 })

  const uuidParsed = z.string().uuid().safeParse(assetId)
  if (!uuidParsed.success) return NextResponse.json({ error: 'Invalid asset_id' }, { status: 400 })

  const { data, error } = await supabase
    .from('asset_value_logs')
    .select('id, asset_id, old_value, new_value, note, created_at')
    .eq('asset_id', assetId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}
