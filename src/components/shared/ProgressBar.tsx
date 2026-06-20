'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  percent: number
  height?: number
  className?: string
  showLabel?: boolean
}

function getColor(percent: number): string {
  if (percent >= 85) return 'var(--danger)'
  if (percent >= 60) return 'var(--warning)'
  return 'var(--success)'
}

export default function ProgressBar({
  percent,
  height = 6,
  className = '',
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const color = getColor(clamped)

  return (
    <div className={className}>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: 'var(--bg-elevated)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 9999 }}
        />
      </div>
      {showLabel && (
        <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)' }}>
          {clamped.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
