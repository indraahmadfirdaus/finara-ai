'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface MobileFABProps {
  onClick: () => void
  label: string
}

export default function MobileFAB({ onClick, label }: MobileFABProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-24 right-5 z-40 lg:hidden w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
      style={{ background: 'var(--accent)' }}
      aria-label={label}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24, delay: 0.15 }}
    >
      <Plus size={24} color="white" strokeWidth={2.5} />
    </motion.button>
  )
}
