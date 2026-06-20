# Finara — AI Finance Assistant Design Spec
**Date:** 2026-06-20  
**Status:** Approved  
**Stack:** Next.js 15 · Supabase · DeepSeek API · Framer Motion · Tailwind CSS

---

## 1. Product Vision

Finara adalah AI finance assistant berbahasa Indonesia berbasis web. User berinteraksi via chatbot sebagai interface utama — catat transaksi, tanya rekap, kelola budget, goals, dan hutang cukup dengan mengetik natural language. Dashboard visual tersedia sebagai halaman terpisah untuk analisis mendalam.

**Positioning:** "Cleo, tapi untuk Indonesia" — gratis, web-based, no install, Bahasa Indonesia.

**Target user:** Individu Indonesia usia 20–35 yang mau ganti catatan manual (Excel, buku kas) ke sesuatu yang lebih cerdas dan visual.

---

## 2. Architecture

```
Browser (Next.js 15 App Router)
    ↓ fetch / EventSource (streaming)
API Route Handlers (server-side)
    ↓                    ↓
DeepSeek API         Supabase
(chat + tools)       (auth + DB)
```

### Repo structure

```
finara/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx           # Bottom nav + page transitions
│   │   │   ├── page.tsx             # Chat (home)
│   │   │   ├── dashboard/page.tsx   # Analytics
│   │   │   ├── transactions/page.tsx
│   │   │   ├── budgets/page.tsx
│   │   │   ├── goals/page.tsx
│   │   │   └── debts/page.tsx
│   │   └── api/
│   │       ├── chat/route.ts        # DeepSeek streaming + tool execution
│   │       ├── transactions/route.ts
│   │       ├── budgets/route.ts
│   │       ├── goals/route.ts
│   │       └── debts/route.ts
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatBubble.tsx       # User & assistant bubbles
│   │   │   ├── TypingIndicator.tsx  # 3-dot bounce animation
│   │   │   ├── ChatInput.tsx        # Bottom input bar
│   │   │   └── ResponseCard.tsx     # Rich card dalam bubble
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── SpendingChart.tsx    # Pie chart kategori
│   │   │   ├── BudgetBar.tsx        # Progress bar budget
│   │   │   └── RecentList.tsx
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx
│   │   │   └── PageTransition.tsx
│   │   └── shared/
│   │       ├── AnimatedNumber.tsx   # Counter 0 → nilai
│   │       ├── Toast.tsx
│   │       └── SkeletonLoader.tsx
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts
│       │   └── server.ts
│       ├── deepseek/
│       │   ├── client.ts
│       │   └── tools.ts             # Function calling definitions
│       └── utils/
│           ├── currency.ts          # IDR formatter
│           └── date.ts
├── public/
│   └── lottie/                      # Success, empty state animations
└── supabase/
    └── schema.sql
```

---

## 3. Auth Flow

Provider: **Supabase Auth** (email + password)

| Step | Detail |
|------|--------|
| Register | Email + password → Supabase kirim verification email otomatis |
| Email verify | User klik link → redirect ke app → session aktif |
| Login | Email + password → session cookie via Supabase SSR |
| Forgot password | Supabase kirim reset link ke email (built-in) |
| Session | Supabase SSR cookie, refresh otomatis |

Tidak ada OAuth. Tidak ada magic link (untuk simplicity — user harus ingat password).

---

## 4. AI Layer — DeepSeek Function Calling

### System prompt (Bahasa Indonesia)
Finara adalah AI finance assistant yang helpful, casual, dan supportif. Selalu respond dalam Bahasa Indonesia. Ketika user input transaksi atau request data, gunakan tools yang tersedia. Jangan pernah hallucinate angka — selalu ambil dari database via tools.

### Tools / Function definitions

