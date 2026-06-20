'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { formatRelative } from '@/lib/utils/date'
import { Plus, X, Loader2, User, CheckCircle } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import SkeletonLoader from '@/components/shared/SkeletonLoader'
import EmptyState from '@/components/shared/EmptyState'

interface Debt {
  id: string
  person: string
  amount: number
  type: 'owe' | 'lent'
  note: string | null
  settled: boolean
  created_at: string
}

type TabType = 'owe' | 'lent'

const containerVariants = { animate: { transition: { staggerChildren: 0.05 } } }
const itemVariants = { initial: { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 } }

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabType>('owe')
  const [showForm, setShowForm] = useState(false)
  const [formPerson, setFormPerson] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formType, setFormType] = useState<TabType>('owe')
  const [saving, setSaving] = useState(false)

  const fetchDebts = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/debts?settled=false')
    const data = await res.json()
    setDebts(data.debts ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDebts() }, [fetchDebts])

  async function handleCreate() {
    if (!formPerson || !formAmount) return
    setSaving(true)
    await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person: formPerson, amount: parseInt(formAmount), type: formType, note: formNote || undefined }),
    })
    await fetchDebts()
    setSaving(false)
    setShowForm(false)
    setFormPerson('')
    setFormAmount('')
    setFormNote('')
  }

  async function handleSettle(id: string) {
    await fetch('/api/debts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDebts((prev) => prev.filter((d) => d.id !== id))
  }

  const filtered = debts.filter((d) => d.type === tab)
  const totalOwe = debts.filter((d) => d.type === 'owe').reduce((s, d) => s + d.amount, 0)
  const totalLent = debts.filter((d) => d.type === 'lent').reduce((s, d) => s + d.amount, 0)

  return (
    <PageTransition>
      <TopBar
        title="Hutang & Piutang"
        action={
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white"
            style={{ background: 'var(--accent)' }}>
            <Plus size={14} /> Tambah
          </motion.button>
        }
      />

      {/* Desktop page header */}
      <div className="hidden lg:flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Hutang & Piutang</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={15} />
          Tambah
        </motion.button>
      </div>

      <div className="px-4 pt-3 lg:max-w-3xl lg:mx-auto lg:px-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Hutangku</p>
            <p className="text-sm font-bold" style={{ color: 'var(--danger)' }}>{formatIDR(totalOwe)}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Piutangku</p>
            <p className="text-sm font-bold" style={{ color: 'var(--success)' }}>{formatIDR(totalLent)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex relative mb-4">
          {(['owe', 'lent'] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 text-sm font-medium relative"
              style={{ color: tab === t ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {t === 'owe' ? 'Hutang Aku' : 'Piutang Aku'}
              {tab === t && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <SkeletonLoader key={i} variant="card" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={tab === 'owe' ? 'Tidak ada hutang' : 'Tidak ada piutang'}
            description={tab === 'owe' ? 'Yeay, kamu bebas hutang! 🎉' : 'Belum ada yang pinjem ke kamu'}
            icon={tab === 'owe' ? '✨' : '💰'}
          />
        ) : (
          <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-3">
            <AnimatePresence>
              {filtered.map((d) => (
                <motion.div key={d.id} variants={itemVariants}
                  exit={{ x: -100, opacity: 0, height: 0 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid var(--border)`,
                    borderLeft: `3px solid ${d.type === 'owe' ? 'var(--danger)' : 'var(--success)'}`,
                  }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: d.type === 'owe' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)' }}>
                        <User size={16} style={{ color: d.type === 'owe' ? 'var(--danger)' : 'var(--success)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.person}</p>
                        {d.note && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.note}</p>}
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelative(d.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-sm font-bold" style={{ color: d.type === 'owe' ? 'var(--danger)' : 'var(--success)' }}>
                        {formatIDR(d.amount)}
                      </p>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSettle(d.id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                        style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)' }}>
                        <CheckCircle size={12} /> Lunas
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

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
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tambah Hutang/Piutang</h3>
                <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>

              <div className="flex gap-2 mb-3">
                {(['owe', 'lent'] as TabType[]).map((t) => (
                  <button key={t} onClick={() => setFormType(t)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                    style={formType === t ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    {t === 'owe' ? 'Hutangku' : 'Piutangku'}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <input type="text" value={formPerson} onChange={(e) => setFormPerson(e.target.value)} placeholder="Nama orang"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="Jumlah (Rp)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="Keterangan (opsional)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={saving || !formPerson || !formAmount}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'var(--accent)' }}>
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
