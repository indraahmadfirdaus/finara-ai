'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Coffee, Heart, Sparkles } from 'lucide-react'
import PageTransition from '@/components/layout/PageTransition'

function CoderOwl() {
  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Coder owl mascot"
    >
      <defs>
        <linearGradient id="owlBodyGrad" x1="40" y1="40" x2="120" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C5CFC" />
        </linearGradient>
        <linearGradient id="owlWingL" x1="20" y1="80" x2="55" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6B46FC" />
          <stop offset="100%" stopColor="#5B3FE8" />
        </linearGradient>
        <linearGradient id="owlWingR" x1="105" y1="80" x2="140" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6B46FC" />
          <stop offset="100%" stopColor="#5B3FE8" />
        </linearGradient>
        <linearGradient id="eyeAmberL" x1="52" y1="68" x2="72" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="eyeAmberR" x1="88" y1="68" x2="108" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <radialGradient id="glowCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0" />
        </radialGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Ambient glow behind owl */}
      <ellipse cx="80" cy="110" rx="52" ry="18" fill="url(#glowCenter)" />

      {/* Left wing */}
      <path
        d="M 46 95 C 28 88, 18 105, 22 125 C 26 140, 40 145, 52 138 L 55 120 Z"
        fill="url(#owlWingL)"
        opacity="0.85"
      />
      {/* Wing feather lines left */}
      <path d="M 34 108 C 38 112, 44 115, 50 114" stroke="#A78BFA" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
      <path d="M 30 118 C 36 122, 43 124, 49 122" stroke="#A78BFA" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
      <path d="M 30 128 C 36 130, 43 131, 50 130" stroke="#A78BFA" strokeWidth="1" opacity="0.3" strokeLinecap="round" />

      {/* Right wing */}
      <path
        d="M 114 95 C 132 88, 142 105, 138 125 C 134 140, 120 145, 108 138 L 105 120 Z"
        fill="url(#owlWingR)"
        opacity="0.85"
      />
      {/* Wing feather lines right */}
      <path d="M 126 108 C 122 112, 116 115, 110 114" stroke="#A78BFA" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
      <path d="M 130 118 C 124 122, 117 124, 111 122" stroke="#A78BFA" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
      <path d="M 130 128 C 124 130, 117 131, 110 130" stroke="#A78BFA" strokeWidth="1" opacity="0.3" strokeLinecap="round" />

      {/* Body */}
      <ellipse cx="80" cy="115" rx="34" ry="32" fill="url(#owlBodyGrad)" />

      {/* Chest belly — lighter patch */}
      <ellipse cx="80" cy="122" rx="20" ry="18" fill="#C4B5FD" opacity="0.3" />

      {/* Circuit feather patterns on chest */}
      {/* horizontal line */}
      <line x1="68" y1="115" x2="92" y2="115" stroke="#E0D7FF" strokeWidth="0.8" opacity="0.35" />
      <line x1="68" y1="121" x2="92" y2="121" stroke="#E0D7FF" strokeWidth="0.8" opacity="0.25" />
      <line x1="68" y1="127" x2="92" y2="127" stroke="#E0D7FF" strokeWidth="0.8" opacity="0.2" />
      {/* vertical tick nodes */}
      <circle cx="74" cy="115" r="1.2" fill="#FBB724" opacity="0.55" />
      <circle cx="80" cy="121" r="1.2" fill="#FBB724" opacity="0.45" />
      <circle cx="86" cy="115" r="1.2" fill="#FBB724" opacity="0.55" />

      {/* Head */}
      <ellipse cx="80" cy="76" rx="38" ry="36" fill="url(#owlBodyGrad)" />

      {/* Ear tufts (pointy corners of head = owl ears) */}
      <path d="M 53 46 L 48 28 L 62 42 Z" fill="#7C5CFC" />
      <path d="M 107 46 L 112 28 L 98 42 Z" fill="#7C5CFC" />
      {/* Ear tuft highlight */}
      <path d="M 54 43 L 50 32 L 60 41 Z" fill="#A78BFA" opacity="0.5" />
      <path d="M 106 43 L 110 32 L 100 41 Z" fill="#A78BFA" opacity="0.5" />

      {/* Face disc — lighter ring */}
      <ellipse cx="80" cy="78" rx="30" ry="28" fill="#8B6CFE" opacity="0.35" />

      {/* LEFT EYE — code bracket glasses */}
      {/* Eye background circle */}
      <circle cx="62" cy="76" r="14" fill="#1A1A2E" />
      <circle cx="62" cy="76" r="11" fill="url(#eyeAmberL)" />
      {/* Iris */}
      <circle cx="62" cy="76" r="7" fill="#D97706" />
      {/* Pupil */}
      <circle cx="62" cy="76" r="3.5" fill="#1A1A2E" />
      {/* Pupil shine */}
      <circle cx="64" cy="74" r="1.2" fill="white" opacity="0.8" />
      {/* Code bracket left side of left lens [ */}
      <path d="M 50 66 L 47 66 L 47 86 L 50 86" stroke="#C4B5FD" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* RIGHT EYE */}
      <circle cx="98" cy="76" r="14" fill="#1A1A2E" />
      <circle cx="98" cy="76" r="11" fill="url(#eyeAmberR)" />
      <circle cx="98" cy="76" r="7" fill="#D97706" />
      <circle cx="98" cy="76" r="3.5" fill="#1A1A2E" />
      <circle cx="100" cy="74" r="1.2" fill="white" opacity="0.8" />
      {/* Code bracket right side of right lens ] */}
      <path d="M 110 66 L 113 66 L 113 86 L 110 86" stroke="#C4B5FD" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Bridge between glasses */}
      <path d="M 76 76 L 84 76" stroke="#C4B5FD" strokeWidth="1.8" strokeLinecap="round" />

      {/* Beak */}
      <path d="M 76 84 L 80 92 L 84 84 Z" fill="#FBB724" />
      <path d="M 78 84 L 80 89 L 82 84 Z" fill="#FDE68A" opacity="0.6" />

      {/* Tiny code snippet floating near glasses — { } */}
      <text x="56" y="62" fontSize="7" fill="#FBB724" opacity="0.65" fontFamily="monospace" fontWeight="bold">{"{"}</text>
      <text x="97" y="62" fontSize="7" fill="#FBB724" opacity="0.65" fontFamily="monospace" fontWeight="bold">{"}"}</text>

      {/* Subtle circuit lines on head */}
      <path d="M 56 56 L 56 50 L 62 50" stroke="#C4B5FD" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 104 56 L 104 50 L 98 50" stroke="#C4B5FD" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="62" cy="50" r="1" fill="#FBB724" opacity="0.4" />
      <circle cx="98" cy="50" r="1" fill="#FBB724" opacity="0.4" />

      {/* Feet / talons */}
      <path d="M 66 146 L 60 152 M 66 146 L 64 154 M 66 146 L 68 153" stroke="#6B46FC" strokeWidth="2" strokeLinecap="round" />
      <path d="M 94 146 L 88 152 M 94 146 L 92 154 M 94 146 L 96 153" stroke="#6B46FC" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const perks = [
  { icon: Coffee, text: 'Bantu beli kopi untuk begadang nge-code' },
  { icon: Sparkles, text: 'Motivasi buat terus ngembangin fitur baru' },
  { icon: Heart, text: 'Finara tetap gratis untuk semua orang' },
]

