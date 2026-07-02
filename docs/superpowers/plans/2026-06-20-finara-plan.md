# Finara — Grand Implementation Plan
**Date:** 2026-06-20
**Execution mode:** Full agentic automation
**Spec:** `docs/superpowers/specs/2026-06-20-finara-design.md`
**CLAUDE.md:** Always read CLAUDE.md before executing any phase

---

## Critical Context for Every Agent

Before writing a single line of code, every agent MUST internalize:

1. **UI/UX is the product** — animations are not optional polish, they are core features
2. **Dark premium theme** — `#0F0F14` base, `#7C5CFC` accent, no light backgrounds
3. **Mobile-first** — every component designed at 375px width first
4. **Framer Motion everywhere** — no element appears without an entrance animation
5. **DeepSeek function calling** — AI writes to DB via tools, never directly from client
6. **Bahasa Indonesia** — all AI responses, all UI copy (labels, placeholders, empty states)
7. **Optimistic UI** — user messages appear instantly, no waiting for server

---

## Phase Overview

```
Phase 1: Project Scaffold & Infrastructure     (~45 min)
Phase 2: Database & Auth                       (~30 min)
Phase 3: Design System & Shared Components     (~60 min)
Phase 4: AI Chat Engine                        (~90 min)
Phase 5: Dashboard & Data Pages                (~60 min)
Phase 6: Polish, README & Deploy               (~45 min)
```

---

## Phase 1 — Project Scaffold & Infrastructure

**Goal:** Working Next.js 15 app with all dependencies installed, folder structure in place, design tokens configured, and base layout ready.

### Steps

**1.1 Initialize Next.js project**
```bash
cd /Users/indra/Documents/nyoba/finara
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

**1.2 Install all dependencies**
```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  framer-motion \
  recharts \
  lottie-react \
  lucide-react \
  zod \
  openai
```
> Note: Use `openai` SDK — it is compatible with DeepSeek API (same OpenAI-compatible format, just change baseURL to `https://api.deepseek.com`).

```bash
npm install -D @types/node
```

**1.3 Create full folder structure**

Create all directories as defined in CLAUDE.md repository structure. Create placeholder `index.ts` or empty files so git tracks them.

Directories to create:
- `src/components/chat/cards/`
- `src/components/dashboard/`
- `src/components/layout/`
- `src/components/shared/`
- `src/lib/supabase/`
- `src/lib/deepseek/`
- `src/lib/utils/`
- `public/lottie/`
- `supabase/`

**1.4 Configure `tailwind.config.ts`**

Extend theme with design tokens from CLAUDE.md:
```typescript
colors: {
  base: '#0F0F14',
  surface: '#1A1A24',
  elevated: '#22222F',
  accent: { DEFAULT: '#7C5CFC', light: '#9B7FFE', dim: 'rgba(124,92,252,0.15)' },
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#2A2A3A',
}
```

**1.5 Configure `src/app/globals.css`**

Add CSS variables from CLAUDE.md design tokens. Set `background-color: var(--bg-base)` on `body`. Import Geist font or Inter.

**1.6 Create `.env.example`**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEEPSEEK_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**1.7 Create `src/app/layout.tsx`** (root)
- Dark background
- Font setup
- `<Providers>` wrapper component (for future context providers)
- Metadata: title "Finara", description "AI Finance Assistant untuk Indonesia"

**1.8 Create `src/lib/utils/currency.ts`**
```typescript
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
```

**1.9 Create `src/lib/utils/date.ts`**
```typescript
// Helpers: formatDate(date), formatRelative(date), getMonthKey(date) → 'YYYY-MM'
// Use id-ID locale throughout
```

