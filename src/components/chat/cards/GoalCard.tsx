'use client'

import { motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { Target } from 'lucide-react'
import ProgressBar from '@/components/shared/ProgressBar'

interface GoalCardData {
  name: string
  target: number
  current: number
  percent: number
  deadline?: string
}

export default function GoalCard({ data }: { data: GoalCardData }) {
  const percent = data.percent ?? (data.target > 0 ? (data.current / data.target) * 100 : 0)
  const remaining = data.target - data.current

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-xl mt-2 overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-dim)' }}
          >
            <Target size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {data.name}
            </p>
            {data.deadline && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Deadline: {data.deadline}
              </p>
            )}
          </div>
          <p className="text-sm font-bold ml-auto" style={{ color: 'var(--accent)' }}>
            {percent.toFixed(0)}%
          </p>
        </div>
        <ProgressBar percent={percent} height={5} className="mb-2" />
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>
            {formatIDR(data.current)} terkumpul
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Kurang {formatIDR(remaining)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
