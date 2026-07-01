# Dashboard AI Insight — Design Spec
**Date:** 2026-07-01
**Status:** Approved

---

## Overview

Replace the current dashboard (6 data-heavy widgets) with a minimal, AI-powered insight experience. The dashboard becomes a conversation starter, not a data dump. Core philosophy: data goes to AI first, AI translates it into plain-language insight, user immediately understands their financial health.

---

## What Changes

**Removed:** SpendingChartClient, SpendingBars, BalanceTrend, BudgetProgress, RecentTransactions, AssetNetWorth as standalone widgets.

**Kept:** BalanceHero (top card — balance, income, expense for current month).

**Added:** AI Insight section below the hero card. Grafik/visualisasi tetap ada tapi **embedded dalam insight card** yang relevan — bukan widget terpisah. Style mengikuti landing page: pure CSS/SVG animated, compact, kontekstual.

---

## UI Flow

### State 1 — Idle (first visit or no insight yet)
- Orb Finara besar di tengah, animasi float + pulse (identik dengan landing page)
- Tagline: "Finara siap menganalisis keuanganmu"
- Tombol: "✦ Tanya Insight Finara"

### State 2 — Loading (after button tap)
- Orb idle fade out + scale down (0.35s)
- Insight section card muncul fade in (0.4s)
- Header card: orb kecil + "Insight Finara" + "Menganalisis..." + button "↺ Perbarui" (disabled)
- Body: 3 skeleton cards shimmer

### State 3 — Loaded
- Skeleton fade out
- 3–5 insight cards stagger in (delay 90ms per card)
- Header subtitle: "Diperbarui [relative time]"
- Button "↺ Perbarui" re-enabled

### State 4 — Refresh
- Re-enter loading state, cards stagger in again

---

## Insight Card Format

Each card has a **text layer** (AI-generated) + an optional **visualization layer** (data-driven, pure CSS/SVG):

```
[icon 34x34] Title (12px semibold)
             Desc  (11px secondary, max 2 lines)
             [viz]         ← mini chart jika relevan
             [tag pill]    — warning / danger / good / info
```

Tag types:
- `warning` (amber) — spending pattern worth watching
- `danger` (red) — budget kritis, hutang menumpuk
- `good` (green) — goal on track, surplus bulan ini
- `info` (purple) — saran proaktif dari Finara

---

## Visualization per Insight Type

Visualisasi pure CSS/SVG animated — no Recharts. AI return `viz_type` + data numerik, frontend render chart yang sesuai.

### `viz_type: "bar"` — Spending by category
Horizontal bars, lebar animasi dari 0 → persen, warna dari `getCategoryMeta()`.
```
Makanan ████████░░ 40%
Transportasi ████░░░░░░ 22%
Belanja ███░░░░░░░ 15%
```
Dipakai untuk: insight dominasi kategori pengeluaran.

### `viz_type: "progress"` — Budget atau Goal ring/bar
Animated progress bar (seperti `ProgressBar` shared component), warna berubah sesuai persen:
- `< 80%` → accent purple
- `≥ 80%` → warning amber
- `> 100%` → danger red

Dipakai untuk: insight budget hampir habis, goal progress.

### `viz_type: "sparkline"` — Trend harian
SVG path sederhana (polyline), lebar penuh card, tanpa axis. Animated stroke-dashoffset dari 0 → full. Warna hijau jika naik, merah jika turun.
Dipakai untuk: insight tren pengeluaran mingguan.

### `viz_type: "donut"` — Komposisi sederhana (2–3 segmen)
SVG circle dengan `stroke-dasharray` animated. Tanpa legend teks panjang — hanya nilai utama di tengah.
Dipakai untuk: insight rasio income vs expense, atau proporsi satu kategori.

### `viz_type: null` — No viz
Insight yang tidak butuh visual (contoh: saran hutang, insight kualitatif).

---

## DeepSeek Response Schema (updated)

```ts
InsightCard = {
  icon: string
  title: string
  description: string
  tag: 'warning' | 'danger' | 'good' | 'info'
  viz_type: 'bar' | 'progress' | 'sparkline' | 'donut' | null
  viz_data: VizData | null
}

// viz_data per type:
BarData    = { items: { label: string; value: number; percent: number }[] }
ProgressData = { label: string; value: number; max: number; percent: number }
SparklineData = { points: number[] }          // daily totals, max 14 points
DonutData  = { segments: { label: string; value: number; color: string }[]; center_label: string }
```

AI hanya return `viz_type` dan angka-angkanya — tidak pernah generate warna atau SVG path. Frontend yang render.

---

## API: `/api/dashboard/insight`

### Method
`GET` — no body, user from `supabase.auth.getUser()` (or `DEV_USER_ID` fallback).

### Server logic
1. Auth check
2. Fetch in parallel:
   - Transactions bulan ini (amount, type, category, date)
   - Budgets bulan ini (category, limit_amount + computed used)
   - Goals aktif (name, target_amount, current_amount, deadline)
   - Debts unsettled (person, amount, type)
