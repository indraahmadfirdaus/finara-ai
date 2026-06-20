'use client'

import { motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface SummaryCardData {
  period: string
  income: number
  expense: number
  balance: number
}

export default function SummaryCard({ data }: { data: SummaryCardData }) {
  const expenseRatio = data.income > 0 ? (data.expense / data.income) * 100 : 0

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-xl mt-2 overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          {data.period}
        </p>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} style={{ color: 'var(--success)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pemasukan</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
            {formatIDR(data.income)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingDown size={14} style={{ color: 'var(--danger)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pengeluaran</span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>
            {formatIDR(data.expense)}
          </span>
        </div>
        <div
          className="h-px w-full"
          style={{ background: 'var(--border)' }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Wallet size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              Saldo
            </span>
          </div>
          <span
            className="text-sm font-bold"
            style={{ color: data.balance >= 0 ? 'var(--text-primary)' : 'var(--danger)' }}
          >
            {formatIDR(data.balance)}
          </span>
        </div>
        {data.income > 0 && (
          <div className="pt-1">
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 4, background: 'var(--bg-surface)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, expenseRatio)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                style={{
                  height: '100%',
                  background: expenseRatio >= 85 ? 'var(--danger)' : expenseRatio >= 60 ? 'var(--warning)' : 'var(--success)',
                  borderRadius: 9999,
                }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {expenseRatio.toFixed(0)}% dari pemasukan terpakai
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
