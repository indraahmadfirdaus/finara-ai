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
              maxWidth: 200,
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
        style={{
          width: 64,
          height: 64,
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
  // placeholder — diisi Task 2
  return null
}
