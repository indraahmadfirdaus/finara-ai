'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Landmark, ChevronRight } from 'lucide-react'
import { formatCompactIDR } from '@/lib/utils/currency'

interface AssetNetWorthProps {
  totalAssets: number
  netWorth: number
  count: number
}

export default function AssetNetWorth({ totalAssets, netWorth, count }: AssetNetWorthProps) {
  const router = useRouter()

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push('/assets')}
      className="rounded-2xl p-4 cursor-pointer"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-dim)' }}
          >
            <Landmark size={13} style={{ color: 'var(--accent-light)' }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Aset & Net Worth
          </h3>
        </div>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Aset</p>
          <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatCompactIDR(totalAssets)}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {count} aset
          </p>
        </div>

        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Net Worth</p>
          <p
            className="text-base font-bold"
            style={{ color: netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}
          >
            {formatCompactIDR(netWorth)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
