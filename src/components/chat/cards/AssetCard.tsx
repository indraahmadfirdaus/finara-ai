'use client'

import { motion } from 'framer-motion'
import { Check, Landmark, TrendingUp, Home, Car, Package } from 'lucide-react'
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

const TYPE_META: Record<AssetType, { label: string; icon: typeof Landmark; accent: string; iconBg: string; iconColor: string }> = {
  bank:       { label: 'Rekening',  icon: Landmark,   accent: 'var(--accent)',         iconBg: 'var(--accent-dim)',         iconColor: 'var(--accent-light)' },
  investment: { label: 'Investasi', icon: TrendingUp,  accent: 'var(--success)',        iconBg: 'rgba(34,197,94,0.12)',      iconColor: 'var(--success)' },
  property:   { label: 'Properti',  icon: Home,        accent: '#F59E0B',               iconBg: 'rgba(245,158,11,0.12)',     iconColor: '#F59E0B' },
  vehicle:    { label: 'Kendaraan', icon: Car,         accent: 'var(--text-secondary)', iconBg: 'var(--bg-elevated)',        iconColor: 'var(--text-secondary)' },
  other:      { label: 'Lainnya',   icon: Package,     accent: 'var(--text-muted)',     iconBg: 'var(--bg-elevated)',        iconColor: 'var(--text-muted)' },
}

function SingleAssetCard({ item, action }: { item: AssetItem; action?: 'created' | 'updated' | 'deleted' }) {
  const meta = TYPE_META[item.type ?? 'other']
  const Icon = meta.icon

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
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: meta.iconBg }}
            >
              <Icon size={15} style={{ color: meta.iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {item.name}
                </p>
                {action && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1"
                    style={{
                      background: action === 'deleted' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                      color: action === 'deleted' ? 'var(--danger)' : 'var(--success)',
                    }}
                  >
                    <Check size={9} />
                    {action === 'created' ? 'Dibuat' : action === 'updated' ? 'Diperbarui' : 'Dihapus'}
                  </span>
                )}
              </div>
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
      action={data._action}
    />
  )
}
