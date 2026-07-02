import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getDeepseekClient } from '@/lib/deepseek/client'
import { tools } from '@/lib/deepseek/tools'
import { getPeriodRange, getMonthKey, getTodayKey } from '@/lib/utils/date'
import type { SupabaseClient } from '@supabase/supabase-js'
import type OpenAI from 'openai'

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  session_id: z.string().uuid().optional(),
})

function buildSystemPrompt(todayKey: string): string {
  return `Kamu adalah Finara, AI finance assistant pribadi yang helpful, casual, dan supportif.
Selalu jawab dalam Bahasa Indonesia yang santai dan ramah.
Gunakan emoji secukupnya (jangan berlebihan).
JANGAN gunakan "---" atau garis pemisah horizontal dalam respons — langsung tulis paragraf berikutnya saja.
JANGAN PERNAH mengarang angka keuangan — selalu gunakan tools untuk membaca data dari database.
Ketika mencatat transaksi, selalu konfirmasi dengan menyebut jumlah dan kategorinya.
Ketika user minta navigasi ke halaman lain, gunakan tool navigate_to.
Berikan insight proaktif jika ada pola menarik dalam data keuangan user.
Format angka selalu dalam rupiah: "Rp 15.000", "Rp 2.500.000".
TANGGAL HARI INI: ${todayKey} (gunakan ini sebagai default untuk field "date" jika user tidak menyebut tanggal spesifik).

ATURAN WAJIB TOOL CALLING — BACA DAN PATUHI SELALU:
1. WAJIB panggil tool untuk SETIAP operasi tulis (add_transaction, update_transaction, delete_transaction, set_budget, add_goal, deposit_goal, add_debt, settle_debt, add_asset, update_asset_value, delete_asset). TIDAK ADA PENGECUALIAN.
2. Setiap permintaan baru dari user = tool call baru yang harus dipanggil di turn ini. Riwayat percakapan sebelumnya TIDAK MEMBENARKAN kamu skip tool call.
3. DILARANG KERAS menjawab "sudah aku catat", "oke, sudah disimpan", atau konfirmasi apapun tanpa tool call yang berhasil di turn ini.
4. Jika kamu ragu apakah data sudah ada, panggil tool GET terlebih dahulu. Jangan berasumsi dari teks riwayat percakapan.
5. JANGAN PERNAH mengandalkan memori percakapan untuk operasi tulis — database adalah sumber kebenaran, bukan teks chat.

KATEGORI PENGELUARAN yang valid (gunakan PERSIS salah satu dari ini):
Makanan & Minuman, Transportasi, Belanja, Hiburan, Kesehatan, Pendidikan, Tagihan & Utilitas, Rumah, Travel, Perawatan Diri, Anak & Keluarga, Hewan Peliharaan, Sosial & Hadiah, Cicilan & Hutang, Lainnya

KATEGORI PEMASUKAN yang valid (gunakan PERSIS salah satu dari ini):
Gaji, Freelance, Bisnis, Investasi, Bonus, Hadiah, Transfer Masuk, Lainnya

Jangan mengarang kategori baru — selalu pilih yang paling sesuai dari daftar di atas.

Untuk EDIT atau HAPUS transaksi:
- Selalu panggil get_transactions dulu untuk menemukan transaksi yang dimaksud dan mendapatkan ID-nya.
- Jika ada lebih dari satu transaksi yang cocok, tanya user mana yang dimaksud sebelum melanjutkan.
- Setelah yakin, panggil update_transaction atau delete_transaction dengan ID yang benar.
- Setelah hapus, konfirmasi dengan menyebut transaksi yang dihapus.

Setelah tool call berhasil, return response card dalam format markdown:
\`\`\`card:transaction
{...json...}
\`\`\`
Gunakan card:summary untuk rekap, card:goal untuk goal, card:budget untuk budget, card:debt untuk hutang/piutang.

Format card:budget (WAJIB gunakan field ini persis):
\`\`\`card:budget
{ "category": "Transportasi", "limit": 500000, "used": 0, "percent": 0 }
\`\`\`
Field "limit" = limit_amount dari tool result. "used" = pengeluaran terpakai (0 jika baru diset). JANGAN gunakan nama lain seperti "limit_amount".

Format card:debt — untuk satu hutang:
\`\`\`card:debt
{ "person": "Nama", "amount": 50000, "type": "owe", "note": "kopi" }
\`\`\`
Untuk daftar hutang (get_debts), gunakan field "items":
\`\`\`card:debt
{ "items": [{ "person": "Nama", "amount": 50000, "type": "owe", "note": "kopi", "settled": false }] }
\`\`\`
type: "owe" = kamu berhutang, "lent" = kamu meminjamkan. JANGAN tampilkan tabel markdown untuk hutang — selalu gunakan card:debt.

Format card:goal (WAJIB gunakan field ini persis):
\`\`\`card:goal
{ "name": "nama goal", "target": 1000000, "current": 100000, "percent": 10, "deadline": "2026-12-31" }
\`\`\`
Field "target" = target_amount, "current" = current_amount. JANGAN gunakan nama lain.

Sertakan field "_action" pada card setelah operasi write berhasil:
- "_action": "created" setelah membuat baru
- "_action": "updated" setelah mengubah
- "_action": "deleted" setelah menghapus

Contoh card:transaction setelah edit: { "id": "...", "type": "expense", "amount": 50000, "category": "Makanan & Minuman", "date": "2026-06-20", "_action": "updated" }
Contoh card:budget setelah buat: { "category": "Transportasi", "limit": 500000, "used": 0, "percent": 0, "_action": "created" }
Contoh card:goal setelah buat: { "name": "Liburan", "target": 5000000, "current": 0, "percent": 0, "_action": "created" }
Contoh card:debt setelah catat: { "person": "Budi", "amount": 50000, "type": "owe", "note": "kopi", "_action": "created" }

Fitur ASET — gunakan tool add_asset, update_asset_value, get_assets, delete_asset.
Tipe aset valid: bank (rekening/tabungan), investment (investasi), property (properti), vehicle (kendaraan), other (lainnya).

PENTING — Ketika user menyebut pembelian aset (nabung emas, beli logam mulia, invest saham/reksadana/kripto, beli kendaraan, beli properti, dll):
1. SELALU tanya dulu sebelum eksekusi: "Mau aku catat sebagai aset sekaligus pengeluaran, atau aset aja?"
2. Tunggu jawaban user — jangan langsung panggil tool apapun.
3. Setelah user jawab, baru eksekusi sesuai pilihannya:
   - "Dua-duanya" → panggil add_asset lalu add_transaction (kategori "Investasi" untuk saham/reksadana/emas, atau kategori yang paling sesuai)
   - "Aset aja" → panggil add_asset saja, skip add_transaction

Setelah operasi aset, return card dalam format:
\`\`\`card:asset
{ "name": "Reksadana Bibit", "type": "investment", "institution": "Bibit", "value": 200000000, "_action": "created" }
\`\`\`
Untuk list aset (get_assets), gunakan field "items":
\`\`\`card:asset
{ "items": [{ "name": "BCA Tahapan", "type": "bank", "value": 50000000 }, { "name": "Reksadana Bibit", "type": "investment", "value": 200000000 }], "total": 250000000 }
\`\`\`
JANGAN tampilkan tabel markdown untuk aset — selalu gunakan card:asset.

PANDUAN INSTALL PWA — jika user tanya cara install Finara di HP, jelaskan dengan ramah dan pakai emoji:

Chrome (Android):
1. Buka Finara di Chrome
2. Tap ikon tiga titik (⋮) di pojok kanan atas
3. Pilih "Tambahkan ke layar utama" atau "Install App"
4. Tap "Tambah" untuk konfirmasi
5. Ikon Finara langsung muncul di home screen 🎉

Safari (iPhone/iPad):
1. Buka Finara di Safari (HARUS pakai Safari, bukan Chrome di iPhone)
2. Tap ikon Share (kotak dengan panah ke atas ↑) di bagian bawah layar
3. Scroll ke bawah, pilih "Tambahkan ke Layar Utama" (Add to Home Screen)
4. Tap "Tambah" di pojok kanan atas
5. Ikon Finara langsung muncul di home screen 🎉

Samsung Internet (Android):
1. Buka Finara di Samsung Internet
2. Tap ikon menu (tiga garis) di bawah
3. Pilih "Tambahkan halaman ke" → "Layar beranda"
4. Tap "Tambah"

Setelah install, Finara bisa dibuka kayak app biasa — tanpa buka browser dulu! 📱`
}

