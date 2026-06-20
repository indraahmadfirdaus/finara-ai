'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, LayoutDashboard, List, Target, User, LogOut, Sun, Moon, HandCoins, ChevronDown } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { createClient } from '@/lib/supabase/client'

const LIST_SUBS = [
  { href: '/transactions', icon: List, label: 'Transaksi' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/debts', icon: HandCoins, label: 'Hutang' },
]

const TOP_TABS = [
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

const BOTTOM_TABS = [
  { href: '/profile', icon: User, label: 'Profil' },
]

export default function SideNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [listOpen, setListOpen] = useState(LIST_SUBS.some((s) => pathname === s.href))

  const isListActive = LIST_SUBS.some((s) => pathname === s.href)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function NavItem({ href, icon: Icon, label }: { href: string; icon: typeof MessageCircle; label: string }) {
    const isActive = pathname === href
    return (
      <Link
        href={href}
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
        <Icon
          size={18}
          strokeWidth={isActive ? 2.5 : 1.8}
          style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-muted)', flexShrink: 0, position: 'relative' }}
        />
        <span className="text-sm font-medium relative" style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)' }}>
          {label}
        </span>
      </Link>
    )
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-64 flex-shrink-0 sticky top-0 h-screen"
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)' }}
    >
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <svg width="32" height="32" viewBox="0 0 72 72" fill="none" className="flex-shrink-0">
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
        {TOP_TABS.map((tab) => (
          <NavItem key={tab.href} {...tab} />
        ))}

        {/* Daftar group */}
        <div>
          <button
            onClick={() => setListOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
            style={{
              background: isListActive ? 'var(--accent-dim)' : 'transparent',
              color: isListActive ? 'var(--accent-light)' : 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => { if (!isListActive) e.currentTarget.style.background = 'var(--bg-elevated)' }}
            onMouseLeave={(e) => { if (!isListActive) e.currentTarget.style.background = isListActive ? 'var(--accent-dim)' : 'transparent' }}
          >
            <List
              size={18}
              strokeWidth={isListActive ? 2.5 : 1.8}
              style={{ color: isListActive ? 'var(--accent-light)' : 'var(--text-muted)', flexShrink: 0 }}
            />
            <span className="text-sm font-medium flex-1 text-left" style={{ color: isListActive ? 'var(--accent-light)' : 'var(--text-secondary)' }}>
              Daftar
            </span>
            <motion.div
              animate={{ rotate: listOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {listOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 34, opacity: { duration: 0.15 } }}
                className="overflow-hidden"
              >
                <div className="pl-4 pt-1 pb-1 flex flex-col gap-0.5">
                  {LIST_SUBS.map((sub, i) => {
                    const isActive = pathname === sub.href
                    return (
                      <motion.div
                        key={sub.href}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 28 }}
                      >
                        <Link
                          href={sub.href}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl relative"
                          style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)', transition: 'background 0.15s ease' }}
                          onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
                          onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="side-pill"
                              className="absolute inset-0 rounded-xl"
                              style={{ background: 'var(--accent-dim)' }}
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                          <sub.icon
                            size={16}
                            strokeWidth={isActive ? 2.5 : 1.8}
                            style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-muted)', flexShrink: 0, position: 'relative' }}
                          />
                          <span className="text-sm font-medium relative" style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)' }}>
                            {sub.label}
                          </span>
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {BOTTOM_TABS.map((tab) => (
          <NavItem key={tab.href} {...tab} />
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid var(--border-light)' }}>
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
