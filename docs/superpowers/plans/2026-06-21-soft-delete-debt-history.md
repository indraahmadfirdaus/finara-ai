# Soft Delete, Debt History & DebtCard Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all hard deletes to soft deletes via `deleted_at`, show settled debts in a "Lunas" tab, add chat history delete, and align DebtCard visual style with TransactionCard.

**Architecture:** Add `deleted_at timestamptz` column to 5 tables via SQL migration; update all GET queries to filter `deleted_at IS NULL`; convert DELETE handlers to `update({ deleted_at: now() })`; add new `DELETE /api/chat` route for session soft-delete; add "Lunas" tab to debts page; restyle DebtCard to match TransactionCard compact layout.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL + RLS), TypeScript, Framer Motion, Zod

## Global Constraints

- All colors via `var(--)` CSS variables — no hardcoded hex except DebtCard's settled state uses `var(--text-muted)`
- All amounts stored as `bigint` — use `Math.round()` on write, `Number()` on read
- API routes: always verify `supabase.auth.getUser()` before any query
- `deleted_at IS NULL` filter must be added to ALL existing GET queries on affected tables
- No `middleware.ts` — auth guard is `src/proxy.ts`
- Zod validation on all POST/PATCH/DELETE bodies
- `npx tsc --noEmit` must pass clean after each task

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/schema.sql` | Modify | Add `deleted_at` columns + indexes |
| `supabase/migrations/002_soft_delete.sql` | Create | Migration SQL to run in Supabase SQL Editor |
| `src/app/api/transactions/route.ts` | Modify | Soft-delete on DELETE; filter `deleted_at IS NULL` on GET |
| `src/app/api/goals/route.ts` | Modify | Soft-delete on DELETE (new handler); filter on GET |
| `src/app/api/assets/route.ts` | Modify | Soft-delete on DELETE; filter on GET |
| `src/app/api/budgets/route.ts` | Modify | Soft-delete on DELETE (new handler); filter on GET |
| `src/app/api/chat/route.ts` | Modify | Add DELETE handler for session soft-delete |
| `src/app/(app)/debts/page.tsx` | Modify | Add "Lunas" tab, fetch settled debts, display with badge |
| `src/components/chat/HistoryDrawer.tsx` | Modify | Add trash icon per session, call DELETE /api/chat |
| `src/components/chat/cards/DebtCard.tsx` | Modify | Restyle SingleDebt to match TransactionCard compact layout |

---

### Task 1: DB Migration — add `deleted_at` to 5 tables

**Files:**
- Create: `supabase/migrations/002_soft_delete.sql`
- Modify: `supabase/schema.sql`

**Interfaces:**
- Produces: `deleted_at timestamptz` column on `transactions`, `budgets`, `goals`, `assets`, `chat_history`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/002_soft_delete.sql`:

```sql
-- Migration 002: soft delete columns
-- Run this in Supabase SQL Editor

ALTER TABLE transactions  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE budgets        ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE goals          ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE assets         ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE chat_history   ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Indexes for fast filtering of non-deleted rows
CREATE INDEX IF NOT EXISTS idx_transactions_not_deleted ON transactions(user_id, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_goals_not_deleted        ON goals(user_id, deleted_at)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_not_deleted       ON assets(user_id, deleted_at)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_not_deleted         ON chat_history(user_id, deleted_at) WHERE deleted_at IS NULL;
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Copy the SQL above and run it in the Supabase dashboard → SQL Editor. Verify: each `ALTER TABLE` returns `ALTER TABLE` (no error). Budgets has no index because GET is always scoped by month anyway.

- [ ] **Step 3: Update schema.sql to reflect new columns**

In `supabase/schema.sql`, add `deleted_at timestamptz` to each table definition. Example for transactions (same pattern for budgets, goals, assets, chat_history):

```sql
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount bigint not null,
  type text check (type in ('income', 'expense')) not null,
  category text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now(),
  deleted_at timestamptz                          -- soft delete
);
```

Also append the 4 new partial indexes to the indexes section at the bottom of schema.sql.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/002_soft_delete.sql supabase/schema.sql
git commit -m "feat: add deleted_at soft-delete columns to 5 tables"
```

---

### Task 2: Soft-delete transactions API

**Files:**
- Modify: `src/app/api/transactions/route.ts`

**Interfaces:**
- Consumes: `deleted_at` column from Task 1
- Produces: `DELETE /api/transactions?id=<uuid>` now sets `deleted_at`; GET excludes soft-deleted rows

- [ ] **Step 1: Add `deleted_at IS NULL` filter to GET**

In the `GET` handler, after `.eq('user_id', user.id)` add:
```ts
.is('deleted_at', null)
```

