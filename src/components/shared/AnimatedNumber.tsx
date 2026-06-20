'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion'
import { formatIDR } from '@/lib/utils/currency'

interface AnimatedNumberProps {
  value: number
  currency?: boolean
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export default function AnimatedNumber({
  value,
  currency = false,
  prefix = '',
  suffix = '',
  duration = 1500,
  className = '',
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { duration, bounce: 0 })
  const display = useTransform(spring, (v) => {
    if (currency) return formatIDR(Math.round(v))
    return `${prefix}${Math.round(v).toLocaleString('id-ID')}${suffix}`
  })

  const prevValue = useRef(0)

  useEffect(() => {
    motionValue.set(prevValue.current)
    spring.set(prevValue.current)
    motionValue.set(value)
    prevValue.current = value
  }, [value, motionValue, spring])

  return <motion.span className={className}>{display}</motion.span>
}