**1.10 Create `src/lib/utils/categories.ts`**
```typescript
export const EXPENSE_CATEGORIES = ['Makanan','Transportasi','Belanja','Hiburan','Kesehatan','Pendidikan','Tagihan','Investasi','Lainnya']
export const INCOME_CATEGORIES = ['Gaji','Freelance','Bisnis','Investasi','Hadiah','Lainnya']
export const CATEGORY_ICONS: Record<string, string> = { /* lucide icon names */ }
export const CATEGORY_COLORS: Record<string, string> = { /* hex colors for chart */ }
```

### Checkpoint 1
- [ ] `npm run dev` starts on port 3000
- [ ] Black/dark background renders in browser
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] All directories exist

---

## Phase 2 — Database & Auth

**Goal:** Supabase schema deployed, auth flow (register/login/verify/logout) working end-to-end, middleware protecting app routes.

### Steps

**2.1 Create `supabase/schema.sql`**

Full schema with:
- `transactions` table
- `budgets` table
- `goals` table
- `debts` table
- `chat_history` table
- RLS enabled on all tables
- Policy for each: `auth.uid() = user_id` for all operations

```sql
-- transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount bigint not null,
  type text check (type in ('income','expense')) not null,
  category text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);
alter table transactions enable row level security;
create policy "users own transactions" on transactions for all using (auth.uid() = user_id);

-- budgets
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category text not null,
  limit_amount bigint not null,
  month text not null,
  created_at timestamptz default now(),
  unique(user_id, category, month)
);
alter table budgets enable row level security;
create policy "users own budgets" on budgets for all using (auth.uid() = user_id);

-- goals
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  target_amount bigint not null,
  current_amount bigint default 0,
  deadline date,
  created_at timestamptz default now()
);
alter table goals enable row level security;
create policy "users own goals" on goals for all using (auth.uid() = user_id);

-- debts
create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  person text not null,
  amount bigint not null,
  type text check (type in ('owe','lent')) not null,
  note text,
  settled boolean default false,
  settled_at timestamptz,
  created_at timestamptz default now()
);
alter table debts enable row level security;
create policy "users own debts" on debts for all using (auth.uid() = user_id);

-- chat_history
create table chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  role text check (role in ('user','assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);
alter table chat_history enable row level security;
create policy "users own chat_history" on chat_history for all using (auth.uid() = user_id);
```

