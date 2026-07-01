# Dashboard AI Insight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 6-widget dashboard with an AI-powered insight feed — balance hero stays, everything else becomes a DeepSeek-generated insight card with embedded animated CSS/SVG visualizations.

**Architecture:** A new GET `/api/dashboard/insight` route aggregates DB data into a compact summary, sends it to DeepSeek, and returns 3–5 typed insight cards (each with `viz_type` + `viz_data`). The client `InsightSection` component manages idle → loading → loaded state transitions with orb animation. Visualizations are pure CSS/SVG, rendered per `viz_type` by dedicated sub-components.

**Tech Stack:** Next.js 16, DeepSeek via OpenAI SDK, Supabase SSR, Zod v4, Framer Motion v12, pure CSS/SVG (no Recharts)

## Global Constraints

- Never hardcode hex colors — use CSS vars (`var(--accent)`, `var(--text-primary)`, etc.)
- All amounts stored/passed as `bigint`/`number` integers — no floats
- Auth: always `supabase.auth.getUser()` server-side; DEV fallback: `process.env.NEXT_PUBLIC_DEV_BYPASS === 'true'` → use `process.env.DEV_USER_ID`
- No `middleware.ts` — auth guard lives in `src/proxy.ts`
- Card entry animation: spring `stiffness: 300, damping: 22`
- Stagger delay: 90ms per card
- All new client components: `'use client'` at top
- `npx tsc --noEmit` must pass after every task

---

## File Map

| Status | File | Responsibility |
|---|---|---|
| New | `src/app/api/dashboard/insight/route.ts` | GET handler: fetch DB → build summary → call DeepSeek → return validated InsightCard[] |
| New | `src/lib/dashboard/insightTypes.ts` | Shared TS types: InsightCard, VizData variants, API response |
| New | `src/components/dashboard/InsightSection.tsx` | State machine (idle/loading/loaded/error), sessionStorage cache, renders orb + card list |
| New | `src/components/dashboard/InsightCard.tsx` | Single insight card: icon + text + viz + tag pill |
| New | `src/components/dashboard/InsightBarViz.tsx` | CSS animated horizontal bar chart |
| New | `src/components/dashboard/InsightSparkline.tsx` | SVG polyline sparkline, stroke-dashoffset animation |
| New | `src/components/dashboard/InsightDonut.tsx` | SVG donut with animated stroke-dasharray |
| Modify | `src/app/(app)/dashboard/page.tsx` | Strip 6 widgets + extra fetches, add `<InsightSection />` |

---

## Task 1: Shared Types

**Files:**
- Create: `src/lib/dashboard/insightTypes.ts`

**Interfaces:**
- Produces: `InsightCard`, `BarData`, `ProgressData`, `SparklineData`, `DonutData`, `InsightResponse` — used by Tasks 2, 3, 4

- [ ] **Step 1: Create the types file**

```ts
// src/lib/dashboard/insightTypes.ts

export type InsightTag = 'warning' | 'danger' | 'good' | 'info'
export type VizType = 'bar' | 'progress' | 'sparkline' | 'donut' | null

export interface BarItem {
  label: string
  value: number
  percent: number
}
export interface BarData {
  items: BarItem[]
}

export interface ProgressData {
  label: string
  value: number
  max: number
  percent: number
}

export interface SparklineData {
  points: number[]
}

export interface DonutSegment {
  label: string
  value: number
  color: string
}
export interface DonutData {
  segments: DonutSegment[]
  center_label: string
}

export type VizData = BarData | ProgressData | SparklineData | DonutData

export interface InsightCard {
  icon: string
  title: string
  description: string
  tag: InsightTag
  viz_type: VizType
  viz_data: VizData | null
}

export interface InsightResponse {
  insights: InsightCard[]
  generated_at: string
  error?: string
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/dashboard/insightTypes.ts
git commit -m "feat(dashboard): add shared insight types"
```

---

## Task 2: API Route — `/api/dashboard/insight`

**Files:**
- Create: `src/app/api/dashboard/insight/route.ts`

