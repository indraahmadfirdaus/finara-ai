'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Sun, Moon,
  MessageCircle, BarChart2, Target, HandCoins,
  Landmark, ScanLine, Zap, ShieldCheck,
} from 'lucide-react'
import { useTheme } from '@/lib/theme'

// ── Animated theme icon (same pattern as landing page) ──────────────────────
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

// ── Tile: Anggaran & Goals ────────────────────────────────────────────────────
function AnggrangTile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const bars = [
    { label: 'Makanan', pct: 72, color: '#F59E0B' },
    { label: 'Transport', pct: 40, color: 'var(--accent)' },
    { label: 'Goal Bali', pct: 60, color: 'var(--success)' },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)' }}>
          <Target size={16} style={{ color: '#F59E0B' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Anggaran & Goals</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Set budget bulanan dan pantau progress tabungan kamu.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {bars.map((bar, i) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{bar.label}</span>
              <span className="text-xs font-semibold" style={{ color: bar.color }}>{bar.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--land-separator)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: bar.color }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${bar.pct}%` } : { width: 0 }}
                transition={{ duration: 0.7, delay: 0.25 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Tile: Hutang & Piutang ────────────────────────────────────────────────────
function HutangTile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setSettled(true), 2200)
    return () => clearTimeout(t)
  }, [inView])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.21, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.12)' }}>
          <HandCoins size={16} style={{ color: 'var(--success)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Hutang & Piutang</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Catat siapa yang berhutang, selesaikan satu tap.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {/* Chip: Budi — settles after inView */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={inView ? { opacity: settled ? 0.35 : 1, x: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--danger)', textDecoration: settled ? 'line-through' : 'none' }}>Budi</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rp 50.000</span>
          </div>
          <AnimatePresence>
            {settled && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}
              >
                Lunas ✓
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
        {/* Chip: Sari */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Sari</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rp 120.000</span>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Tile: Privasi ─────────────────────────────────────────────────────────────
function PrivasiTile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const labels = ['🔒 Encrypted', '🛡️ Row Level Security', '🚫 No Data Sharing']

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.12)' }}>
          <motion.div
            animate={inView ? { scale: [1, 1.12, 1] } : {}}
            transition={{ delay: 0.4, duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
          </motion.div>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Privasi Terjaga</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Data kamu dienkripsi dan hanya bisa diakses akunmu sendiri.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {labels.map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.35 + i * 0.15, duration: 0.4 }}
            className="text-xs px-3 py-2 rounded-xl font-medium"
            style={{ background: 'rgba(34,197,94,0.08)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.15)' }}
          >
            {label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Tile: AI Proaktif ─────────────────────────────────────────────────────────
function AITile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const insights = [
    { emoji: '⚠️', text: 'Budget Makanan 85% terpakai' },
    { emoji: '📈', text: 'Pengeluaran naik 23% vs minggu lalu' },
    { emoji: '🎯', text: 'Goal Bali sudah 60%!' },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.0, ease: [0.22, 1, 0.36, 1] }}
      className="sm:col-span-2 lg:col-span-3 rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(251,183,36,0.12)' }}>
          <Zap size={16} style={{ color: '#FBB724' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Proaktif</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Finara kasih insight otomatis — budget hampir habis, pola pengeluaran aneh, dan lainnya.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {insights.map((ins, i) => (
          <motion.div
            key={ins.text}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.2, type: 'spring', stiffness: 320, damping: 24 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(251,183,36,0.1)', color: '#FBB724', border: '1px solid rgba(251,183,36,0.2)' }}
          >
            <span>{ins.emoji}</span>
            {ins.text}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function FeaturesPage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          background: 'radial-gradient(circle, var(--land-orb-purple) 0%, transparent 65%)',
          transition: 'background 0.4s ease',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-8%',
          width: '42vw', height: '42vw', maxWidth: 480, maxHeight: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--land-orb-gold) 0%, transparent 65%)',
          transition: 'background 0.4s ease',
        }} />
      </div>

      {/* Sticky nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 sm:px-8 lg:px-16"
        style={{
          background: scrolled ? 'var(--land-surface)' : 'transparent',
          borderBottom: scrolled ? '1px solid var(--land-separator)' : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2.5"
        >
          <svg width="26" height="26" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" stroke="url(#fn1)" strokeWidth="2.5" />
            <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="url(#fn1)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="36" r="3.5" fill="url(#fn1)" />
            <defs>
              <linearGradient id="fn1" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A78BFA" /><stop offset="1" stopColor="#7C5CFC" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-sm font-bold" style={{ letterSpacing: '-0.02em' }}>finara</span>
        </button>

        <div className="flex items-center gap-2">
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
            Daftar
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 px-5 sm:px-8 lg:px-16 pt-32 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
          style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent-light)',
            border: '1px solid rgba(124,92,252,0.25)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Semua yang bisa Finara lakukan
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-[1.15] mb-4"
          style={{ letterSpacing: '-0.03em' }}
        >
          Satu chat,{' '}
          <span style={{
            background: 'linear-gradient(135deg,#A78BFA 0%,#7C5CFC 50%,#FBB724 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            semua terkontrol
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          Dari catat belanja sampai pantau aset — semuanya lewat obrolan biasa.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/register')}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-black"
          style={{ background: 'linear-gradient(135deg,#FBB724 0%,#F97316 100%)' }}
        >
          Coba gratis sekarang
          <ArrowRight size={15} />
        </motion.button>
      </section>

      {/* Bento Grid */}
      <section className="relative z-10 px-5 sm:px-8 lg:px-16 pb-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

          {/* Tile: Chat Natural — placeholder, filled in Task 4 */}
          <div className="sm:col-span-1 lg:col-span-1 lg:row-span-2 rounded-2xl min-h-[320px] sm:min-h-[360px]"
            style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />

          {/* Tile: Dashboard — placeholder, filled in Task 4 */}
          <div className="sm:col-span-1 lg:col-span-1 lg:row-span-2 rounded-2xl min-h-[320px] sm:min-h-[360px]"
            style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />

          {/* Tile 3: Anggaran & Goals */}
          <AnggrangTile />

          {/* Tile 4: Hutang & Piutang */}
          <HutangTile />

          {/* Tile 5: Aset — placeholder, filled in Task 5 */}
          <div className="sm:col-span-2 lg:col-span-2 rounded-2xl min-h-[160px]"
            style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />

          {/* Tile 6: Scan Struk — placeholder, filled in Task 5 */}
          <div className="sm:col-span-2 lg:col-span-2 rounded-2xl min-h-[160px]"
            style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />

          {/* Tile 7: Privasi */}
          <PrivasiTile />

          {/* Tile 8: AI Proaktif */}
          <AITile />

        </div>
      </section>

      {/* Bottom CTA strip */}
      <section className="relative z-10 px-5 sm:px-8 lg:px-16 py-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="text-xl font-bold mb-6"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Siap coba Finara?
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/register')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg,#FBB724 0%,#F97316 100%)' }}
          >
            Daftar Gratis
            <ArrowRight size={15} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-medium"
            style={{
              background: 'var(--land-tile-btn)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--land-tile-btn-border)',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--land-glass-border)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--land-tile-btn)')}
          >
            <ArrowLeft size={15} />
            Kembali ke beranda
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 px-5 sm:px-8 lg:px-16 py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
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
        <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          Dibuat oleh{' '}
          <span className="font-semibold" style={{ color: 'var(--text-secondary)', opacity: 1 }}>indrafrds</span>
        </span>
      </footer>
    </div>
  )
}