3. Build compact summary object (tidak kirim raw rows ke AI — hanya aggregated)
4. Call DeepSeek `deepseek-chat` dengan system prompt insight analyst
5. Return JSON: `{ insights: InsightCard[], generated_at: string }`

### Summary payload to DeepSeek (tidak raw rows)
```json
{
  "period": "Juli 2026",
  "income": 8500000,
  "expense": 140000,
  "balance": 8360000,
  "expense_by_category": { "Makanan & Minuman": 95000, "Transportasi": 45000 },
  "budgets": [{ "category": "Transportasi", "limit": 600000, "used": 470000, "percent": 78 }],
  "goals": [{ "name": "Dana Darurat", "target": 30000000, "current": 18000000, "percent": 60, "deadline": null }],
  "debts_owed": [{ "person": "Budi", "amount": 250000 }, { "person": "Reza", "amount": 500000 }],
  "debts_lent": [{ "person": "Siti", "amount": 150000 }]
}
```

### DeepSeek system prompt
- Role: analis keuangan pribadi yang komunikatif dan to-the-point
- Output: JSON array 3–5 insight cards
- Each card: `{ icon, title, description, tag }`
- icon: single emoji
- tag: `"warning" | "danger" | "good" | "info"`
- Bahasa Indonesia, casual, max 2 kalimat per desc
- Prioritize actionable insights over observations

### Response schema (Zod validated)
```ts
InsightCard = {
  icon: string       // emoji
  title: string      // max ~50 chars
  description: string // max ~100 chars
  tag: 'warning' | 'danger' | 'good' | 'info'
}
Response = { insights: InsightCard[], generated_at: string }
```

### Error handling
- DeepSeek timeout / parse failure → return `{ insights: [], error: 'gagal menganalisis' }`
- No data (user baru) → return 1 insight card: "Belum ada data cukup, coba catat transaksi pertamamu!"

---

## Frontend Components

### `dashboard/page.tsx`
- Remove all 6 widget imports and their data fetching (spendingChartData, dailyTrend, budgets, recentTransactions, totalAssets, netWorth)
- Keep only: income, expense, balance for BalanceHero
- Add `<InsightSection />` client component below hero

### `components/dashboard/InsightSection.tsx` (new, client)
- Manages state: `'idle' | 'loading' | 'loaded' | 'error'`
- On mount: check `sessionStorage['finara_insight_cache']` — if fresh (<10 min), skip API call, go straight to loaded
- Tap button → fetch `/api/dashboard/insight` → update state
- Refresh → re-fetch, invalidate cache
- Renders: OrbIdle | InsightCard list inside InsightSectionCard

### `components/dashboard/InsightCard.tsx` (new)
- Pure display, receives `InsightCard` props
- Follows existing chat card visual style (bg-elevated, border-light)
- Stagger animation via `animationDelay` prop
- Renders visualization inline based on `viz_type`:
  - `"bar"` → `<InsightBarViz />`
  - `"progress"` → `<ProgressBar />` (shared component, reused)
  - `"sparkline"` → `<InsightSparkline />`
  - `"donut"` → `<InsightDonut />`
  - `null` → nothing

### `components/dashboard/InsightBarViz.tsx` (new)
Pure CSS animated horizontal bars. Animates width from 0 on mount via CSS transition. Colors from `getCategoryMeta()`.

### `components/dashboard/InsightSparkline.tsx` (new)
SVG polyline. Points normalized to viewBox height. `stroke-dashoffset` animation on mount.

### `components/dashboard/InsightDonut.tsx` (new)
SVG circle with `stroke-dasharray`. Animated on mount. Center label via `<text>` element.

### `/api/dashboard/insight/route.ts` (new)
- GET handler
- Full logic as described above

---

## Caching

- Client-side only: `sessionStorage['finara_insight_cache']` = `{ insights, generated_at }`
- TTL: 10 minutes — if fresh, load from cache on mount (no API call)
- Refresh button always bypasses cache
- No server-side caching — data changes frequently

---

## Files Touched

| Action | File |
|---|---|
| Modify | `src/app/(app)/dashboard/page.tsx` |
| Keep (unused for now) | `SpendingChartClient.tsx`, existing dashboard widget files |
| New | `src/components/dashboard/InsightSection.tsx` |
| New | `src/components/dashboard/InsightCard.tsx` |
| New | `src/components/dashboard/InsightBarViz.tsx` |
| New | `src/components/dashboard/InsightSparkline.tsx` |
| New | `src/components/dashboard/InsightDonut.tsx` |
| New | `src/app/api/dashboard/insight/route.ts` |

---

## Out of Scope
- Persist insights to DB (not needed — ephemeral per session)
- Light mode (follows existing CSS vars, no extra work)
- Desktop layout changes (sidebar layout unchanged, insight section fills the same content area)
