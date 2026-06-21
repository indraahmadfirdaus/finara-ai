'use client'

import { motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'

type AssetType = 'bank' | 'investment' | 'property' | 'vehicle' | 'other'

interface AssetItem {
  name: string
  type: AssetType
  institution?: string
  value: number
}

interface AssetCardData {
  name?: string
  type?: AssetType
  institution?: string
  value?: number
  items?: AssetItem[]
  total?: number
  _action?: 'created' | 'updated' | 'deleted'
}

const TYPE_META: Record<AssetType, { label: string; accent: string }> = {
  bank:       { label: 'Rekening',  accent: 'var(--accent)'         },
  investment: { label: 'Investasi', accent: 'var(--success)'        },
  property:   { label: 'Properti',  accent: '#F59E0B'               },
  vehicle:    { label: 'Kendaraan', accent: 'var(--text-secondary)' },
  other:      { label: 'Lainnya',   accent: 'var(--text-muted)'     },
}

function SingleAssetCard({ item }: { item: AssetItem }) {
  const meta = TYPE_META[item.type ?? 'other']

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="rounded-xl mt-2 overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-stretch">
        <div className="w-1 flex-shrink-0 rounded-l-xl" style={{ background: meta.accent }} />
        <div className="flex-1 p-3 pl-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {item.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {item.institution ? `${meta.label} · ${item.institution}` : meta.label}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold" style={{ color: meta.accent }}>{formatIDR(item.value)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AssetCard({ data }: { data: AssetCardData }) {
  if (data.items && data.items.length > 0) {
    return (
      <div className="space-y-0">
        {data.items.map((item, i) => (
          <SingleAssetCard key={i} item={item} />
        ))}
        {data.total !== undefined && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
            className="mt-2 rounded-xl p-3 flex items-center justify-between"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--accent-light)' }}>Total Aset</p>
            <p className="text-sm font-bold" style={{ color: 'var(--accent-light)' }}>{formatIDR(data.total)}</p>
          </motion.div>
        )}
      </div>
    )
  }

  if (!data.name || data.value === undefined) return null

  return (
    <SingleAssetCard
      item={{ name: data.name, type: data.type ?? 'other', institution: data.institution, value: data.value }}
    />
  )
}
