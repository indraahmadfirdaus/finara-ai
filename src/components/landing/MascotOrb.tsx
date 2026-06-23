'use client'

import { motion, AnimatePresence } from 'framer-motion'

export type MascotState = 'idle' | 'wave' | 'worried' | 'angry' | 'excited' | 'happy'

// Anchor point in viewport coordinates — set by parent via getBoundingClientRect
export interface OrbAnchor {
  x: number  // left edge of orb center
  y: number  // top edge of orb center
}

export interface MascotOrbProps {
  state: MascotState
  showBubble: boolean
  anchor: OrbAnchor
  bubbleDirection?: 'left' | 'right'  // which side bubble appears
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

const BUBBLE: Record<MascotState, string | null> = {
  idle:    null,
  wave:    'Hei! Gue Finara, asisten keuangan kamu 👋',
  worried: 'Eh, pengeluaranmu naik nih... 👀',
  angry:   'Ini beneran ga diatur?? 😤',
  excited: 'Finara bakal hadir di mana kamu ngobrol!',
  happy:   'Ayo! Gue udah nunggu nih 🎉',
}

export default function MascotOrb({
  state,
  showBubble,
  anchor,
  bubbleDirection = 'left',
}: MascotOrbProps) {
  return (
    <motion.div
      className="fixed z-40 pointer-events-none"
      // Anchor x,y is where we want the orb CENTER to be
      animate={{ x: anchor.x - ORB_SIZE / 2, y: anchor.y - ORB_SIZE / 2 }}
      transition={{ type: 'spring', stiffness: 80, damping: 18, mass: 1.2 }}
      style={{ top: 0, left: 0, width: ORB_SIZE, height: ORB_SIZE }}
    >
      {/* Bubble */}
      <AnimatePresence>
        {showBubble && BUBBLE[state] && (
          <motion.div
            key={state}
            initial={{ opacity: 0, scale: 0.85, x: bubbleDirection === 'left' ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="absolute pointer-events-none"
            style={{
              // Position bubble to the left or right of the orb
              ...(bubbleDirection === 'left'
                ? { right: ORB_SIZE + 8, top: '50%', transform: 'translateY(-50%)' }
                : { left: ORB_SIZE + 8, top: '50%', transform: 'translateY(-50%)' }),
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              ...(bubbleDirection === 'left'
                ? { borderBottomRightRadius: 4 }
                : { borderBottomLeftRadius: 4 }),
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
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: ORB_SIZE,
          height: ORB_SIZE,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #A78BFA 0%, #7C5CFC 100%)',
          boxShadow: `0 0 24px 6px ${GLOW[state]}, inset 0 1px 0 rgba(255,255,255,0.18)`,
          position: 'relative',
          transition: 'box-shadow 0.5s ease',
        }}
      >
        <OrbFace state={state} />
      </motion.div>
    </motion.div>
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
