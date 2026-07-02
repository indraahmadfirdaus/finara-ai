# Chat Tool-Calling Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate skipped tool calls in long-history chat sessions and multi-transaction messages, with a deterministic card gate + corrective retry, plus a `source` column ('chat'/'manual') for dev analytics.

**Architecture:** Extract pure logic from `src/app/api/chat/route.ts` into three focused modules (`historyWindow`, `cardGate`, `prompt`) under `src/lib/chat/`, wire them into the SSE loop, and add a nullable `source` column to the five record tables. Spec: `docs/superpowers/specs/2026-07-02-chat-tool-reliability-design.md`.

**Tech Stack:** Next.js 16.2.9 (route handler), openai SDK v6 (DeepSeek), Supabase, Zod v4, Vitest (new devDependency, unit tests only).

## Global Constraints

- Branch: `feat/chat-tool-reliability` (already checked out). NEVER commit to `main`.
- Run `npx tsc --noEmit` before every commit (hard ban in CLAUDE.md).
- No client changes: `src/app/(app)/chat/page.tsx`, `StreamingText.tsx`, SSE event shapes, and card formats stay untouched.
- No secrets in client code; all changes are server-side or SQL.
- Constants (verbatim from spec): `FULL_TURNS = 8`, `TOOL_RESULT_MAX_CHARS = 1500`, `WINDOW_CHAR_BUDGET = 24000`, history fetch `limit(160)` descending.
- `source` column: `TEXT CHECK (source IN ('chat','manual'))`, **nullable, no default** (legacy rows stay NULL).
- Any schema change must be reflected in BOTH `supabase/migrations/004_record_source.sql` AND `supabase/schema.sql`.
- All user-facing strings in Bahasa Indonesia (casual), consistent with existing prompt tone.

---

### Task 1: Vitest setup

**Files:**
- Modify: `package.json` (devDependency + script)
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `npm test` → runs `vitest run` over `src/**/*.test.ts`. Later tasks rely on this command.

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Add test script to package.json**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run"
```

- [ ] **Step 3: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Smoke-run**

Run: `npm test`
Expected: `No test files found` exit — acceptable (exit code may be 1; that's fine, next task adds tests). If vitest errors on config parsing, fix before proceeding.

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for unit testing pure chat modules"
```

---

### Task 2: `historyWindow` module (TDD)

**Files:**
- Create: `src/lib/chat/historyWindow.ts`
- Test: `src/lib/chat/historyWindow.test.ts`

**Interfaces:**
- Produces (used by Task 5):
  - `interface ChatHistoryRow { role: string; content: string; tool_calls_json?: unknown; tool_call_id?: string | null }`
  - `function buildHistoryWindow(rows: ChatHistoryRow[]): OpenAI.Chat.ChatCompletionMessageParam[]` — input MUST be chronological (oldest → newest)
  - `function stripCardBlocks(text: string): string` (also used by Task 3 tests for reference; exported for reuse)
  - Constants: `FULL_TURNS`, `TOOL_RESULT_MAX_CHARS`, `WINDOW_CHAR_BUDGET`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/chat/historyWindow.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  buildHistoryWindow,
  stripCardBlocks,
  FULL_TURNS,
  TOOL_RESULT_MAX_CHARS,
  type ChatHistoryRow,
} from './historyWindow'

function userRow(content: string): ChatHistoryRow {
  return { role: 'user', content }
}
function assistantRow(content: string): ChatHistoryRow {
  return { role: 'assistant', content }
}
function toolCallRow(id: string, name: string): ChatHistoryRow {
  return {
    role: 'tool_call',
    content: '',
    tool_calls_json: [{ id, type: 'function', function: { name, arguments: '{}' } }],
  }
}
function toolRow(id: string, content: string): ChatHistoryRow {
  return { role: 'tool', content, tool_call_id: id }
}

// A full turn: user → tool_call → tool → assistant (4 rows)
function fullTurn(n: number): ChatHistoryRow[] {
  return [
    userRow(`pesan ${n}`),
    toolCallRow(`call_${n}`, 'add_transaction'),
    toolRow(`call_${n}`, '{"success":true}'),
    assistantRow(`jawaban ${n}`),
  ]
}

