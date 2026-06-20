'use client'

import { motion } from 'framer-motion'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {icon && (
        <div className="mb-4 text-5xl opacity-50">{icon}</div>
      )}
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
    </motion.div>
  )
}
