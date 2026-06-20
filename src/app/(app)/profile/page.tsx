'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, User, MessageCircle, Sun, Moon } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import { createClient } from '@/lib/supabase/client'
import { formatIDR } from '@/lib/utils/currency'
import { useTheme } from '@/lib/theme'

interface Stats {
  income: number
  expense: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [email, setEmail] = useState('')
  const [stats, setStats] = useState<Stats>({ income: 0, expense: 0 })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })

    fetch('/api/transactions?period=month&limit=200').then((r) => r.json()).then((data) => {
      const txs = data.transactions ?? []
      setStats({
        income: txs.filter((t: { type: string }) => t.type === 'income').reduce((s: number, t: { amount: number }) => s + t.amount, 0),
        expense: txs.filter((t: { type: string }) => t.type === 'expense').reduce((s: number, t: { amount: number }) => s + t.amount, 0),
      })
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initial = email ? email[0].toUpperCase() : '?'

  return (
    <PageTransition>
      <TopBar title="Profil" />
      <div className="px-4 pt-3 space-y-4 lg:max-w-2xl lg:mx-auto lg:px-6">
        {/* User card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'var(--accent)' }}
          >
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <User size={13} style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Akun</p>
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {email}
            </p>
          </div>
        </motion.div>

        {/* This month stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Statistik Bulan Ini
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Pemasukan</p>
              <p className="text-sm font-bold" style={{ color: 'var(--success)' }}>{formatIDR(stats.income)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Pengeluaran</p>
              <p className="text-sm font-bold" style={{ color: 'var(--danger)' }}>{formatIDR(stats.expense)}</p>
            </div>
          </div>
        </motion.div>

        {/* Theme toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon size={18} style={{ color: 'var(--accent-light)' }} />
            ) : (
              <Sun size={18} style={{ color: '#F59E0B' }} />
            )}
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
            </p>
          </div>
          <button
            onClick={toggle}
            className="relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0"
            style={{ background: theme === 'dark' ? 'var(--accent)' : 'var(--border)' }}
          >
            <motion.div
              animate={{ x: theme === 'dark' ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className="absolute top-1 w-4 h-4 rounded-full"
              style={{ background: 'white' }}
            />
          </button>
        </motion.div>

        {/* Chat with Finara */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/')}
          className="w-full rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(124,92,252,0.3)' }}
        >
          <MessageCircle size={18} style={{ color: 'var(--accent-light)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--accent-light)' }}>
            Chat dengan Finara
          </p>
        </motion.button>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <LogOut size={18} style={{ color: 'var(--danger)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Keluar</p>
        </motion.button>

        <p className="text-center text-xs py-2" style={{ color: 'var(--text-muted)' }}>
          Finara v1.0 · AI Finance Assistant
        </p>
      </div>
    </PageTransition>
  )
}
