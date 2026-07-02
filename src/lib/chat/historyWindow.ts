import type OpenAI from 'openai'

export interface ChatHistoryRow {
  role: string
  content: string
  tool_calls_json?: unknown
  tool_call_id?: string | null
}

export const FULL_TURNS = 8
export const TOOL_RESULT_MAX_CHARS = 1500
export const WINDOW_CHAR_BUDGET = 24000

type Msg = OpenAI.Chat.ChatCompletionMessageParam

const CARD_BLOCK_REGEX = /```card:[a-z]+\s*\n[\s\S]*?```/g

export function stripCardBlocks(text: string): string {
  return text.replace(CARD_BLOCK_REGEX, '[kartu ditampilkan]')
}

function truncateToolResult(content: string): string {
  if (content.length <= TOOL_RESULT_MAX_CHARS) return content
  return content.slice(0, TOOL_RESULT_MAX_CHARS) + '…[dipangkas]'
}

// One turn = a 'user' row up to (excluding) the next 'user' row.
// Leading rows before the first 'user' row are remnants of a truncated turn — dropped.
function groupTurns(rows: ChatHistoryRow[]): ChatHistoryRow[][] {
  const firstUser = rows.findIndex((r) => r.role === 'user')
  if (firstUser === -1) return []
  const turns: ChatHistoryRow[][] = []
  let current: ChatHistoryRow[] = []
  for (const row of rows.slice(firstUser)) {
    if (row.role === 'user' && current.length > 0) {
      turns.push(current)
      current = []
    }
    current.push(row)
  }
  if (current.length > 0) turns.push(current)
  return turns
}

function convertFullTurn(turn: ChatHistoryRow[]): Msg[] {
  const msgs: Msg[] = []
  const validToolCallIds = new Set<string>()
  for (const row of turn) {
    if (row.role === 'user') {
      msgs.push({ role: 'user', content: row.content })
    } else if (row.role === 'tool_call') {
      if (!Array.isArray(row.tool_calls_json) || row.tool_calls_json.length === 0) continue
      const toolCalls = row.tool_calls_json as OpenAI.Chat.ChatCompletionMessageToolCall[]
      toolCalls.forEach((tc) => validToolCallIds.add(tc.id))
      msgs.push({ role: 'assistant', content: row.content || null, tool_calls: toolCalls })
    } else if (row.role === 'tool') {
      // A tool result without its parent tool_call breaks the API contract — drop it.
      if (!row.tool_call_id || !validToolCallIds.has(row.tool_call_id)) continue
      msgs.push({ role: 'tool', tool_call_id: row.tool_call_id, content: truncateToolResult(row.content) })
    } else if (row.role === 'assistant') {
      msgs.push({ role: 'assistant', content: row.content })
    }
  }

  // Pairing safety post-process: collect the set of tool_call ids that are
  // actually answered by an emitted tool message in this turn.
  const answeredIds = new Set<string>()
  for (const m of msgs) {
    if (m.role === 'tool') {
      answeredIds.add((m as OpenAI.Chat.ChatCompletionToolMessageParam).tool_call_id)
    }
  }

  // For each assistant message that carries tool_calls, filter its tool_calls
  // to only those ids that were answered. If the filtered list is empty, either
  // replace the message with a content-only message (if there is text) or drop
  // it entirely — an empty tool_calls array triggers a 400 from the API.
  const result: Msg[] = []
  for (const m of msgs) {
    if (m.role === 'assistant' && Array.isArray((m as OpenAI.Chat.ChatCompletionAssistantMessageParam).tool_calls)) {
      const assistantMsg = m as OpenAI.Chat.ChatCompletionAssistantMessageParam
      const filtered = (assistantMsg.tool_calls ?? []).filter((tc) => answeredIds.has(tc.id))
      if (filtered.length === 0) {
        // No answered tool_calls — replace with content-only or drop.
        if (assistantMsg.content && typeof assistantMsg.content === 'string' && assistantMsg.content.length > 0) {
          result.push({ role: 'assistant', content: assistantMsg.content })
        }
        // else: drop entirely
      } else {
        result.push({ ...assistantMsg, tool_calls: filtered })
      }
    } else {
      result.push(m)
    }
  }

  return result
}

// Old turns keep only user/assistant text; card JSON is replaced so stale
// "confirmation examples" stop teaching the model to skip tools.
function convertTextOnlyTurn(turn: ChatHistoryRow[]): Msg[] {
  const msgs: Msg[] = []
  for (const row of turn) {
    if (row.role === 'user') {
      msgs.push({ role: 'user', content: row.content })
    } else if (row.role === 'assistant' && row.content) {
      msgs.push({ role: 'assistant', content: stripCardBlocks(row.content) })
    }
  }
  return msgs
}

export function buildHistoryWindow(rows: ChatHistoryRow[]): Msg[] {
  const turns = groupTurns(rows)
  const kept: Msg[][] = []
  let usedChars = 0
  for (let i = turns.length - 1; i >= 0; i--) {
    const distanceFromEnd = turns.length - 1 - i
    const msgs =
      distanceFromEnd < FULL_TURNS ? convertFullTurn(turns[i]) : convertTextOnlyTurn(turns[i])
    const chars = JSON.stringify(msgs).length
    if (kept.length > 0 && usedChars + chars > WINDOW_CHAR_BUDGET) break
    usedChars += chars
    kept.push(msgs)
  }
  return kept.reverse().flat()
}
