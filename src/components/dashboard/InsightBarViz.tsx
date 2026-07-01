'use client'

import { useEffect, useRef } from 'react'
import { getCategoryMeta } from '@/lib/utils/categoryIcon'
import type { BarData } from '@/lib/dashboard/insightTypes'

export default function InsightBarViz({ data }: { data: BarData }) {
  const barsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const timers = barsRef.current.map((el, i) =>
      setTimeout(() => {
        if (el) el.style.width = `${data.items[i]?.percent ?? 0}%`
      }, i * 60),
    )
    return () => timers.forEach(clearTimeout)
  }, [data.items])

  return (
    <div className="mt-3 flex flex-col gap-2">
      {data.items.map((item, i) => {
        const meta = getCategoryMeta(item.label, 'expense')
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {item.label}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {item.percent}%
              </span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 5, background: 'var(--bg-base)' }}
            >
              <div
                ref={el => { if (el) barsRef.current[i] = el }}
                className="h-full rounded-full"
                style={{
                  width: '0%',
                  background: meta.color,
                  transition: `width 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
