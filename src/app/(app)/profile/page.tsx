'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sun, Moon, MessageCircle, LogOut, ChevronRight,
  TrendingUp, TrendingDown, KeyRound, Info,
} from 'lucide-react'
import PageTransition from '@/components/layout/PageTransition'
import { createClient } from '@/lib/supabase/client'
import { formatIDR } from '@/lib/utils/currency'
import { useTheme } from '@/lib/theme'

interface Stats {
  income: number
  expense: number
}

function Row({
  icon,
  label,
  value,
  onClick,
  danger,
  delay,
  right,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  onClick?: () => void
  danger?: boolean
  delay?: number
  right?: React.ReactNode
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay ?? 0, duration: 0.22 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={!onClick}
      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
      style={{ color: danger ? 'var(--danger)' : 'var(--text-primary)' }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = 'var(--bg-elevated)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ color: danger ? 'var(--danger)' : 'var(--accent-light)', flexShrink: 0 }}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && (
        <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{value}</span>
      )}
      {right ?? (onClick && <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />)}
    </motion.button>
  )
}

function Divider() {
  return <div className="mx-5" style={{ height: 1, background: 'var(--border-light)' }} />
}

function SectionLabel({ label, delay }: { label: string; delay?: number }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay ?? 0 }}
      className="px-5 pt-5 pb-1 text-xs font-semibold tracking-widest uppercase"
      style={{ color: 'var(--text-muted)' }}
    >
      {label}
    </motion.p>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [email, setEmail] = useState('')
  const [stats, setStats] = useState<Stats>({ income: 0, expense: 0 })
  const [statsLoaded, setStatsLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
    fetch('/api/transactions?period=month&limit=200')
      .then((r) => r.json())
      .then((data) => {
        const txs = data.transactions ?? []
        setStats({
          income: txs.filter((t: { type: string }) => t.type === 'income').reduce((s: number, t: { amount: number }) => s + t.amount, 0),
          expense: txs.filter((t: { type: string }) => t.type === 'expense').reduce((s: number, t: { amount: number }) => s + t.amount, 0),
        })
        setStatsLoaded(true)
      })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initial = email ? email[0].toUpperCase() : '?'
  const username = email ? email.split('@')[0] : ''

  return (
    <PageTransition>
      <div className="min-h-screen lg:max-w-2xl lg:mx-auto" style={{ background: 'var(--bg-base)' }}>

        {/* Hero header — full bleed accent */}
        <div
          className="relative flex flex-col items-center pt-14 pb-8 px-6"
          style={{ background: 'var(--accent)' }}
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4"
            style={{ background: 'rgba(255,255,255,0.18)', outline: '4px solid rgba(255,255,255,0.28)' }}
          >
            {initial}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg font-bold text-white"
          >
            {username || '—'}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm mt-0.5"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            {email || '—'}
          </motion.p>
        </div>

        {/* Body */}
        <div className="rounded-t-3xl -mt-4 relative z-10" style={{ background: 'var(--bg-base)' }}>

          {/* Statistik bulan ini */}
          <SectionLabel label="Bulan ini" delay={0.18} />
          <div
            className="mx-4 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <Row
              icon={<TrendingUp size={17} />}
              label="Pemasukan"
              value={statsLoaded ? formatIDR(stats.income) : '—'}
              delay={0.2}
            />
            <Divider />
            <Row
              icon={<TrendingDown size={17} />}
              label="Pengeluaran"
              value={statsLoaded ? formatIDR(stats.expense) : '—'}
              delay={0.23}
            />
          </div>

          {/* Pengaturan */}
          <SectionLabel label="Pengaturan" delay={0.26} />
          <div
            className="mx-4 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <Row
              icon={theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
              label={theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
              delay={0.28}
              onClick={toggle}
              right={
                <div
                  className="relative w-10 h-5 rounded-full transition-colors duration-300 flex-shrink-0"
                  style={{ background: theme === 'dark' ? 'rgba(124,92,252,0.6)' : 'var(--border)' }}
                >
                  <motion.div
                    animate={{ x: theme === 'dark' ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                  />
                </div>
              }
            />
          </div>

          {/* Lainnya */}
          <SectionLabel label="Akun" delay={0.3} />
          <div
            className="mx-4 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <Row
              icon={<KeyRound size={17} />}
              label="Ganti Password"
              delay={0.32}
              onClick={() => router.push('/profile/change-password')}
            />
          </div>

          <SectionLabel label="Lainnya" delay={0.34} />
          <div
            className="mx-4 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <Row
              icon={<MessageCircle size={17} />}
              label="Chat dengan Finara"
              delay={0.36}
              onClick={() => router.push('/')}
            />
            <Divider />
            <Row
              icon={<Info size={17} />}
              label="Tentang Finara"
              delay={0.38}
              onClick={() => router.push('/about')}
              right={
                <div className="flex items-center gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
                    v1.0
                  </span>
                  <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
                </div>
              }
            />
          </div>

          {/* Keluar */}
          <div
            className="mx-4 mt-4 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <Row
              icon={<LogOut size={17} />}
              label="Keluar"
              delay={0.36}
              onClick={handleLogout}
              danger
            />
          </div>

          <p className="text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>
            Finara · AI Finance Assistant
          </p>
        </div>

      </div>
    </PageTransition>
  )
}
