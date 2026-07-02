'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatIDR, formatCompactIDR } from '@/lib/utils/currency'
import { formatDate, getMonthLabel } from '@/lib/utils/date'
import { getCategoryMeta } from '@/lib/utils/categoryIcon'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  note: string | null
  date: string
}

interface DayData {
  income: number
  expense: number
  txs: Transaction[]
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function getMonthRange(date: Date): { dateFrom: string; dateTo: string } {
  const y = date.getFullYear()
  const m = date.getMonth()
  const first = new Date(y, m, 1)
  const last = new Date(y, m + 1, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    dateFrom: `${first.getFullYear()}-${pad(first.getMonth() + 1)}-01`,
    dateTo: `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`,
  }
}

function buildTxMap(txs: Transaction[]): Map<string, DayData> {
  const map = new Map<string, DayData>()
  for (const tx of txs) {
    const existing = map.get(tx.date) ?? { income: 0, expense: 0, txs: [] }
    if (tx.type === 'income') existing.income += tx.amount
    else existing.expense += tx.amount
    existing.txs.push(tx)
    map.set(tx.date, existing)
  }
  return map
}

function buildCalendarDays(activeMonth: Date): Array<{ date: Date; isCurrentMonth: boolean; key: string }> {
  const y = activeMonth.getFullYear()
  const m = activeMonth.getMonth()
  const firstDay = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const daysInPrevMonth = new Date(y, m, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, '0')

  const cells: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = []

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(y, m - 1, daysInPrevMonth - i)
    cells.push({ date: d, isCurrentMonth: false, key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(y, m, i)
    cells.push({ date: d, isCurrentMonth: true, key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(i)}` })
  }
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(y, m + 1, i)
      cells.push({ date: d, isCurrentMonth: false, key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(i)}` })
    }
  }

  return cells
}

function todayKey(): string {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000)
  const iso = now.toISOString()
  return iso.split('T')[0]
}

