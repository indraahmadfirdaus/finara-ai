'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'

interface TopBarProps {
  title: string
  showBack?: boolean
  action?: React.ReactNode
}

export default function TopBar({ title, showBack = false, action }: TopBarProps) {
  const router = useRouter()

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:hidden"
      style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border-light)' }}
    >
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
      </div>
      {action && <div>{action}</div>}
    </motion.header>
  )
}
