'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react'

// Chat demo conversation
const DEMO = [
  { role: 'user', text: 'beli makan siang 28rb' },
  { role: 'ai', text: 'Siap, dicatat ya! 🍜', card: { label: 'Makanan', amount: 28000, type: 'expense' } },
  { role: 'user', text: 'rekap pengeluaran minggu ini' },
  { role: 'ai', text: 'Minggu ini kamu udah keluar **Rp 312.000** dari budget bulanan. Terbanyak di Makanan (47%). Masih aman kok! 👍' },
  { role: 'user', text: 'gaji masuk 5 juta' },
  { role: 'ai', text: 'Yeay gajian! 🎉 Rp 5.000.000 masuk ke pemasukan.', card: { label: 'Gaji', amount: 5000000, type: 'income' } },
]

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Chat aja, beres',
    desc: 'Catat transaksi kayak chat biasa. "Beli bensin 50rb" — Finara langsung simpan.',
    color: '#A78BFA',
    bg: 'rgba(124,92,252,0.12)',
  },
  {
    icon: Zap,
    title: 'Rekap instan',
    desc: 'Tanya kapan aja: "pengeluaran minggu ini berapa?" Finara jawab real-time dari data kamu.',
    color: '#FBB724',
    bg: 'rgba(251,183,36,0.12)',
  },
  {
    icon: ShieldCheck,
    title: 'Data kamu, privasi kamu',
    desc: 'Semua data dienkripsi dan hanya bisa diakses sama kamu. Tidak ada yang snoop.',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
  },
]

function formatIDR(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

// Typing bubble component
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--accent-light)' }}
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.16 }}
        />
      ))}
    </div>
  )
}

function MiniCard({ label, amount, type }: { label: string; amount: number; type: string }) {
  const isIncome = type === 'income'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="mt-2 px-3 py-2.5 rounded-xl flex items-center justify-between"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${isIncome ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        borderLeft: `3px solid ${isIncome ? '#22C55E' : '#EF4444'}`,
      }}
    >
      <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      <span className="text-xs font-bold" style={{ color: isIncome ? '#22C55E' : '#EF4444' }}>
        {isIncome ? '+' : '-'}{formatIDR(amount)}
      </span>
    </motion.div>
  )
}

