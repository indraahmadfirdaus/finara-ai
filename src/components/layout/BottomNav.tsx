'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageCircle, LayoutDashboard, List, Target, User } from 'lucide-react'

const tabs = [
  { href: '/', icon: MessageCircle, label: 'Chat' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: List, label: 'Transaksi' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/profile', icon: User, label: 'Profil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe"
      style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center px-3"
            >
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <tab.icon
                  size={22}
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