interface AddTransactionArgs {
  amount: number
  type: 'income' | 'expense'
  category: string
  note?: string
  date?: string
}

interface UpdateTransactionArgs {
  id: string
  amount?: number
  type?: 'income' | 'expense'
  category?: string
  note?: string
  date?: string
}

interface DeleteTransactionArgs {
  id: string
}

interface GetSummaryArgs {
  period: 'today' | 'week' | 'month' | 'year'
  type?: 'income' | 'expense' | 'all'
}

interface GetTransactionsArgs {
  limit?: number
  period?: 'today' | 'week' | 'month' | 'year'
  category?: string
  type?: 'income' | 'expense'
}

interface SetBudgetArgs {
  category: string
  limit_amount: number
  month?: string
}

interface GetBudgetsArgs {
  month?: string
}

interface AddGoalArgs {
  name: string
  target_amount: number
  deadline?: string
}

interface DepositGoalArgs {
  goal_name: string
  amount: number
}

interface AddDebtArgs {
  person: string
  amount: number
  type: 'owe' | 'lent'
  note?: string
}

interface SettleDebtArgs {
  person: string
}

interface GetDebtsArgs {
  type?: 'owe' | 'lent' | 'all'
}

interface GetInsightsArgs {
  period?: 'week' | 'month'
}