describe('stripCardBlocks', () => {
  it('replaces card blocks with placeholder', () => {
    const text = 'Sip!\n```card:transaction\n{ "amount": 25000, "_action": "created" }\n```\nLanjut?'
    expect(stripCardBlocks(text)).toBe('Sip!\n[kartu ditampilkan]\nLanjut?')
  })

  it('leaves plain text untouched', () => {
    expect(stripCardBlocks('halo dunia')).toBe('halo dunia')
  })
})

describe('buildHistoryWindow', () => {
  it('returns empty array for empty input', () => {
    expect(buildHistoryWindow([])).toEqual([])
  })

  it('converts a simple user/assistant exchange', () => {
    const out = buildHistoryWindow([userRow('halo'), assistantRow('hai!')])
    expect(out).toEqual([
      { role: 'user', content: 'halo' },
      { role: 'assistant', content: 'hai!' },
    ])
  })

  it('drops orphan rows before the first user row', () => {
    const rows = [
      toolRow('call_x', '{"success":true}'),
      assistantRow('sisa turn terpotong'),
      ...fullTurn(1),
    ]
    const out = buildHistoryWindow(rows)
    expect(out[0]).toEqual({ role: 'user', content: 'pesan 1' })
    expect(out).toHaveLength(4)
  })

  it('keeps tool_call/tool pairs in recent turns', () => {
    const out = buildHistoryWindow(fullTurn(1))
    expect(out[1]).toMatchObject({ role: 'assistant', tool_calls: [{ id: 'call_1' }] })
    expect(out[2]).toMatchObject({ role: 'tool', tool_call_id: 'call_1' })
  })

  it('strips tool rows and card blocks from turns older than FULL_TURNS', () => {
    const turns: ChatHistoryRow[] = []
    // oldest turn contains a card in assistant text
    turns.push(
      userRow('catat kopi 25rb'),
      toolCallRow('call_old', 'add_transaction'),
      toolRow('call_old', '{"success":true}'),
      assistantRow('Dicatat!\n```card:transaction\n{"_action":"created"}\n```')
    )
    for (let i = 0; i < FULL_TURNS; i++) turns.push(...fullTurn(i))

    const out = buildHistoryWindow(turns)
    // oldest turn: only user + assistant text, card replaced
    expect(out[0]).toEqual({ role: 'user', content: 'catat kopi 25rb' })
    expect(out[1]).toEqual({ role: 'assistant', content: 'Dicatat!\n[kartu ditampilkan]' })
    // no tool rows from the old turn survive
    expect(out.filter((m) => m.role === 'tool')).toHaveLength(FULL_TURNS)
  })

  it('truncates oversized tool results in full turns', () => {
    const big = 'x'.repeat(TOOL_RESULT_MAX_CHARS + 500)
    const rows = [
      userRow('lihat transaksi'),
      toolCallRow('call_1', 'get_transactions'),
      toolRow('call_1', big),
      assistantRow('ini datanya'),
    ]
    const out = buildHistoryWindow(rows)
    const toolMsg = out.find((m) => m.role === 'tool') as { content: string }
    expect(toolMsg.content.length).toBeLessThanOrEqual(TOOL_RESULT_MAX_CHARS + 20)
    expect(toolMsg.content.endsWith('…[dipangkas]')).toBe(true)
  })

  it('skips malformed tool_call rows AND their orphaned tool results', () => {
    const rows = [
      userRow('halo'),
      { role: 'tool_call', content: '', tool_calls_json: null } as ChatHistoryRow,
      toolRow('call_broken', '{"success":true}'),
      assistantRow('ok'),
    ]
    const out = buildHistoryWindow(rows)
    expect(out).toEqual([
      { role: 'user', content: 'halo' },
      { role: 'assistant', content: 'ok' },
    ])
  })

  it('drops oldest turns beyond the char budget but always keeps the newest turn', () => {
    const huge = 'y'.repeat(30000)
    const rows = [
      userRow(huge),
      assistantRow('jawaban lama'),
      userRow('pesan baru'),
      assistantRow('jawaban baru'),
    ]
    const out = buildHistoryWindow(rows)
    expect(out).toEqual([
      { role: 'user', content: 'pesan baru' },
      { role: 'assistant', content: 'jawaban baru' },
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './historyWindow'` (or similar).

- [ ] **Step 3: Implement `src/lib/chat/historyWindow.ts`**

```ts
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
  return msgs
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all historyWindow tests green).

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/chat/historyWindow.ts src/lib/chat/historyWindow.test.ts
git commit -m "feat(chat): add pairing-safe tiered history window builder"
```

---

### Task 3: `cardGate` module (TDD)

**Files:**
- Create: `src/lib/chat/cardGate.ts`
- Test: `src/lib/chat/cardGate.test.ts`

**Interfaces:**
- Produces (used by Tasks 4 & 5):
  - `type ToolLedger = Map<string, number>`
  - `function createLedger(): ToolLedger`
  - `function recordToolSuccess(ledger: ToolLedger, toolName: string): void`
  - `function evaluateCardBlock(block: string, ledger: ToolLedger): boolean` — `block` is the complete fenced card string (```` ```card:x\n{...}\n``` ````). Returns `true` = allowed (debits ledger for write cards), `false` = fake card, withhold.
  - `function countMoneyMentions(text: string): number` — advisory heuristic for the multi-item hint.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/chat/cardGate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createLedger, recordToolSuccess, evaluateCardBlock, countMoneyMentions } from './cardGate'

function card(type: string, body: object): string {
  return '```card:' + type + '\n' + JSON.stringify(body) + '\n```'
}

describe('evaluateCardBlock', () => {
  it('allows a created card when the matching tool succeeded, and debits credit', () => {
    const ledger = createLedger()
    recordToolSuccess(ledger, 'add_transaction')
    const block = card('transaction', { amount: 25000, _action: 'created' })
    expect(evaluateCardBlock(block, ledger)).toBe(true)
    // credit is spent — a second identical card is fake
    expect(evaluateCardBlock(block, ledger)).toBe(false)
  })

  it('withholds a write card with no matching tool success', () => {
    const ledger = createLedger()
    expect(evaluateCardBlock(card('transaction', { _action: 'created' }), ledger)).toBe(false)
  })

  it('allows exactly N cards for N successes (multi-transaction case)', () => {
    const ledger = createLedger()
    recordToolSuccess(ledger, 'add_transaction')
    recordToolSuccess(ledger, 'add_transaction')
    recordToolSuccess(ledger, 'add_transaction')
    const block = card('transaction', { _action: 'created' })
    expect(evaluateCardBlock(block, ledger)).toBe(true)
    expect(evaluateCardBlock(block, ledger)).toBe(true)
    expect(evaluateCardBlock(block, ledger)).toBe(true)
    expect(evaluateCardBlock(block, ledger)).toBe(false)
  })

  it('always allows read-only cards (no _action)', () => {
    const ledger = createLedger()
    expect(evaluateCardBlock(card('summary', { income: 1, expense: 2 }), ledger)).toBe(true)
    expect(evaluateCardBlock(card('debt', { items: [] }), ledger)).toBe(true)
  })

  it('maps every card/action pair to its tool', () => {
    const pairs: Array<[string, string, string]> = [
      ['transaction', 'updated', 'update_transaction'],
      ['transaction', 'deleted', 'delete_transaction'],
      ['budget', 'created', 'set_budget'],
      ['budget', 'updated', 'set_budget'],
      ['goal', 'created', 'add_goal'],
      ['goal', 'updated', 'deposit_goal'],
      ['debt', 'created', 'add_debt'],
      ['debt', 'updated', 'settle_debt'],
      ['asset', 'created', 'add_asset'],
      ['asset', 'updated', 'update_asset_value'],
      ['asset', 'deleted', 'delete_asset'],
    ]
    for (const [type, action, tool] of pairs) {
      const ledger = createLedger()
      recordToolSuccess(ledger, tool)
      expect(evaluateCardBlock(card(type, { _action: action }), ledger)).toBe(true)
    }
  })

  it('withholds unknown card/action combos even with credits around', () => {
    const ledger = createLedger()
    recordToolSuccess(ledger, 'add_transaction')
    expect(evaluateCardBlock(card('budget', { _action: 'deleted' }), ledger)).toBe(false)
  })

  it('fails closed on unparseable JSON that claims an _action', () => {
    const ledger = createLedger()
    recordToolSuccess(ledger, 'add_transaction')
    const broken = '```card:transaction\n{ "_action": "created", broken\n```'
    expect(evaluateCardBlock(broken, ledger)).toBe(false)
  })

  it('fails open on unparseable JSON without _action', () => {
    const ledger = createLedger()
    const broken = '```card:summary\n{ income: 5 oops\n```'
    expect(evaluateCardBlock(broken, ledger)).toBe(true)
  })
})

describe('countMoneyMentions', () => {
  it('counts multiple rupiah shorthand mentions', () => {
    expect(countMoneyMentions('tadi jajan kopi 25rb, bensin 50rb, makan siang 35rb')).toBe(3)
  })

  it('counts jt/juta and formatted thousands', () => {
    expect(countMoneyMentions('gaji 5jt dan bonus 1.500.000')).toBe(2)
  })

  it('returns 0 for plain chatter', () => {
    expect(countMoneyMentions('halo apa kabar hari ini')).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './cardGate'`.

- [ ] **Step 3: Implement `src/lib/chat/cardGate.ts`**

```ts
export type ToolLedger = Map<string, number>

export function createLedger(): ToolLedger {
  return new Map()
}

export function recordToolSuccess(ledger: ToolLedger, toolName: string): void {
  ledger.set(toolName, (ledger.get(toolName) ?? 0) + 1)
}

// card type + _action → the tool that must have succeeded this request
const CARD_ACTION_TOOL: Record<string, string> = {
  'transaction:created': 'add_transaction',
  'transaction:updated': 'update_transaction',
  'transaction:deleted': 'delete_transaction',
  'budget:created': 'set_budget',
  'budget:updated': 'set_budget',
  'goal:created': 'add_goal',
  'goal:updated': 'deposit_goal',
  'debt:created': 'add_debt',
  'debt:updated': 'settle_debt',
  'asset:created': 'add_asset',
  'asset:updated': 'update_asset_value',
  'asset:deleted': 'delete_asset',
}

const WRITE_ACTIONS = new Set(['created', 'updated', 'deleted'])
const CARD_HEADER_REGEX = /^```card:([a-z]+)\s*\n([\s\S]*?)```\s*$/

// true = card may stream to the user (write cards debit one ledger credit).
// false = fake claim: withhold. Fail-closed for anything that claims an _action.
export function evaluateCardBlock(block: string, ledger: ToolLedger): boolean {
  const match = block.match(CARD_HEADER_REGEX)
  if (!match) return !block.includes('_action')
  const cardType = match[1]
  let parsed: unknown
  try {
    parsed = JSON.parse(match[2].trim())
  } catch {
    return !match[2].includes('_action')
  }
  const action = (parsed as { _action?: unknown })._action
  if (typeof action !== 'string' || !WRITE_ACTIONS.has(action)) return true
  const tool = CARD_ACTION_TOOL[`${cardType}:${action}`]
  if (!tool) return false
  const credit = ledger.get(tool) ?? 0
  if (credit <= 0) return false
  ledger.set(tool, credit - 1)
  return true
}

// Advisory heuristic: counts money-looking tokens ("25rb", "5jt", "1.500.000").
const MONEY_REGEX = /\d[\d.,]*\s*(?:rb|ribu|k|jt|juta)\b|\b\d{1,3}(?:[.,]\d{3})+\b|\b\d{4,}\b/gi

export function countMoneyMentions(text: string): number {
  return (text.match(MONEY_REGEX) ?? []).length
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (historyWindow + cardGate suites green).

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/chat/cardGate.ts src/lib/chat/cardGate.test.ts
git commit -m "feat(chat): add card gate ledger validating write cards against real tool successes"
```

---

### Task 4: `prompt` module — restructured system prompt + reminder + corrective prompt

**Files:**
- Create: `src/lib/chat/prompt.ts`
- Test: `src/lib/chat/prompt.test.ts`

**Interfaces:**
- Consumes: `countMoneyMentions` from `./cardGate` (Task 3).
- Produces (used by Task 5):
  - `function buildSystemPrompt(todayKey: string): string`
  - `function buildReminder(userContent: string): string`
  - `const CORRECTIVE_PROMPT: string`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/chat/prompt.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildReminder, CORRECTIVE_PROMPT } from './prompt'

describe('buildSystemPrompt', () => {
  it('opens with the tool-calling rules block', () => {
    const prompt = buildSystemPrompt('2026-07-02')
    expect(prompt.indexOf('ATURAN WAJIB TOOL CALLING')).toBeLessThan(200)
  })

  it('contains the multi-item rule and the injected date', () => {
    const prompt = buildSystemPrompt('2026-07-02')
    expect(prompt).toContain('SATU KALI PER ITEM')
    expect(prompt).toContain('2026-07-02')
  })
})

describe('buildReminder', () => {
  it('adds an item-count hint when ≥2 money mentions', () => {
    const r = buildReminder('kopi 25rb, bensin 50rb, makan 35rb')
    expect(r).toContain('±3')
  })

  it('omits the hint for plain messages', () => {
    const r = buildReminder('halo, gimana keuanganku?')
    expect(r).not.toContain('±')
    expect(r).toContain('REMINDER SISTEM')
  })
})

describe('CORRECTIVE_PROMPT', () => {
  it('instructs the model to call missing tools without duplicating successes', () => {
    expect(CORRECTIVE_PROMPT).toContain('PELANGGARAN')
    expect(CORRECTIVE_PROMPT).toContain('jangan duplikasi')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './prompt'`.

- [ ] **Step 3: Implement `src/lib/chat/prompt.ts`**

The system prompt is the existing `buildSystemPrompt` from `src/app/api/chat/route.ts:20-134` **restructured**: tool rules first, two new rules added, everything else preserved verbatim (categories, card formats, asset flow, PWA guide).

```ts
import { countMoneyMentions } from './cardGate'

export function buildSystemPrompt(todayKey: string): string {
  return `ATURAN WAJIB TOOL CALLING — PRIORITAS TERTINGGI, BACA DAN PATUHI SELALU:
1. WAJIB panggil tool untuk SETIAP operasi tulis (add_transaction, update_transaction, delete_transaction, set_budget, add_goal, deposit_goal, add_debt, settle_debt, add_asset, update_asset_value, delete_asset). TIDAK ADA PENGECUALIAN.
2. MULTI-ITEM: Jika user menyebut BEBERAPA transaksi dalam satu pesan, panggil add_transaction SATU KALI PER ITEM — boleh beberapa tool_calls sekaligus dalam satu turn. Sebelum menulis jawaban akhir, hitung ulang: jumlah tool call sukses HARUS sama dengan jumlah item yang user sebut. Jika ada yang belum, panggil tool-nya sekarang.
3. Setiap permintaan baru dari user = tool call baru yang harus dipanggil di turn ini. Riwayat percakapan sebelumnya TIDAK MEMBENARKAN kamu skip tool call.
4. DILARANG KERAS menjawab "sudah aku catat", "oke, sudah disimpan", atau konfirmasi apapun tanpa tool call yang berhasil di turn ini.
5. DILARANG menulis card dengan "_action" created/updated/deleted kecuali tool call yang sesuai BERHASIL di turn ini. Kartu tanpa tool call akan DITOLAK sistem dan tidak tampil ke user.
6. Jika kamu ragu apakah data sudah ada, panggil tool GET terlebih dahulu. Jangan berasumsi dari teks riwayat percakapan.
7. JANGAN PERNAH mengandalkan memori percakapan untuk operasi tulis — database adalah sumber kebenaran, bukan teks chat.

Kamu adalah Finara, AI finance assistant pribadi yang helpful, casual, dan supportif.
Selalu jawab dalam Bahasa Indonesia yang santai dan ramah.
Gunakan emoji secukupnya (jangan berlebihan).
JANGAN gunakan "---" atau garis pemisah horizontal dalam respons — langsung tulis paragraf berikutnya saja.
JANGAN PERNAH mengarang angka keuangan — selalu gunakan tools untuk membaca data dari database.
Ketika mencatat transaksi, selalu konfirmasi dengan menyebut jumlah dan kategorinya.
Ketika user minta navigasi ke halaman lain, gunakan tool navigate_to.
Berikan insight proaktif jika ada pola menarik dalam data keuangan user.
Format angka selalu dalam rupiah: "Rp 15.000", "Rp 2.500.000".
TANGGAL HARI INI: ${todayKey} (gunakan ini sebagai default untuk field "date" jika user tidak menyebut tanggal spesifik).

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

// Injected as a system message right before the newest user message.
// NOT persisted to chat_history.
export function buildReminder(userContent: string): string {
  let reminder =
    'REMINDER SISTEM (WAJIB): Jika pesan user berikut berisi operasi tulis (catat/ubah/hapus transaksi, budget, goal, hutang, aset), WAJIB panggil tool yang sesuai DI TURN INI — riwayat percakapan bukan alasan untuk skip. Beberapa item = satu tool call PER ITEM. JANGAN tulis card _action created/updated/deleted tanpa tool call sukses — sistem akan menolak kartunya.'
  const hint = countMoneyMentions(userContent)
  if (hint >= 2) {
    reminder += ` Pesan user berikut tampaknya menyebut ±${hint} nominal — pastikan jumlah tool call sesuai jumlah item.`
  }
  return reminder
}

export const CORRECTIVE_PROMPT =
  'PELANGGARAN TERDETEKSI: kamu menampilkan konfirmasi/kartu tanpa tool call yang berhasil. Item yang kamu klaim BELUM tersimpan di database. Panggil tool yang diperlukan SEKARANG hanya untuk item yang belum tersimpan — jangan duplikasi tool call yang sudah sukses (lihat riwayat tool di atas). Setelah tool berhasil, tulis ulang card konfirmasinya.'
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all three suites green).

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/chat/prompt.ts src/lib/chat/prompt.test.ts
git commit -m "feat(chat): restructure system prompt with multi-item rules + recency reminder"
```

---

### Task 5: Wire everything into `/api/chat/route.ts`

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Interfaces:**
- Consumes: `buildHistoryWindow`, `ChatHistoryRow` (Task 2); `createLedger`, `recordToolSuccess`, `evaluateCardBlock`, `ToolLedger` (Task 3); `buildSystemPrompt`, `buildReminder`, `CORRECTIVE_PROMPT` (Task 4).
- Produces: unchanged HTTP/SSE contract (`text`, `navigate`, `data_changed`, `done`, `error` events).

No unit test for the route (it needs Supabase + DeepSeek); safety comes from the tested pure modules + `tsc` + manual scenarios in Task 7. Make these modifications:

- [ ] **Step 1: Swap imports and delete moved code**

At the top of `src/app/api/chat/route.ts` add:

```ts
import { buildHistoryWindow, type ChatHistoryRow } from '@/lib/chat/historyWindow'
import { createLedger, recordToolSuccess, evaluateCardBlock } from '@/lib/chat/cardGate'
import { buildSystemPrompt, buildReminder, CORRECTIVE_PROMPT } from '@/lib/chat/prompt'
```

Delete from the route file:
- the local `buildSystemPrompt` function (lines 20–134)
- the local `reconstructMessages` function (lines 584–607)

Move `DATA_MUTATING_TOOLS` from inside `runCompletion` to module scope (top level, after the interfaces):

```ts
const DATA_MUTATING_TOOLS = new Set([
  'add_transaction', 'update_transaction', 'delete_transaction',
  'set_budget', 'add_goal', 'deposit_goal', 'add_debt', 'settle_debt',
  'add_asset', 'update_asset_value', 'delete_asset',
])
```

- [ ] **Step 2: Fix the history fetch (newest-first) and skip history when no session**

Replace the history query + reconstruction block (previously lines 633–652) with:

```ts
    let historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    if (rawSessionId) {
      // Newest 160 rows, then reversed to chronological — the old ascending
      // limit(80) silently dropped the most recent turns in long sessions.
      const { data: history } = await supabase
        .from('chat_history')
        .select('role, content, tool_calls_json, tool_call_id')
        .eq('user_id', user.id)
        .eq('session_id', rawSessionId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(160)

      const chronological: ChatHistoryRow[] = (history ?? []).reverse().map((h) => ({
        ...h,
        content: h.role === 'user' ? stripScanSentinel(h.content) : h.content,
      }))
      historyMessages = buildHistoryWindow(chronological)
    }
```

- [ ] **Step 3: Inject the recency reminder before the newest user message**

Replace the `allMessages` construction with:

```ts
    const incomingUserContent = stripScanSentinel(messages[messages.length - 1].content)
    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt(getTodayKey()) },
      ...historyMessages,
      { role: 'system', content: buildReminder(incomingUserContent) },
      { role: 'user', content: incomingUserContent },
    ]
```

(The reminder message is never persisted — persistence code only writes the user message, tool turns, and final assistant content.)

- [ ] **Step 4: Card gate in the streaming buffer**

Inside `start(controller)`, alongside the existing state, add:

```ts
          const ledger = createLedger()
          const withheldBlocks: string[] = []
          let retryUsed = false
```

In `flushToken`, the card-completion branch currently does:

```ts
                  if (closeIdx !== -1) {
                    const fullBlock = cardBuffer.slice(0, openEnd + 1 + closeIdx + 3)
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: fullBlock })}\n\n`))
```

Change it to validate before enqueueing:

```ts
                  if (closeIdx !== -1) {
                    const fullBlock = cardBuffer.slice(0, openEnd + 1 + closeIdx + 3)
                    if (evaluateCardBlock(fullBlock, ledger)) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: fullBlock })}\n\n`))
                    } else {
                      // Fake card: no matching successful tool call this request.
                      withheldBlocks.push(fullBlock)
                    }
```

(The rest of the branch — resetting `cardBuffer`, `inCardBlock`, recursing on `remaining` — stays identical.)

- [ ] **Step 5: Credit the ledger on successful mutating tools**

In the tool-execution loop, right after `const result = await executeTool(...)` and before the navigate check, add:

```ts
                  if (
                    DATA_MUTATING_TOOLS.has(tc.name) &&
                    typeof result === 'object' && result !== null &&
                    (result as { success?: boolean }).success === true
                  ) {
                    recordToolSuccess(ledger, tc.name)
                  }
```

(Keep the existing `didMutateData` logic untouched.)

- [ ] **Step 6: Corrective retry after the first completion chain**

Replace the single top-level `await runCompletion()` with:

```ts
          await runCompletion()

          // Self-healing: the model claimed writes that never happened.
          // One corrective retry so the data actually lands in the DB.
          if (withheldBlocks.length > 0 && !retryUsed) {
            retryUsed = true
            const withheldBeforeRetry = withheldBlocks.length
            let honestContent = finalAssistantContent
            for (const block of withheldBlocks) honestContent = honestContent.replace(block, '')
            currentMessages.push({ role: 'assistant', content: honestContent || '(kartu ditolak sistem)' })
            currentMessages.push({ role: 'system', content: CORRECTIVE_PROMPT })
            await runCompletion()

            if (withheldBlocks.length > withheldBeforeRetry) {
              // Retry still produced fake cards — tell the user the truth.
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'text', content: '\n\n⚠️ Sebagian pencatatan gagal diproses. Mohon ulangi permintaannya ya 🙏' })}\n\n`
                )
              )
            }
          }
```

- [ ] **Step 7: Strip withheld cards from persisted assistant content**

Replace the final assistant persistence block:

```ts
          // Persist: final assistant text response (fake cards stripped so they
          // don't poison the history window next turn)
          let persistedAssistantContent = finalAssistantContent
          for (const block of withheldBlocks) {
            persistedAssistantContent = persistedAssistantContent.replace(block, '')
          }
          await supabase.from('chat_history').insert({
            user_id: userId,
            session_id: currentSessionId,
            role: 'assistant',
            content: persistedAssistantContent,
          })
```

- [ ] **Step 8: Typecheck, lint, test**

```bash
npx tsc --noEmit
npm run lint
npm test
```

Expected: all clean/green.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat(chat): smart history window, recency reminder, card gate + corrective retry"
```

---

### Task 6: `source` column ('chat' | 'manual') on record tables

**Files:**
- Create: `supabase/migrations/004_record_source.sql`
- Modify: `supabase/schema.sql`
- Modify: `src/app/api/chat/route.ts` (5 create inserts in `executeTool`)
- Modify: `src/app/api/transactions/route.ts:71`, `src/app/api/goals/route.ts:44`, `src/app/api/debts/route.ts:51`, `src/app/api/assets/route.ts:54`, `src/app/api/budgets/route.ts:61-64`

**Interfaces:**
- Produces: column `source TEXT CHECK (source IN ('chat','manual'))` on `transactions`, `budgets`, `goals`, `debts`, `assets`. Nullable, no default. New inserts always set it explicitly.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/004_record_source.sql`:

```sql
-- Migration 004: record source tracking for dev analytics
-- Run this in Supabase SQL Editor
-- source: 'chat' = created via AI chat tools, 'manual' = created via app forms.
-- NULL = legacy row created before this migration (origin unknown — do NOT backfill).
-- Note: budgets uses upsert, so its source reflects the LAST writer, not the creator.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('chat', 'manual'));
ALTER TABLE budgets      ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('chat', 'manual'));
ALTER TABLE goals        ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('chat', 'manual'));
ALTER TABLE debts        ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('chat', 'manual'));
ALTER TABLE assets       ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('chat', 'manual'));
```

- [ ] **Step 2: Mirror in schema.sql**

In `supabase/schema.sql`, inside EACH of the five `create table` blocks (`transactions`, `budgets`, `goals`, `debts`, `assets`), add this column line (before `created_at`):

```sql
  source text check (source in ('chat', 'manual')),
