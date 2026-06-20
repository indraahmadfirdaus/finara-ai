@AGENTS.md

# Finara — CLAUDE.md (Living Spec)

> **Read this before touching any file.** This is the single source of truth for conventions, design patterns, and expected behavior across the Finara codebase. Every PR must comply with all rules here.

---

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [Theming & CSS Variables](#2-theming--css-variables)
3. [Chat Card Pattern — MUST BE CONSISTENT](#3-chat-card-pattern--must-be-consistent)
4. [Shared Components](#4-shared-components)
5. [Navigation & Layout](#5-navigation--layout)
6. [Animations (Framer Motion)](#6-animations-framer-motion)
7. [Utility Functions](#7-utility-functions)
8. [AI & System Prompt](#8-ai--system-prompt)
9. [Supabase & Auth](#9-supabase--auth)
10. [API Routes](#10-api-routes)
11. [Next.js 16 Specifics](#11-nextjs-16-specifics)
12. [Hard Bans](#12-hard-bans)

---

## 1. Project Structure

```
src/
├── app/
│   ├── (app)/                  # Protected routes (auth required)
│   │   ├── chat/               # Main chat — session-aware
│   │   ├── dashboard/          # Overview (force-dynamic)
│   │   ├── transactions/       # CRUD + filter
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── debts/
│   │   ├── profile/            # Settings, password, support link
│   │   ├── support/            # Support developer page (Saweria)
│   │   ├── about/              # App info & stack
│   │   └── layout.tsx          # App shell: SideNav + main + BottomNav
│   ├── (auth)/                 # Login, register, verify
│   ├── api/                    # Server-side API routes (no browser secrets)
│   │   ├── chat/               # SSE streaming, tool execution
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── goals/
│   │   └── debts/
│   ├── globals.css             # CSS var definitions ONLY — no component styles
│   └── layout.tsx              # Root layout — ThemeProvider, Geist fonts
│
├── components/
│   ├── chat/
│   │   ├── ChatBubble.tsx      # User & AI message bubbles
│   │   ├── StreamingText.tsx   # Card block parser + markdown renderer
│   │   ├── HistoryDrawer.tsx   # Session restore drawer
│   │   ├── ImageOCR.tsx        # Receipt/invoice image upload
│   │   └── cards/              # All chat cards — follow the pattern in §3
│   ├── layout/
│   │   ├── SideNav.tsx         # Desktop sidebar — 256px sticky
│   │   ├── BottomNav.tsx       # Mobile nav — lg:hidden
│   │   ├── TopBar.tsx          # Mobile header — lg:hidden
│   │   └── PageTransition.tsx  # Fade-in wrapper for every new page
│   ├── dashboard/              # Dashboard widgets
│   └── shared/                 # AnimatedNumber, ProgressBar, Toast, etc.
│
├── lib/
│   ├── supabase/client.ts      # Browser client
│   ├── supabase/server.ts      # Server client (async, cookies)
│   ├── deepseek/client.ts      # OpenAI SDK → DeepSeek
│   ├── deepseek/tools.ts       # 17 tool definitions
│   ├── theme.tsx               # ThemeContext (dark/light)
│   └── utils/                  # currency, date, categories, categoryIcon
│
└── proxy.ts                    # Auth guard (Next.js 16 — not middleware.ts)
```

---

## 2. Theming & CSS Variables

### Usage

Always use CSS variables — **never hardcode hex values**.

```css
/* CORRECT */
style={{ color: 'var(--text-primary)' }}
style={{ background: 'var(--accent-dim)' }}

/* WRONG */
style={{ color: '#F1F1F3' }}
style={{ background: '#7C5CFC' }}
```

### Full Variable Reference

| Variable | Dark | Light | Usage |
|---|---|---|---|
| `--bg-base` | `#0D0D14` | `#F4F4F8` | Page background |
| `--bg-surface` | `#1A1A26` | `#FFFFFF` | Cards, panels, nav |
| `--bg-elevated` | `#22222F` | `#EBEBF2` | Hover state, elevated cards |
| `--accent` | `#7C5CFC` | `#7C5CFC` | Primary brand purple |
| `--accent-light` | `#A78BFA` | `#6B46FC` | Active nav, active icon |
| `--accent-dim` | `rgba(124,92,252,0.15)` | `rgba(124,92,252,0.10)` | Badge background, active pill |
| `--success` | `#22C55E` | `#16A34A` | Income, settled, safe |
| `--warning` | `#F59E0B` | `#D97706` | Budget near limit (80%+) |
| `--danger` | `#EF4444` | `#DC2626` | Expense, over budget, debt owed |
| `--text-primary` | `#F1F1F3` | `#0F0F14` | Main text |
| `--text-secondary` | `#A1A1AA` | `#4B4B60` | Labels, captions |
| `--text-muted` | `#6B7280` | `#9090A8` | Placeholders, metadata |
| `--border` | `#2A2A3A` | `#D8D8E8` | Solid borders |
| `--border-light` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.06)` | Subtle borders, dividers |
| `--bubble-user-from` | `#7C5CFC` | `#7C5CFC` | User chat bubble (gradient start) |
| `--bubble-user-to` | `#6B46FC` | `#6B46FC` | User chat bubble (gradient end) |
| `--bubble-ai` | `#1E1E2E` | `#FFFFFF` | AI bubble background |
| `--bubble-ai-border` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.07)` | AI bubble border |
| `--input-bg` | `#1A1A26` | `#FFFFFF` | Input background |
| `--nav-bg` | `#13131E` | `#FFFFFF` | Bottom nav background |
| `--header-bg` | `#0D0D14` | `#F4F4F8` | Sticky header background |

### Amber Color (Support/Saweria only)
No CSS var — use hardcoded values locally in support-related UI only:
```
#FBB724               → amber primary (border, text)
rgba(251,183,36,0.12) → button/badge background
rgba(251,183,36,0.35) → box-shadow glow
```

### ThemeProvider
```tsx
import { useTheme } from '@/lib/theme'
const { theme, toggle } = useTheme()
// theme: 'dark' | 'light'
// Applied via: document.documentElement.setAttribute('data-theme', theme)
// Persisted via: localStorage key 'finara-theme'
// Default SSR: data-theme="dark" on <html> with suppressHydrationWarning
```

### CRITICAL — Tailwind v4 Specificity Bug
**Never** combine `:root {}` and `[data-theme="dark"] {}` in one CSS block. Dark values always win due to a Tailwind v4 specificity bug.

```css
/* WRONG — never do this */
:root, [data-theme="dark"] { --accent: #7C5CFC; }

/* CORRECT */
[data-theme="dark"] { --accent: #7C5CFC; }
[data-theme="light"] { --accent: #7C5CFC; }
```

---

## 3. Chat Card Pattern — MUST BE CONSISTENT

Every card rendered in chat **must** follow this exact pattern. `TransactionCard.tsx` is the canonical reference.

### Visual Structure

```
┌─┬────────────────────────────────────────────────┐
│ │  [Icon 36x36]  Category Name  [Badge]   Rp Amt │
│ │                Note/Subtitle               Date │
│ │                                                 │
│ │  [ProgressBar if applicable]                    │
│ │  Left label                       Right label   │
└─┴────────────────────────────────────────────────┘
 ↑
 w-1 accent bar
```

### Required Implementation

```tsx
<motion.div
  initial={{ y: 16, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
  className="rounded-xl mt-2 overflow-hidden"
  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
>
  <div className="flex items-stretch">
    {/* 1. ACCENT LEFT BAR — always required */}
    <div className="w-1 flex-shrink-0 rounded-l-xl" style={{ background: accentColor }} />

    {/* 2. CONTENT — pl-4 provides spacing from the bar */}
    <div className="flex-1 p-3 pl-4">
      <div className="flex items-center gap-3">

        {/* 3. ICON — 36x36, rounded-xl */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={15} style={{ color: iconColor }} />
        </div>

        {/* 4. TEXT + ACTION BADGE */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {label}
            </p>
            {data._action && <ActionBadge action={data._action} />}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>

        {/* 5. RIGHT SIDE — amount or percent */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold" style={{ color: accentColor }}>{value}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{meta}</p>
        </div>

      </div>
    </div>
  </div>
</motion.div>
```

### _action Badge

```tsx
{data._action && (
  <span
    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1"
    style={{
      background: data._action === 'deleted' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
      color: data._action === 'deleted' ? 'var(--danger)' : 'var(--success)',
    }}
  >
    <Check size={9} />
    {data._action === 'created' ? 'Dibuat' : data._action === 'updated' ? 'Diperbarui' : 'Dihapus'}
  </span>
)}
```

### Accent Bar Color per Card Type

| Card | Accent Bar | Condition |
|---|---|---|
| TransactionCard | `var(--success)` | income |
| TransactionCard | `var(--danger)` | expense |
| BudgetCard | color from `getCategoryMeta()` | normal |
| BudgetCard | `var(--warning)` | `percent >= 80` |
| BudgetCard | `var(--danger)` | over budget |
| GoalCard | `var(--accent)` | always |
| DebtCard | `var(--danger)` | type = 'owe' |
| DebtCard | `var(--success)` | type = 'lent' |
| DebtCard | `var(--text-muted)` | settled |
| AssetCard | `var(--accent)` | type = 'bank' |
| AssetCard | `var(--success)` | type = 'investment' |
| AssetCard | `#F59E0B` | type = 'property' |
| AssetCard | `var(--text-secondary)` | type = 'vehicle' |
| AssetCard | `var(--text-muted)` | type = 'other' |

### Card Formats from AI (System Prompt)

The AI sends cards as markdown code blocks. These are parsed by `StreamingText.tsx`:

````
```card:transaction
{ "id": "uuid", "type": "expense", "amount": 25000, "category": "Makanan & Minuman", "note": "makan siang", "date": "2026-06-20", "_action": "created" }
```

```card:budget
{ "category": "Transportasi", "limit": 500000, "used": 18000, "percent": 3.6, "_action": "created" }
```

```card:goal
{ "name": "Liburan Bali", "target": 5000000, "current": 0, "percent": 0, "deadline": "2026-12-31", "_action": "created" }
```

```card:debt
{ "person": "Budi", "amount": 50000, "type": "owe", "note": "kopi", "_action": "created" }
// For a list: { "items": [{ "person": "...", "amount": ..., "type": "owe", "settled": false }] }
```

```card:summary
{ "period": "bulan ini", "income": 5000000, "expense": 2500000, "balance": 2500000 }
```

```card:asset
{ "name": "Reksadana Bibit", "type": "investment", "institution": "Bibit", "value": 200000000, "_action": "created" }
// For list (get_assets): { "items": [{ "name": "BCA", "type": "bank", "value": 50000000 }], "total": 50000000 }
```
````

**`_action` must be included on all cards after a write operation** (created / updated / deleted).

---

## 4. Shared Components

### AnimatedNumber
```tsx
import AnimatedNumber from '@/components/shared/AnimatedNumber'
<AnimatedNumber value={1500000} />        // Rp 1.500.000 with animated counter
<AnimatedNumber value={75} suffix="%" />
```

### ProgressBar
```tsx
import ProgressBar from '@/components/shared/ProgressBar'
<ProgressBar percent={75} height={5} />
<ProgressBar percent={95} color="var(--warning)" />   // near limit
<ProgressBar percent={110} color="var(--danger)" />   // over budget
// Default color: var(--accent). Width animates from 0 on mount.
```

### Toast
```tsx
import { useToast } from '@/components/shared/Toast'
const { showToast } = useToast()
showToast('Transaction saved', 'success')
showToast('Failed to save', 'error')
// Auto-closes after 3 seconds. Rendered top-center.
```

### PageTransition
```tsx
import PageTransition from '@/components/layout/PageTransition'
export default function MyPage() {
  return (
    <PageTransition>
      <div>...</div>
    </PageTransition>
  )
}
// Required on every new page for consistent fade-in entry.
```

### getCategoryMeta
```tsx
import { getCategoryMeta } from '@/lib/utils/categoryIcon'
const { icon: Icon, bg, color } = getCategoryMeta('Transportasi', 'expense')
// bg: rgba string for the icon container background
// color: hex string for the icon itself
// Fallback: Banknote (income) or DollarSign (expense) if no keyword match
```

---

## 5. Navigation & Layout

### App Shell Structure
```
[SideNav 256px] | [flex-1 flex-col]
                    main (pb-20 lg:pb-0)
                    [BottomNav lg:hidden]
```

### Adding Nav Items — SideNav

Edit the appropriate array in `src/components/layout/SideNav.tsx`:

```tsx
// Top-level pages:
const TOP_TABS = [
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

// Bottom profile area:
const BOTTOM_TABS = [
  { href: '/profile', icon: User, label: 'Profil' },
  { href: '/support', icon: Coffee, label: 'Dukung Dev' },
]

// Collapsible "Daftar" sub-items:
const LIST_SUBS = [
  { href: '/transactions', icon: List, label: 'Transaksi' },
  { href: '/budgets', icon: PieChart, label: 'Anggaran' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/debts', icon: HandCoins, label: 'Hutang' },
]
```

NavItems use `layoutId="side-pill"` for shared layout animation across all active indicators.

### Adding Nav Items — BottomNav

BottomNav shows exactly 4 tabs. Additional pages go into the **Daftar drawer** (LIST_SUBS). Never add a 5th item to MAIN_TABS — it breaks the mobile nav proportions.

### Chat Input — Fixed Position
```css
/* Mobile: above bottom nav */
bottom: 4rem    /* bottom-16 = 64px */

/* Desktop: flush to bottom, offset for sidebar */
bottom: 0       /* lg:bottom-0 */
left: 256px     /* lg:left-64 */
```

---

## 6. Animations (Framer Motion)

### Standard Spring
```tsx
transition={{ type: 'spring', stiffness: 300-400, damping: 20-30 }}
```

### Page Enter (PageTransition)
```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.2, ease: 'easeInOut' }}
```

### Card Enter (all chat cards)
```tsx
initial={{ y: 16, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ type: 'spring', stiffness: 300, damping: 22 }}
```

### List Stagger
```tsx
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
}
const item = {
  hidden: { opacity: 0, x: -6 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } }
}
```

### Nav Active Pill (shared layout animation)
```tsx
{isActive && (
  <motion.div
    layoutId="side-pill"   // "nav-pill" for BottomNav
    className="absolute inset-0 rounded-xl"
    style={{ background: 'var(--accent-dim)' }}
    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
  />
)}
```

### Tap Feedback
```tsx
whileTap={{ scale: 0.95 }}   // standard buttons
whileTap={{ scale: 0.9 }}    // large CTA buttons
```

### AnimatePresence — required for exit animations
```tsx
import { AnimatePresence } from 'framer-motion'
<AnimatePresence>
  {isOpen && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>
// Required for: modals, drawers, conditionally-rendered elements
```

---

## 7. Utility Functions

### Currency
```tsx
import { formatIDR, formatCompactIDR } from '@/lib/utils/currency'

formatIDR(25000)          // 'Rp 25.000'
formatIDR(2500000)        // 'Rp 2.500.000'
formatCompactIDR(25000)   // 'Rp 25rb'
formatCompactIDR(2500000) // 'Rp 2.5jt'
formatCompactIDR(25000000)// 'Rp 25M'

// Never format numbers inline — always use these helpers.
```

### Date
```tsx
import { getTodayKey, getMonthKey, getPeriodRange, formatDate, formatDateShort, formatRelative } from '@/lib/utils/date'

getTodayKey()             // 'YYYY-MM-DD' in WIB (UTC+7)
getMonthKey()             // 'YYYY-MM'
getPeriodRange('today')   // { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
getPeriodRange('week')    // current week
getPeriodRange('month')   // current month
getPeriodRange('year')    // current year
formatDate(date)          // 'dd MMMM yyyy' (id-ID locale)
formatDateShort(date)     // 'dd MMM' (id-ID locale)
formatRelative(date)      // 'Hari ini', 'Kemarin', 'X hari lalu', or formatDateShort
```

### Categories
```tsx
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/utils/categories'
// EXPENSE (15): 'Makanan & Minuman', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan',
//               'Pendidikan', 'Tagihan & Utilitas', 'Rumah', 'Travel', 'Perawatan Diri',
//               'Anak & Keluarga', 'Hewan Peliharaan', 'Sosial & Hadiah', 'Cicilan & Hutang', 'Lainnya'
// INCOME (8):   'Gaji', 'Freelance', 'Bisnis', 'Investasi', 'Bonus', 'Hadiah', 'Transfer Masuk', 'Lainnya'
// These strings must match exactly when creating/filtering transactions.
```

---

## 8. AI & System Prompt

### DeepSeek Client
```tsx
import { getDeepseekClient } from '@/lib/deepseek/client'
const client = getDeepseekClient()
// Internally: new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: DEEPSEEK_API_KEY })
// Model: 'deepseek-chat'
// DEEPSEEK_API_KEY is server-side only — never expose to browser.
```

### Tool Execution — Server Side Only
All 17 tools execute in `/api/chat/route.ts`. The client receives only SSE events:
- `{ type: 'text', content: '...' }` — streamed text chunk
- `{ type: 'navigate', page: '/...' }` — client-side redirect
- `{ type: 'data_changed' }` — trigger a data refetch
- `{ type: 'done', session_id: 'uuid' }` — end of stream
- `{ type: 'error', message: '...' }` — error state

### Tool Categories
| Group | Tools |
|---|---|
| Transactions | `add_transaction`, `update_transaction`, `delete_transaction`, `get_transactions`, `get_summary` |
| Budgets | `set_budget`, `get_budgets` |
| Goals | `add_goal`, `deposit_goal`, `get_goals` |
| Debts | `add_debt`, `settle_debt`, `get_debts` |
| Assets | `add_asset`, `update_asset_value`, `get_assets`, `delete_asset` |
| Insights | `get_insights` |
| Navigation | `navigate_to` |

### Chat Session Isolation
```tsx
// Stored in sessionStorage (NOT localStorage) — one session per browser tab
const SESSION_KEY = 'finara_chat_session_id'

// New chat: generate UUID, persist to sessionStorage
const newId = crypto.randomUUID()
sessionStorage.setItem(SESSION_KEY, newId)

// Restore from history: write the restored session_id to sessionStorage
sessionStorage.setItem(SESSION_KEY, restoredSessionId)

// DON'T generate session_id inside useState initializer — re-runs on every mount
// DON'T use localStorage — breaks tab isolation
```

---

## 9. Supabase & Auth

### Client Instantiation
```tsx
// Browser (client components)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Server (route handlers, server components)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()  // async — uses cookies()
```

### Auth Pattern — API Routes
```tsx
// REQUIRED: always verify server-side. Never trust client-sent userId.
const { data: { user } } = await supabase.auth.getUser()
if (!user) return new Response('Unauthorized', { status: 401 })
const userId = user.id  // use this — never req.body.userId
```

### Row Level Security
All tables have RLS enabled — queries are automatically scoped to `auth.uid()`. Manual `WHERE user_id = ?` filters are not required for correctness but are good for index performance.

### Table Schemas

#### transactions
```sql
id uuid, user_id uuid, amount bigint, type ('income'|'expense'),
category text, note text?, date date, created_at timestamptz
```

#### budgets
```sql
id uuid, user_id uuid, category text, limit_amount bigint,
month text ('YYYY-MM'), created_at timestamptz
UNIQUE: (user_id, category, month)
```

#### goals
```sql
id uuid, user_id uuid, name text, target_amount bigint,
current_amount bigint (default 0), deadline date?, created_at timestamptz
```

#### debts
```sql
id uuid, user_id uuid, person text, amount bigint,
type ('owe'|'lent'), note text?, settled boolean (default false),
settled_at timestamptz?, created_at timestamptz
```

#### chat_history
```sql
id uuid, user_id uuid, session_id uuid, role ('user'|'assistant'),
content text, created_at timestamptz
INDEX: (user_id, session_id, created_at ASC)
```

#### assets
```sql
id uuid, user_id uuid, name text, type ('bank'|'investment'|'property'|'vehicle'|'other'),
institution text?, value bigint (default 0), note text?,
created_at timestamptz, updated_at timestamptz (auto-updated via trigger)
```

#### asset_value_logs
```sql
id uuid, asset_id uuid (FK → assets.id ON DELETE CASCADE), user_id uuid,
old_value bigint, new_value bigint, note text?, created_at timestamptz
```

### Amount — bigint
```tsx
// DB stores amounts as bigint. Convert on the way in, format on the way out.
// Into DB:  Math.round(amount)         — no floats
// Out of DB: formatIDR(Number(row.amount))
```

---

## 10. API Routes

### Standard Pattern
```tsx
// src/app/api/[feature]/route.ts
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.from('...').select('...')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function POST(req: Request) {
  // Validate with Zod before any DB write
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 })
  // ...
}
```

### Chat — SSE Streaming
`POST /api/chat` accepts `{ messages, session_id }` and returns an SSE stream.
- `Content-Type: text/event-stream`
- Event format: `data: {...}\n\n`
- Tool execution loop continues until no more `tool_calls` in the response
- Final messages saved to `chat_history` after the loop ends

---

## 11. Next.js 16 Specifics

### proxy.ts — Not middleware.ts
```tsx
// src/proxy.ts  (NOT middleware.ts — that filename is deprecated in Next.js 16)
export async function proxy(request: NextRequest) { ... }
// Function must be named 'proxy', not 'middleware'
// Runtime: Node.js (default) — do NOT set runtime = 'edge'
```

### Auth Guard Routes
```
Public:    /, /login, /register, /auth/*, /api/*, /_next/*, /favicon.ico
Protected: /(app)/* → redirect to /login if unauthenticated
Auth pages + already logged in → redirect to /chat
```

### force-dynamic
```tsx
// Pages that must always fetch fresh data (no static caching):
export const dynamic = 'force-dynamic'
// Currently applied to: dashboard/page.tsx
```

### Fonts
```tsx
// Root layout uses Geist via next/font
// CSS vars: --font-sans (Geist Sans), --font-mono (Geist Mono)
// Do not import additional font families without discussion — typography consistency.
```

---

## 12. Hard Bans

| Banned | Reason |
|---|---|
| `middleware.ts` | Deprecated in Next.js 16 — use `proxy.ts` |
| Hardcoded hex colors | Breaks theming — use `var(--)` |
| `userId` from request body | Security — always use `supabase.auth.getUser()` |
| `DEEPSEEK_API_KEY` in client code | Secret leak |
| `SUPABASE_SERVICE_ROLE_KEY` in client code | Bypasses RLS — security hole |
| Chat card without accent left bar | Visual inconsistency |
| Chat card icon without left padding (`pl-4`) | Icon appears flush against the bar |
| `:root {}` + `[data-theme="dark"] {}` in one CSS block | Tailwind v4 specificity bug |
| `useState(() => crypto.randomUUID())` for session | Re-runs on every mount |
| `localStorage` for chat `session_id` | Breaks tab isolation — use `sessionStorage` |
| Pushing directly to `main` | Use feature branches + PR |
| Committing without `npx tsc --noEmit` | Type errors reach production |
| Float amounts to DB | Use `Math.round()` — DB expects bigint |
| Inline number formatting | Use `formatIDR()` / `formatCompactIDR()` |
| Direct Saweria link anywhere in UI | Must route through `/support` page |

---

## New Feature Checklist

Before opening a PR, verify all of the following:

- [ ] All colors use `var(--)` — no hardcoded hex (amber Saweria UI is the only exception)
- [ ] Chat cards follow §3: accent bar + icon with `pl-4` + `_action` badge
- [ ] Entry animation: spring `stiffness: 300, damping: 22` (cards) or `damping: 28` (list items)
- [ ] New pages wrapped in `<PageTransition>`
- [ ] Numbers formatted with `formatIDR()` or `formatCompactIDR()`
- [ ] Dates processed via helpers in `date.ts` — not raw `new Date()`
- [ ] API routes verify `supabase.auth.getUser()` before any query
- [ ] No secrets in client-side code
- [ ] `npx tsc --noEmit` passes clean
- [ ] New nav items added to both SideNav AND BottomNav (or the Daftar sub-menu)
