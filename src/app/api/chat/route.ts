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

const SYSTEM_PROMPT = `Kamu adalah Finara, AI finance assistant pribadi yang helpful, casual, dan supportif.
Selalu jawab dalam Bahasa Indonesia yang santai dan ramah.
Gunakan emoji secukupnya (jangan berlebihan).
JANGAN PERNAH mengarang angka keuangan — selalu gunakan tools untuk membaca data dari database.
Ketika mencatat transaksi, selalu konfirmasi dengan menyebut jumlah dan kategorinya.
Ketika user minta navigasi ke halaman lain, gunakan tool navigate_to.
Berikan insight proaktif jika ada pola menarik dalam data keuangan user.
Format angka selalu dalam rupiah: "Rp 15.000", "Rp 2.500.000".

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

Untuk card:transaction, sertakan field "_action":
- Setelah add_transaction: "_action": "created"
- Setelah update_transaction: "_action": "updated"
- Setelah delete_transaction: "_action": "deleted"
Contoh card setelah edit: { "id": "...", "type": "expense", "amount": 50000, "category": "Makanan", "date": "2026-06-20", "_action": "updated" }`

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

interface AccumulatedToolCall {
  id: string
  name: string
  arguments: string
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

    case 'navigate_to': {
      const { page } = args as NavigateArgs
      return { navigate: true, page }
    }

    default:
      return { error: 'Unknown tool' }
  }
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
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (rawSessionId) {
      historyQuery.eq('session_id', rawSessionId)
    }

    const { data: history } = await historyQuery.limit(40)

    const historyMessages = (history ?? []).map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }))

    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historyMessages,
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ]

    const encoder = new TextEncoder()
    const userId = user.id
    const currentSessionId = sessionId

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ''
          let currentMessages = [...allMessages]

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

            // Buffer for card blocks — held back until closing ``` is received
            let cardBuffer = ''
            let inCardBlock = false

            function flushToken(token: string) {
              // Check if we're entering a card block
              if (!inCardBlock) {
                const combined = cardBuffer + token
                // Card blocks start with ```card:
                const openIdx = combined.indexOf('```card:')
                if (openIdx !== -1) {
                  // Flush everything before the card block immediately
                  if (openIdx > 0) {
                    const before = combined.slice(0, openIdx)
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: before })}\n\n`))
                  }
                  cardBuffer = combined.slice(openIdx)
                  inCardBlock = true
                  return
                }
                // No card block in sight — flush pending safe prefix
                // Keep last 8 chars buffered in case ``` is split across chunks
                const safeLen = Math.max(0, combined.length - 8)
                if (safeLen > 0) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: combined.slice(0, safeLen) })}\n\n`))
                  cardBuffer = combined.slice(safeLen)
                } else {
                  cardBuffer = combined
                }
              } else {
                // Inside a card block — accumulate until closing ```
                cardBuffer += token
                // Closing ``` must come after the opening line
                const openEnd = cardBuffer.indexOf('\n')
                if (openEnd !== -1) {
                  const afterOpen = cardBuffer.slice(openEnd + 1)
                  const closeIdx = afterOpen.indexOf('```')
                  if (closeIdx !== -1) {
                    // Full card block captured — flush atomically
                    const fullBlock = cardBuffer.slice(0, openEnd + 1 + closeIdx + 3)
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: fullBlock })}\n\n`))
                    const remaining = cardBuffer.slice(openEnd + 1 + closeIdx + 3)
                    cardBuffer = ''
                    inCardBlock = false
                    // Process any remaining content after the card block
                    if (remaining) flushToken(remaining)
                  }
                }
              }
            }

            for await (const chunk of completion) {
              const delta = chunk.choices[0]?.delta
              if (!delta) continue

              if (delta.content) {
                fullContent += delta.content
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

            // Flush any remaining buffered content (tail of normal text)
            if (cardBuffer && !inCardBlock) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: cardBuffer })}\n\n`))
              cardBuffer = ''
            }

            if (hasToolCalls && Object.keys(accumulatedToolCalls).length > 0) {
              const toolCallsList = Object.values(accumulatedToolCalls)

              currentMessages.push({
                role: 'assistant',
                content: fullContent || null,
                tool_calls: toolCallsList.map((tc) => ({
                  id: tc.id,
                  type: 'function' as const,
                  function: { name: tc.name, arguments: tc.arguments },
                })),
              })

              const DATA_MUTATING_TOOLS = new Set([
                'add_transaction', 'update_transaction', 'delete_transaction',
                'set_budget', 'add_goal', 'deposit_goal', 'add_debt', 'settle_debt',
              ])

              let didMutateData = false

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

                  currentMessages.push({
                    role: 'tool',
                    tool_call_id: tc.id,
                    content: JSON.stringify(result),
                  })
                } catch (err) {
                  currentMessages.push({
                    role: 'tool',
                    tool_call_id: tc.id,
                    content: JSON.stringify({ error: String(err) }),
                  })
                }
              }

              if (didMutateData) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'data_changed' })}\n\n`)
                )
              }

              fullContent = ''
              await runCompletion()
            }
          }

          await runCompletion()

          const userMsg = messages[messages.length - 1]
          await supabase.from('chat_history').insert(
            { user_id: userId, session_id: currentSessionId, role: 'user', content: userMsg.content }
          )
          await supabase.from('chat_history').insert(
            { user_id: userId, session_id: currentSessionId, role: 'assistant', content: fullContent }
          )

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
