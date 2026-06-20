'use client'

import { motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { User } from 'lucide-react'

interface DebtCardData {
  person: string
  amount: number
  type: 'owe' | 'lent'
  note?: string
}

export default function DebtCard({ data }: { data: DebtCardData }) {
  const isOwe = data.type === 'owe'

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-xl mt-2 overflow-hidden"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${isOwe ? 'var(--danger)' : 'var(--success)'}`,
      }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: isOwe ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
              }}
            >
              <User size={14} style={{ color: isOwe ? 'var(--danger)' : 'var(--success)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {data.person}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isOwe ? 'Kamu berhutang ke' : 'Kamu meminjamkan ke'} {data.person}
              </p>
            </div>
          </div>
          <p
            className="text-sm font-bold"
            style={{ color: isOwe ? 'var(--danger)' : 'var(--success)' }}
          >
            {formatIDR(data.amount)}
          </p>
        </div>
        {data.note && (
          <p className="text-xs mt-2 pl-10" style={{ color: 'var(--text-muted)' }}>
            {data.note}
          </p>
        )}
      </div>
    </motion.div>
  )
}
