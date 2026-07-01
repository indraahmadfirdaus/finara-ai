'use client'

import { motion, AnimatePresence, type Transition, type TargetAndTransition } from 'framer-motion'

export type MascotState = 'idle' | 'wave' | 'worried' | 'angry' | 'excited' | 'happy'

export interface MascotOrbProps {
  state: MascotState
  showBubble: boolean
  /** When true, renders inline (relative) instead of fixed bottom-right */
  inline?: boolean
  /** Override orb size in px (default 56) */
  size?: number
}

const ORB_SIZE = 56  // px, matches w-14 h-14

const GLOW: Record<MascotState, string> = {
  idle:    'rgba(124,92,252,0.3)',
  wave:    'rgba(124,92,252,0.6)',
  worried: 'rgba(245,158,11,0.5)',
  angry:   'rgba(239,68,68,0.5)',
  excited: 'rgba(6,182,212,0.5)',
  happy:   'rgba(34,197,94,0.5)',
}

// Per-state body animations
const BODY_ANIMATE: Record<MascotState, TargetAndTransition> = {
  idle:    { y: [0, -6, 0], x: 0, rotate: 0, scale: 1 },
  wave:    { y: [0, -8, 0], x: 0, rotate: [-3, 3, -3, 0], scale: 1 },
  worried: { y: [0, -3, 0], x: [-2, 2, -2, 0], rotate: [-2, 2, -2, 0], scale: 1 },
  angry:   { y: [0, -2, 0, -2, 0], x: [-4, 4, -4, 4, 0], rotate: [-5, 5, -5, 5, 0], scale: [1, 1.04, 1, 1.04, 1] },
  excited: { y: [0, -10, 0, -6, 0], x: 0, rotate: 0, scale: [1, 1.08, 1, 1.05, 1] },
  happy:   { y: [0, -9, 0], x: 0, rotate: [0, 4, 0, -4, 0], scale: [1, 1.05, 1] },
}

const BODY_TRANSITION: Record<MascotState, Transition> = {
  idle:    { duration: 3,   repeat: Infinity, ease: 'easeInOut' },
  wave:    { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  worried: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  angry:   { duration: 0.5, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' },
  excited: { duration: 0.7, repeat: Infinity, ease: 'easeOut' },
  happy:   { duration: 1.0, repeat: Infinity, ease: 'easeInOut' },
}

const BUBBLE: Record<MascotState, string | null> = {
  idle:    null,
  wave:    'Hei! Gue Finara, asisten keuangan kamu 👋',
  worried: 'Eh, pengeluaranmu naik nih... 👀',
  angry:   'Ini beneran ga diatur?? 😤',
  excited: 'Finara bakal hadir di mana kamu ngobrol!',
  happy:   'Ayo! Gue udah nunggu nih 🎉',
}

export default function MascotOrb({ state, showBubble, inline = false, size }: MascotOrbProps) {
  const orbSize = size ?? ORB_SIZE
  return (
    <div
      className={inline ? 'pointer-events-none' : 'fixed z-40 pointer-events-none'}
      style={inline
        ? { width: orbSize, height: orbSize, position: 'relative' }
        : { bottom: 24, right: 24, width: orbSize, height: orbSize, position: 'fixed' }
      }
    >
      {/* Bubble — appears above the orb */}
      <AnimatePresence mode="wait">
        {showBubble && BUBBLE[state] && (
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="absolute pointer-events-none"
            style={{
              bottom: 4,
              right: orbSize + 10,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              borderBottomRightRadius: 4,
              color: 'var(--text-primary)',
              fontSize: 12,
              lineHeight: 1.5,
              padding: '8px 12px',
              width: 'max-content',
              maxWidth: 'min(200px, 45vw)',
              whiteSpace: 'normal',
            }}
          >
            {BUBBLE[state]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb body */}
      <motion.div
        animate={BODY_ANIMATE[state]}
        transition={BODY_TRANSITION[state]}
        style={{
          width: orbSize,
          height: orbSize,
          borderRadius: '50%',
          background: state === 'angry'
            ? 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)'
            : state === 'happy' || state === 'wave'
            ? 'linear-gradient(135deg, #86EFAC 0%, #22C55E 50%, #7C5CFC 100%)'
            : state === 'excited'
            ? 'linear-gradient(135deg, #67E8F9 0%, #06B6D4 50%, #7C5CFC 100%)'
            : 'linear-gradient(135deg, #A78BFA 0%, #7C5CFC 100%)',
          boxShadow: `0 0 24px 6px ${GLOW[state]}, inset 0 1px 0 rgba(255,255,255,0.18)`,
          position: 'relative',
          transition: 'box-shadow 0.5s ease, background 0.4s ease',
        }}
      >
        <OrbFace state={state} />
      </motion.div>
    </div>
  )
}

function OrbFace({ state }: { state: MascotState }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 11,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 34,
        height: 18,
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
  if (state === 'idle') {
    return (
      <>
        <BlinkDot />
        <BlinkDot delay={0.3} />
      </>
    )
  }
  if (state === 'wave' || state === 'happy') {
    return (
      <svg width="22" height="8" viewBox="0 0 22 8" fill="none">
        <path d="M1 7 Q4 1 7 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M15 7 Q18 1 21 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
  if (state === 'worried' || state === 'angry') {
    return (
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
        {state === 'angry' && (
          <>
            <line x1="1" y1="1" x2="7" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="21" y1="1" x2="15" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
        <ellipse cx="5" cy="7" rx="2.5" ry="2" fill="white" />
        <ellipse cx="17" cy="7" rx="2.5" ry="2" fill="white" />
      </svg>
    )
  }
  if (state === 'excited') {
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
