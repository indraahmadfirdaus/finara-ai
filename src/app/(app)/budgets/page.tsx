'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { Plus, X, Loader2 } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import ProgressBar from '@/components/shared/ProgressBar'
import SkeletonLoader from '@/components/shared/SkeletonLoader'
import EmptyState from '@/components/shared/EmptyState'
import { EXPENSE_CATEGORIES } from '@/lib/utils/categories'

interface Budget {
  id: string
  category: string
  limit_amount: number
  used: number
  percent: number
}

const containerVariants = { animate: { transition: { staggerChildren: 0.06 } } }
const itemVariants = { initial: { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 } }

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0])
  const [formLimit, setFormLimit] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/budgets')
    const data = await res.json()
    setBudgets(data.budgets ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  async function handleSave() {
    if (!formLimit) return
    setSaving(true)
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: formCategory, limit_amount: parseInt(formLimit.replace(/\D/g, '')) }),
    })
    await fetchBudgets()
    setSaving(false)
    setShowForm(false)
    setFormLimit('')
  }

  return (
    <PageTransition>
      <TopBar
        title="Anggaran"
        action={
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={14} />
            Tambah
          </motion.button>
        }
      />

      <div className="px-4 pt-3 lg:max-w-3xl lg:mx-auto lg:px-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonLoader key={i} variant="card" />)}
          </div>
        ) : budgets.length === 0 && !showForm ? (
          <EmptyState
            title="Belum ada anggaran"
            description="Tambah anggaran untuk kontrol pengeluaranmu"
            icon="📊"
          />
        ) : (
          <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-3">
            {budgets.map((b) => (
              <motion.div
                key={b.id}
                variants={itemVariants}
                className="rounded-2xl p-4"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {b.category}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {b.percent.toFixed(0)}%
                  </p>
                </div>
                <ProgressBar percent={b.percent} height={6} className="mb-2" />
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>
                    Terpakai {formatIDR(b.used)}
                  </span>
                  <span style={{ color: b.used > b.limit_amount ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    {b.used > b.limit_amount
                      ? `Over ${formatIDR(b.used - b.limit_amount)}`
                      : `Sisa ${formatIDR(b.limit_amount - b.used)}`}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Limit: {formatIDR(b.limit_amount)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Add budget modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Tambah Anggaran
                </h3>
                <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Kategori
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Limit (Rp)
                  </label>
                  <input
                    type="number"
                    value={formLimit}
                    onChange={(e) => setFormLimit(e.target.value)}
                    placeholder="1000000"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving || !formLimit}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'var(--accent)' }}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  Simpan
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