```

- [ ] **Step 3: Chat route sets source='chat'**

In `src/app/api/chat/route.ts` `executeTool`, update the five CREATE operations (updates/deletes untouched):

`add_transaction`:
```ts
        .insert({ user_id: userId, amount, type, category, note, date: date ?? getTodayKey(), source: 'chat' })
```

`set_budget`:
```ts
        .upsert(
          { user_id: userId, category, limit_amount, month: m, source: 'chat' },
          { onConflict: 'user_id,category,month' }
        )
```

`add_goal`:
```ts
        .insert({ user_id: userId, name, target_amount, deadline, source: 'chat' })
```

`add_debt`:
```ts
        .insert({ user_id: userId, person, amount, type, note, source: 'chat' })
```

`add_asset`:
```ts
        .insert({ user_id: userId, name, type, value: Math.round(value), institution, note, source: 'chat' })
```

- [ ] **Step 4: Manual API routes set source='manual'**

`src/app/api/transactions/route.ts:71`:
```ts
    .insert({ ...parsed.data, user_id: user.id, source: 'manual' })
```

`src/app/api/goals/route.ts:44`:
```ts
    .insert({ ...parsed.data, user_id: user.id, source: 'manual' })
```

`src/app/api/debts/route.ts:51`:
```ts
    .insert({ ...parsed.data, user_id: user.id, source: 'manual' })
