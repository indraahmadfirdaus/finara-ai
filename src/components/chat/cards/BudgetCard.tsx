'use client'

import { motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import ProgressBar from '@/components/shared/ProgressBar'

interface BudgetCardData {
  category: string
  limit: number
  used: number
  percent: number
}

export default function BudgetCard({ data }: { data: BudgetCardData }) {
  const percent = data.percent ?? (data.limit > 0 ? (data.used / data.limit) * 100 : 0)
  const remaining = data.limit - data.used
  const isOver = remaining < 0

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-xl mt-2 overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Budget {data.category}
          </p>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {percent.toFixed(0)}%
          </p>
        </div>
        <ProgressBar percent={percent} height={5} className="mb-2" />
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>
            Terpakai {formatIDR(data.used)} dari {formatIDR(data.limit)}
          </span>
          <span style={{ color: isOver ? 'var(--danger)' : 'var(--text-secondary)' }}>
            {isOver ? `Over ${formatIDR(Math.abs(remaining))}` : `Sisa ${formatIDR(remaining)}`}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
