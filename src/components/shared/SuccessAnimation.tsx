'use client'

import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export default function SuccessAnimation({ size = 48 }: { size?: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <CheckCircle size={size} style={{ color: 'var(--success)' }} />
    </motion.div>
  )
}
