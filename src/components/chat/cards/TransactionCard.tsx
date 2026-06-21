'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { formatIDR } from '@/lib/utils/currency'
import { formatDateShort } from '@/lib/utils/date'

interface TransactionCardData {
  id?: string
  type: 'income' | 'expense'
  amount: number
  category: string
  note?: string
  date?: string
  _action?: 'created' | 'updated' | 'deleted'
}

export default function TransactionCard({ data }: { data: TransactionCardData }) {
  const isIncome = data.type === 'income'
  const accentColor = isIncome ? 'var(--success)' : 'var(--danger)'
  const borderColor = isIncome ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'

  return (
    <motion.div
      initial={{ y: 10, opacity: 0, scale: 0.97 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="mt-2 px-3 py-2.5 rounded-2xl flex items-center gap-3"
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      {/* Label + note */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {data.note || data.category}
          </p>
          {data._action && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5"
              style={{
                background: data._action === 'deleted' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                color: data._action === 'deleted' ? 'var(--danger)' : 'var(--success)',
              }}
            >
              <Check size={8} />
              {data._action === 'created' ? 'Dicatat' : data._action === 'updated' ? 'Diperbarui' : 'Dihapus'}
            </span>
          )}
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {data.category}{data.date ? ` · ${formatDateShort(data.date)}` : ''}
        </p>
      </div>

      {/* Amount */}
      <p
        className="text-xs font-bold flex-shrink-0"
        style={{
          color: data._action === 'deleted' ? 'var(--text-muted)' : accentColor,
          textDecoration: data._action === 'deleted' ? 'line-through' : 'none',
        }}
      >
        {isIncome ? '+' : '-'}{formatIDR(data.amount)}
      </p>
    </motion.div>
  )
}