```

`src/app/api/assets/route.ts:54`:
```ts
    .insert({ ...parsed.data, value: Math.round(parsed.data.value), user_id: user.id, source: 'manual' })
```

`src/app/api/budgets/route.ts` (upsert object):
```ts
      { user_id: user.id, category: parsed.data.category, limit_amount: parsed.data.limit_amount, month, source: 'manual' },
```

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add supabase/migrations/004_record_source.sql supabase/schema.sql src/app/api/chat/route.ts src/app/api/transactions/route.ts src/app/api/goals/route.ts src/app/api/debts/route.ts src/app/api/assets/route.ts src/app/api/budgets/route.ts
git commit -m "feat(db): add source column (chat/manual) to record tables for dev analytics"
```

**⚠️ Deploy note:** the SQL migration must be run in the Supabase SQL Editor BEFORE this code deploys, otherwise inserts fail on the unknown `source` column. Flag this to the user at handoff.

---

### Task 7: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full check suite**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

Expected: all pass, build succeeds.

- [ ] **Step 2: Manual smoke scenarios (needs `npm run dev` + Supabase migration applied)**

Ask the user to run migration 004 in the Supabase SQL Editor first, then verify together:

1. **[PRIORITAS #1]** Satu bubble: `"tadi jajan kopi 25rb, bensin 50rb, sama makan siang 35rb"` → 3 kartu transaksi muncul, 3 row di tabel `transactions` dengan `source='chat'`.
2. Session dengan history panjang (100+ baris — pakai session lama dari HistoryDrawer): catat transaksi baru → tool tetap terpanggil, kartu muncul, row masuk DB.
3. Restore session dari HistoryDrawer → langsung catat transaksi → berhasil.
4. Tambah transaksi manual dari halaman `/transactions` → row `source='manual'`.
5. Chat biasa tanpa transaksi (`"halo, gimana keuanganku bulan ini?"`) → tidak ada regresi, summary card tetap tampil.

- [ ] **Step 3: Push branch & open PR**

```bash
git push -u origin feat/chat-tool-reliability
gh pr create --title "feat(chat): tool-calling reliability — smart history window, card gate, corrective retry, source tracking" --body "$(cat <<'EOF'
## Summary
- Fix history window: fetch newest 160 rows (was: oldest 80 — recent context was silently dropped in long sessions)
- Pairing-safe turn grouping + tiered fidelity (8 full turns, older turns text-only, tool results truncated, ~24k char budget)
- Restructured system prompt (tool rules first, explicit multi-item rule) + non-persisted recency reminder before the newest user message
- Card gate: write-cards (`_action` created/updated/deleted) only stream if a matching successful tool call happened this request; fake cards withheld + stripped from persisted history
- Corrective retry (max 1×) when fake cards are detected, honest error text if it still fails
- New `source` column ('chat'/'manual', nullable) on transactions/budgets/goals/debts/assets for dev analytics

## Deploy
⚠️ Run `supabase/migrations/004_record_source.sql` in Supabase SQL Editor BEFORE deploying.

Spec: docs/superpowers/specs/2026-07-02-chat-tool-reliability-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
