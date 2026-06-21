'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { formatIDR } from '@/lib/utils/currency'
import ProgressBar from '@/components/shared/ProgressBar'
import { getCategoryMeta } from '@/lib/utils/categoryIcon'

interface BudgetCardData {
  category: string
  limit?: number
  limit_amount?: number
  used?: number
  percent?: number
  _action?: 'created' | 'updated' | 'deleted'
}

export default function BudgetCard({ data }: { data: BudgetCardData }) {
  const limit = data.limit ?? data.limit_amount ?? 0
  const used = data.used ?? 0
  const percent = data.percent ?? (limit > 0 ? (used / limit) * 100 : 0)
  const remaining = limit - used
  const isOver = remaining < 0
  const { color } = getCategoryMeta(data.category, 'expense')

  const barColor = isOver ? 'var(--danger)' : percent >= 80 ? '#FBBF24' : color
  const accentColor = isOver ? 'var(--danger)' : color

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="rounded-xl mt-2 overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-stretch">
        {/* Accent left bar */}
        <div className="w-1 flex-shrink-0 rounded-l-xl" style={{ background: accentColor }} />

        <div className="flex-1 p-3 pl-4">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {data.category}
                </p>
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
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Limit {formatIDR(limit)}
              </p>
            </div>
            <p
              className="text-sm font-bold flex-shrink-0"
              style={{ color: barColor }}
            >
              {percent.toFixed(0)}%
            </p>
          </div>

          <ProgressBar percent={percent} height={5} className="mb-2" color={barColor} />

          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>
              Terpakai {formatIDR(used)}
            </span>
            <span style={{ color: isOver ? 'var(--danger)' : 'var(--text-secondary)' }}>
              {isOver ? `Over ${formatIDR(Math.abs(remaining))}` : `Sisa ${formatIDR(remaining)}`}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
