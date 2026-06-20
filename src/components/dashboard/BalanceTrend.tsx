'use client'

import { motion } from 'framer-motion'
import { formatCompactIDR } from '@/lib/utils/currency'

interface DailyPoint {
  label: string   // "DD MMM"
  expense: number
  income: number
}

interface BalanceTrendProps {
  points: DailyPoint[]
}

function Sparkline({ values, color, W = 400, H = 60 }: { values: number[]; color: string; W?: number; H?: number }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 10) - 5
    return `${x},${y}`
  })
  const polyline = pts.join(' ')
  const fill = `0,${H} ` + polyline + ` ${W},${H}`

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id={`trendgrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#trendgrad-${color.replace('#', '')})`} />
      <polyline
        points={polyline}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default function BalanceTrend({ points }: BalanceTrendProps) {
  if (points.length < 2) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
        Butuh minimal 2 hari data untuk menampilkan tren
      </p>
    )
  }

  const expenses = points.map((p) => p.expense)
  const incomes = points.map((p) => p.income)
  const totalExpense = expenses.reduce((s, v) => s + v, 0)
  const totalIncome = incomes.reduce((s, v) => s + v, 0)

  // Highest single-day expense
  const peakExpIdx = expenses.indexOf(Math.max(...expenses))
  const peakExpDay = points[peakExpIdx]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-col gap-4"
    >
      {/* Summary chips */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Total pengeluaran</p>
          <p className="text-sm font-bold" style={{ color: 'var(--danger)' }}>{formatCompactIDR(totalExpense)}</p>
        </div>
        <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Total pemasukan</p>
          <p className="text-sm font-bold" style={{ color: 'var(--success)' }}>{formatCompactIDR(totalIncome)}</p>
        </div>
      </div>

      {/* Expense trend line */}
      <div>
        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>
          Tren pengeluaran harian
        </p>
        <div className="overflow-hidden rounded-lg">
          <Sparkline values={expenses} color="#EF4444" />
        </div>
        {peakExpDay && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Puncak:{' '}
            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
              {peakExpDay.label} — {formatCompactIDR(peakExpDay.expense)}
            </span>
          </p>
        )}
      </div>

      {/* Income trend line */}
      <div>
        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>
          Tren pemasukan harian
        </p>
        <div className="overflow-hidden rounded-lg">
          <Sparkline values={incomes} color="#22C55E" />
        </div>
      </div>

      {/* X-axis labels — first, mid, last */}
      <div className="flex justify-between">
        {[0, Math.floor(points.length / 2), points.length - 1].map((idx) => (
          <span key={idx} className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {points[idx]?.label ?? ''}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