export default function CalendarPage() {
  const [activeMonth, setActiveMonth] = useState(() => new Date())
  const [txMap, setTxMap] = useState<Map<string, DayData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slideDir, setSlideDir] = useState<1 | -1>(1)

  const fetchMonth = useCallback(async (month: Date) => {
    setLoading(true)
    const { dateFrom, dateTo } = getMonthRange(month)
    const res = await fetch(`/api/transactions?date_from=${dateFrom}&date_to=${dateTo}&limit=500`)
    const data = await res.json()
    setTxMap(buildTxMap(data.transactions ?? []))
    setLoading(false)
  }, [])

  useEffect(() => { fetchMonth(activeMonth) }, [activeMonth, fetchMonth])

  function prevMonth() {
    setSlideDir(-1)
    setSelectedDate(null)
    setActiveMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setSlideDir(1)
    setSelectedDate(null)
    setActiveMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const cells = buildCalendarDays(activeMonth)
  const today = todayKey()

  const monthLabel = getMonthLabel(
    `${activeMonth.getFullYear()}-${String(activeMonth.getMonth() + 1).padStart(2, '0')}`
  )

  const monthIncome = Array.from(txMap.values()).reduce((s, d) => s + d.income, 0)
  const monthExpense = Array.from(txMap.values()).reduce((s, d) => s + d.expense, 0)
  const net = monthIncome - monthExpense

  const drawerData = selectedDate ? txMap.get(selectedDate) : undefined

  return (
    <PageTransition>
      <TopBar title="Kalender" />

      {/* Desktop header */}
      <div className="hidden lg:flex items-center px-6 py-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Kalender</h1>
      </div>

      <div className="px-4 pt-3 pb-8 lg:max-w-3xl lg:mx-auto lg:px-6">

        {/* Month summary bar */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between mb-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{monthLabel}</span>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span style={{ color: 'var(--success)' }}>+{formatIDR(monthIncome)}</span>
            <span style={{ color: 'var(--danger)' }}>−{formatIDR(monthExpense)}</span>
            <span style={{ color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {net >= 0 ? '+' : '−'}{formatIDR(Math.abs(net))}
            </span>
          </div>
        </div>

        {/* Month navigation header */}
        <div className="flex items-center justify-between mb-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <ChevronLeft size={18} />
          </motion.button>
          <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{monthLabel}</p>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>

        {/* Day-of-week header row */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center py-1">
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeMonth.getFullYear()}-${activeMonth.getMonth()}`}
            initial={{ x: slideDir * 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDir * -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="grid grid-cols-7 gap-0.5"
          >
            {cells.map((cell) => {
              const dayData = txMap.get(cell.key)
              const isToday = cell.key === today
              const isSelected = cell.key === selectedDate

              const summaryText = (() => {
                if (!dayData) return null
                const { income, expense } = dayData
                if (income > 0 && expense > 0) {
                  return (
                    <span>
                      <span style={{ color: 'var(--success)' }}>+{formatCompactIDR(income)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>/</span>
                      <span style={{ color: 'var(--danger)' }}>−{formatCompactIDR(expense)}</span>
                    </span>
                  )
                }
                if (income > 0) return <span style={{ color: 'var(--success)' }}>+{formatCompactIDR(income)}</span>
                return <span style={{ color: 'var(--danger)' }}>−{formatCompactIDR(expense)}</span>
              })()

              return (
                <motion.button
                  key={cell.key}
                  whileTap={cell.isCurrentMonth ? { scale: 0.92 } : undefined}
                  onClick={() => {
                    if (!cell.isCurrentMonth) return
                    setSelectedDate(cell.key === selectedDate ? null : cell.key)
                  }}
                  className="flex flex-col items-start justify-between rounded-xl p-1.5 h-14 lg:h-16 relative overflow-hidden"
                  style={{
                    opacity: cell.isCurrentMonth ? 1 : 0.25,
                    background: isSelected ? 'var(--accent-dim)' : 'transparent',
                    border: isToday ? '1px solid var(--accent)' : '1px solid transparent',
                    cursor: cell.isCurrentMonth ? 'pointer' : 'default',
                  }}
                >
                  <span
                    className="text-sm font-semibold leading-none"
                    style={{ color: isToday ? 'var(--accent-light)' : 'var(--text-primary)' }}
                  >
                    {cell.date.getDate()}
                  </span>
                  {summaryText && (
                    <span className="text-[9px] leading-tight w-full text-left font-medium">
                      {summaryText}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* DayDrawer */}
      <AnimatePresence>
        {selectedDate && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
              onClick={() => setSelectedDate(null)}
            />

            {/* Sheet */}
            <motion.div
              key="drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl lg:max-w-lg lg:mx-auto lg:left-0 lg:right-0"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderBottom: 'none',
                paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
              </div>

              <div className="px-4 pb-2 pt-1">
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatDate(selectedDate)}
                </p>
                {drawerData && (
                  <div className="flex items-center gap-3 mt-0.5 text-sm font-semibold">
                    {drawerData.income > 0 && (
                      <span style={{ color: 'var(--success)' }}>+{formatIDR(drawerData.income)}</span>
                    )}
                    {drawerData.expense > 0 && (
                      <span style={{ color: 'var(--danger)' }}>−{formatIDR(drawerData.expense)}</span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: 'var(--border-light)' }} />

              {/* Transaction list */}
              <div className="max-h-[50vh] overflow-y-auto px-4 py-2">
                {!drawerData || drawerData.txs.length === 0 ? (
                  <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                    Tidak ada transaksi
                  </p>
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
                    className="flex flex-col gap-0"
                  >
                    {drawerData.txs.map((tx, idx) => {
                      const { icon: Icon, bg, color } = getCategoryMeta(tx.category, tx.type)
                      const isLast = idx === drawerData.txs.length - 1
                      return (
                        <motion.div
                          key={tx.id}
                          variants={{
                            hidden: { opacity: 0, x: -6 },
                            visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 28 } },
                          }}
                          className="flex items-center gap-3 py-3"
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
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tx.category}</p>
                          </div>
                          <p
                            className="text-sm font-semibold flex-shrink-0"
                            style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}
                          >
                            {tx.type === 'income' ? '+' : '−'}{formatIDR(tx.amount)}
                          </p>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
