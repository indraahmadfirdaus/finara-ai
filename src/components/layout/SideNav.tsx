'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageCircle, LayoutDashboard, List, Target, User, LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'

const tabs = [
  { href: '/', icon: MessageCircle, label: 'Chat' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: List, label: 'Transaksi' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/profile', icon: User, label: 'Profil' },
]

export default function SideNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useTheme()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-64 flex-shrink-0 sticky top-0 h-screen"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)' }}
    >
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <svg width="32" height="32" viewBox="0 0 72 72" fill="none" flex-shrink-0>
          <circle cx="36" cy="36" r="34" stroke="url(#sng)" strokeWidth="2.5" />
          <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="url(#sng)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="36" cy="36" r="3.5" fill="url(#sng)" />
          <defs>
            <linearGradient id="sng" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A78BFA" /><stop offset="100%" stopColor="#7C5CFC" />
            </linearGradient>
          </defs>
        </svg>
        <div>
          <p className="text-base font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>finara</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Online</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl relative transition-colors group"
              style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)' }}
            >
              {isActive && (
                <motion.div
                  layoutId="side-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'var(--accent-dim)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-muted)', flexShrink: 0, position: 'relative' }}
              />
              <span className="text-sm font-medium relative" style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)' }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid var(--border-light)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {theme === 'dark'
            ? <Sun size={18} strokeWidth={1.8} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            : <Moon size={18} strokeWidth={1.8} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          }
          <span className="text-sm font-medium">{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={18} strokeWidth={1.8} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