export default function SupportPage() {
  const router = useRouter()

  return (
    <PageTransition>
      <div className="min-h-screen lg:max-w-xl lg:mx-auto" style={{ background: 'var(--bg-base)' }}>

        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Dukung Developer
          </p>
        </div>

        {/* Owl hero */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center pt-10 pb-2 px-6"
        >
          {/* Glow ring behind owl */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: 200, height: 200 }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(124,92,252,0.18) 0%, rgba(124,92,252,0.06) 55%, transparent 75%)',
              }}
            />
            <div
              className="absolute inset-4 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(251,183,36,0.08) 0%, transparent 70%)',
              }}
            />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CoderOwl />
            </motion.div>
          </div>
        </motion.div>

        {/* Message from dev */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.38 }}
          className="px-6 text-center"
        >
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
          >
            Hai, aku indrafrds
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Aku bangun Finara sendiri — dari desain, kode, sampai server. Kalau kamu merasa Finara membantu hidupmu, traktir aku segelas kopi lewat Saweria. Beneran bikin hari makin semangat.
          </p>
        </motion.div>

        {/* What your support means */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.38 }}
          className="px-4 mt-7"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {perks.map(({ icon: Icon, text }, i) => (
              <div
                key={text}
                className="flex items-center gap-4 px-5 py-4"
                style={i < perks.length - 1 ? { borderBottom: '1px solid var(--border-light)' } : undefined}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(251,183,36,0.12)' }}
                >
                  <Icon size={16} style={{ color: '#FBB724' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Saweria CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.42 }}
          className="px-4 mt-6"
        >
          <motion.a
            href="https://saweria.co/indrafrds"
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-base"
            style={{
              background: 'linear-gradient(135deg, #FBB724 0%, #F59E0B 100%)',
              color: '#1A1200',
              boxShadow: '0 4px 24px rgba(251,183,36,0.35), 0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            <SaweriaIcon />
            Traktir di Saweria
          </motion.a>

          <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Dibuka di tab baru · saweria.co/indrafrds
          </p>
        </motion.div>

        {/* Dev note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mx-4 mt-6 mb-8 px-5 py-4 rounded-2xl"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid rgba(124,92,252,0.2)',
          }}
        >
          <p className="text-xs leading-relaxed" style={{ color: 'var(--accent-light)' }}>
            <span className="font-semibold">Tidak ada kewajiban sama sekali.</span> Finara gratis dan akan tetap gratis. Dukunganmu murni karena ingin — dan itu sudah lebih dari cukup buat aku.
          </p>
        </motion.div>

      </div>
    </PageTransition>
  )
}

function SaweriaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z"
        fill="rgba(0,0,0,0.15)"
      />
      <path
        d="M8 10.5C8 9.12 9.12 8 10.5 8h3C14.88 8 16 9.12 16 10.5v0c0 1.2-.84 2.2-2 2.42V14a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-1.08C8.84 12.7 8 11.7 8 10.5Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M10 16.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
    </svg>
  )
}
