'use client'

import { motion } from 'framer-motion'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 text-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full"
      >
        <p className="text-4xl mb-4">😵</p>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Ada yang error nih
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {error.message ?? 'Terjadi kesalahan yang tidak terduga.'}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={reset}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          Coba Lagi
        </motion.button>
      </motion.div>
    </div>
  )
}
