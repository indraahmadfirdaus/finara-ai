'use client'

import { motion } from 'framer-motion'
import ProgressBar from '@/components/shared/ProgressBar'
import InsightBarViz from './InsightBarViz'
import InsightSparkline from './InsightSparkline'
import InsightDonut from './InsightDonut'
import type { InsightCard as InsightCardType, BarData, ProgressData, SparklineData, DonutData } from '@/lib/dashboard/insightTypes'

const TAG_STYLES = {
  warning: { bg: 'rgba(251,183,36,0.12)', color: '#FBB724', label: 'Perlu perhatian' },
  danger:  { bg: 'rgba(239,68,68,0.12)',  color: 'var(--danger)',  label: 'Kritis' },
  good:    { bg: 'rgba(34,197,94,0.12)',  color: 'var(--success)', label: 'Bagus' },
  info:    { bg: 'rgba(124,92,252,0.12)', color: 'var(--accent-light)', label: 'Insight' },
}

const ACCENT_BAR_COLOR = {
  warning: '#FBB724',
  danger:  'var(--danger)',
  good:    'var(--success)',
  info:    'var(--accent)',
}

interface Props {
  card: InsightCardType
  index: number
}

export default function InsightCard({ card, index }: Props) {
  const tag = TAG_STYLES[card.tag]
  const accentColor = ACCENT_BAR_COLOR[card.tag]

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22, delay: index * 0.09 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}
    >
      <div className="flex items-stretch">
        {/* Accent left bar */}
        <div className="w-1 flex-shrink-0 rounded-l-xl" style={{ background: accentColor }} />

        {/* Content */}
        <div className="flex-1 p-3 pl-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
              style={{ background: tag.bg }}
            >
              {card.icon}
            </div>

            {/* Text + viz */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {card.title}
              </p>
              <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {card.description}
              </p>

              {card.viz_type === 'bar' && card.viz_data && (
                <InsightBarViz data={card.viz_data as BarData} />
              )}
              {card.viz_type === 'sparkline' && card.viz_data && (
                <InsightSparkline data={card.viz_data as SparklineData} />
              )}
              {card.viz_type === 'donut' && card.viz_data && (
                <InsightDonut data={card.viz_data as DonutData} />
              )}
              {card.viz_type === 'progress' && card.viz_data && (() => {
                const d = card.viz_data as ProgressData
                const color = d.percent >= 85 ? 'var(--danger)' : d.percent >= 60 ? 'var(--warning)' : 'var(--accent)'
                return (
                  <div className="mt-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
                      <span className="text-[11px] font-semibold" style={{ color }}>{d.percent}%</span>
                    </div>
                    <ProgressBar percent={d.percent} height={5} color={color} />
                  </div>
                )
              })()}

              <span
                className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: tag.bg, color: tag.color }}
              >
                {tag.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