**2.2 Create `src/lib/supabase/client.ts`**
```typescript
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**2.3 Create `src/lib/supabase/server.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(cookiesToSet) { ... } } }
  )
}
```

**2.4 Create `src/middleware.ts`**
- Protect all `/(app)/*` routes — redirect to `/login` if no session
- Redirect authenticated users away from `/login` and `/register` to `/`

**2.5 Create auth pages**

`src/app/(auth)/login/page.tsx`:
- Dark card centered on screen
- Finara logo/wordmark at top
- Email + password inputs (styled, with focus ring in accent purple)
- "Login" button with loading spinner state (Framer Motion AnimatePresence)
- Link to register
- Link to forgot password
- Error message with shake animation on failure
- Framer Motion: card fade+scale in on mount

`src/app/(auth)/register/page.tsx`:
- Same premium design as login
- Email + password + confirm password
- On submit: Supabase `signUp()` → show "Check your email" success state with Lottie animation
- Framer Motion: form fields stagger in on mount

`src/app/(auth)/verify/page.tsx`:
- Simple page shown after register: "We sent a verification link to your email"
- Lottie email animation
- Link back to login

**2.6 Handle auth callback**

`src/app/auth/callback/route.ts`:
- Exchange code from Supabase email link for session
- Redirect to `/` on success

### Checkpoint 2
- [ ] Schema SQL is complete and can be run in Supabase SQL editor
- [ ] Register with a test email works
- [ ] Verification email arrives (or is simulated)
- [ ] Login with verified account works
- [ ] `/` redirects to `/login` when not authenticated
- [ ] `/login` redirects to `/` when already authenticated

---

## Phase 3 — Design System & Shared Components

**Goal:** All reusable UI primitives built and animated correctly. These are the building blocks used by every page.

### Steps

**3.1 `src/components/shared/AnimatedNumber.tsx`**
- Props: `value: number`, `duration?: number`, `prefix?: string`
- Uses `useMotionValue` + `useSpring` + `useTransform` from Framer Motion
- Animates from previous value to new value smoothly
- Formats with `formatIDR` if currency prop passed

**3.2 `src/components/shared/ProgressBar.tsx`**
- Props: `percent: number`, `color?: string`, `height?: number`
- Animated width from 0 to `percent`% on mount using `motion.div`
- Color changes: green < 60%, yellow 60–85%, red > 85%
- Smooth transition: 800ms ease-out

**3.3 `src/components/shared/Toast.tsx`**
- Global toast system using React context + `AnimatePresence`
- Slides in from top-right (desktop) or top-center (mobile)
- Types: success (green), error (red), info (purple)
- Auto-dismiss after 3 seconds
- `useToast()` hook for triggering from anywhere

**3.4 `src/components/shared/SkeletonLoader.tsx`**
- Shimmer effect using CSS gradient animation
- Variants: `text`, `card`, `avatar`, `chart`
- Used during data loading states

**3.5 `src/components/shared/EmptyState.tsx`**
- Props: `title`, `description`, `lottieFile?`
- If lottie file provided, renders Lottie animation
- Otherwise renders a simple icon
- Used in transactions list, goals list, debts list when empty

**3.6 `src/components/layout/PageTransition.tsx`**
- Wraps page content with Framer Motion `motion.div`
- `initial: { opacity: 0 }`, `animate: { opacity: 1 }`, `exit: { opacity: 0 }`
- 200ms ease-in-out

**3.7 `src/components/layout/BottomNav.tsx`**
- 5 tabs: Chat (home icon), Dashboard, Transaksi, Goals, Profil
- Uses Next.js `usePathname()` to determine active tab
- Active tab: accent color + scale(1.1) spring animation
- Inactive: muted color
- Tab bar background: `bg-surface` with top border
- Safe area padding for iOS (`pb-safe` or `padding-bottom: env(safe-area-inset-bottom)`)
- Fixed to bottom of screen

**3.8 `src/components/layout/TopBar.tsx`**
- Shows on pages other than chat
- Back button (if nested) + page title + optional action button
- Subtle border-bottom

**3.9 `src/components/shared/SuccessAnimation.tsx`**
- Green checkmark Lottie animation
- Plays once on mount
- Used after successful transaction save, goal deposit, etc.

**3.10 `src/app/(app)/layout.tsx`**
- Server component that checks auth (redirect if not logged in)
- Renders `<BottomNav />` fixed at bottom
- Renders `<PageTransition>` around `{children}`
- Main content area: `pb-20` to avoid bottom nav overlap

### Checkpoint 3
- [ ] BottomNav renders correctly on mobile
- [ ] AnimatedNumber animates from 0 to a test value
- [ ] ProgressBar animates on mount
- [ ] Toast appears and dismisses after 3s
- [ ] PageTransition fades in

---

## Phase 4 — AI Chat Engine

**Goal:** The core product. Chat page where user types natural language, AI streams back responses with rich cards, and data is saved to Supabase via function calling.

### Steps

**4.1 Create `src/lib/deepseek/client.ts`**

Use the `openai` npm package with DeepSeek base URL:
```typescript
import OpenAI from 'openai'

export const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY!,
})
```

**4.2 Create `src/lib/deepseek/tools.ts`**

Define all 13 function calling tools as OpenAI-compatible tool definitions:

```typescript
export const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: 'Catat transaksi keuangan baru (pemasukan atau pengeluaran)',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Jumlah dalam rupiah (angka bulat)' },
          type: { type: 'string', enum: ['income', 'expense'] },
          category: { type: 'string', description: 'Kategori transaksi' },
          note: { type: 'string', description: 'Catatan tambahan (opsional)' },
          date: { type: 'string', description: 'Tanggal format YYYY-MM-DD, default hari ini' },
        },
        required: ['amount', 'type', 'category'],
      },
    },
  },
  // ... all 13 tools
]
```

Each tool must have a clear Indonesian description so DeepSeek can map natural language correctly.

**4.3 Create `src/app/api/chat/route.ts`**

This is the most critical file. It must:

1. Accept POST: `{ messages: Message[], userId: string }`
2. Validate input with Zod
3. Get user from Supabase auth (verify session via cookie, not client-sent userId)
4. Load last 20 chat messages from `chat_history` table for context
5. Call DeepSeek with streaming + tools:
```typescript
const stream = await deepseek.chat.completions.create({
  model: 'deepseek-chat',
  messages: [systemPrompt, ...history, ...messages],
  tools,
  tool_choice: 'auto',
  stream: true,
})
```
6. Handle streaming with tool call detection:
   - If streaming text: forward chunks to client via `ReadableStream`
   - If tool call detected: pause stream, execute tool against Supabase, inject result back, continue
7. After full response: save user message + assistant response to `chat_history`
8. Return `ReadableStream` with proper headers for SSE

**System prompt for DeepSeek:**
```
Kamu adalah Finara, AI finance assistant pribadi yang helpful, casual, dan supportif.
Selalu jawab dalam Bahasa Indonesia yang santai dan ramah.
Gunakan emoji secukupnya.
JANGAN pernah mengarang angka keuangan — selalu gunakan tools untuk membaca data dari database.
Ketika mencatat transaksi, selalu konfirmasi dengan menyebut jumlah dan kategorinya.
Ketika user minta navigasi ke halaman lain, gunakan tool navigate_to.
Berikan insight proaktif jika ada pola menarik dalam data keuangan user.
Format angka selalu dalam rupiah: "Rp 15.000", "Rp 2.500.000".
Setelah tool call berhasil, return response card dalam format:
\`\`\`card:transaction
{...}
\`\`\`
```

**Tool execution functions (server-side, in route.ts or separate file):**

```typescript
async function executeTool(name: string, args: unknown, userId: string, supabase: SupabaseClient) {
  switch (name) {
    case 'add_transaction': {
      const { amount, type, category, note, date } = args as AddTransactionArgs
      const { data } = await supabase.from('transactions').insert({
        user_id: userId, amount, type, category, note, date: date ?? new Date().toISOString().split('T')[0]
      }).select().single()
      return { success: true, transaction: data }
    }
    case 'get_summary': {
      // Query transactions grouped by type for the period
      // Return { income, expense, balance, topCategories }
    }
    case 'navigate_to': {
      // Return { navigate: true, page: args.page }
      // Frontend will intercept this and call router.push()
    }
    // ... all 13 cases
  }
}
```

**4.4 Create `src/components/chat/TypingIndicator.tsx`**

Three bouncing dots animation:
```typescript
// 3 motion.div circles, staggered y-animation, infinite loop
// Colors: accent purple
// Size: 8px dots, 4px gap
```

**4.5 Create `src/components/chat/StreamingText.tsx`**

Renders streaming text with a blinking cursor at the end while streaming. When done streaming, cursor disappears. Parses `card:*` code blocks and renders the appropriate card component instead of raw text.

**4.6 Create chat response card components**

`src/components/chat/cards/TransactionCard.tsx`:
- Green (income) or red (expense) left border
- Shows: amount (bold, large), category with icon, note, date
- Spring animation on mount

`src/components/chat/cards/SummaryCard.tsx`:
- Shows: period title, income row, expense row, balance (highlighted)
- Mini progress bar showing expense/income ratio
- Spring animation on mount

`src/components/chat/cards/GoalCard.tsx`:
- Goal name, target amount, current amount
- Progress bar (animated)
- Percentage and days remaining

`src/components/chat/cards/DebtCard.tsx`:
- Person name, amount, type (owe/lent with different colors)
- Note if present

`src/components/chat/cards/BudgetCard.tsx`:
- Category, limit, used, remaining
- Color-coded progress bar

**4.7 Create `src/components/chat/ChatBubble.tsx`**

```typescript
// Props: message: { role: 'user'|'assistant', content: string }, isStreaming?: boolean
// User bubble: right-aligned, accent background, white text
// Assistant bubble: left-aligned, surface background
// Framer Motion entrance animation
// For assistant: renders <StreamingText> which handles cards
// Avatar: small "F" logo circle for assistant, user initial for user
```

**4.8 Create `src/components/chat/ChatInput.tsx`**

```typescript
// Fixed bottom bar (above BottomNav)
// Textarea that auto-expands (max 4 lines)
// Send button: accent purple, disabled when empty or loading
// Loading: spinner animation on send button
// Keyboard: submit on Enter (not Shift+Enter)
// Framer Motion: subtle scale on focus
```

**4.9 Create `src/app/(app)/page.tsx`** (Chat home)

State management:
```typescript
const [messages, setMessages] = useState<Message[]>([])
const [isStreaming, setIsStreaming] = useState(false)
const [input, setInput] = useState('')
const bottomRef = useRef<HTMLDivElement>(null)
```

On send:
1. Add user message to state immediately (optimistic)
2. Clear input
3. Add placeholder assistant message with `isStreaming: true`
4. POST to `/api/chat` with fetch + ReadableStream reader
5. Update placeholder message chunk by chunk
6. When done: set `isStreaming: false`
7. If response contains `navigate_to`: call `router.push(page)`
8. Auto-scroll to bottom on new message

On mount:
- Load chat history from Supabase for current user
- Show welcome message if no history: "Halo! Aku Finara, asisten keuangan pribadimu 👋 Mau catat apa hari ini?"
- AnimatePresence for message list

### Checkpoint 4
- [ ] Typing "beli kopi 15k" → AI responds and saves to DB
- [ ] Typing "rekap bulan ini" → AI returns a SummaryCard
- [ ] Streaming works (text appears char by char)
- [ ] TypingIndicator shows while waiting
- [ ] Cards animate in with spring
- [ ] "buka dashboard" → navigates to /dashboard
- [ ] Chat history persists on page refresh

---

## Phase 5 — Dashboard & Data Pages

**Goal:** Visual analytics dashboard and all data management pages (transactions, budgets, goals, debts).

### Steps

**5.1 Create CRUD API routes**

`src/app/api/transactions/route.ts`:
- GET: fetch transactions for current user, supports `?period=month&category=Makanan` filters
- POST: create transaction (Zod validated)
- DELETE: delete by id (verify ownership)

`src/app/api/budgets/route.ts`:
- GET: fetch budgets for month, join with actual spending from transactions
- POST/PUT: upsert budget

`src/app/api/goals/route.ts`:
- GET: fetch all goals
- POST: create goal
- PATCH: update current_amount (deposit)

`src/app/api/debts/route.ts`:
- GET: fetch debts, supports `?type=owe|lent&settled=false`
- POST: create debt
- PATCH: settle debt (set settled=true, settled_at=now)

**5.2 `src/components/dashboard/BalanceHero.tsx`**

```
┌─────────────────────────────────┐
│  Saldo Bulan Ini                │
│  Rp 2.700.000  ← AnimatedNumber │
│                                 │
│  ↑ Rp 5.000.000   ↓ Rp 2.300.000│
│    Pemasukan        Pengeluaran  │
└─────────────────────────────────┘
```
- Gradient card background (subtle purple glow)
- All numbers animate from 0 on mount
- Green for income, red for expense

**5.3 `src/components/dashboard/SpendingChart.tsx`**

- Recharts `PieChart` with `Pie` (donut style, innerRadius 60)
- Each category gets a color from `CATEGORY_COLORS`
- Custom tooltip showing category name + amount + percentage
- Legend below chart (horizontal, wraps)
- Animated on mount with `animationBegin={0}` `animationDuration={800}`

**5.4 `src/components/dashboard/BudgetProgress.tsx`**

- List of budget categories with animated progress bars
- Shows: category icon + name, used/limit amounts, percentage
- Color: green < 60%, yellow 60–85%, red > 85%
- Stagger animation: each bar animates after previous

**5.5 `src/components/dashboard/RecentTransactions.tsx`**

- Last 5 transactions
- Each row: category icon, note, date (left) + amount (right, color-coded)
- Stagger entrance animation
- "Lihat semua" link to /transactions

**5.6 `src/app/(app)/dashboard/page.tsx`**

Layout (mobile):
```
[TopBar: "Dashboard"]
[BalanceHero]
[SpendingChart]  ← scrollable below
[BudgetProgress]
[RecentTransactions]
```

- Fetches data server-side where possible
- Period selector: Bulan Ini / 3 Bulan / Tahun Ini
- PageTransition wrapper

**5.7 `src/app/(app)/transactions/page.tsx`**

- Grouped by date (today, yesterday, this week, older)
- Filter bar: All / Pemasukan / Pengeluaran + category filter chips
- Each transaction: swipe left on mobile to reveal delete action
- Pull-to-refresh (or refresh button)
- Infinite scroll or pagination (last 50, load more)
- Empty state with Lottie animation: "Belum ada transaksi"
- Stagger animation for list items

**5.8 `src/app/(app)/budgets/page.tsx`**

- Month selector (default: current month)
- List of budgets with animated progress bars
- "+ Tambah Budget" button → inline form or bottom sheet
- Budget card: category, limit, used, remaining, % used
- Tap to edit limit amount
- Color transitions: green → yellow → red as spending increases

**5.9 `src/app/(app)/goals/page.tsx`**

- Cards grid (2-col on mobile if space, else 1-col)
- Each goal card: name, progress bar, current/target, % and amount remaining
- "+ Tambah Goal" button → form
- Setor button on each card → prompt for amount
- Completed goals: checkmark animation, subtle green glow
- Empty state: encouraging message + Lottie animation

**5.10 `src/app/(app)/debts/page.tsx`**

- Two tabs: "Hutang Aku" (owe) / "Piutang Aku" (lent)
- Tab switch with underline slide animation
- Each debt card: person name, amount, note, date
- "Lunas" button → confirm dialog → settle with animation
- Settled debts: show in separate "Sudah Lunas" section (collapsed by default)
- Running totals at top: total owe, total lent

**5.11 Profile page `src/app/(app)/profile/page.tsx`**

- User email display
- Month/year stats summary (total income, total expense)
- Logout button
- App version

### Checkpoint 5
- [ ] Dashboard loads with real data from Supabase
- [ ] SpendingChart renders with actual category breakdown
- [ ] BudgetProgress shows real budget vs spending
- [ ] Transactions page lists correctly with filters
- [ ] Goals page shows progress bars
- [ ] Debts page shows owe/lent tabs
- [ ] All pages have loading skeletons
- [ ] All pages have empty states

---

## Phase 6 — Polish, README & Deploy

**Goal:** Production-ready, deployed to Vercel, README complete for submission.

### Steps

**6.1 Animation audit**

Go through every page and component:
- Every list: stagger children animation ✓
- Every page mount: fade in via PageTransition ✓
- Every number: AnimatedNumber ✓
- Every progress bar: animated width ✓
- Every button: scale on press (`whileTap={{ scale: 0.95 }}`) ✓
- Chat bubbles: spring entrance ✓
- Bottom nav tabs: spring scale on active ✓

**6.2 Mobile responsiveness audit**

Test at 375px (iPhone SE), 390px (iPhone 14), 430px (iPhone 14 Plus):
- Bottom nav not overlapping content ✓
- Input bar not hidden by keyboard ✓
- Touch targets minimum 44px ✓
- No horizontal scroll ✓
- Charts fit within viewport ✓

**6.3 Error handling**

- DeepSeek API failure: show toast "Finara lagi sibuk, coba lagi ya 😅"
- Network offline: show offline banner
- Auth session expired: auto-redirect to login
- All API routes: return proper error shapes `{ error: string }`

**6.4 Performance**

- `next/dynamic` for heavy components (Recharts, Lottie)
- `loading.tsx` for each page (skeleton)
- `error.tsx` for each page (error boundary)
- Image optimization: use `next/image` if any images used

**6.5 Create `README.md`**

Structure per submission requirements:

```markdown
# Finara — AI Finance Assistant

## What it is & how to run
...

## Who it's for & the one job it does well
...

## Why this problem & how we know it's worth solving
...

## What's already out there & why we built this anyway
...

## Scope: in vs out
...

## Assumptions made
...

## 3 questions for real users
...

## How we'd know it's working & what's next
...

## How AI was used
...
```

**6.6 Create `.env.local` with actual keys**

Fill in:
- Supabase project URL + anon key (from Supabase dashboard)
- Supabase service role key
- DeepSeek API key (user has this)

**6.7 Run Supabase schema**

Paste `supabase/schema.sql` into Supabase SQL editor and run. Verify all tables + RLS policies created.

**6.8 Final local verification**

```bash
npm run typecheck   # must be clean
npm run build       # must succeed
npm run dev         # manual smoke test
```

Smoke test checklist:
- Register new user
- Receive verification email, click link
- Login
- Chat: "beli makan siang 25k"
- AI responds with TransactionCard
- Dashboard shows the transaction
- Chat: "rekap hari ini"
- AI responds with SummaryCard
- Navigate to Goals page
- Chat: "buka goals"
- AI navigates to /goals
- Add a goal manually from chat: "bikin goal laptop 15jt"
- See goal appear in Goals page

**6.9 Deploy to Vercel**

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- `NEXT_PUBLIC_APP_URL` → Vercel domain

**6.10 Update Supabase auth settings**

In Supabase dashboard → Auth → URL Configuration:
- Site URL: `https://your-vercel-domain.vercel.app`
- Redirect URLs: add `https://your-vercel-domain.vercel.app/auth/callback`

**6.11 Commit everything & push to GitHub**

```bash
git add .
git commit -m "feat: complete Finara MVP"
git remote add origin https://github.com/username/finara.git
git push -u origin main
```

### Final Checkpoint
- [ ] `npm run build` clean
- [ ] Live Vercel URL opens and loads
- [ ] Register + login works on live URL
- [ ] Chat saves a transaction on live URL
- [ ] README covers all 9 submission sections
- [ ] GitHub repo is public with real commit history

---

## Execution Notes for Agents

### Do not skip animations
Every component listed in CLAUDE.md Animation Reference must be implemented. Do not leave a "TODO: add animation later" — implement it in the same pass.

### Card parsing in StreamingText
The `StreamingText` component must parse the full streamed content after streaming completes, detect `card:*` code blocks, and render the appropriate card component. This is critical to the product feel.

### Tool execution is server-side only
`DEEPSEEK_API_KEY` never touches the browser. All tool calls happen in `/api/chat/route.ts`. The client only sees text responses and card blocks.

### Optimistic UI in chat
User messages must appear immediately when sent, before the API call resolves. Never make the user wait to see their own message.

### IDR formatting
Always use `formatIDR()` from `src/lib/utils/currency.ts`. Never format currency inline. Store as integer bigint in DB, display as formatted string in UI.

### Mobile keyboard handling
In the chat page, when the mobile keyboard opens, the input bar must stay visible above the keyboard. Use `position: fixed; bottom: 0` with appropriate padding adjustments.

### Supabase auth in API routes
Always verify the user session server-side in API routes using `createClient()` from `src/lib/supabase/server.ts`. Never trust a `userId` passed from the client body.
