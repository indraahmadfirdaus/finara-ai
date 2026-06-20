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
      className="mx-4 mt-4 lg:mx-0 lg:mt-0 rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Purple accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: 'linear-gradient(90deg, #7C5CFC, #A78BFA, #FBB724)' }}
      />
      {/* Subtle glow */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)' }}
      />

      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
        {period}
      </p>
      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
        Saldo
      </p>
      <AnimatedNumber
        value={balance}
        currency
        className={`text-2xl font-bold block mb-4 ${balance >= 0 ? '' : 'text-red-500'}`}
      />

      <div className="flex gap-4">
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)' }}
        >
          <div className="flex items-center gap-1 mb-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pemasukan</p>
          </div>
          <AnimatedNumber
            value={income}
            currency
            className="text-sm font-bold block"
          />
        </div>
        <div
          className="flex-1 rounded-xl p-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
        >
          <div className="flex items-center gap-1 mb-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--danger)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pengeluaran</p>
          </div>
          <AnimatedNumber
            value={expense}
            currency
            className="text-sm font-bold block"
          />
        </div>
      </div>
    </motion.div>
  )
}