**Interfaces:**
- Consumes: `InsightCard`, `InsightResponse` from `src/lib/dashboard/insightTypes.ts`
- Consumes: `getDeepseekClient()` from `src/lib/deepseek/client.ts`
- Consumes: `createClient()` from `src/lib/supabase/server.ts`
- Consumes: `getPeriodRange`, `getMonthKey` from `src/lib/utils/date.ts`
- Produces: `GET /api/dashboard/insight` → `InsightResponse` JSON

- [ ] **Step 1: Create the route file**

```ts
// src/app/api/dashboard/insight/route.ts
import { createClient } from '@/lib/supabase/server'
import { getDeepseekClient } from '@/lib/deepseek/client'
import { getPeriodRange, getMonthKey } from '@/lib/utils/date'
import type { InsightCard, InsightResponse } from '@/lib/dashboard/insightTypes'

const SYSTEM_PROMPT = `Kamu adalah analis keuangan pribadi yang komunikatif dan to-the-point.
User memberikanmu ringkasan data keuangan bulan ini.
Tugasmu: hasilkan 3-5 insight yang paling actionable dan relevan.

PENTING — balas HANYA dengan JSON array valid, tidak ada teks lain sebelum atau sesudah:
[
  {
    "icon": "<emoji tunggal>",
    "title": "<max 50 karakter>",
    "description": "<max 100 karakter, 1-2 kalimat, bahasa Indonesia casual>",
    "tag": "<warning|danger|good|info>",
    "viz_type": "<bar|progress|sparkline|donut|null>",
    "viz_data": <object sesuai viz_type, atau null>
  }
]

Aturan viz_data per viz_type:
- "bar": { "items": [{ "label": string, "value": number, "percent": number }] } — max 5 items, sorted descending
- "progress": { "label": string, "value": number, "max": number, "percent": number }
- "sparkline": { "points": [number] } — array angka harian, max 14 points, urutan lama ke baru
- "donut": { "segments": [{ "label": string, "value": number, "color": "green"|"red"|"purple"|"amber" }], "center_label": string } — max 3 segments
- null: viz_data harus null

Tag rules:
- "danger": budget > 85%, hutang menumpuk, pengeluaran > income
- "warning": budget 60-85%, satu kategori dominan >35% pengeluaran
- "good": goal on track, income surplus besar, hutang terlunasi
- "info": saran proaktif, observasi menarik

