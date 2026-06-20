'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageTransition from '@/components/layout/PageTransition'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (next.length < 6) { setError('Password baru minimal 6 karakter.'); return }
    if (next !== confirm) { setError('Konfirmasi password tidak cocok.'); return }

    setLoading(true)
    const supabase = createClient()

    // Re-authenticate with current password first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setError('Sesi tidak valid, silakan login ulang.'); setLoading(false); return }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    })
    if (signInErr) { setError('Password saat ini salah.'); setLoading(false); return }

    const { error: updateErr } = await supabase.auth.updateUser({ password: next })
    if (updateErr) { setError(updateErr.message); setLoading(false); return }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.back(), 1800)
  }

  const inputClass = "w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all placeholder:opacity-40"
  const inputStyle = {
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    border: '1px solid var(--input-border)',
  }

  return (
    <PageTransition>
      <div className="min-h-screen lg:max-w-2xl lg:mx-auto" style={{ background: 'var(--bg-base)' }}>

        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10"
          style={{ background: 'var(--header-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-light)' }}
        >
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Ganti Password</p>
        </div>

        <div className="px-4 pt-6 pb-10 space-y-4">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <CheckCircle2 size={56} style={{ color: 'var(--success)' }} className="mx-auto mb-4" />
                </motion.div>
                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Password berhasil diubah</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Kembali ke profil...</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <div className="px-5 pt-4 pb-1">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      Password saat ini
                    </p>
                  </div>
                  <div className="relative px-4 pb-4">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={current}
                      onChange={(e) => setCurrent(e.target.value)}
                      required
                      placeholder="Masukkan password lama"
                      className={inputClass}
                      style={{ ...inputStyle, paddingRight: '3rem' }}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(124,92,252,0.6)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-7 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <div className="px-5 pt-4 pb-1">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      Password baru
                    </p>
                  </div>
                  <div className="px-4 pb-3 space-y-3">
                    <div className="relative">
                      <input
                        type={showNext ? 'text' : 'password'}
                        value={next}
                        onChange={(e) => setNext(e.target.value)}
                        required
                        placeholder="Minimal 6 karakter"
                        className={inputClass}
                        style={{ ...inputStyle, paddingRight: '3rem' }}
                        onFocus={(e) => (e.target.style.borderColor = 'rgba(124,92,252,0.6)')}
                        onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNext(!showNext)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      placeholder="Ulangi password baru"
                      className={inputClass}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(124,92,252,0.6)')}
                      onBlur={(e) => (e.target.style.borderColor = 'var(--input-border)')}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-xs px-1" style={{ color: 'var(--danger)' }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading || !current || !next || !confirm}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-black flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #FBB724 0%, #F97316 100%)' }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Menyimpan...' : 'Simpan Password'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  )
}