| Tool | Trigger contoh | Parameter |
|------|---------------|-----------|
| `add_transaction` | "beli kopi 15k", "gajian 5jt" | amount, type(income/expense), category, note, date |
| `get_summary` | "rekap bulan ini", "pengeluaran minggu ini" | period(day/week/month/year), type? |
| `get_transactions` | "lihat transaksi", "transaksi kemarin" | limit, period, category? |
| `set_budget` | "set budget makan 1jt sebulan" | category, limit, month |
| `get_budgets` | "budget ku gimana?" | month? |
| `add_goal` | "bikin goal liburan 20jt" | name, target, deadline? |
| `deposit_goal` | "setor 500k ke goal liburan" | goal_name, amount |
| `get_goals` | "goals ku apa aja?" | — |
| `add_debt` | "pinjem ke Budi 200k" | person, amount, type(owe/lent), note? |
| `settle_debt` | "Budi udah bayar" | person, debt_id? |
| `get_debts` | "hutang aku ke siapa?" | type? |
| `get_insights` | "kenapa pengeluaran naik?", "saran hemat" | period? |
| `navigate_to` | "buka dashboard", "lihat goals" | page(dashboard/transactions/budgets/goals/debts) |

### Streaming
- API route `/api/chat` menggunakan `ReadableStream` untuk streaming token DeepSeek ke browser
- Tool calls dieksekusi server-side, hasilnya dimasukkan kembali ke context sebelum lanjut generate response
- Client pakai `EventSource` / `fetch` dengan `response.body` reader

### Response format dari AI
AI bisa return dua format dalam satu response:
1. **Teks biasa** — percakapan, konfirmasi, saran
2. **JSON card** dalam markdown code block — trigger render komponen khusus di frontend

```
Oke, sudah aku catat! 🎉

\`\`\`card:transaction
{"type":"expense","amount":15000,"category":"Makanan","note":"kopi"}
\`\`\`

Pengeluaran kopi kamu bulan ini udah 12x ya, totalnya Rp 180.000 😄
```

---

## 5. Database Schema

```sql
-- Supabase Auth handles users table

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount bigint not null,              -- dalam rupiah (integer, no decimal)
  type text check (type in ('income','expense')) not null,
  category text not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category text not null,
  limit_amount bigint not null,
  month text not null,                 -- format: YYYY-MM
  created_at timestamptz default now(),
  unique(user_id, category, month)
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  target_amount bigint not null,
  current_amount bigint default 0,
  deadline date,
  created_at timestamptz default now()
);

create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  person text not null,
  amount bigint not null,
  type text check (type in ('owe','lent')) not null,  -- owe=kita hutang, lent=kita piutang
  note text,
  settled boolean default false,
  settled_at timestamptz,
  created_at timestamptz default now()
);

create table chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  session_id uuid,
  role text check (role in ('user','assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

create table assets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  name        text not null,
  type        text not null check (type in ('bank', 'investment', 'property', 'vehicle', 'other')),
  institution text,                        -- platform/bank, opsional
  value       bigint not null default 0,   -- nilai terkini dalam rupiah
  note        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table asset_value_logs (
  id          uuid primary key default gen_random_uuid(),
  asset_id    uuid references assets(id) on delete cascade,
  user_id     uuid not null,
  old_value   bigint not null,
  new_value   bigint not null,
  note        text,
  created_at  timestamptz default now()
);

-- RLS: semua tabel hanya bisa diakses user sendiri
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table goals enable row level security;
alter table debts enable row level security;
alter table chat_history enable row level security;
alter table assets enable row level security;
alter table asset_value_logs enable row level security;

-- Policy template (repeat for each table)
create policy "user owns data" on transactions
  for all using (auth.uid() = user_id);

-- Asset policies
create policy "Users can manage own assets"
  on assets for all using (auth.uid() = user_id);

create policy "Users can manage own asset logs"
  on asset_value_logs for all using (auth.uid() = user_id);
```

---

## 6. UI/UX Design

### Mobile-first breakpoints
- Default: mobile (< 640px) — bottom nav, full-width chat
- md+: sidebar nav, split layout optional

