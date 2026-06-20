'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { formatRelative } from '@/lib/utils/date'
import { getCategoryMeta } from '@/lib/utils/categoryIcon'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  note: string | null
  date: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1 },
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
        Belum ada transaksi
      </p>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-1">
      {transactions.map((tx) => {
        const { icon: Icon, bg, color } = getCategoryMeta(tx.category, tx.type)
        return (
          <motion.div
            key={tx.id}
            variants={itemVariants}
            className="flex items-center gap-3 py-2.5"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}
            >
              <Icon size={15} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {tx.note ?? tx.category}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatRelative(tx.date)} · {tx.category}
              </p>
            </div>
            <p
              className="text-sm font-semibold flex-shrink-0"
              style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}
            >
              {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
            </p>
          </motion.div>
        )
      })}

      <Link
        href="/transactions"
        className="block text-center text-xs py-2 rounded-xl mt-2 transition-opacity hover:opacity-80"
        style={{ color: 'var(--accent-light)', background: 'var(--accent-dim)' }}
      >
        Lihat semua transaksi →
      </Link>
    </motion.div>
  )
}
