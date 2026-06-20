'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageCircle, ShieldCheck, Zap, BarChart2, Target, BookOpen } from 'lucide-react'
import PageTransition from '@/components/layout/PageTransition'

const features = [
  {
    icon: MessageCircle,
    title: 'Chat Natural',
    desc: 'Catat transaksi hanya dengan ketik seperti chat biasa. "Beli makan siang 25k" — Finara langsung simpan.',
  },
  {
    icon: BarChart2,
    title: 'Rekap Otomatis',
    desc: 'Lihat ringkasan pemasukan, pengeluaran, dan saldo kapan saja tanpa hitung manual.',
  },
  {
    icon: Target,
    title: 'Goals & Budget',
    desc: 'Buat target tabungan dan anggaran bulanan. Finara pantau progresnya untukmu.',
  },
  {
    icon: Zap,
    title: 'AI Proaktif',
    desc: 'Finara kasih insight kalau ada pola pengeluaran tidak biasa atau budget mendekati batas.',
  },
  {
    icon: ShieldCheck,
    title: 'Privasi Terjaga',
    desc: 'Data keuanganmu hanya bisa diakses oleh akunmu sendiri. Tidak ada yang bisa melihat datamu.',
  },
]

const stack = [
  { label: 'AI', value: 'DeepSeek Chat' },
  { label: 'Frontend', value: 'Next.js 16 + React' },
  { label: 'Database', value: 'Supabase (PostgreSQL)' },
  { label: 'Auth', value: 'Supabase Auth' },
  { label: 'Animasi', value: 'Framer Motion' },
]

export default function AboutPage() {
  const router = useRouter()

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
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tentang Finara</p>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center pt-10 pb-8 px-6 text-center"
        >
          <svg width="64" height="64" viewBox="0 0 72 72" fill="none" className="mb-5">
            <rect width="72" height="72" rx="18" fill="var(--accent-dim)" />
            <circle cx="36" cy="36" r="28" stroke="url(#abg1)" strokeWidth="2.5" />
            <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="url(#abg1)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M20 44 Q27 34 36 42 Q45 50 52 40" stroke="url(#abg2)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55" />
            <circle cx="36" cy="36" r="3.5" fill="url(#abg1)" />
            <defs>
              <linearGradient id="abg1" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#A78BFA" /><stop offset="100%" stopColor="#7C5CFC" />
              </linearGradient>
              <linearGradient id="abg2" x1="20" y1="36" x2="52" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FBB724" /><stop offset="100%" stopColor="#F97316" />
              </linearGradient>
            </defs>
          </svg>

          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            finara
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Asisten keuangan pribadi bertenaga AI. Dirancang untuk membantu orang Indonesia kelola uang dengan cara yang terasa natural — cukup ngobrol.
          </p>
          <div
            className="mt-4 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}
          >
            v1.0 · Beta
          </div>
        </motion.div>

        {/* Fitur */}
        <div className="px-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Fitur
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-start gap-4 px-5 py-4"
                  style={i < features.length - 1 ? { borderBottom: '1px solid var(--border-light)' } : undefined}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--accent-dim)' }}
                  >
                    <Icon size={16} style={{ color: 'var(--accent-light)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{f.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Tech stack */}
        <div className="px-4 mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Dibangun dengan
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {stack.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="flex items-center justify-between px-5 py-3.5"
                style={i < stack.length - 1 ? { borderBottom: '1px solid var(--border-light)' } : undefined}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Panduan singkat */}
        <div className="px-4 mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Cara Pakai
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {[
              { q: 'Catat pengeluaran', a: '"Beli bensin 50k" atau "makan siang 25rb"' },
              { q: 'Catat pemasukan', a: '"Gaji masuk 5 juta" atau "terima transfer 200k"' },
              { q: 'Lihat rekap', a: '"Rekap bulan ini" atau "pengeluaran minggu ini"' },
              { q: 'Buat budget', a: '"Set budget makanan 1 juta bulan ini"' },
              { q: 'Navigasi', a: '"Buka dashboard" atau "lihat goals saya"' },
            ].map((item, i, arr) => (
              <motion.div
                key={item.q}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="px-5 py-3.5"
                style={i < arr.length - 1 ? { borderBottom: '1px solid var(--border-light)' } : undefined}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <BookOpen size={11} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
                  <p className="text-xs font-semibold" style={{ color: 'var(--accent-light)' }}>{item.q}</p>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>
          Finara · Dibuat dengan ❤️ untuk Indonesia
        </p>

      </div>
    </PageTransition>
  )
}
