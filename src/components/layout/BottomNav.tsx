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
      className="fixed bottom-0 left-0 right-0 z-40 pb-safe lg:hidden"
      style={{ background: 'var(--nav-bg)', borderTop: '1px solid var(--nav-border)' }}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 min-w-[52px] min-h-[52px] justify-center px-2 relative"
            >
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: 'var(--accent-dim)', width: 44, height: 36, margin: 'auto' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="relative z-10 w-11 h-9 flex items-center justify-center"
                >
                  <tab.icon
                    size={20}
                    style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-muted)' }}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </motion.div>
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-muted)' }}
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