### Color palette
- Background: `#0F0F14` (near black) — premium dark
- Surface: `#1A1A24`
- Accent: `#7C5CFC` (purple — trustworthy, modern)
- Success: `#22C55E`
- Warning: `#F59E0B`
- Text primary: `#F1F1F3`
- Text muted: `#6B7280`

### Chat page (home)
- Scroll area untuk bubbles, pinned bottom input
- User bubble: kanan, accent color
- AI bubble: kiri, surface color
- Typing indicator: 3 dots bounce (Framer Motion)
- Streaming: karakter muncul satu-satu dengan cursor blink
- Rich card: slide up dari bawah dengan spring physics

### Bottom navigation
```
[💬 Chat] [📊 Dashboard] [📋 Transaksi] [🎯 Goals] [👤 Profil]
```
- Active tab: accent color + scale(1.1) + label visible
- Inactive: muted, icon only
- Tab switch: content slide + fade transition

### Dashboard page
- Header: greeting + bulan ini
- Hero card: net balance (AnimatedNumber on mount)
- Income vs Expense: dua stat cards side by side
- Spending by category: donut/pie chart (Recharts)
- Budget progress: animated progress bars
- Recent transactions: last 5, tap untuk detail

### Animations (Framer Motion)
| Element | Animation |
|---------|-----------|
| Chat bubble masuk | `x: ±20, opacity: 0 → 1`, spring |
| AI card response | `y: 20, opacity: 0 → 1`, spring stiffness 300 |
| Page transition | `opacity: 0 → 1`, 200ms ease |
| Bottom nav active | `scale: 1 → 1.1`, spring |
| Number counter | 0 → nilai, 1.5s ease-out |
| Progress bar | `width: 0% → actual%`, 800ms ease-out |
| Toast | `y: -20 → 0`, auto dismiss 3s |
| Typing indicator | stagger bounce, infinite |
| Success checkmark | draw path animation |
| Skeleton | shimmer gradient loop |

---

## 7. Pages & Features Scope

### In scope (MVP)
- [x] Auth: register, login, email verify, forgot password
- [x] Chat: input natural language, streaming AI response, rich cards
- [x] Transactions: add via chat atau form manual, list, filter by period
- [x] Dashboard: summary, chart, budget progress
- [x] Budgets: set per kategori, warning dari AI
- [x] Goals: create, deposit, progress tracking
- [x] Debts: add, settle, list hutang/piutang
- [x] AI navigation: bot bisa redirect ke halaman lain
- [x] Chat history: persisted per user
- [x] Mobile responsive

### Out of scope (post-MVP)
- [ ] Bank account sync / open banking
- [ ] Recurring transactions / reminders
- [ ] Multi-currency
- [ ] Export to Excel/PDF
- [ ] Voice input
- [ ] Social / shared finance
- [ ] Investasi / portofolio

---

## 8. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 15 (App Router) | SSR, Route Handlers, Vercel deploy |
| Auth + DB | Supabase | Email auth built-in, PostgreSQL, RLS |
| AI | DeepSeek API (deepseek-chat) | User has API key, function calling support |
| Styling | Tailwind CSS v4 | Utility-first, mobile-first easy |
| Animation | Framer Motion | Best-in-class React animation |
| Charts | Recharts | Lightweight, composable |
| Lottie | lottie-react | Success/empty state micro-animations |
| Deploy | Vercel | Free tier, auto CI/CD dari GitHub |

---

## 9. Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only
DEEPSEEK_API_KEY=               # server-side only, tidak expose ke browser
NEXT_PUBLIC_APP_URL=
```

---

## 10. README Structure (submission)

1. What it is & how to run
2. Who it's for & the one job it does well
3. Why this problem & how we know it's worth solving
4. What's already out there & why we built this anyway
5. Scope: in vs out
6. Assumptions made
7. 3 questions for real users
8. How we'd know it's working & what's next
9. How AI was used (where it helped, where it got something wrong)
