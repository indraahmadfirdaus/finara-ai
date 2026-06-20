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
        className="px-3 py-2 rounded-xl text-xs shadow-lg"
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

interface LabelProps {
  cx: number
  cy: number
  midAngle: number
  outerRadius: number
  percent: number
  name: string
}

function CustomLabel({ cx, cy, midAngle, outerRadius, percent, name }: LabelProps) {
  if (percent < 0.05) return null

  const RADIAN = Math.PI / 180
  const radius = outerRadius + 30
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const anchor = x > cx ? 'start' : 'end'

  return (
    <g>
      <text
        x={x}
        y={y - 6}
        textAnchor={anchor}
        dominantBaseline="middle"
        style={{ fontSize: 13, fontWeight: 700, fill: 'var(--text-primary)', fontFamily: 'inherit' }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <text
        x={x}
        y={y + 9}
        textAnchor={anchor}
        dominantBaseline="middle"
        style={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'inherit' }}
      >
        {name}
      </text>
    </g>
  )
}

function CenterLabel({ cx, cy, total }: { cx: number; cy: number; total: number }) {
  const short =
    total >= 1_000_000
      ? `Rp ${(total / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`
      : formatIDR(total)

  return (
    <g>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'inherit' }}
      >
        Total
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 13, fontWeight: 700, fill: 'var(--text-primary)', fontFamily: 'inherit' }}
      >
        {short}
      </text>
    </g>
  )
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
      className="px-2"
    >
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
            animationBegin={0}
            animationDuration={900}
            labelLine={false}
            label={(props) => (
              <CustomLabel
                cx={props.cx ?? 0}
                cy={props.cy ?? 0}
                midAngle={props.midAngle ?? 0}
                outerRadius={props.outerRadius ?? 0}
                percent={props.percent ?? 0}
                name={props.name ?? ''}
              />
            )}
          >
            {data.map((entry) => (
              <Cell
                key={entry.category}
                fill={CATEGORY_COLORS[entry.category] ?? '#6B7280'}
                stroke="transparent"
              />
            ))}
          </Pie>
          {/* Ghost pie to render center total label inside the hole */}
          <Pie
            data={[{ value: 1 }]}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={57}
            fill="transparent"
            stroke="transparent"
            isAnimationActive={false}
            label={({ cx, cy }: { cx: number; cy: number }) => (
              <CenterLabel cx={cx} cy={cy} total={total} />
            )}
            labelLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
