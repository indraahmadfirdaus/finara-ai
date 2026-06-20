'use client'

import { motion } from 'framer-motion'
import { formatCompactIDR } from '@/lib/utils/currency'
import { CATEGORY_COLORS } from '@/lib/utils/categories'

interface SpendingBarsProps {
  data: { category: string; amount: number }[]
}

export default function SpendingBars({ data }: SpendingBarsProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
        Belum ada pengeluaran
      </p>
    )
  }

  const max = data[0].amount
  const total = data.reduce((s, d) => s + d.amount, 0)
  const top = data.slice(0, 6)

  return (
    <div className="flex flex-col gap-3">
      {top.map((item, i) => {
        const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0
        const barWidth = max > 0 ? (item.amount / max) * 100 : 0
        const color = CATEGORY_COLORS[item.category] ?? '#6B7280'

        return (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color }}>
                  {pct}%
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatCompactIDR(item.amount)}
                </span>
              </div>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--border-light)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
