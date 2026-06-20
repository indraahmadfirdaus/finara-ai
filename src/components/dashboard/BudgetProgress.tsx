'use client'

import { motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import ProgressBar from '@/components/shared/ProgressBar'

interface BudgetItem {
  id: string
  category: string
  limit_amount: number
  used: number
  percent: number
}

interface BudgetProgressProps {
  budgets: BudgetItem[]
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1 },
}

export default function BudgetProgress({ budgets }: BudgetProgressProps) {
  if (budgets.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
        Belum ada anggaran
      </p>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-3"
    >
      {budgets.map((b) => (
        <motion.div key={b.id} variants={itemVariants}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {b.category}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatIDR(b.used)} / {formatIDR(b.limit_amount)}
            </span>
          </div>
          <ProgressBar percent={b.percent} height={5} />
        </motion.div>
      ))}
    </motion.div>
  )
}
