'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type MascotState = 'idle' | 'wave' | 'worried' | 'angry' | 'excited' | 'happy'

export interface MascotOrbProps {
  state: MascotState
  showBubble: boolean
}

const GLOW: Record<MascotState, string> = {
  idle:    'rgba(124,92,252,0.3)',
  wave:    'rgba(124,92,252,0.6)',
  worried: 'rgba(245,158,11,0.5)',
  angry:   'rgba(239,68,68,0.5)',
  excited: 'rgba(6,182,212,0.5)',
  happy:   'rgba(34,197,94,0.5)',
}

const BUBBLE: Record<MascotState, string | null> = {
  idle:    null,
  wave:    'Hei! Gue Finara, asisten keuangan kamu 👋',
  worried: 'Eh, pengeluaranmu naik nih... 👀',
  angry:   'Ini beneran ga diatur?? 😤',
  excited: 'Finara bakal hadir di mana kamu ngobrol!',
  happy:   'Ayo! Gue udah nunggu nih 🎉',
}

export default function MascotOrb({ state, showBubble }: MascotOrbProps) {
  return (
    <div
      className="fixed z-40 flex items-center gap-2"
      style={{ right: 24, top: '50%', transform: 'translateY(-50%)' }}
    >
      {/* Bubble — kiri dari orb */}
      <AnimatePresence>
        {showBubble && BUBBLE[state] && (
          <motion.div
            key={state}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="rounded-2xl px-3 py-2 text-xs leading-relaxed"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              maxWidth: 'min(200px, 45vw)',
              borderBottomRightRadius: 4,
            }}
          >
            {BUBBLE[state]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-12 h-12 lg:w-16 lg:h-16"
        style={{
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #A78BFA 0%, #7C5CFC 100%)',
          boxShadow: `0 0 24px 4px ${GLOW[state]}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          position: 'relative',
          flexShrink: 0,
          transition: 'box-shadow 0.4s ease',
        }}
      >
        {/* Layar ekspresi */}
        <OrbFace state={state} />
      </motion.div>
    </div>
  )
}

function OrbFace({ state }: { state: MascotState }) {
  // Layar: rounded rect di tengah-bawah orb
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 36,
        height: 20,
        borderRadius: 6,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Eyes state={state} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Eyes({ state }: { state: MascotState }) {
  // idle & wave: dot berkedip / arc happy
  if (state === 'idle') {
    return (
      <>
        <BlinkDot />
        <BlinkDot delay={0.3} />
      </>
    )
  }
  if (state === 'wave' || state === 'happy') {
    // ^ ^ arc
    return (
      <svg width="22" height="8" viewBox="0 0 22 8" fill="none">
        <path d="M1 7 Q4 1 7 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M15 7 Q18 1 21 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
  if (state === 'worried' || state === 'angry') {
    // > < nervous / angry
    return (
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
        {/* Brow turun untuk angry */}
        {state === 'angry' && (
          <>
            <line x1="1" y1="1" x2="7" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="21" y1="1" x2="15" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
        {/* Mata oval kecil */}
        <ellipse cx="5" cy="7" rx="2.5" ry="2" fill="white" />
        <ellipse cx="17" cy="7" rx="2.5" ry="2" fill="white" />
      </svg>
    )
  }
  if (state === 'excited') {
    // ★ ★
    return (
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
        <text x="1" y="9" fontSize="8" fill="white">★</text>
        <text x="13" y="9" fontSize="8" fill="white">★</text>
      </svg>
    )
  }
  return null
}

function BlinkDot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }}
      animate={{ scaleY: [1, 0.1, 1] }}
      transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5 + delay, delay }}
    />
  )
}