interface NavigateArgs {
  page: string
}

interface AddAssetArgs {
  name: string
  type: 'bank' | 'investment' | 'property' | 'vehicle' | 'other'
  value: number
  institution?: string
  note?: string
}

interface UpdateAssetValueArgs {
  asset_name: string
  value: number
  note?: string
}

interface GetAssetsArgs {
  type?: 'bank' | 'investment' | 'property' | 'vehicle' | 'other' | 'all'
}

interface DeleteAssetArgs {
  asset_name: string
}

interface AccumulatedToolCall {
  id: string
  name: string
  arguments: string
}

// Represents one turn of tool interaction to be persisted
interface ToolTurnRecord {
  assistantContent: string | null
  toolCalls: Array<{ id: string; name: string; arguments: string }>
  toolResults: Array<{ tool_call_id: string; content: string }>
}

async function executeTool(
  name: string,
  args: unknown,
  userId: string,
  supabase: SupabaseClient
): Promise<unknown> {
  switch (name) {
    case 'add_transaction': {
      const { amount, type, category, note, date } = args as AddTransactionArgs
      const { data, error } = await supabase
        .from('transactions')
        .insert({ user_id: userId, amount, type, category, note, date: date ?? getTodayKey() })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return { success: true, transaction: data }
    }

    case 'update_transaction': {
      const { id, ...fields } = args as UpdateTransactionArgs
      if (Object.keys(fields).length === 0) return { success: false, error: 'Tidak ada field yang diubah' }
      const { data, error } = await supabase
        .from('transactions')
        .update(fields)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      if (error) throw new Error(error.message)
      if (!data) return { success: false, error: 'Transaksi tidak ditemukan' }
      return { success: true, transaction: data }
    }

    case 'delete_transaction': {
      const { id } = args as DeleteTransactionArgs
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
      return { success: true, deleted_id: id }
    }

    case 'get_summary': {
      const { period, type } = args as GetSummaryArgs
      const range = getPeriodRange(period)
      let query = supabase
        .from('transactions')
        .select('amount, type, category')
        .eq('user_id', userId)
        .gte('date', range.start)
        .lte('date', range.end)

      if (type && type !== 'all') query = query.eq('type', type)

      const { data } = await query
      const rows = data ?? []
      const income = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
      const expense = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
      return { income, expense, balance: income - expense, period, rowCount: rows.length }
    }

    case 'get_transactions': {
      const { limit = 10, period, category, type } = args as GetTransactionsArgs
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit)

      if (period) {
        const range = getPeriodRange(period)
        query = query.gte('date', range.start).lte('date', range.end)
      }
      if (category) query = query.eq('category', category)
      if (type) query = query.eq('type', type)

      const { data } = await query
      return { transactions: data ?? [] }
    }

    case 'set_budget': {
      const { category, limit_amount, month } = args as SetBudgetArgs
      const m = month ?? getMonthKey()
      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          { user_id: userId, category, limit_amount, month: m },
          { onConflict: 'user_id,category,month' }
        )
        .select()
        .single()
      if (error) throw new Error(error.message)
      return { success: true, budget: data }
    }

    case 'get_budgets': {
      const { month } = args as GetBudgetsArgs
      const m = month ?? getMonthKey()
      const range = getPeriodRange('month')

      const [budgetsResult, txResult] = await Promise.all([
        supabase.from('budgets').select('*').eq('user_id', userId).eq('month', m),
        supabase
          .from('transactions')
          .select('amount, category')
          .eq('user_id', userId)
          .eq('type', 'expense')
          .gte('date', range.start)
          .lte('date', range.end),
      ])

      const budgets = budgetsResult.data ?? []
      const txRows = txResult.data ?? []

      const spendingByCategory: Record<string, number> = {}
      txRows.forEach((r) => {
        spendingByCategory[r.category] = (spendingByCategory[r.category] ?? 0) + r.amount
      })

      const result = budgets.map((b) => ({
        ...b,
        used: spendingByCategory[b.category] ?? 0,
        percent:
          b.limit_amount > 0
            ? ((spendingByCategory[b.category] ?? 0) / b.limit_amount) * 100
            : 0,
      }))

      return { budgets: result, month: m }
    }

    case 'add_goal': {
      const { name, target_amount, deadline } = args as AddGoalArgs
      const { data, error } = await supabase
        .from('goals')
        .insert({ user_id: userId, name, target_amount, deadline })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return { success: true, goal: data }
    }

    case 'deposit_goal': {
      const { goal_name, amount } = args as DepositGoalArgs
      const { data: goal } = await supabase
        .from('goals')
        .select('id, current_amount')
        .eq('user_id', userId)
        .ilike('name', `%${goal_name}%`)
        .single()

      if (!goal) return { success: false, error: `Goal "${goal_name}" tidak ditemukan` }

      const newAmount = (goal.current_amount ?? 0) + amount
      const { data, error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', goal.id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return { success: true, goal: data }
    }

    case 'get_goals': {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { goals: data ?? [] }
    }

    case 'add_debt': {
      const { person, amount, type, note } = args as AddDebtArgs
      const { data, error } = await supabase
        .from('debts')
        .insert({ user_id: userId, person, amount, type, note })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return { success: true, debt: data }
    }

    case 'settle_debt': {
      const { person } = args as SettleDebtArgs
      const { data, error } = await supabase
        .from('debts')
        .update({ settled: true, settled_at: new Date().toISOString() })
        .eq('user_id', userId)
        .ilike('person', `%${person}%`)
        .eq('settled', false)
        .select()
      if (error) throw new Error(error.message)
      return { success: true, settled: data }
    }

    case 'get_debts': {
      const { type } = args as GetDebtsArgs
      let query = supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (type && type !== 'all') query = query.eq('type', type)
      const { data } = await query
      return { debts: data ?? [] }
    }

    case 'get_insights': {
      const { period = 'month' } = args as GetInsightsArgs
      const range = getPeriodRange(period)
      const { data } = await supabase
        .from('transactions')
        .select('amount, type, category, date')
        .eq('user_id', userId)
        .gte('date', range.start)
        .lte('date', range.end)
        .eq('type', 'expense')

      const rows = data ?? []
      const byCategory: Record<string, number> = {}
      rows.forEach((r) => {
        byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amount
      })
      const sorted = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      return {
        period,
        topCategories: sorted,
        totalExpense: rows.reduce((s, r) => s + r.amount, 0),
      }
    }

    case 'add_asset': {
      const { name, type, value, institution, note } = args as AddAssetArgs
      const { data, error } = await supabase
        .from('assets')
        .insert({ user_id: userId, name, type, value: Math.round(value), institution, note })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return { success: true, asset: data }
    }

    case 'update_asset_value': {
      const { asset_name, value, note } = args as UpdateAssetValueArgs
      const { data: asset } = await supabase
        .from('assets')
        .select('id, value')
        .eq('user_id', userId)
        .ilike('name', `%${asset_name}%`)
        .single()
      if (!asset) return { success: false, error: `Aset "${asset_name}" tidak ditemukan` }

      const newValue = Math.round(value)
      const { data, error } = await supabase
        .from('assets')
        .update({ value: newValue })
        .eq('id', asset.id)
        .select()
        .single()
      if (error) throw new Error(error.message)

      if (asset.value !== newValue) {
        await supabase.from('asset_value_logs').insert({
          asset_id: asset.id,
          user_id: userId,
          old_value: asset.value,
          new_value: newValue,
          note: note ?? null,
        })
      }
      return { success: true, asset: data }
    }

    case 'get_assets': {
      const { type } = args as GetAssetsArgs
      let query = supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .order('type', { ascending: true })
        .order('name', { ascending: true })
      if (type && type !== 'all') query = query.eq('type', type)

      const { data: assets } = await query
      const rows = assets ?? []

      const { data: debts } = await supabase
        .from('debts')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'owe')
        .eq('settled', false)

      const totalAssets = rows.reduce((s, a) => s + a.value, 0)
      const totalDebts = (debts ?? []).reduce((s, d) => s + d.amount, 0)
      return { assets: rows, totalAssets, totalDebts, netWorth: totalAssets - totalDebts }
    }

    case 'delete_asset': {
      const { asset_name } = args as DeleteAssetArgs
      const { data: asset } = await supabase
        .from('assets')
        .select('id, name')
        .eq('user_id', userId)
        .ilike('name', `%${asset_name}%`)
        .single()
      if (!asset) return { success: false, error: `Aset "${asset_name}" tidak ditemukan` }

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', asset.id)
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
      return { success: true, deleted_name: asset.name }
    }

    case 'navigate_to': {
      const { page } = args as NavigateArgs
      return { navigate: true, page }
    }

    default:
      return { error: 'Unknown tool' }
  }
}

