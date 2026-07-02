# Manual Add Transaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "+ Tambah" button to the transactions page that opens a bottom sheet modal for manually creating transactions with type, category, amount, note, and date fields.

**Architecture:** A single-file change to `src/app/(app)/transactions/page.tsx` — add form state, a bottom-sheet modal (identical pattern to goals page), and wire it to the existing `POST /api/transactions` endpoint. No new files needed.

**Tech Stack:** React (useState, useCallback), Framer Motion (AnimatePresence, motion), Lucide React icons, existing `EXPENSE_CATEGORIES` / `INCOME_CATEGORIES` from `@/lib/utils/categories`, `getTodayKey` from `@/lib/utils/date`, `getCategoryMeta` from `@/lib/utils/categoryIcon`.

## Global Constraints

- All colors use `var(--)` CSS variables — no hardcoded hex values
- Animations: spring `stiffness: 300, damping: 30` for modal slide-up; `stiffness: 300, damping: 22` for card enter; buttons use `whileTap={{ scale: 0.97 }}`
- Amounts stored as `Math.round(amount)` bigint — never floats
- Categories must exactly match strings in `EXPENSE_CATEGORIES` / `INCOME_CATEGORIES`
- Date default: `getTodayKey()` from `@/lib/utils/date` (WIB-aware, not `new Date().toISOString().split('T')[0]`)
- `npx tsc --noEmit` must pass before commit
- API auth verified server-side; client only sends `{ amount, type, category, note, date }`

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `src/app/(app)/transactions/page.tsx` | Add form state + modal + "+ Tambah" buttons |

No new files.

---

### Task 1: Add form state and "+ Tambah" button wiring

**Files:**
- Modify: `src/app/(app)/transactions/page.tsx`

**Interfaces:**
- Produces: `showForm` state, `handleCreate` async function, buttons in TopBar and desktop header

- [ ] **Step 1: Add imports**

At the top of `src/app/(app)/transactions/page.tsx`, add to the existing import lines:

```tsx
// Add to lucide-react imports (merge with existing line):
import { Trash2, ChevronDown, X, TrendingUp, TrendingDown, ArrowLeftRight, Plus, Loader2 } from 'lucide-react'

// Add new imports after existing import lines:
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/utils/categories'
import { getTodayKey } from '@/lib/utils/date'
```

- [ ] **Step 2: Add form state variables**

Inside `TransactionsPage()`, after the existing state declarations (after `const [showCatPicker, setShowCatPicker] = useState(false)`), add:

```tsx
// Add transaction form state
const [showForm, setShowForm] = useState(false)
const [formType, setFormType] = useState<'income' | 'expense'>('expense')
const [formCategory, setFormCategory] = useState('')
const [formAmount, setFormAmount] = useState('')
const [formNote, setFormNote] = useState('')
const [formDate, setFormDate] = useState(getTodayKey())
const [saving, setSaving] = useState(false)
```

- [ ] **Step 3: Add handleCreate function**

After the `deleteTransaction` function, add:

```tsx
async function handleCreate() {
  if (!formAmount || !formCategory) return
  setSaving(true)
  await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(Number(formAmount)),
      type: formType,
      category: formCategory,
      note: formNote || undefined,
      date: formDate,
    }),
  })
  await fetchTxs()
  setSaving(false)
  setShowForm(false)
  setFormType('expense')
  setFormCategory('')
  setFormAmount('')
  setFormNote('')
  setFormDate(getTodayKey())
}
```

- [ ] **Step 4: Add "+ Tambah" button to TopBar**

Find the existing `<TopBar title="Transaksi" />` line and replace it:

```tsx
<TopBar
  title="Transaksi"
  action={
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setShowForm(true)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white"
      style={{ background: 'var(--accent)' }}
    >
      <Plus size={14} />
      Tambah
    </motion.button>
  }
/>
```

- [ ] **Step 5: Add "+ Tambah Transaksi" button to desktop header**

Find the existing desktop header block:

```tsx
{/* Desktop page header */}
<div className="hidden lg:flex items-center px-6 py-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
  <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Transaksi</h1>
</div>
```

Replace with:

```tsx
{/* Desktop page header */}
<div className="hidden lg:flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
  <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Transaksi</h1>
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={() => setShowForm(true)}
    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
    style={{ background: 'var(--accent)' }}
  >
    <Plus size={15} />
    Tambah Transaksi
  </motion.button>
</div>
```

- [ ] **Step 6: Type-check**

```bash
cd /Users/indra/Documents/nyoba/finara && npx tsc --noEmit
```

Expected: no errors (only state + imports added so far, modal not yet rendered).

---

### Task 2: Add bottom sheet modal with full form

**Files:**
- Modify: `src/app/(app)/transactions/page.tsx`

**Interfaces:**
- Consumes: `showForm`, `formType`, `formCategory`, `formAmount`, `formNote`, `formDate`, `saving`, `handleCreate` from Task 1
- Produces: fully functional modal visible on `showForm === true`

- [ ] **Step 1: Add modal inside `<AnimatePresence>`**

The file already has an `<AnimatePresence>` block — but it's used for `showDatePicker` and `showCatPicker`. Find the closing `</PageTransition>` tag at the bottom of the return. Just before it, add a new `<AnimatePresence>` block for the form modal:

```tsx
{/* ── Add Transaction Modal ── */}
<AnimatePresence>
  {showForm && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={() => setShowForm(false)}
      />

      {/* Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-5 lg:bottom-8 lg:left-1/2 lg:right-auto lg:w-[420px] lg:-translate-x-1/2"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Tambah Transaksi
          </h3>
          <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Type toggle */}
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setFormType(t); setFormCategory('') }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={
                  formType === t
                    ? {
                        background: t === 'income' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                        color: t === 'income' ? 'var(--success)' : 'var(--danger)',
                      }
                    : { color: 'var(--text-muted)' }
                }
              >
                {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>

          {/* Category picker — scrollable icon grid */}
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Kategori</p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {(formType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => {
                const meta = getCategoryMeta(cat, formType)
                const Icon = meta.icon
                const isSelected = formCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setFormCategory(cat)}
                    className="flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all"
                    style={{
                      background: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      border: isSelected ? '1px solid rgba(124,92,252,0.4)' : '1px solid var(--border)',
                      minWidth: '60px',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: isSelected ? 'var(--accent-dim)' : meta.bg }}
                    >
                      <Icon size={14} style={{ color: isSelected ? 'var(--accent-light)' : meta.color }} />
                    </div>
                    <span
                      className="text-[10px] font-medium text-center leading-tight"
                      style={{ color: isSelected ? 'var(--accent-light)' : 'var(--text-muted)' }}
                    >
                      {cat.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Amount */}
          <input
            type="number"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            placeholder="Jumlah (Rp)"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />

          {/* Note */}
          <input
            type="text"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder="Catatan (opsional)"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />

          {/* Date */}
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            disabled={saving || !formAmount || !formCategory}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Simpan Transaksi
          </motion.button>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/indra/Documents/nyoba/finara && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/indra/Documents/nyoba/finara
git add src/app/\(app\)/transactions/page.tsx
git commit -m "feat(transactions): add manual add transaction modal"
```
