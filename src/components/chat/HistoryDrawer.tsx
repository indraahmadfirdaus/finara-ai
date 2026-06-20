'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HistoryRow {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Session {
  date: string
  label: string
  preview: string
  messages: HistoryRow[]
}

function groupByDate(rows: HistoryRow[]): Session[] {
  const map = new Map<string, HistoryRow[]>()
  for (const row of rows) {
    const d = row.created_at.slice(0, 10)
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(row)
  }

  const sessions: Session[] = []
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  for (const [date, msgs] of map) {
    const userMsgs = msgs.filter((m) => m.role === 'user')
    const preview = userMsgs[userMsgs.length - 1]?.content ?? msgs[msgs.length - 1]?.content ?? ''
    let label = date
    if (date === today) label = 'Hari ini'
    else if (date === yesterday) label = 'Kemarin'
    else {
      const d = new Date(date)
      label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
    }
    sessions.push({ date, label, preview: preview.slice(0, 60), messages: msgs })
  }

  return sessions.sort((a, b) => b.date.localeCompare(a.date))
}

interface HistoryDrawerProps {
  open: boolean
  onClose: () => void
  onRestore: (messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>) => void
}

export default function HistoryDrawer({ open, onClose, onRestore }: HistoryDrawerProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('chat_history')
      .select('id, role, content, created_at')
      .order('created_at', { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (data) setSessions(groupByDate(data as HistoryRow[]))
        setLoading(false)
      })
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-80 flex flex-col"
            style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-light)' }}
            >
              <div className="flex items-center gap-2">
                <Clock size={15} style={{ color: 'var(--accent-light)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Riwayat Chat
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Sessions list */}
            <div className="flex-1 overflow-y-auto py-2">
              {loading && (
                <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Memuat...
                </div>
              )}
              {!loading && sessions.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <MessageSquare size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Belum ada riwayat chat
                  </p>
                </div>
              )}
              {sessions.map((s) => (
                <button
                  key={s.date}
                  onClick={() => {
                    onRestore(s.messages.map((m, i) => ({ id: String(i), role: m.role, content: m.content })))
                    onClose()
                  }}
                  className="w-full text-left px-5 py-3.5 transition-colors"
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--accent-light)' }}>
                    {s.label}
                  </p>
                  <p
                    className="text-sm leading-snug line-clamp-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {s.preview || '(kosong)'}
                  </p>
                </button>
              ))}
            </div>

            <div
              className="px-5 py-3 flex-shrink-0 text-center text-xs"
              style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)' }}
            >
              {sessions.length} hari percakapan tersimpan
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
