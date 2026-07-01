'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InsightCard from './InsightCard'
import MascotOrb from '@/components/landing/MascotOrb'
import type { InsightCard as InsightCardType } from '@/lib/dashboard/insightTypes'
import type { AnalyticsResponse, DailyBarItem, BudgetLinePoint } from '@/app/api/dashboard/analytics/route'

type State = 'idle' | 'loading' | 'loaded' | 'error'

// ── Analytics charts (port from landing page) ────────────────────────────────

function SpendingBarChart({ items }: { items: DailyBarItem[] }) {
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: 44 }}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.04 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              flex: 1,
              height: `${Math.max(item.percent, 4)}%`,
              borderRadius: '3px 3px 2px 2px',
              background: item.isMax ? 'var(--danger)' : 'var(--bg-base)',
              border: `1px solid ${item.isMax ? 'rgba(239,68,68,0.35)' : 'var(--border-light)'}`,
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>
      <div className="flex gap-1.5 mt-1">
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 9,
              color: item.isMax ? 'var(--danger)' : 'var(--text-muted)',
              fontWeight: item.isMax ? 700 : 400,
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function BudgetLineChart({ points }: { points: BudgetLinePoint[] }) {
  const W = 220
  const H = 44
  const sx = (i: number) => (i / (points.length - 1)) * W
  const sy = (v: number) => H - (Math.min(v, 100) / 100) * H
  const vals = points.map(p => p.percent)
  const linePath = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v)}`).join(' ')
  const fillPath = `${linePath} L${sx(vals.length - 1)},${H} L${sx(0)},${H} Z`

  // trend: if last week < first week → spending is going down → success color
  const isImproving = vals[vals.length - 1] <= vals[0]
  const lineColor = isImproving ? 'var(--success)' : 'var(--warning)'
  const gradId = 'budgetgrad-dash'

  return (
    <div>
      <div style={{ position: 'relative', height: H }}>
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0 }}
        >
          <line x1={0} y1={1} x2={W} y2={1} stroke="var(--border)" strokeWidth={1} strokeDasharray="4 3" />
        </svg>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path d={fillPath} fill={`url(#${gradId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} />
          <motion.path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
          {vals.map((v, i) => (
            <motion.circle
              key={i}
              cx={sx(i)}
              cy={sy(v)}
              r={3.5}
              fill={lineColor}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 * i + 0.5, duration: 0.2 }}
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-between mt-1">
        {points.map((p, i) => (
          <span
            key={i}
            style={{
              fontSize: 9,
              color: i === points.length - 1 ? lineColor : 'var(--text-muted)',
              fontWeight: i === points.length - 1 ? 700 : 400,
            }}
          >
            {p.label}
          </span>
        ))}
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>limit</span>
      </div>
    </div>
  )
}

function AnalyticsSection({ data }: { data: AnalyticsResponse }) {
  const [activeChart, setActiveChart] = useState(0)

  const charts = [
    {
      key: 'daily',
      label: 'Pengeluaran Harian',
      sublabel: '7 hari terakhir',
      render: () => <SpendingBarChart items={data.daily_bar} />,
    },
    {
      key: 'budget',
      label: 'Tren Budget',
      sublabel: 'Mingguan bulan ini',
      render: () => <BudgetLineChart points={data.budget_line} />,
    },
  ]

  return (
    <div
      className="mx-4 mt-4 rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      {/* Chart tabs */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border-light)' }}>
        {charts.map((c, i) => (
          <button
            key={c.key}
            onClick={() => setActiveChart(i)}
            className="flex-1 py-2.5 px-3 text-left transition-colors"
            style={{
              background: activeChart === i ? 'var(--accent-dim)' : 'transparent',
              borderRight: i === 0 ? '1px solid var(--border-light)' : 'none',
            }}
          >
            <p
              className="text-[11px] font-semibold"
              style={{ color: activeChart === i ? 'var(--accent-light)' : 'var(--text-secondary)' }}
            >
              {c.label}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{c.sublabel}</p>
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="p-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeChart}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            {!data.has_data ? (
              <p className="text-[11px] text-center py-4" style={{ color: 'var(--text-muted)' }}>
                Belum ada data transaksi bulan ini
              </p>
            ) : (
              charts[activeChart].render()
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Main InsightSection ───────────────────────────────────────────────────────

export default function InsightSection() {
  const [uiState, setUiState] = useState<State>('idle')
  const [insights, setInsights] = useState<InsightCardType[]>([])
  const [generatedAt, setGeneratedAt] = useState<string>('')
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const hasFetchedOnMount = useRef(false)

  const fetchInsights = useCallback(async (forceRefresh = false) => {
    setUiState('loading')
    try {
      const url = forceRefresh ? '/api/dashboard/insight?refresh=1' : '/api/dashboard/insight'
      const res = await fetch(url)
      const data = await res.json()
      if (data.insights?.length > 0) {
        setInsights(data.insights)
        setGeneratedAt(data.generated_at)
        setUiState('loaded')
      } else {
        setUiState('error')
      }
    } catch {
      setUiState('error')
    }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/analytics')
      if (res.ok) setAnalytics(await res.json())
    } catch {
      // non-critical — charts just won't show
    }
  }, [])

  // On mount: restore cached insights from DB (no force-refresh) + load analytics
  useEffect(() => {
    if (hasFetchedOnMount.current) return
    hasFetchedOnMount.current = true
    fetchInsights(false)
    fetchAnalytics()
  }, [fetchInsights, fetchAnalytics])

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
      {/* ── Analytics charts (always visible once loaded) ── */}
      {analytics && <AnalyticsSection data={analytics} />}

      {/* ── AI Insight section ── */}
      <AnimatePresence>
        {uiState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.3 } }}
            className="flex flex-col items-center py-7 gap-4 px-4"
          >
            <MascotOrb state="idle" showBubble={false} inline size={72} />
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
            {/* Header with small orb */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-light)' }}
            >
              <MascotOrb
                state={uiState === 'loading' ? 'excited' : 'happy'}
                showBubble={false}
                inline
                size={40}
              />
              <div className="flex-1">
                <p className="text-[13px]" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
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
    </div>
  )
}
