'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Email atau password salah.')
      setLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    router.push('/chat')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,92,252,0.2) 0%, transparent 70%)' }}
      />

      <div className="flex-1 flex flex-col justify-center px-5 pb-8 pt-8 relative z-10 lg:max-w-md lg:mx-auto lg:w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <Link href="/" className="inline-flex flex-col items-center group">
            <svg width="48" height="48" viewBox="0 0 72 72" fill="none" className="mx-auto mb-3 transition-opacity group-hover:opacity-80">
              <circle cx="36" cy="36" r="34" stroke="url(#lg1)" strokeWidth="2.5" />
              <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="url(#lg1)" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M20 44 Q27 34 36 42 Q45 50 52 40" stroke="url(#lg2)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55" />
              <circle cx="36" cy="36" r="3.5" fill="url(#lg1)" />
              <defs>
                <linearGradient id="lg1" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#A78BFA" /><stop offset="100%" stopColor="#7C5CFC" />
                </linearGradient>
                <linearGradient id="lg2" x1="20" y1="36" x2="52" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FBB724" /><stop offset="100%" stopColor="#F97316" />
                </linearGradient>
              </defs>
            </svg>
            <h1 className="text-3xl font-bold tracking-tight transition-opacity group-hover:opacity-80" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              finara
            </h1>
          </Link>
          <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            KEUANGAN PRIBADIMU
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-lg font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
            Masuk
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email kamu"
              className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all placeholder:opacity-40"
              style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--input-border)' }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(124,92,252,0.6)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full px-4 py-3.5 pr-12 rounded-2xl text-sm outline-none transition-all placeholder:opacity-40"
                style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--input-border)' }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(124,92,252,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5"
                style={{ color: 'var(--text-muted)' }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs px-1" style={{ color: 'var(--danger)' }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl text-sm font-bold text-black transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg, #FBB724 0%, #F97316 100%)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Masuk...' : 'Masuk Sekarang'}
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--accent-light)' }}>
            Daftar
          </Link>
        </p>
      </div>
    </div>
  )
}
