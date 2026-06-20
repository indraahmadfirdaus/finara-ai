'use client'

import { motion } from 'framer-motion'
import AnimatedNumber from '@/components/shared/AnimatedNumber'

interface BalanceHeroProps {
  income: number
  expense: number
  balance: number
  period?: string
}

export default function BalanceHero({ income, expense, balance, period = 'Bulan Ini' }: BalanceHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="mx-4 mt-4 rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1A1240 0%, var(--bg-surface) 100%)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Purple glow */}
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,92,252,0.2) 0%, transparent 70%)' }}
      />

      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {period}
      </p>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        Saldo
      </p>
      <AnimatedNumber
        value={balance}
        currency
        className={`text-2xl font-bold block mb-4 ${balance >= 0 ? '' : 'text-red-500'}`}
      />

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pemasukan</p>
          </div>
          <AnimatedNumber
            value={income}
            currency
            className="text-sm font-semibold block"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pengeluaran</p>
          </div>
          <AnimatedNumber
            value={expense}
            currency
            className="text-sm font-semibold block"
          />
        </div>
      </div>
    </motion.div>
  )
}
