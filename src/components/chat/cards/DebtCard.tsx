'use client'

import { motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'
import { User, Check } from 'lucide-react'

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24, delay: index * 0.07 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{
        background: settled
          ? 'rgba(107,114,128,0.06)'
          : isOwe
          ? 'rgba(239,68,68,0.06)'
          : 'rgba(34,197,94,0.06)',
        border: `1px solid ${
          settled
            ? 'rgba(107,114,128,0.15)'
            : isOwe
            ? 'rgba(239,68,68,0.2)'
            : 'rgba(34,197,94,0.2)'
        }`,
        borderLeft: `3px solid ${
          settled ? 'var(--text-muted)' : isOwe ? 'var(--danger)' : 'var(--success)'
        }`,
        opacity: settled ? 0.6 : 1,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: settled
            ? 'rgba(107,114,128,0.1)'
            : isOwe
            ? 'rgba(239,68,68,0.15)'
            : 'rgba(34,197,94,0.15)',
        }}
      >
        {settled ? (
          <Check size={14} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <User size={14} style={{ color: isOwe ? 'var(--danger)' : 'var(--success)' }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', textDecoration: settled ? 'line-through' : 'none' }}>
          {item.person}
        </p>
        {item.note && (
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.note}</p>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: settled ? 'var(--text-muted)' : isOwe ? 'var(--danger)' : 'var(--success)' }}>
          {formatIDR(item.amount)}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {settled ? 'Lunas' : isOwe ? 'Kamu berhutang' : 'Kamu meminjamkan'}
        </p>
      </div>
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
      className="rounded-2xl mt-2 overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      {showSummary && (
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
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

      <div className="flex flex-col gap-2 p-3 pt-0">
        {items.map((item, i) => (
          <SingleDebt key={`${item.person}-${i}`} item={item} index={i} />
        ))}
      </div>
    </motion.div>
  )
}
