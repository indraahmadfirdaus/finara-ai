'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { formatRelative, getMonthKey } from '@/lib/utils/date'
import { getCategoryMeta } from '@/lib/utils/categoryIcon'
import { Trash2, ChevronDown, X, TrendingUp, TrendingDown, ArrowLeftRight, Plus, Loader2 } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import EmptyState from '@/components/shared/EmptyState'
import SkeletonLoader from '@/components/shared/SkeletonLoader'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/utils/categories'
import { getTodayKey } from '@/lib/utils/date'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  note: string | null
  date: string
}

type TxType = 'all' | 'income' | 'expense'

// Quick period presets
const PERIODS = [
  { label: 'Hari ini', id: 'today' },
  { label: '7 hari', id: 'week' },
  { label: 'Bulan ini', id: 'month' },
  { label: 'Tahun ini', id: 'year' },
] as const
type PeriodId = typeof PERIODS[number]['id'] | 'custom'

function groupByDate(txs: Transaction[]): Record<string, Transaction[]> {
  return txs.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = []
    acc[tx.date].push(tx)
    return acc
  }, {})
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}
function monthStartISO() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`
}

// Extract unique categories from a list of transactions
function uniqueCategories(txs: Transaction[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const tx of txs) {
    const k = tx.category.toLowerCase()
    if (!seen.has(k)) { seen.add(k); out.push(tx.category) }
  }
  return out.sort()
}

export default function TransactionsPage() {
  const [allTxs, setAllTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Filters (client-side derived from allTxs for categories, server-side for date/type)
  const [period, setPeriod] = useState<PeriodId>('month')
  const [customFrom, setCustomFrom] = useState(monthStartISO())
  const [customTo, setCustomTo] = useState(todayISO())
  const [txType, setTxType] = useState<TxType>('all')
  const [category, setCategory] = useState<string>('all')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCatPicker, setShowCatPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Add transaction form state
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')
  const [formCategory, setFormCategory] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formDate, setFormDate] = useState(getTodayKey())
  const [saving, setSaving] = useState(false)

  // Build API params from active filters
  const buildParams = useCallback(() => {
    const p = new URLSearchParams()
    if (period === 'custom') {
      p.set('date_from', customFrom)
      p.set('date_to', customTo)
    } else {
      p.set('period', period)
    }
    if (txType !== 'all') p.set('type', txType)
    return p
  }, [period, customFrom, customTo, txType])

  const fetchTxs = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/transactions?${buildParams()}`)
    const data = await res.json()
    setAllTxs(data.transactions ?? [])
    setLoading(false)
  }, [buildParams])

  useEffect(() => { fetchTxs() }, [fetchTxs])

  // Close pickers on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false)
        setShowCatPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function deleteTransaction(id: string) {
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    setAllTxs((prev) => prev.filter((t) => t.id !== id))
  }

  async function handleCreate() {
    if (!formAmount || !formCategory) return
    setSaving(true)
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(Number(formAmount)),
        type: formType,
        category: formCategory,
        note: formNote || undefined,
        date: formDate,
      }),
    })
    await fetchTxs()
    setSaving(false)
    setShowForm(false)
    setFormType('expense')
    setFormCategory('')
    setFormAmount('')
    setFormNote('')
    setFormDate(getTodayKey())
  }

  // Client-side category filter on top of server results
  const filtered = category === 'all'
    ? allTxs
    : allTxs.filter((tx) => tx.category.toLowerCase() === category.toLowerCase())

  const grouped = groupByDate(filtered)
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
  const categories = uniqueCategories(allTxs)

  // Summary bar
  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Active period label
  const activePeriodLabel = period === 'custom'
    ? `${customFrom} – ${customTo}`
    : PERIODS.find(p => p.id === period)?.label ?? ''

  return (
    <PageTransition>
      <TopBar
        title="Transaksi"
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

      {/* Desktop page header */}
      <div className="hidden lg:flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Transaksi</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={15} />
          Tambah Transaksi
        </motion.button>
      </div>

      <div className="px-4 pt-3 pb-8 space-y-3 lg:max-w-3xl lg:mx-auto lg:px-6">

        {/* ── Period quick-select ── */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => { setPeriod(p.id); setCategory('all') }}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={
                period === p.id
                  ? { background: 'var(--accent)', color: 'white' }
                  : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => { setShowDatePicker(v => !v); setShowCatPicker(false) }}
            className="flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold transition-all"
            style={
              period === 'custom'
                ? { background: 'var(--accent)', color: 'white' }
                : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            Kustom <ChevronDown size={12} />
          </button>
        </div>

        {/* ── Date range picker (custom) ── */}
        <AnimatePresence>
          {showDatePicker && (
            <motion.div
              ref={pickerRef}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-2xl p-4 space-y-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Rentang Tanggal</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Dari</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Sampai</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => { setPeriod('custom'); setShowDatePicker(false); setCategory('all') }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--accent)' }}
              >
                Terapkan
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Type + Category filter row ── */}
        <div className="flex gap-2">
          {/* Type toggle */}
          <div
            className="flex rounded-xl p-0.5 gap-0.5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {([
              { id: 'all', icon: ArrowLeftRight, label: 'Semua' },
              { id: 'income', icon: TrendingUp, label: '+' },
              { id: 'expense', icon: TrendingDown, label: '-' },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTxType(id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  txType === id
                    ? {
                        background: id === 'income' ? 'rgba(34,197,94,0.2)' : id === 'expense' ? 'rgba(239,68,68,0.2)' : 'var(--accent-dim)',
                        color: id === 'income' ? 'var(--success)' : id === 'expense' ? 'var(--danger)' : 'var(--accent-light)',
                      }
                    : { color: 'var(--text-muted)' }
                }
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Category picker */}
          <div className="relative flex-1">
            <button
              onClick={() => { setShowCatPicker(v => !v); setShowDatePicker(false) }}
              className="w-full flex items-center justify-between gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
              style={
                category !== 'all'
                  ? { background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid rgba(124,92,252,0.3)' }
                  : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              <span className="truncate">{category === 'all' ? 'Semua Kategori' : category}</span>
              {category !== 'all' ? (
                <X size={12} onClick={(e) => { e.stopPropagation(); setCategory('all') }} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>
            <AnimatePresence>
              {showCatPicker && (
                <motion.div
                  ref={pickerRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full mt-1 z-30 rounded-2xl overflow-hidden shadow-xl"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <div className="max-h-52 overflow-y-auto py-1">
                    {[{ key: 'all', label: 'Semua Kategori' }, ...categories.map(c => ({ key: c, label: c }))].map(({ key, label }) => {
                      const meta = key === 'all' ? null : getCategoryMeta(key)
                      const Icon = meta?.icon
                      return (
                        <button
                          key={key}
                          onClick={() => { setCategory(key); setShowCatPicker(false) }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                          style={{
                            color: category === key ? 'var(--accent-light)' : 'var(--text-primary)',
                            background: category === key ? 'var(--accent-dim)' : 'transparent',
                          }}
                          onMouseEnter={(e) => { if (category !== key) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                          onMouseLeave={(e) => { if (category !== key) e.currentTarget.style.background = 'transparent' }}
                        >
                          {Icon && meta ? (
                            <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                              <Icon size={11} style={{ color: meta.color }} />
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-md flex-shrink-0" style={{ background: 'var(--bg-elevated)' }} />
                          )}
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Active filter label + summary ── */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {activePeriodLabel}{category !== 'all' ? ` · ${category}` : ''}
            {txType !== 'all' ? ` · ${txType === 'income' ? 'Pemasukan' : 'Pengeluaran'}` : ''}
          </span>
          <div className="flex items-center gap-3 text-xs font-semibold">
            {txType !== 'expense' && (
              <span style={{ color: 'var(--success)' }}>+{formatIDR(income)}</span>
            )}
            {txType !== 'income' && (
              <span style={{ color: 'var(--danger)' }}>-{formatIDR(expense)}</span>
            )}
          </div>
        </div>

        {/* ── Transaction list ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <SkeletonLoader key={i} variant="card" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada transaksi"
            description="Coba ubah filter atau catat transaksi lewat chat"
            icon="💸"
          />
        ) : (
          <motion.div
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.03 } } }}
            className="space-y-5"
          >
            {dateKeys.map((date) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {formatRelative(date)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {grouped[date].length} transaksi
                  </p>
                </div>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <AnimatePresence>
                    {grouped[date].map((tx, idx) => {
                      const { icon: Icon, bg, color } = getCategoryMeta(tx.category, tx.type)
                      const isLast = idx === grouped[date].length - 1
                      return (
                        <motion.div
                          key={tx.id}
                          variants={{ initial: { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 } }}
                          exit={{ x: -80, opacity: 0, height: 0, overflow: 'hidden' }}
                          className="flex items-center gap-3 px-4 py-3"
                          style={!isLast ? { borderBottom: '1px solid var(--border-light)' } : undefined}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: bg }}
                          >
                            <Icon size={15} style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {tx.note ?? tx.category}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {tx.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <p
                              className="text-sm font-semibold"
                              style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}
                            >
                              {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
                            </p>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => deleteTransaction(tx.id)}
                              className="p-1.5 rounded-lg ml-1"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Trash2 size={13} />
                            </motion.button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Add Transaction Modal ── */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowForm(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-5 lg:bottom-8 lg:left-1/2 lg:right-auto lg:w-[420px] lg:-translate-x-1/2"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Tambah Transaksi
                </h3>
                <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Type toggle */}
                <div
                  className="flex rounded-xl p-1 gap-1"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  {(['expense', 'income'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setFormType(t); setFormCategory('') }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={
                        formType === t
                          ? {
                              background: t === 'income' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                              color: t === 'income' ? 'var(--success)' : 'var(--danger)',
                            }
                          : { color: 'var(--text-muted)' }
                      }
                    >
                      {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </button>
                  ))}
                </div>

                {/* Category picker — scrollable icon grid */}
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Kategori</p>
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {(formType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => {
                      const meta = getCategoryMeta(cat, formType)
                      const Icon = meta.icon
                      const isSelected = formCategory === cat
                      return (
                        <button
                          key={cat}
                          onClick={() => setFormCategory(cat)}
                          className="flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all"
                          style={{
                            background: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                            border: isSelected ? '1px solid rgba(124,92,252,0.4)' : '1px solid var(--border)',
                            minWidth: '60px',
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: isSelected ? 'var(--accent-dim)' : meta.bg }}
                          >
                            <Icon size={14} style={{ color: isSelected ? 'var(--accent-light)' : meta.color }} />
                          </div>
                          <span
                            className="text-[10px] font-medium text-center leading-tight"
                            style={{ color: isSelected ? 'var(--accent-light)' : 'var(--text-muted)' }}
                          >
                            {cat.split(' ')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Amount */}
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="Jumlah (Rp)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                />

                {/* Note */}
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Catatan (opsional)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                />

                {/* Date */}
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                />

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  disabled={saving || !formAmount || !formCategory}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'var(--accent)' }}
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  Simpan Transaksi
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
