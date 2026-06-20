'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { ArrowRight, Sparkles, ShieldCheck, Zap, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

const DEMO = [
  { role: 'user', text: 'beli makan siang 28rb' },
  { role: 'ai', text: 'Siap, dicatat ya! 🍜', card: { label: 'Makanan', amount: 28000, type: 'expense' } },
  { role: 'user', text: 'rekap pengeluaran minggu ini' },
  { role: 'ai', text: 'Minggu ini kamu udah keluar **Rp 312.000**. Terbanyak di Makanan (47%). Masih aman! 👍' },
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
        background: 'var(--land-glass)',
        border: `1px solid ${isIncome ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        borderLeft: `3px solid ${isIncome ? 'var(--success)' : 'var(--danger)'}`,
      }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-xs font-bold" style={{ color: isIncome ? 'var(--success)' : 'var(--danger)' }}>
        {isIncome ? '+' : '-'}{formatIDR(amount)}
      </span>
    </motion.div>
  )
}

function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') ? (
          <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// Animated theme icon — rotates out old, rotates in new
function ThemeIcon({ theme }: { theme: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'flex' }}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </motion.span>
    </AnimatePresence>
  )
}

function ChatDemo() {
  const [shown, setShown] = useState<number[]>([])
  const [typing, setTyping] = useState(false)
  const [userTypingIdx, setUserTypingIdx] = useState<number | null>(null)
  const [userTypingText, setUserTypingText] = useState('')
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function play() {
      await delay(800)
      if (cancelled) return

      for (let i = 0; i < DEMO.length; i++) {
        const item = DEMO[i]
        if (item.role === 'user') {
          setUserTypingIdx(i)
          setUserTypingText('')
          for (let c = 0; c <= item.text.length; c++) {
            if (cancelled) return
            setUserTypingText(item.text.slice(0, c))
            await delay(38 + Math.random() * 28)
          }
          await delay(200)
          setUserTypingIdx(null)
          setShown((prev) => [...prev, i])
          await delay(400)
        } else {
          setTyping(true)
          await delay(900 + Math.random() * 400)
          if (cancelled) return
          setTyping(false)
          setShown((prev) => [...prev, i])
          await delay(600)
        }
      }

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

  // Scroll only the messages container — never the page
  useEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown, typing, userTypingText])

  return (
    <div
      className="w-full rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: 'var(--land-surface)',
        border: '1px solid var(--land-glass-border)',
        height: 400,
        maxWidth: 320,
        boxShadow: '0 40px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(124,92,252,0.12), inset 0 1px 0 var(--land-glass-border)',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--land-glass-border)' }}
      >
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent-dim)' }}
        >
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
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>finara</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 10 }}>Online</p>
          </div>
        </div>
      </div>

      {/* Scrollable messages */}
      <div
        ref={msgsRef}
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex-1 min-h-0" />

        <AnimatePresence initial={false}>
          {DEMO.map((item, i) => {
            if (!shown.includes(i)) return null
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
                      ? {
                          background: 'linear-gradient(135deg, var(--bubble-user-from), var(--bubble-user-to))',
                          color: '#fff',
                          borderBottomRightRadius: 4,
                        }
                      : {
                          background: 'var(--land-chat-ai)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--land-chat-ai-border)',
                          borderBottomLeftRadius: 4,
                          transition: 'background 0.25s ease',
                        }
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

          {userTypingIdx !== null && (
            <motion.div
              key="user-typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end"
            >
              <div
                className="px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%]"
                style={{
                  background: 'linear-gradient(135deg, var(--bubble-user-from), var(--bubble-user-to))',
                  color: '#fff',
                  borderBottomRightRadius: 4,
                }}
              >
                {userTypingText || ' '}
                <span
                  className="inline-block w-0.5 h-3 ml-0.5 align-middle"
                  style={{ background: 'rgba(255,255,255,0.7)', animation: 'cursor-blink 0.8s step-end infinite' }}
                />
              </div>
            </motion.div>
          )}

          {typing && (
            <motion.div
              key="ai-typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2"
            >
              <div
                className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-dim)' }}
              >
                <svg width="12" height="12" viewBox="0 0 72 72" fill="none">
                  <circle cx="36" cy="36" r="28" stroke="#A78BFA" strokeWidth="4" />
                  <path d="M22 38 Q29 28 36 36 Q43 44 50 34" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round" fill="none" />
                  <circle cx="36" cy="36" r="4" fill="#A78BFA" />
                </svg>
              </div>
              <div
                className="rounded-2xl"
                style={{
                  background: 'var(--land-chat-ai)',
                  border: '1px solid var(--land-chat-ai-border)',
                  borderBottomLeftRadius: 4,
                  transition: 'background 0.25s ease',
                }}
              >
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fake input */}
      <div className="px-3 pb-3 pt-1 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
          style={{
            background: 'var(--land-chat-input-bg)',
            border: '1px solid var(--land-chat-input-border)',
            transition: 'background 0.25s ease',
          }}
        >
          <span className="flex-1 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Ketik pesan...</span>
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#FBB724,#F97316)' }}
          >
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
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: d, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 rounded-2xl p-5"
      style={{
        background: 'var(--land-glass)',
        border: '1px solid var(--land-glass-border)',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
    </motion.div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: 'var(--land-bg)',
        color: 'var(--text-primary)',
        transition: 'background 0.25s ease, color 0.15s ease',
      }}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div style={{
          position: 'absolute', top: '-15%', right: '-5%',
          width: '55vw', height: '55vw', maxWidth: 640, maxHeight: 640,
          borderRadius: '50%',
          background: `radial-gradient(circle, var(--land-orb-purple) 0%, transparent 65%)`,
          transition: 'background 0.4s ease',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-8%',
          width: '42vw', height: '42vw', maxWidth: 480, maxHeight: 480,
          borderRadius: '50%',
          background: `radial-gradient(circle, var(--land-orb-gold) 0%, transparent 65%)`,
          transition: 'background 0.4s ease',
        }} />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8 lg:px-16"
      >
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" stroke="url(#navg)" strokeWidth="2.5" />
            <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="url(#navg)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="36" r="3.5" fill="url(#navg)" />
            <defs>
              <linearGradient id="navg" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A78BFA" /><stop offset="1" stopColor="#7C5CFC" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-sm font-bold" style={{ letterSpacing: '-0.02em' }}>finara</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle with animated icon */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={toggle}
            className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'var(--land-nav-btn)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--land-glass-border)',
              transition: 'background 0.2s ease',
            }}
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--land-glass-border)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--land-nav-btn)')}
          >
            <ThemeIcon theme={theme} />
          </motion.button>

          <button
            onClick={() => router.push('/login')}
            className="hidden sm:block px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Masuk
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/register')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-black"
            style={{ background: 'linear-gradient(135deg,#FBB724,#F97316)' }}
          >
            Daftar gratis
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 px-5 sm:px-8 lg:px-16 pt-6 pb-16 lg:pt-12 lg:pb-24">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-20">

          {/* Left copy */}
          <div className="flex-1 lg:max-w-lg text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid rgba(124,92,252,0.25)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              AI Finance Assistant · Bahasa Indonesia
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4"
              style={{ letterSpacing: '-0.03em' }}
            >
              Catat keuangan{' '}
              <span style={{
                background: 'linear-gradient(135deg,#A78BFA 0%,#7C5CFC 50%,#FBB724 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                cukup dengan chat
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5 }}
              className="text-sm sm:text-base leading-relaxed mb-7"
              style={{ color: 'var(--text-muted)' }}
            >
              Gak perlu aplikasi ribet. Finara ngerti bahasa sehari-hari kamu —
              cukup ketik kayak chat sama teman, data keuangan langsung tersimpan rapi.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/register')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-black"
                style={{ background: 'linear-gradient(135deg,#FBB724 0%,#F97316 100%)' }}
              >
                Mulai gratis sekarang
                <ArrowRight size={15} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/login')}
                className="flex items-center justify-center px-6 py-3.5 rounded-2xl text-sm font-medium"
                style={{
                  background: 'var(--land-tile-btn)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--land-tile-btn-border)',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--land-glass-border)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--land-tile-btn)')}
              >
                Sudah punya akun
              </motion.button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.52 }}
              className="mt-4 text-xs"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            >
              Gratis selamanya · Tidak perlu kartu kredit · Data aman & terenkripsi
            </motion.p>
          </div>

          {/* Right — chat demo */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex justify-center lg:block lg:flex-shrink-0"
          >
            <ChatDemo />
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 flex items-center gap-4 px-5 sm:px-8 lg:px-16 mb-8 max-w-6xl mx-auto">
        <div className="flex-1 h-px" style={{ background: 'var(--land-separator)' }} />
        <span
          className="text-xs font-semibold tracking-widest uppercase flex-shrink-0"
          style={{ color: 'var(--text-muted)', opacity: 0.6 }}
        >
          Kenapa Finara?
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--land-separator)' }} />
      </div>

      {/* Features */}
      <section className="relative z-10 px-5 sm:px-8 lg:px-16 pb-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4">
          {FEATURES.map((f, i) => (
            <FeatureTile key={f.title} {...f} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 px-5 sm:px-8 lg:px-16 py-6 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderTop: '1px solid var(--land-separator)' }}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" stroke="var(--accent)" strokeWidth="2.5" />
            <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="36" r="3.5" fill="var(--accent)" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>finara · v1.0 Beta</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Dibuat untuk Indonesia 🇮🇩</span>
      </footer>
    </div>
  )
}
