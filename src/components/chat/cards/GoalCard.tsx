'use client'

import { motion } from 'framer-motion'
import { Check, Target } from 'lucide-react'
import { formatIDR } from '@/lib/utils/currency'
import ProgressBar from '@/components/shared/ProgressBar'

interface GoalCardData {
  name: string
  target?: number
  target_amount?: number
  current?: number
  current_amount?: number
  percent?: number
  deadline?: string
  _action?: 'created' | 'updated' | 'deleted'
}

export default function GoalCard({ data }: { data: GoalCardData }) {
  const target = data.target ?? data.target_amount ?? 0
  const current = data.current ?? data.current_amount ?? 0
  const percent = data.percent ?? (target > 0 ? (current / target) * 100 : 0)
  const remaining = target - current

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-xl mt-2 overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-stretch">
        {/* Accent left bar */}
        <div className="w-1 flex-shrink-0 rounded-l-xl" style={{ background: 'var(--accent)' }} />

        <div className="flex-1 p-3 pl-4">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-dim)' }}
            >
              <Target size={15} style={{ color: 'var(--accent-light)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {data.name}
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
              {data.deadline && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Deadline: {data.deadline}
                </p>
              )}
            </div>
            <p className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--accent-light)' }}>
              {percent.toFixed(0)}%
            </p>
          </div>

          <ProgressBar percent={percent} height={5} className="mb-2" />

          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>
              {formatIDR(current)} terkumpul
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Kurang {formatIDR(remaining)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