Prioritaskan insight yang membutuhkan tindakan user. Jangan ulangi topik yang sama.`

function buildSummary(
  txRows: { amount: number; type: string; category: string; date: string }[],
  budgetRows: { category: string; limit_amount: number }[],
  goalRows: { name: string; target_amount: number; current_amount: number; deadline: string | null }[],
  debtRows: { person: string; amount: number; type: string }[],
  period: string,
) {
  const income = txRows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const expense = txRows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  const expenseByCategory: Record<string, number> = {}
  txRows.filter(r => r.type === 'expense').forEach(r => {
    expenseByCategory[r.category] = (expenseByCategory[r.category] ?? 0) + r.amount
  })

  // Daily expense for sparkline (last 14 days)
  const dailyMap: Record<string, number> = {}
  txRows.filter(r => r.type === 'expense').forEach(r => {
    dailyMap[r.date] = (dailyMap[r.date] ?? 0) + r.amount
  })
  const dailyPoints = Object.entries(dailyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([, v]) => v)

  const budgets = budgetRows.map(b => ({
    category: b.category,
    limit: b.limit_amount,
    used: expenseByCategory[b.category] ?? 0,
    percent: b.limit_amount > 0
      ? Math.round(((expenseByCategory[b.category] ?? 0) / b.limit_amount) * 100)
      : 0,
  }))

  const goals = goalRows.map(g => ({
    name: g.name,
    target: g.target_amount,
    current: g.current_amount,
    percent: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
    deadline: g.deadline,
  }))

  return {
    period,
    income,
    expense,
    balance: income - expense,
    expense_by_category: expenseByCategory,
    daily_expense_points: dailyPoints,
    budgets,
    goals,
    debts_owed: debtRows.filter(d => d.type === 'owe').map(d => ({ person: d.person, amount: d.amount })),
    debts_lent: debtRows.filter(d => d.type === 'lent').map(d => ({ person: d.person, amount: d.amount })),
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userId = user?.id ?? (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true' ? process.env.DEV_USER_ID : null)
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const range = getPeriodRange('month')
  const month = getMonthKey()
  // e.g. "Juli 2026"
  const period = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  const [txResult, budgetResult, goalResult, debtResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, category, date')
      .eq('user_id', userId)
      .gte('date', range.start)
      .lte('date', range.end)
      .is('deleted_at', null),
    supabase
      .from('budgets')
      .select('category, limit_amount')
      .eq('user_id', userId)
      .eq('month', month)
      .is('deleted_at', null),
    supabase
      .from('goals')
      .select('name, target_amount, current_amount, deadline')
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('debts')
      .select('person, amount, type')
      .eq('user_id', userId)
      .eq('settled', false),
  ])

  const txRows = txResult.data ?? []
  const budgetRows = budgetResult.data ?? []
  const goalRows = goalResult.data ?? []
  const debtRows = debtResult.data ?? []

  // No data → return helpful empty state card
  if (txRows.length === 0 && goalRows.length === 0 && debtRows.length === 0) {
    const emptyResponse: InsightResponse = {
      insights: [{
        icon: '👋',
        title: 'Belum ada data keuangan',
        description: 'Mulai catat transaksi pertamamu di Chat, dan Finara siap menganalisis keuanganmu!',
        tag: 'info',
        viz_type: null,
        viz_data: null,
      }],
      generated_at: new Date().toISOString(),
    }
    return Response.json(emptyResponse)
  }

  const summary = buildSummary(txRows, budgetRows, goalRows, debtRows, period)

  try {
    const client = getDeepseekClient()
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(summary) },
      ],
      temperature: 0.4,
      max_tokens: 1200,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]'
    // Strip markdown code fences if DeepSeek wraps in ```json
    const cleaned = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    const parsed: InsightCard[] = JSON.parse(cleaned)

    const response: InsightResponse = {
      insights: parsed.slice(0, 5),
      generated_at: new Date().toISOString(),
    }
    return Response.json(response)
  } catch {
    return Response.json({
      insights: [],
      generated_at: new Date().toISOString(),
      error: 'Finara gagal menganalisis saat ini, coba lagi.',
    } satisfies InsightResponse)
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Smoke test via curl**

```bash
# Start dev server first, then:
curl -s http://localhost:3000/api/dashboard/insight | python3 -m json.tool | head -40
```
Expected: JSON with `insights` array and `generated_at`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/dashboard/insight/route.ts
git commit -m "feat(dashboard): add /api/dashboard/insight GET route"
```

---

## Task 3: Visualization Sub-Components

**Files:**
- Create: `src/components/dashboard/InsightBarViz.tsx`
- Create: `src/components/dashboard/InsightSparkline.tsx`
- Create: `src/components/dashboard/InsightDonut.tsx`

**Interfaces:**
- Consumes: `BarData`, `SparklineData`, `DonutData` from `src/lib/dashboard/insightTypes.ts`
- Consumes: `getCategoryMeta` from `src/lib/utils/categoryIcon.tsx` (InsightBarViz only)
- Produces: `<InsightBarViz data={BarData} />`, `<InsightSparkline data={SparklineData} />`, `<InsightDonut data={DonutData} />` — used by Task 4

- [ ] **Step 1: Create InsightBarViz**

```tsx
// src/components/dashboard/InsightBarViz.tsx
'use client'

import { useEffect, useRef } from 'react'
import { getCategoryMeta } from '@/lib/utils/categoryIcon'
import { formatCompactIDR } from '@/lib/utils/currency'
import type { BarData } from '@/lib/dashboard/insightTypes'

export default function InsightBarViz({ data }: { data: BarData }) {
  const barsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    // animate width from 0 → target after mount
    const timers = barsRef.current.map((el, i) =>
      setTimeout(() => {
        if (el) el.style.width = `${data.items[i]?.percent ?? 0}%`
      }, i * 60),
    )
    return () => timers.forEach(clearTimeout)
  }, [data.items])

  return (
    <div className="mt-3 flex flex-col gap-2">
      {data.items.map((item, i) => {
        const meta = getCategoryMeta(item.label, 'expense')
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {item.label}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {item.percent}%
              </span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 5, background: 'var(--bg-base)' }}
            >
              <div
                ref={el => { if (el) barsRef.current[i] = el }}
                className="h-full rounded-full"
                style={{
                  width: '0%',
                  background: meta.color,
                  transition: `width 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create InsightSparkline**

```tsx
// src/components/dashboard/InsightSparkline.tsx
'use client'

import { useEffect, useRef } from 'react'
import type { SparklineData } from '@/lib/dashboard/insightTypes'

export default function InsightSparkline({ data }: { data: SparklineData }) {
  const pathRef = useRef<SVGPolylineElement>(null)

  const points = data.points
  if (points.length < 2) return null

  const W = 300
  const H = 48
  const pad = 4
  const max = Math.max(...points, 1)
  const min = Math.min(...points)
  const range = max - min || 1

  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return `${x},${y}`
  })
  const polylinePoints = coords.join(' ')

  // Determine trend color: last point vs first
  const isUp = points[points.length - 1] <= points[0]
  const strokeColor = isUp ? 'var(--success)' : 'var(--danger)'

  useEffect(() => {
    const el = pathRef.current
    if (!el) return
    const len = el.getTotalLength?.() ?? 300
    el.style.strokeDasharray = `${len}`
    el.style.strokeDashoffset = `${len}`
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)'
      el.style.strokeDashoffset = '0'
    })
  }, [])

  return (
    <div className="mt-3 w-full overflow-hidden rounded-lg" style={{ background: 'var(--bg-base)' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 48, display: 'block' }}
        preserveAspectRatio="none"
      >
        <polyline
          ref={pathRef}
          points={polylinePoints}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
```

- [ ] **Step 3: Create InsightDonut**

```tsx
// src/components/dashboard/InsightDonut.tsx
'use client'

import { useEffect, useRef } from 'react'
import type { DonutData } from '@/lib/dashboard/insightTypes'

const COLOR_MAP: Record<string, string> = {
  green: 'var(--success)',
  red: 'var(--danger)',
  purple: 'var(--accent)',
  amber: 'var(--warning)',
}

export default function InsightDonut({ data }: { data: DonutData }) {
  const circleRefs = useRef<(SVGCircleElement | null)[]>([])

  const R = 36
  const cx = 48
  const cy = 48
  const circumference = 2 * Math.PI * R

  const total = data.segments.reduce((s, seg) => s + seg.value, 0) || 1
  let cumPercent = 0

  useEffect(() => {
    circleRefs.current.forEach((el, i) => {
      if (!el) return
      const seg = data.segments[i]
      const pct = seg.value / total
      const dash = pct * circumference
      el.style.strokeDasharray = `0 ${circumference}`
      setTimeout(() => {
        el.style.transition = 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)'
        el.style.strokeDasharray = `${dash} ${circumference - dash}`
      }, i * 150)
    })
  }, [data.segments, circumference, total])

  return (
    <div className="mt-3 flex items-center gap-4">
      <div style={{ width: 96, height: 96, flexShrink: 0 }}>
        <svg viewBox="0 0 96 96" style={{ width: 96, height: 96, transform: 'rotate(-90deg)' }}>
          {/* background track */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--bg-base)" strokeWidth="10" />
          {data.segments.map((seg, i) => {
            const offset = cumPercent * circumference
            cumPercent += seg.value / total
            return (
              <circle
                key={i}
                ref={el => { circleRefs.current[i] = el }}
                cx={cx} cy={cy} r={R}
                fill="none"
                stroke={COLOR_MAP[seg.color] ?? 'var(--accent)'}
                strokeWidth="10"
                strokeDasharray={`0 ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            )
          })}
          {/* center label — rotate back to upright */}
          <text
            x={cx} y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: 13,
              fontWeight: 700,
              fill: 'var(--text-primary)',
              transform: 'rotate(90deg)',
              transformOrigin: `${cx}px ${cy}px`,
            }}
          >
            {data.center_label}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5">
        {data.segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: COLOR_MAP[seg.color] ?? 'var(--accent)' }}
            />
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/InsightBarViz.tsx \
        src/components/dashboard/InsightSparkline.tsx \
        src/components/dashboard/InsightDonut.tsx
git commit -m "feat(dashboard): add insight visualization components (bar, sparkline, donut)"
```

---

## Task 4: InsightCard Component

**Files:**
- Create: `src/components/dashboard/InsightCard.tsx`

**Interfaces:**
- Consumes: `InsightCard` type from `src/lib/dashboard/insightTypes.ts`
- Consumes: `<InsightBarViz />`, `<InsightSparkline />`, `<InsightDonut />` from Task 3
- Consumes: `<ProgressBar />` from `src/components/shared/ProgressBar.tsx`
- Produces: `<InsightCard card={InsightCard} index={number} />` — used by Task 5

- [ ] **Step 1: Create InsightCard**

```tsx
// src/components/dashboard/InsightCard.tsx
'use client'

import { motion } from 'framer-motion'
import ProgressBar from '@/components/shared/ProgressBar'
import InsightBarViz from './InsightBarViz'
import InsightSparkline from './InsightSparkline'
import InsightDonut from './InsightDonut'
import type { InsightCard as InsightCardType, BarData, ProgressData, SparklineData, DonutData } from '@/lib/dashboard/insightTypes'

const TAG_STYLES = {
  warning: { bg: 'rgba(251,183,36,0.12)', color: '#FBB724', label: 'Perlu perhatian' },
  danger:  { bg: 'rgba(239,68,68,0.12)',  color: 'var(--danger)',  label: 'Kritis' },
  good:    { bg: 'rgba(34,197,94,0.12)',  color: 'var(--success)', label: 'Bagus' },
  info:    { bg: 'rgba(124,92,252,0.12)', color: 'var(--accent-light)', label: 'Insight' },
}

const ACCENT_BAR_COLOR = {
  warning: '#FBB724',
  danger:  'var(--danger)',
  good:    'var(--success)',
  info:    'var(--accent)',
}

interface Props {
  card: InsightCardType
  index: number
}

export default function InsightCard({ card, index }: Props) {
  const tag = TAG_STYLES[card.tag]
  const accentColor = ACCENT_BAR_COLOR[card.tag]

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22, delay: index * 0.09 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}
    >
      <div className="flex items-stretch">
        {/* Accent left bar */}
        <div className="w-1 flex-shrink-0 rounded-l-xl" style={{ background: accentColor }} />

        {/* Content */}
        <div className="flex-1 p-3 pl-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
              style={{ background: tag.bg }}
            >
              {card.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {card.title}
              </p>
              <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {card.description}
              </p>

              {/* Visualization */}
              {card.viz_type === 'bar' && card.viz_data && (
                <InsightBarViz data={card.viz_data as BarData} />
              )}
              {card.viz_type === 'sparkline' && card.viz_data && (
                <InsightSparkline data={card.viz_data as SparklineData} />
              )}
              {card.viz_type === 'donut' && card.viz_data && (
                <InsightDonut data={card.viz_data as DonutData} />
              )}
              {card.viz_type === 'progress' && card.viz_data && (() => {
                const d = card.viz_data as ProgressData
                const color = d.percent >= 85 ? 'var(--danger)' : d.percent >= 60 ? 'var(--warning)' : 'var(--accent)'
                return (
                  <div className="mt-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
                      <span className="text-[11px] font-semibold" style={{ color }}>{d.percent}%</span>
                    </div>
                    <ProgressBar percent={d.percent} height={5} color={color} />
                  </div>
                )
              })()}

              {/* Tag pill */}
              <span
                className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: tag.bg, color: tag.color }}
              >
                {tag.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/InsightCard.tsx
git commit -m "feat(dashboard): add InsightCard component with embedded visualizations"
```

---

## Task 5: InsightSection Component

**Files:**
- Create: `src/components/dashboard/InsightSection.tsx`

**Interfaces:**
- Consumes: `InsightCard` type + `InsightResponse` from `src/lib/dashboard/insightTypes.ts`
- Consumes: `<InsightCard />` from Task 4
- Produces: `<InsightSection />` (no props) — used by Task 6

- [ ] **Step 1: Create InsightSection**

```tsx
// src/components/dashboard/InsightSection.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InsightCard from './InsightCard'
import type { InsightCard as InsightCardType } from '@/lib/dashboard/insightTypes'

type State = 'idle' | 'loading' | 'loaded' | 'error'

const CACHE_KEY = 'finara_insight_cache'
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface Cache {
  insights: InsightCardType[]
  generated_at: string
  cached_at: number
}

function loadCache(): Cache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache: Cache = JSON.parse(raw)
    if (Date.now() - cache.cached_at > CACHE_TTL_MS) return null
    return cache
  } catch {
    return null
  }
}

function saveCache(insights: InsightCardType[], generated_at: string) {
  try {
    const cache: Cache = { insights, generated_at, cached_at: Date.now() }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

export default function InsightSection() {
  const [uiState, setUiState] = useState<State>('idle')
  const [insights, setInsights] = useState<InsightCardType[]>([])
  const [generatedAt, setGeneratedAt] = useState<string>('')

  // On mount: check cache
  useEffect(() => {
    const cache = loadCache()
    if (cache) {
      setInsights(cache.insights)
      setGeneratedAt(cache.generated_at)
      setUiState('loaded')
    }
  }, [])

  const fetchInsights = useCallback(async (bypassCache = false) => {
    if (!bypassCache) {
      const cache = loadCache()
      if (cache) {
        setInsights(cache.insights)
        setGeneratedAt(cache.generated_at)
        setUiState('loaded')
        return
      }
    }

    setUiState('loading')
    try {
      const res = await fetch('/api/dashboard/insight')
      const data = await res.json()
      if (data.insights?.length > 0) {
        setInsights(data.insights)
        setGeneratedAt(data.generated_at)
        saveCache(data.insights, data.generated_at)
        setUiState('loaded')
      } else {
        setUiState('error')
      }
    } catch {
      setUiState('error')
    }
  }, [])

  const relativeTime = (iso: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
      if (diff < 60) return 'Baru saja'
      if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
      return `${Math.floor(diff / 3600)} jam lalu`
    } catch {
      return 'Baru saja'
    }
  }

  return (
    <div>
      {/* ── IDLE STATE: Orb besar ── */}
      <AnimatePresence>
        {uiState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.3 } }}
            className="flex flex-col items-center py-7 gap-4 px-4"
          >
            {/* Orb */}
            <div className="relative w-[88px] h-[88px] flex items-center justify-center">
              {/* Pulse rings */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(124,92,252,0.25) 0%, transparent 70%)',
                  animation: 'orbPulse 3s ease-in-out infinite',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  inset: -8,
                  background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
                  animation: 'orbPulse 3s ease-in-out infinite 0.8s',
                }}
              />
              {/* Core */}
              <div
                className="relative z-10 w-[60px] h-[60px] rounded-full flex items-center justify-center text-xl"
                style={{
                  background: 'linear-gradient(135deg, #7C5CFC 0%, #A78BFA 55%, #6B46FC 100%)',
                  boxShadow: '0 0 0 1px rgba(124,92,252,0.5), 0 10px 40px rgba(124,92,252,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
                  animation: 'orbFloat 4s ease-in-out infinite',
                }}
              >
                ✦
              </div>
            </div>

            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Finara siap menganalisis keuanganmu
            </p>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => fetchInsights(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(167,139,250,0.1))',
                border: '1px solid rgba(124,92,252,0.4)',
                color: 'var(--accent-light)',
                boxShadow: '0 2px 16px rgba(124,92,252,0.15)',
              }}
            >
              <span>✦</span>
              Tanya Insight Finara
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LOADING + LOADED STATE: insight card wrapper ── */}
      <AnimatePresence>
        {(uiState === 'loading' || uiState === 'loaded' || uiState === 'error') && (
          <motion.div
            key="section"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-4 mt-5 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {/* Header: orb kecil */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-light)' }}
            >
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #7C5CFC, #A78BFA)',
                  boxShadow: '0 4px 16px rgba(124,92,252,0.4)',
                }}
              >
                ✦
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: -3,
                    border: '1px solid rgba(124,92,252,0.35)',
                    animation: 'ringPulse 2.5s ease-in-out infinite',
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-700" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  Insight Finara
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {uiState === 'loading' ? 'Menganalisis...' : relativeTime(generatedAt)}
                </p>
              </div>
              <button
                onClick={() => fetchInsights(true)}
                disabled={uiState === 'loading'}
                className="text-[11px] font-semibold px-3 py-1 rounded-full"
                style={{
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(124,92,252,0.25)',
                  color: uiState === 'loading' ? 'var(--text-muted)' : 'var(--accent-light)',
                  cursor: uiState === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: uiState === 'loading' ? 0.5 : 1,
                }}
              >
                ↺ Perbarui
              </button>
            </div>

            {/* Skeleton */}
            {uiState === 'loading' && (
              <div className="p-3 flex flex-col gap-2">
                {[70, 90, 60].map((w, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 flex gap-3"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 shimmer" />
                    <div className="flex-1 flex flex-col gap-2 pt-1">
                      <div className="h-2.5 rounded shimmer" style={{ width: `${w}%` }} />
                      <div className="h-2 rounded shimmer" style={{ width: '88%' }} />
                      <div className="h-2 rounded shimmer" style={{ width: '55%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loaded cards */}
            {uiState === 'loaded' && (
              <div className="p-3 flex flex-col gap-2">
                {insights.map((card, i) => (
                  <InsightCard key={i} card={card} index={i} />
                ))}
              </div>
            )}

            {/* Error */}
            {uiState === 'error' && (
              <div className="p-6 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Finara gagal menganalisis saat ini.
                </p>
                <button
                  onClick={() => fetchInsights(true)}
                  className="mt-3 text-xs font-semibold"
                  style={{ color: 'var(--accent-light)' }}
                >
                  Coba lagi
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyframes injected inline for orb animations */}
      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.2); opacity: 0.3; }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/InsightSection.tsx
git commit -m "feat(dashboard): add InsightSection with idle/loading/loaded states and orb transition"
```

---

## Task 6: Simplify Dashboard Page

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `<InsightSection />` from Task 5
- Consumes: `<BalanceHero />` (existing)
- Removes: all 6 widget imports and their data fetches from `getDashboardData()`

- [ ] **Step 1: Replace dashboard/page.tsx**

```tsx
// src/app/(app)/dashboard/page.tsx
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getPeriodRange } from '@/lib/utils/date'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import BalanceHero from '@/components/dashboard/BalanceHero'
import InsightSection from '@/components/dashboard/InsightSection'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userId = user?.id ?? (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true' ? process.env.DEV_USER_ID : null)
  if (!userId) return null

  const range = getPeriodRange('month')

  const { data: txRows } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', userId)
    .gte('date', range.start)
    .lte('date', range.end)
    .is('deleted_at', null)

  const rows = txRows ?? []
  const income = rows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  return { income, expense, balance: income - expense }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <PageTransition>
      <TopBar title="Dashboard" />

      <div className="hidden lg:flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bulan ini</p>
      </div>

      <div className="pb-24 lg:p-6 lg:max-w-2xl lg:mx-auto">
        <div className="lg:mb-4">
          <BalanceHero
            income={data?.income ?? 0}
            expense={data?.expense ?? 0}
            balance={data?.balance ?? 0}
          />
        </div>
        <InsightSection />
      </div>
    </PageTransition>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Manual verification**

Start dev server and open `http://localhost:3000/dashboard`:
1. Balance hero card muncul di atas
2. Orb Finara besar di bawahnya dengan animasi float + pulse
3. Tap "Tanya Insight Finara" → orb fade out → insight section muncul → skeleton 3 cards → insight cards stagger in
4. Setiap insight card dengan `viz_type` menampilkan chart embedded
5. Tombol "↺ Perbarui" berfungsi → re-trigger loading → cards baru muncul
6. Refresh browser → cache valid (<10 mnt) → langsung loaded tanpa API call

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(dashboard): replace widget grid with AI insight section"
```
