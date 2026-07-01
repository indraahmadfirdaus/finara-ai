'use client'

import { useEffect, useRef } from 'react'
import type { SparklineData } from '@/lib/dashboard/insightTypes'

export default function InsightSparkline({ data }: { data: SparklineData }) {
  const pathRef = useRef<SVGPolylineElement>(null)

  const points = data.points
  if (points.length < 2) return null

  const W = 300
  const H = 48
  const pad = 4
  const max = Math.max(...points, 1)
  const min = Math.min(...points)
  const range = max - min || 1

  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return `${x},${y}`
  })
  const polylinePoints = coords.join(' ')

  // Green = spending went down (last < first), red = spending went up
  const isDown = points[points.length - 1] <= points[0]
  const strokeColor = isDown ? 'var(--success)' : 'var(--danger)'

  useEffect(() => {
    const el = pathRef.current
    if (!el) return
    const len = el.getTotalLength?.() ?? 300
    el.style.strokeDasharray = `${len}`
    el.style.strokeDashoffset = `${len}`
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)'
      el.style.strokeDashoffset = '0'
    })
  }, [])

  return (
    <div className="mt-3 w-full overflow-hidden rounded-lg" style={{ background: 'var(--bg-base)' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 48, display: 'block' }}
        preserveAspectRatio="none"
      >
        <polyline
          ref={pathRef}
          points={polylinePoints}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