// Inline bold renderer
function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') ? (
          <strong key={i} style={{ color: '#fff', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}

// Chat demo — auto-advances through DEMO array with typing delays
function ChatDemo() {
  const [shown, setShown] = useState<number[]>([])
  const [typing, setTyping] = useState(false)
  const [userTypingIdx, setUserTypingIdx] = useState<number | null>(null)
  const [userTypingText, setUserTypingText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function play() {
      // Initial pause
      await delay(800)
      if (cancelled) return

      for (let i = 0; i < DEMO.length; i++) {
        const item = DEMO[i]

        if (item.role === 'user') {
          // Simulate user typing char by char
          setUserTypingIdx(i)
          setUserTypingText('')
          for (let c = 0; c <= item.text.length; c++) {
            if (cancelled) return
            setUserTypingText(item.text.slice(0, c))
            await delay(40 + Math.random() * 30)
          }
          await delay(200)
          setUserTypingIdx(null)
          setShown((prev) => [...prev, i])
          await delay(400)
        } else {
          // Show AI typing indicator
          setTyping(true)
          await delay(900 + Math.random() * 400)
          if (cancelled) return
          setTyping(false)
          setShown((prev) => [...prev, i])
          await delay(600)
        }
      }

      // Loop after pause
      await delay(3000)
      if (!cancelled) {
        setShown([])
        setTyping(false)
        setUserTypingIdx(null)
        setUserTypingText('')
        play()
      }
    }

    play()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [shown, typing, userTypingText])

  return (
    <div
      className="w-full max-w-xs mx-auto rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: '#13111E',
        border: '1px solid rgba(255,255,255,0.08)',
        height: 420,
        boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,92,252,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Fake status bar */}
      <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,92,252,0.2)' }}>
          <svg width="16" height="16" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="28" stroke="url(#dlg)" strokeWidth="3" />
            <path d="M22 38 Q29 28 36 36 Q43 44 50 34" stroke="url(#dlg)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="36" r="3" fill="url(#dlg)" />
            <defs>
              <linearGradient id="dlg" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A78BFA" /><stop offset="1" stopColor="#7C5CFC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>finara</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden px-3 py-3 space-y-2.5 flex flex-col justify-end">
        <AnimatePresence initial={false}>
          {DEMO.map((item, i) => {
            const isVisible = shown.includes(i)
            if (!isVisible) return null
            const isUser = item.role === 'user'

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className="px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%]"
                  style={
                    isUser
                      ? { background: 'linear-gradient(135deg, #7C5CFC, #6B46FC)', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: '#1E1E2E', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderBottomLeftRadius: 4 }
                  }
                >
                  <InlineMd text={item.text} />
                </div>
                {!isUser && item.card && (
                  <div className="w-full max-w-[85%]">
                    <MiniCard {...item.card} />
                  </div>
                )}
              </motion.div>
            )
          })}

          {/* User currently typing */}
          {userTypingIdx !== null && (
            <motion.div
              key="user-typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end"
            >
              <div
                className="px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%]"
                style={{ background: 'linear-gradient(135deg, #7C5CFC, #6B46FC)', color: '#fff', borderBottomRightRadius: 4 }}
              >
                {userTypingText || ' '}
                <span
                  className="inline-block w-0.5 h-3 ml-0.5 align-middle"
                  style={{ background: 'rgba(255,255,255,0.7)', animation: 'cursor-blink 0.8s step-end infinite' }}
                />
              </div>
            </motion.div>
          )}

          {/* AI typing indicator */}
          {typing && (
            <motion.div
              key="ai-typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2"
            >
              <div className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,92,252,0.2)' }}>
                <svg width="12" height="12" viewBox="0 0 72 72" fill="none">
                  <circle cx="36" cy="36" r="28" stroke="#A78BFA" strokeWidth="4" />
                  <path d="M22 38 Q29 28 36 36 Q43 44 50 34" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round" fill="none" />
                  <circle cx="36" cy="36" r="4" fill="#A78BFA" />
                </svg>
              </div>
              <div className="rounded-2xl" style={{ background: '#1E1E2E', border: '1px solid rgba(255,255,255,0.07)', borderBottomLeftRadius: 4 }}>
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Fake input bar */}
      <div className="px-3 pb-3 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="flex-1 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Ketik pesan...</span>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FBB724,#F97316)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureTile({ icon: Icon, title, desc, color, bg, delay: d }: typeof FEATURES[0] & { delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: d, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>{title}</p>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>
    </motion.div>
  )
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#0D0D14', color: '#F1F1F3' }}>

      {/* Ambient background — 2 orbs, not symmetric */}
      <div
        className="pointer-events-none fixed"
        style={{
          top: '-10vh', left: '55%',
          width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 65%)',
          filter: 'blur(1px)',
        }}
      />
      <div
        className="pointer-events-none fixed"
        style={{
          bottom: '5vh', left: '-10vw',
          width: '45vw', height: '45vw', maxWidth: 500, maxHeight: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,183,36,0.1) 0%, transparent 65%)',
          filter: 'blur(1px)',
        }}
      />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-16"
      >
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" stroke="url(#navg)" strokeWidth="2.5" />
            <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="url(#navg)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="36" r="3.5" fill="url(#navg)" />
            <defs>
              <linearGradient id="navg" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A78BFA" /><stop offset="1" stopColor="#7C5CFC" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-base font-bold" style={{ letterSpacing: '-0.02em' }}>finara</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          >
            Masuk
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/register')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-black"
            style={{ background: 'linear-gradient(135deg, #FBB724, #F97316)' }}
          >
            Daftar gratis
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 px-6 lg:px-16 pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left — copy */}
          <div className="flex-1 lg:max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(124,92,252,0.15)', color: '#A78BFA', border: '1px solid rgba(124,92,252,0.25)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              AI Finance Assistant · Bahasa Indonesia
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl lg:text-5xl font-bold leading-tight mb-5"
              style={{ letterSpacing: '-0.03em' }}
            >
              Catat keuangan{' '}
              <span style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C5CFC 50%, #FBB724 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                cukup dengan chat
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5 }}
              className="text-base leading-relaxed mb-8"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Gak perlu aplikasi ribet. Finara ngerti bahasa sehari-hari kamu —
              cukup ketik kayak chat sama teman, data keuangan langsung tersimpan rapi.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/register')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-black"
                style={{ background: 'linear-gradient(135deg, #FBB724 0%, #F97316 100%)' }}
              >
                Mulai gratis sekarang
                <ArrowRight size={15} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/login')}
                className="flex items-center justify-center px-6 py-3.5 rounded-2xl text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                Sudah punya akun
              </motion.button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="mt-4 text-xs"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Gratis selamanya · Tidak perlu kartu kredit · Data aman & terenkripsi
            </motion.p>
          </div>

          {/* Right — live chat demo */}
          <motion.div
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:w-auto flex-shrink-0"
          >
            <ChatDemo />
          </motion.div>
        </div>
      </section>

      {/* Divider hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="relative z-10 flex items-center gap-4 px-6 lg:px-16 mb-10 max-w-6xl mx-auto"
      >
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Kenapa Finara?</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </motion.div>

      {/* Features */}
      <section className="relative z-10 px-6 lg:px-16 pb-24">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4">
          {FEATURES.map((f, i) => (
            <FeatureTile key={f.title} {...f} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-16 py-8 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" stroke="#7C5CFC" strokeWidth="2.5" />
            <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="#7C5CFC" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="36" r="3.5" fill="#7C5CFC" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>finara · v1.0 Beta</span>
        </div>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Dibuat untuk Indonesia 🇮🇩</span>
      </footer>

    </div>
  )
}
