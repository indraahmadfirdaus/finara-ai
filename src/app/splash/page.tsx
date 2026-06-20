'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.replace('/login'), 2800)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#0D0D14' }}
    >
      {/* ambient orbs */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(124,92,252,0.28) 0%, transparent 70%)',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }}
        className="absolute w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)',
          bottom: '20%',
          right: '10%',
        }}
      />

      {/* Logo mark — abstract wave/coin shape, no letter */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 relative"
      >
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* outer ring */}
          <circle cx="36" cy="36" r="34" stroke="url(#logoGrad)" strokeWidth="2.5" />
          {/* inner wave paths */}
          <path
            d="M20 38 Q27 28 36 36 Q45 44 52 34"
            stroke="url(#logoGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M20 44 Q27 34 36 42 Q45 50 52 40"
            stroke="url(#waveGrad2)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
          {/* center dot */}
          <circle cx="36" cy="36" r="3.5" fill="url(#logoGrad)" />
          <defs>
            <linearGradient id="logoGrad" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#7C5CFC" />
            </linearGradient>
            <linearGradient id="waveGrad2" x1="20" y1="36" x2="52" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FBB724" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Wordmark */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
        className="text-center"
      >
        <h1
          className="text-4xl font-bold tracking-tight mb-2"
          style={{ color: '#F1F1F3', letterSpacing: '-0.03em' }}
        >
          finara
        </h1>
        <p className="text-sm font-medium" style={{ color: 'rgba(161,161,170,0.8)', letterSpacing: '0.12em' }}>
          KEUANGAN PRIBADIMU
        </p>
      </motion.div>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2"
      >
        <div
          className="w-16 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 2, ease: 'easeInOut', delay: 0.6 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7C5CFC, #FBB724)' }}
          />
        </div>
      </motion.div>
    </div>
  )
}
