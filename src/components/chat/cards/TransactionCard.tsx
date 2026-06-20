'use client'

import { motion } from 'framer-motion'
import { Check, Trash2 } from 'lucide-react'
import { formatIDR } from '@/lib/utils/currency'
import { formatDateShort } from '@/lib/utils/date'
import { getCategoryMeta } from '@/lib/utils/categoryIcon'

interface TransactionCardData {
  id?: string
  type: 'income' | 'expense'
  amount: number
  category: string
  note?: string
  date?: string
  // action label shown as a badge — set by AI response parser
  _action?: 'created' | 'updated' | 'deleted'
}

export default function TransactionCard({ data }: { data: TransactionCardData }) {
  const isIncome = data.type === 'income'
  const { icon: Icon, bg, color } = getCategoryMeta(data.category, data.type)

  const accentColor = isIncome ? 'var(--success)' : 'var(--danger)'

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="flex items-center rounded-xl overflow-hidden mt-2"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      {/* Accent left bar */}
      <div className="w-1 self-stretch flex-shrink-0" style={{ background: accentColor }} />

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-4 mr-3 my-3"
        style={{ background: bg }}
      >
        {data._action === 'deleted' ? (
          <Trash2 size={15} style={{ color: 'var(--danger)' }} />
        ) : (
          <Icon size={15} style={{ color }} />
        )}
      </div>

      {/* Category + note */}
      <div className="flex-1 min-w-0 py-3">
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
              {data._action === 'created' ? 'Dicatat' : data._action === 'updated' ? 'Diperbarui' : 'Dihapus'}
            </span>
          )}
        </div>
        {data.note && (
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {data.note}
          </p>
        )}
      </div>

      {/* Amount + date */}
      <div className="text-right flex-shrink-0 py-3 pr-4">
        <p
          className="text-sm font-bold leading-tight"
          style={{
            color: data._action === 'deleted' ? 'var(--text-muted)' : accentColor,
            textDecoration: data._action === 'deleted' ? 'line-through' : 'none',
          }}
        >
          {isIncome ? '+' : '-'}{formatIDR(data.amount)}
        </p>
        {data.date && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {formatDateShort(data.date)}
          </p>
        )}
      </div>
    </motion.div>
  )
}
