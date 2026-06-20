'use client'

import { motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { formatDateShort } from '@/lib/utils/date'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TransactionCardData {
  type: 'income' | 'expense'
  amount: number
  category: string
  note?: string
  date?: string
}

export default function TransactionCard({ data }: { data: TransactionCardData }) {
  const isIncome = data.type === 'income'

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-xl overflow-hidden mt-2"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${isIncome ? 'var(--success)' : 'var(--danger)'}`,
      }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: isIncome ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}
            >
              {isIncome ? (
                <TrendingUp size={14} style={{ color: 'var(--success)' }} />
              ) : (
                <TrendingDown size={14} style={{ color: 'var(--danger)' }} />
              )}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {data.category}
              </p>
              {data.note && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {data.note}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p
              className="text-sm font-bold"
              style={{ color: isIncome ? 'var(--success)' : 'var(--danger)' }}
            >
              {isIncome ? '+' : '-'}{formatIDR(data.amount)}
            </p>
            {data.date && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatDateShort(data.date)}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