Full updated query chain:
```ts
let query = supabase
  .from('transactions')
  .select('*')
  .eq('user_id', user.id)
  .is('deleted_at', null)            // ← add this line
  .order('date', { ascending: false })
  .order('created_at', { ascending: false })
  .limit(limit)
```

- [ ] **Step 2: Replace hard delete with soft delete**

Replace the entire `DELETE` handler:
```ts
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
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/api/transactions/route.ts'
git commit -m "feat: soft-delete transactions — set deleted_at instead of hard delete"
```

---

### Task 3: Soft-delete goals API

**Files:**
- Modify: `src/app/api/goals/route.ts`

**Interfaces:**
- Consumes: `deleted_at` column from Task 1
- Produces: `DELETE /api/goals?id=<uuid>` (new handler); GET excludes soft-deleted rows

- [ ] **Step 1: Add `deleted_at IS NULL` filter to GET**

In the `GET` handler, update the query:
```ts
const { data, error } = await supabase
  .from('goals')
  .select('*')
  .eq('user_id', user.id)
  .is('deleted_at', null)            // ← add this line
  .order('created_at', { ascending: false })
```

- [ ] **Step 2: Add DELETE handler**

Append to `src/app/api/goals/route.ts`:
```ts
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
    .from('goals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add 'src/app/api/goals/route.ts'
git commit -m "feat: soft-delete goals — add DELETE handler, filter deleted_at IS NULL"
```

---

### Task 4: Soft-delete budgets & assets APIs

**Files:**
- Modify: `src/app/api/budgets/route.ts`
- Modify: `src/app/api/assets/route.ts`

**Interfaces:**
- Consumes: `deleted_at` column from Task 1
- Produces: `DELETE /api/budgets?id=<uuid>` (new handler); `DELETE /api/assets?id=<uuid>` soft-deletes; GET on both excludes deleted rows

- [ ] **Step 1: budgets — add `deleted_at IS NULL` to GET and add DELETE handler**

In `GET` of budgets route, the budgets query:
```ts
const [budgetsResult, txResult] = await Promise.all([
  supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', month).is('deleted_at', null),
  // txResult unchanged
])
```

Append DELETE handler to `src/app/api/budgets/route.ts`:
```ts
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
```

- [ ] **Step 2: assets — add `deleted_at IS NULL` to GET and soft-delete on DELETE**

In `GET` of assets route:
```ts
const { data, error } = await supabase
  .from('assets')
  .select('*')
  .eq('user_id', user.id)
  .is('deleted_at', null)            // ← add this line
  .order('type', { ascending: true })
  .order('name', { ascending: true })
```

Replace the entire `DELETE` handler in `src/app/api/assets/route.ts`:
```ts
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
    .from('assets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

Note: `asset_value_logs` has `ON DELETE CASCADE` from `assets.id` — logs are fine; they'll only cascade on actual hard delete which we no longer do.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add 'src/app/api/budgets/route.ts' 'src/app/api/assets/route.ts'
git commit -m "feat: soft-delete budgets and assets"
```

---

### Task 5: Chat history soft-delete API

**Files:**
- Modify: `src/app/api/chat/route.ts`

**Interfaces:**
- Consumes: `deleted_at` column on `chat_history` from Task 1
- Produces: `DELETE /api/chat?session_id=<uuid>` sets `deleted_at = now()` on all messages in that session; existing POST already saves history — no change needed there; GET history (used by HistoryDrawer) must filter `deleted_at IS NULL`

- [ ] **Step 1: Find where chat_history is read in the API**

Open `src/app/api/chat/route.ts` and locate the Supabase query that reads from `chat_history` (used to load prior session messages). Add `.is('deleted_at', null)` to that query.

The query looks like:
```ts
const { data: history } = await supabase
  .from('chat_history')
  .select('role, content')
  .eq('user_id', user.id)
  .eq('session_id', session_id)
  .is('deleted_at', null)            // ← add this line
  .order('created_at', { ascending: true })
```

- [ ] **Step 2: Add DELETE handler for session soft-delete**

Append to `src/app/api/chat/route.ts`:
```ts
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
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add 'src/app/api/chat/route.ts'
git commit -m "feat: chat history soft-delete — DELETE /api/chat?session_id=<uuid>"
```

---

### Task 6: HistoryDrawer — delete session button

**Files:**
- Modify: `src/components/chat/HistoryDrawer.tsx`

**Interfaces:**
- Consumes: `DELETE /api/chat?session_id=<uuid>` from Task 5
- Produces: Trash icon button on each session row; on click calls API and removes session from local state without page reload

- [ ] **Step 1: Add Trash2 import**

At the top of `HistoryDrawer.tsx`, add `Trash2` to the lucide-react import:
```ts
import { X, MessageSquare, Clock, Trash2 } from 'lucide-react'
```

- [ ] **Step 2: Add delete handler function**

