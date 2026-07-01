'use client'

import { useEffect, useRef } from 'react'
import type { DonutData } from '@/lib/dashboard/insightTypes'

const COLOR_MAP: Record<string, string> = {
  green: 'var(--success)',
  red: 'var(--danger)',
  purple: 'var(--accent)',
  amber: 'var(--warning)',
}

export default function InsightDonut({ data }: { data: DonutData }) {
  const circleRefs = useRef<(SVGCircleElement | null)[]>([])

  const R = 36
  const cx = 48
  const cy = 48
  const circumference = 2 * Math.PI * R

  const total = data.segments.reduce((s, seg) => s + seg.value, 0) || 1
  let cumPercent = 0

  useEffect(() => {
    circleRefs.current.forEach((el, i) => {
      if (!el) return
      const seg = data.segments[i]
      const pct = seg.value / total
      const dash = pct * circumference
      el.style.strokeDasharray = `0 ${circumference}`
      setTimeout(() => {
        el.style.transition = 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)'
        el.style.strokeDasharray = `${dash} ${circumference - dash}`
      }, i * 150)
    })
  }, [data.segments, circumference, total])

  return (
    <div className="mt-3 flex items-center gap-4">
      <div style={{ width: 96, height: 96, flexShrink: 0 }}>
        <svg viewBox="0 0 96 96" style={{ width: 96, height: 96, transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--bg-base)" strokeWidth="10" />
          {data.segments.map((seg, i) => {
            const offset = cumPercent * circumference
            cumPercent += seg.value / total
            return (
              <circle
                key={i}
                ref={el => { circleRefs.current[i] = el }}
                cx={cx} cy={cy} r={R}
                fill="none"
                stroke={COLOR_MAP[seg.color] ?? 'var(--accent)'}
                strokeWidth="10"
                strokeDasharray={`0 ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            )
          })}
          <text
            x={cx} y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: 13,
              fontWeight: 700,
              fill: 'var(--text-primary)',
              transform: 'rotate(90deg)',
              transformOrigin: `${cx}px ${cy}px`,
            }}
          >
            {data.center_label}
          </text>
        </svg>
      </div>

      <div className="flex flex-col gap-1.5">
        {data.segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: COLOR_MAP[seg.color] ?? 'var(--accent)' }}
            />
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
