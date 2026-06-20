'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, LayoutDashboard, List, Target, User, HandCoins, X, PieChart, Landmark } from 'lucide-react'

const LIST_SUBS = [
  { href: '/transactions', icon: List, label: 'Transaksi' },
  { href: '/budgets', icon: PieChart, label: 'Anggaran' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/assets', icon: Landmark, label: 'Aset' },
  { href: '/debts', icon: HandCoins, label: 'Hutang' },
]

const MAIN_TABS = [
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '__list__', icon: List, label: 'Daftar' },
  { href: '/profile', icon: User, label: 'Profil' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [listOpen, setListOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isListActive = LIST_SUBS.some((s) => pathname === s.href)

  useEffect(() => {
    if (!listOpen) return
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setListOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [listOpen])

  useEffect(() => { setListOpen(false) }, [pathname])

  return (
    <>
      <AnimatePresence>
        {listOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
              onClick={() => setListOpen(false)}
            />

            {/* Popup menu */}
            <motion.div
              key="menu"
              ref={menuRef}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="fixed z-40 lg:hidden rounded-2xl overflow-hidden shadow-2xl"
              style={{
                bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
                left: '1rem',
                right: '1rem',
                maxWidth: 320,
                margin: '0 auto',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="px-3 pt-3 pb-1 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Daftar
                </p>
                <button onClick={() => setListOpen(false)} style={{ color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {LIST_SUBS.map((sub, i) => {
                  const isActive = pathname === sub.href
                  return (
                    <motion.div
                      key={sub.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.055, type: 'spring', stiffness: 400, damping: 28 }}
                    >
                      <button
                        onClick={() => { router.push(sub.href); setListOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left"
                        style={{
                          background: isActive ? 'var(--accent-dim)' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                      >
                        <sub.icon
                          size={18}
                          strokeWidth={isActive ? 2.5 : 1.8}
                          style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-muted)', flexShrink: 0 }}
                        />
                        <span className="text-sm font-medium flex-1" style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)' }}>
                          {sub.label}
                        </span>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-light)' }} />
                        )}
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 pb-safe lg:hidden"
        style={{ background: 'var(--nav-bg)', borderTop: '1px solid var(--nav-border)' }}
      >
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {MAIN_TABS.map((tab) => {
            if (tab.href === '__list__') {
              const isActive = isListActive || listOpen
              return (
                <button
                  key="list"
                  onClick={() => setListOpen((v) => !v)}
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
                      animate={{ scale: isActive ? 1.1 : 1, rotate: listOpen ? 90 : 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                      className="relative z-10 w-11 h-9 flex items-center justify-center"
                    >
                      <tab.icon
                        size={20}
                        style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-muted)' }}
                        strokeWidth={isActive ? 2.5 : 1.8}
                      />
                    </motion.div>
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-muted)' }}>
                    {tab.label}
                  </span>
                </button>
              )
            }

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
                <span className="text-[10px] font-medium" style={{ color: isActive ? 'var(--accent-light)' : 'var(--text-muted)' }}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