Inside the `HistoryDrawer` component, before the return, add:
```ts
async function handleDeleteSession(sessionId: string, e: React.MouseEvent) {
  e.stopPropagation()
  setSessions((prev) => prev.filter((s) => s.session_id !== sessionId))
  await fetch(`/api/chat?session_id=${sessionId}`, { method: 'DELETE' })
}
```

- [ ] **Step 3: Add trash button to each session row**

Replace the existing session `<button>` with a wrapper that has a relative container + trash icon. The session row currently is:

```tsx
<button
  key={s.session_id}
  onClick={() => { onRestore(...); onClose() }}
  className="w-full text-left px-5 py-3.5 transition-colors"
  style={{ borderBottom: '1px solid var(--border-light)' }}
  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
>
  ...
</button>
```

Replace it with:
```tsx
<div
  key={s.session_id}
  className="relative group flex items-center"
  style={{ borderBottom: '1px solid var(--border-light)' }}
>
  <button
    onClick={() => { onRestore(s.messages.map((m, i) => ({ id: String(i), role: m.role, content: m.content })), s.session_id); onClose() }}
    className="flex-1 text-left px-5 py-3.5 transition-colors"
    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
  >
    <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--accent-light)' }}>{s.label}</p>
    <p className="text-sm leading-snug line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
      {s.preview || '(kosong)'}
    </p>
  </button>
  <button
    onClick={(e) => handleDeleteSession(s.session_id, e)}
    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 mr-2 rounded-lg flex-shrink-0"
    style={{ color: 'var(--text-muted)' }}
    title="Hapus sesi"
  >
    <Trash2 size={13} />
  </button>
</div>
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add 'src/components/chat/HistoryDrawer.tsx'
git commit -m "feat: delete chat session from history drawer (soft delete)"
```

---

### Task 7: Debts page — "Lunas" tab

**Files:**
- Modify: `src/app/(app)/debts/page.tsx`

**Interfaces:**
- Consumes: `GET /api/debts?settled=true` (already supported in debts API)
- Produces: Third tab "Lunas" listing all settled debts with badge, read-only (no actions)

- [ ] **Step 1: Add `settled` to TabType and state**

Change the type and add state for settled debts:
```ts
type TabType = 'owe' | 'lent' | 'settled'
```

Add a separate state for settled debts and a loading state:
```ts
const [settledDebts, setSettledDebts] = useState<Debt[]>([])
const [settledLoading, setSettledLoading] = useState(false)
```

- [ ] **Step 2: Fetch settled debts when tab switches to "settled"**

Add a `useEffect` that triggers when `tab === 'settled'`:
```ts
useEffect(() => {
  if (tab !== 'settled') return
  setSettledLoading(true)
  fetch('/api/debts?settled=true')
    .then((r) => r.json())
    .then((d) => { setSettledDebts(d.debts ?? []); setSettledLoading(false) })
}, [tab])
```

- [ ] **Step 3: Add "Lunas" to the tabs UI**

The existing tabs map over `['owe', 'lent']`. Change to `['owe', 'lent', 'settled']` and add label mapping:

```ts
const TAB_LABELS: Record<TabType, string> = { owe: 'Hutangku', lent: 'Piutangku', settled: 'Lunas' }
```

Update tab render:
```tsx
{(['owe', 'lent', 'settled'] as TabType[]).map((t) => (
  <button key={t} onClick={() => setTab(t)} className="relative flex-1 py-2 text-xs font-semibold transition-colors"
    style={{ color: tab === t ? 'var(--accent-light)' : 'var(--text-muted)' }}>
    {TAB_LABELS[t]}
    {tab === t && (
      <motion.div layoutId="debt-tab-pill" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
        style={{ background: 'var(--accent)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
    )}
  </button>
))}
```

- [ ] **Step 4: Render settled list**

In the list section, after the existing `filtered` list render, add a conditional for `tab === 'settled'`:

```tsx
{tab === 'settled' && (
  settledLoading ? (
    <SkeletonLoader />
  ) : settledDebts.length === 0 ? (
    <EmptyState icon={CheckCircle} title="Belum ada yang lunas" subtitle="Hutang dan piutang yang sudah diselesaikan akan muncul di sini" />
  ) : (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-2">
      {settledDebts.map((d) => (
        <motion.div key={d.id} variants={itemVariants}
          className="flex items-center gap-3 rounded-xl p-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', opacity: 0.7 }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(107,114,128,0.12)' }}>
            <CheckCircle size={13} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{d.person}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {d.type === 'owe' ? 'Hutang' : 'Piutang'}{d.note ? ` · ${d.note}` : ''}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-bold" style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatIDR(d.amount)}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>Lunas</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
)}
```

Make sure `CheckCircle` is imported from `lucide-react` (already in the file).

- [ ] **Step 5: Hide the existing list when tab is 'settled'**

