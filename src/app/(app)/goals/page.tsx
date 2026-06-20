'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { Plus, X, Loader2, Target, CheckCircle } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import ProgressBar from '@/components/shared/ProgressBar'
import SkeletonLoader from '@/components/shared/SkeletonLoader'
import EmptyState from '@/components/shared/EmptyState'

interface Goal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
}

const containerVariants = { animate: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { initial: { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 } }

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formTarget, setFormTarget] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [saving, setSaving] = useState(false)
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositing, setDepositing] = useState(false)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/goals')
    const data = await res.json()
    setGoals(data.goals ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  async function handleCreate() {
    if (!formName || !formTarget) return
    setSaving(true)
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formName,
        target_amount: parseInt(formTarget),
        deadline: formDeadline || null,
      }),
    })
    await fetchGoals()
    setSaving(false)
    setShowForm(false)
    setFormName('')
    setFormTarget('')
    setFormDeadline('')
  }

  async function handleDeposit() {
    if (!depositGoalId || !depositAmount) return
    setDepositing(true)
    await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: depositGoalId, amount: parseInt(depositAmount) }),
    })
    await fetchGoals()
    setDepositing(false)
    setDepositGoalId(null)
    setDepositAmount('')
  }

  return (
    <PageTransition>
      <TopBar
        title="Goals"
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
            {[1, 2].map((i) => <SkeletonLoader key={i} variant="card" />)}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState
            title="Belum ada goals"
            description="Buat target tabungan untuk masa depanmu"
            icon="🎯"
          />
        ) : (
          <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-3">
            {goals.map((g) => {
              const percent = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
              const isDone = percent >= 100

              return (
                <motion.div
                  key={g.id}
                  variants={itemVariants}
                  className="rounded-2xl p-4"
                  style={{
                    background: isDone ? 'rgba(34,197,94,0.08)' : 'var(--bg-surface)',
                    border: `1px solid ${isDone ? 'var(--success)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: isDone ? 'rgba(34,197,94,0.2)' : 'var(--accent-dim)' }}
                      >
                        {isDone ? (
                          <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                        ) : (
                          <Target size={16} style={{ color: 'var(--accent)' }} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {g.name}
                        </p>
                        {g.deadline && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Deadline: {g.deadline}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold" style={{ color: isDone ? 'var(--success)' : 'var(--accent)' }}>
                      {percent.toFixed(0)}%
                    </p>
                  </div>

                  <ProgressBar percent={percent} height={5} className="mb-2" />

                  <div className="flex items-center justify-between">
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatIDR(g.current_amount)} / {formatIDR(g.target_amount)}
                    </div>
                    {!isDone && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDepositGoalId(g.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}
                      >
                        Setor dana
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowForm(false)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tambah Goal</h3>
                <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama goal (misal: Liburan Jepang)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <input type="number" value={formTarget} onChange={(e) => setFormTarget(e.target.value)} placeholder="Target (Rp)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={saving || !formName || !formTarget}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'var(--accent)' }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  Buat Goal
                </motion.button>
              </div>
            </motion.div>
          </>
        )}

        {depositGoalId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setDepositGoalId(null)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-5"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Setor Dana</h3>
                <button onClick={() => setDepositGoalId(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
              <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Jumlah (Rp)"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleDeposit} disabled={depositing || !depositAmount}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'var(--accent)' }}>
                {depositing ? <Loader2 size={15} className="animate-spin" /> : null}
                Setor Sekarang
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
