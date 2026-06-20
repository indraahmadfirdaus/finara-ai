'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatIDR } from '@/lib/utils/currency'
import { CATEGORY_COLORS } from '@/lib/utils/categories'

interface SpendingChartProps {
  data: { category: string; amount: number }[]
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-xl text-xs"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <p style={{ color: 'var(--text-primary)' }}>{payload[0].name}</p>
        <p className="font-semibold" style={{ color: 'var(--accent)' }}>
          {formatIDR(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export default function SpendingChart({ data }: SpendingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Belum ada data pengeluaran
        </p>
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.amount, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry) => (
              <Cell
                key={entry.category}
                fill={CATEGORY_COLORS[entry.category] ?? '#6B7280'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-2 justify-center mt-2 px-4">
        {data.map((entry) => (
          <div key={entry.category} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: CATEGORY_COLORS[entry.category] ?? '#6B7280' }}
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {entry.category} {total > 0 ? `${((entry.amount / total) * 100).toFixed(0)}%` : ''}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