Wrap the existing `filtered` list render with `{tab !== 'settled' && ( ... )}`.

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add 'src/app/(app)/debts/page.tsx'
git commit -m "feat: add Lunas tab to debts page showing settled debts"
```

---

### Task 8: DebtCard — restyle to match TransactionCard

**Files:**
- Modify: `src/components/chat/cards/DebtCard.tsx`

**Interfaces:**
- Produces: `SingleDebt` component with compact layout identical to TransactionCard — `borderLeft` accent, 28px icon, note as primary label, amount right-aligned

- [ ] **Step 1: Restyle SingleDebt**

Replace the entire `SingleDebt` function:
```tsx
function SingleDebt({ item, index = 0 }: { item: DebtItem; index?: number }) {
  const isOwe = item.type === 'owe'
  const settled = item.settled === true

  const accentColor = settled ? 'var(--text-muted)' : isOwe ? 'var(--danger)' : 'var(--success)'
  const borderColor = settled
    ? 'rgba(107,114,128,0.2)'
    : isOwe
    ? 'rgba(239,68,68,0.3)'
    : 'rgba(34,197,94,0.3)'
  const iconBg = settled
    ? 'rgba(107,114,128,0.12)'
    : isOwe
    ? 'rgba(239,68,68,0.12)'
    : 'rgba(34,197,94,0.12)'

  return (
    <motion.div
      initial={{ y: 10, opacity: 0, scale: 0.97 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24, delay: index * 0.07 }}
      className="mt-2 px-3 py-2.5 rounded-2xl flex items-center gap-3"
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${accentColor}`,
        opacity: settled ? 0.65 : 1,
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        {settled ? (
          <Check size={13} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <User size={13} style={{ color: accentColor }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)', textDecoration: settled ? 'line-through' : 'none' }}>
            {item.person}
          </p>
          {item.settled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5"
              style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)' }}>
              <Check size={8} />
              Lunas
            </span>
          )}
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {item.note || (isOwe ? 'Kamu berhutang' : 'Kamu meminjamkan')}
        </p>
      </div>

      <p className="text-xs font-bold flex-shrink-0"
        style={{ color: accentColor, textDecoration: settled ? 'line-through' : 'none' }}>
        {formatIDR(item.amount)}
      </p>
    </motion.div>
  )
}
```

- [ ] **Step 2: Update the outer wrapper of DebtCard for list mode**

The outer `motion.div` wrapping the list should have no background/border of its own — each `SingleDebt` is self-contained. Replace:

```tsx
return (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="rounded-2xl mt-2 overflow-hidden"
    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
  >
```

With:
```tsx
return (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="mt-2"
  >
```

Keep the summary header and the `SingleDebt` list inside unchanged — they already look fine. Remove `overflow-hidden` and the background/border styles since they belonged to the old outer container.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add 'src/components/chat/cards/DebtCard.tsx'
git commit -m "feat: restyle DebtCard to match TransactionCard compact layout"
```

---

### Task 9: HistoryDrawer — filter deleted sessions from Supabase query

**Files:**
- Modify: `src/components/chat/HistoryDrawer.tsx`

**Interfaces:**
- Consumes: `deleted_at` column on `chat_history` from Task 1
- Produces: Supabase query in HistoryDrawer only returns rows where `deleted_at IS NULL`

- [ ] **Step 1: Add `.is('deleted_at', null)` to HistoryDrawer query**

In `HistoryDrawer.tsx`, find the `useEffect` that fetches from `chat_history`. It looks like:
```ts
supabase
  .from('chat_history')
  .select('id, role, content, created_at, session_id')
  .eq('user_id', ...)
  .order('created_at', { ascending: false })
  .limit(200)
```

Add `.is('deleted_at', null)` before `.order(...)`:
```ts
supabase
  .from('chat_history')
  .select('id, role, content, created_at, session_id')
  .eq('user_id', ...)
  .is('deleted_at', null)            // ← add this line
  .order('created_at', { ascending: false })
  .limit(200)
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add 'src/components/chat/HistoryDrawer.tsx'
git commit -m "fix: exclude soft-deleted sessions from HistoryDrawer query"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** DB migration ✓, transactions ✓, goals ✓, budgets ✓, assets ✓, chat_history ✓, HistoryDrawer delete ✓, Lunas tab ✓, DebtCard restyle ✓
- [x] **No placeholders:** All steps have concrete code
- [x] **Type consistency:** `deleted_at` is `timestamptz` everywhere; `is('deleted_at', null)` used consistently (not `eq`); `z.string().uuid()` validation on all DELETE handlers
- [x] **Debts API has no DELETE handler** — correct, debts only settle via PATCH, no delete
- [x] **Task 9 is separate from Task 6** — Task 6 adds the UI button, Task 9 adds the query filter. Both touch HistoryDrawer but are cleanly separated steps
