'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { formatRelative } from '@/lib/utils/date'
import { TrendingUp, TrendingDown, Trash2, Filter } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import EmptyState from '@/components/shared/EmptyState'
import SkeletonLoader from '@/components/shared/SkeletonLoader'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  note: string | null
  date: string
}

type FilterType = 'all' | 'income' | 'expense'

const containerVariants = { animate: { transition: { staggerChildren: 0.04 } } }
const itemVariants = { initial: { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 } }

function groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = tx.date
    if (!acc[key]) acc[key] = []
    acc[key].push(tx)
    return acc
  }, {})
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ period: 'month', limit: '50' })
    if (filter !== 'all') params.set('type', filter)
    const res = await fetch(`/api/transactions?${params}`)
    const data = await res.json()
    setTransactions(data.transactions ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  async function deleteTransaction(id: string) {
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const grouped = groupByDate(transactions)
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <PageTransition>
      <TopBar title="Transaksi" />
      <div className="px-4 pt-3">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'income', 'expense'] as FilterType[]).map((f) => (
            <motion.button
              key={f}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-xs font-medium transition-all"
              style={
                filter === f
                  ? { background: 'var(--accent)', color: 'white' }
                  : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {f === 'all' ? 'Semua' : f === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </motion.button>
          ))}
          <div className="ml-auto flex items-center" style={{ color: 'var(--text-muted)' }}>
            <Filter size={14} />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonLoader key={i} variant="card" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="Belum ada transaksi"
            description="Mulai catat pengeluaran kamu lewat chat"
            icon="💸"
          />
        ) : (
          <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-5">
            {dateKeys.map((date) => (
              <div key={date}>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  {formatRelative(date)}
                </p>
                <div
                  className="rounded-2xl overflow-hidden divide-y"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <AnimatePresence>
                    {grouped[date].map((tx) => (
                      <motion.div
                        key={tx.id}
                        variants={itemVariants}
                        exit={{ x: -100, opacity: 0, height: 0 }}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: '1px solid var(--border-light)' }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: tx.type === 'income' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          }}
                        >
                          {tx.type === 'income' ? (
                            <TrendingUp size={15} style={{ color: 'var(--success)' }} />
                          ) : (
                            <TrendingDown size={15} style={{ color: 'var(--danger)' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {tx.note ?? tx.category}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {tx.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}
                          >
                            {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
                          </p>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 rounded-lg"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Trash2 size={13} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