// Reconstruct the full OpenAI message array from persisted chat_history rows,
// including tool_call and tool result rows so the model has full grounding.
function reconstructMessages(
  history: Array<{ role: string; content: string; tool_calls_json?: unknown; tool_call_id?: string | null }>
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return history.map((h) => {
    if (h.role === 'tool_call') {
      return {
        role: 'assistant' as const,
        content: h.content || null,
        tool_calls: h.tool_calls_json as OpenAI.Chat.ChatCompletionMessageToolCall[],
      }
    }
    if (h.role === 'tool') {
      return {
        role: 'tool' as const,
        tool_call_id: h.tool_call_id ?? '',
        content: h.content,
      }
    }
    return {
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }
  })
}

function stripScanSentinel(content: string): string {
  return content.replace(/^\[scan:[^\]]+\]\n/, '')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, session_id: rawSessionId } = parsed.data
    const sessionId = rawSessionId ?? crypto.randomUUID()

    const historyQuery = supabase
      .from('chat_history')
      .select('role, content, tool_calls_json, tool_call_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (rawSessionId) {
      historyQuery.eq('session_id', rawSessionId)
    }

    // Higher limit to accommodate tool_call + tool rows alongside user/assistant rows
    const { data: history } = await historyQuery.limit(80)

    const historyMessages = reconstructMessages(
      (history ?? []).map((h) => ({
        ...h,
        content: h.role === 'user' ? stripScanSentinel(h.content) : h.content,
      }))
    )

    const incomingUserContent = messages[messages.length - 1].content
    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt(getTodayKey()) },
      ...historyMessages,
      { role: 'user', content: stripScanSentinel(incomingUserContent) },
    ]

    const encoder = new TextEncoder()
    const userId = user.id
    const currentSessionId = sessionId

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let finalAssistantContent = ''
          let currentMessages = [...allMessages]
          const toolTurnRecords: ToolTurnRecord[] = []

          async function runCompletion(): Promise<void> {
            const completion = await getDeepseekClient().chat.completions.create({
              model: 'deepseek-chat',
              messages: currentMessages,
              tools,
              tool_choice: 'auto',
              stream: true,
            })

            const accumulatedToolCalls: Record<number, AccumulatedToolCall> = {}
            let hasToolCalls = false
            let turnAssistantContent = ''

            // Buffer for card blocks — held back until closing ``` is received
            let cardBuffer = ''
            let inCardBlock = false

            function flushToken(token: string) {
              if (!inCardBlock) {
                const combined = cardBuffer + token
                const openIdx = combined.indexOf('```card:')
                if (openIdx !== -1) {
                  if (openIdx > 0) {
                    const before = combined.slice(0, openIdx)
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: before })}\n\n`))
                  }
                  cardBuffer = combined.slice(openIdx)
                  inCardBlock = true
                  return
                }
                const safeLen = Math.max(0, combined.length - 8)
                if (safeLen > 0) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: combined.slice(0, safeLen) })}\n\n`))
                  cardBuffer = combined.slice(safeLen)
                } else {
                  cardBuffer = combined
                }
              } else {
                cardBuffer += token
                const openEnd = cardBuffer.indexOf('\n')
                if (openEnd !== -1) {
                  const afterOpen = cardBuffer.slice(openEnd + 1)
                  const closeIdx = afterOpen.indexOf('```')
                  if (closeIdx !== -1) {
                    const fullBlock = cardBuffer.slice(0, openEnd + 1 + closeIdx + 3)
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: fullBlock })}\n\n`))
                    const remaining = cardBuffer.slice(openEnd + 1 + closeIdx + 3)
                    cardBuffer = ''
                    inCardBlock = false
                    if (remaining) flushToken(remaining)
                  }
                }
              }
            }

            for await (const chunk of completion) {
              const delta = chunk.choices[0]?.delta
              if (!delta) continue

              if (delta.content) {
                turnAssistantContent += delta.content
                finalAssistantContent += delta.content
                flushToken(delta.content)
              }

              if (delta.tool_calls) {
                hasToolCalls = true
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0
                  if (!accumulatedToolCalls[idx]) {
                    accumulatedToolCalls[idx] = { id: tc.id ?? `call_${idx}`, name: '', arguments: '' }
                  }
                  if (tc.function?.name) accumulatedToolCalls[idx].name += tc.function.name
                  if (tc.function?.arguments) accumulatedToolCalls[idx].arguments += tc.function.arguments
                  if (tc.id) accumulatedToolCalls[idx].id = tc.id
                }
              }
            }

            // Flush any remaining buffered non-card content
            if (cardBuffer && !inCardBlock) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: cardBuffer })}\n\n`))
              cardBuffer = ''
            }

            if (hasToolCalls && Object.keys(accumulatedToolCalls).length > 0) {
              const toolCallsList = Object.values(accumulatedToolCalls)

              const assistantToolCallMsg: OpenAI.Chat.ChatCompletionMessageParam = {
                role: 'assistant',
                content: turnAssistantContent || null,
                tool_calls: toolCallsList.map((tc) => ({
                  id: tc.id,
                  type: 'function' as const,
                  function: { name: tc.name, arguments: tc.arguments },
                })),
              }
              currentMessages.push(assistantToolCallMsg)

              const DATA_MUTATING_TOOLS = new Set([
                'add_transaction', 'update_transaction', 'delete_transaction',
                'set_budget', 'add_goal', 'deposit_goal', 'add_debt', 'settle_debt',
                'add_asset', 'update_asset_value', 'delete_asset',
              ])

              let didMutateData = false
              const toolResults: Array<{ tool_call_id: string; content: string }> = []

              for (const tc of toolCallsList) {
                try {
                  const args = JSON.parse(tc.arguments)
                  const result = await executeTool(tc.name, args, userId, supabase)

                  if (
                    tc.name === 'navigate_to' &&
                    result &&
                    typeof result === 'object' &&
                    'navigate' in result
                  ) {
                    const nav = result as { navigate: boolean; page: string }
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: 'navigate', page: nav.page })}\n\n`
                      )
                    )
                  }

                  if (DATA_MUTATING_TOOLS.has(tc.name)) didMutateData = true

                  const resultContent = JSON.stringify(result)
                  toolResults.push({ tool_call_id: tc.id, content: resultContent })
                  currentMessages.push({
                    role: 'tool',
                    tool_call_id: tc.id,
                    content: resultContent,
                  })
                } catch (err) {
                  const errorContent = JSON.stringify({
                    success: false,
                    error: String(err),
                    message: 'Gagal menyimpan data. Informasikan ke user bahwa terjadi error dan jangan tampilkan card sukses.',
                  })
                  toolResults.push({ tool_call_id: tc.id, content: errorContent })
                  currentMessages.push({
                    role: 'tool',
                    tool_call_id: tc.id,
                    content: errorContent,
                  })
                }
              }

              // Record this tool turn for persistence
              toolTurnRecords.push({
                assistantContent: turnAssistantContent || null,
                toolCalls: toolCallsList,
                toolResults,
              })

              if (didMutateData) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'data_changed' })}\n\n`)
                )
              }

              await runCompletion()
            }
          }

          await runCompletion()

          // Persist: user message
          const userMsg = messages[messages.length - 1]
          await supabase.from('chat_history').insert({
            user_id: userId,
            session_id: currentSessionId,
            role: 'user',
            content: userMsg.content,
          })

          // Persist: tool call/result turns (each tool turn = 1 tool_call row + N tool rows)
          for (const turn of toolTurnRecords) {
            await supabase.from('chat_history').insert({
              user_id: userId,
              session_id: currentSessionId,
              role: 'tool_call',
              content: turn.assistantContent ?? '',
              tool_calls_json: turn.toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: tc.arguments },
              })),
            })
            for (const tr of turn.toolResults) {
              await supabase.from('chat_history').insert({
                user_id: userId,
                session_id: currentSessionId,
                role: 'tool',
                content: tr.content,
                tool_call_id: tr.tool_call_id,
              })
            }
          }

          // Persist: final assistant text response
          await supabase.from('chat_history').insert({
            user_id: userId,
            session_id: currentSessionId,
            role: 'assistant',
            content: finalAssistantContent,
          })

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', session_id: currentSessionId })}\n\n`)
          )
          controller.close()
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const session_id = searchParams.get('session_id')
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  const uuidParsed = z.string().uuid().safeParse(session_id)
  if (!uuidParsed.success) return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })

  const { error } = await supabase
    .from('chat_history')
    .update({ deleted_at: new Date().toISOString() })
    .eq('session_id', session_id)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
