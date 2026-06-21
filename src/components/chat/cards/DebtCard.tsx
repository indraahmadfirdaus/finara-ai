'use client'

import { motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { Check } from 'lucide-react'

interface DebtItem {
  person: string
  amount: number
  type: 'owe' | 'lent'
  note?: string
  settled?: boolean
}

// Supports single debt or a list
interface DebtCardData extends DebtItem {
  // list mode when AI returns multiple debts
  items?: DebtItem[]
}

function SingleDebt({ item, index = 0 }: { item: DebtItem; index?: number }) {
  const isOwe = item.type === 'owe'
  const settled = item.settled === true

  const accentColor = settled ? 'var(--text-muted)' : isOwe ? 'var(--danger)' : 'var(--success)'
  const borderColor = settled
    ? 'rgba(107,114,128,0.2)'
    : isOwe
    ? 'rgba(239,68,68,0.3)'
    : 'rgba(34,197,94,0.3)'

  return (
    <motion.div
      initial={{ y: 10, opacity: 0, scale: 0.97 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24, delay: index * 0.07 }}
      className="mt-2 px-3 py-2.5 rounded-2xl flex items-center gap-3"
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${accentColor}`,
        opacity: settled ? 0.65 : 1,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)', textDecoration: settled ? 'line-through' : 'none' }}>
            {item.person}
          </p>
          {item.settled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5"
              style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)' }}>
              <Check size={8} />
              Lunas
            </span>
          )}
        </div>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {item.note || (isOwe ? 'Kamu berhutang' : 'Kamu meminjamkan')}
        </p>
      </div>

      <p className="text-xs font-bold flex-shrink-0"
        style={{ color: accentColor, textDecoration: settled ? 'line-through' : 'none' }}>
        {formatIDR(item.amount)}
      </p>
    </motion.div>
  )
}

export default function DebtCard({ data }: { data: DebtCardData }) {
  const items: DebtItem[] = data.items && data.items.length > 0
    ? data.items
    : [{ person: data.person, amount: data.amount ?? 0, type: data.type, note: data.note, settled: data.settled }]

  const totalOwe = items.filter(i => i.type === 'owe' && !i.settled).reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalLent = items.filter(i => i.type === 'lent' && !i.settled).reduce((s, i) => s + (i.amount ?? 0), 0)
  const showSummary = items.length > 1

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="mt-2"
    >
      {showSummary && (
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {items.length} catatan hutang/piutang
          </p>
          <div className="flex items-center gap-3">
            {totalOwe > 0 && (
              <span className="text-xs font-bold" style={{ color: 'var(--danger)' }}>−{formatIDR(totalOwe)}</span>
            )}
            {totalLent > 0 && (
              <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>+{formatIDR(totalLent)}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 p-3">
        {items.map((item, i) => (
          <SingleDebt key={`${item.person}-${i}`} item={item} index={i} />
        ))}
      </div>
    </motion.div>
  )
}
