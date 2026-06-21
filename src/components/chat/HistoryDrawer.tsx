'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Clock, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HistoryRow {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  session_id: string
}

interface Session {
  session_id: string
  label: string
  preview: string
  created_at: string
  messages: HistoryRow[]
}

function groupBySession(rows: HistoryRow[]): Session[] {
  const map = new Map<string, HistoryRow[]>()
  for (const row of rows) {
    if (!map.has(row.session_id)) map.set(row.session_id, [])
    map.get(row.session_id)!.push(row)
  }

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  const sessions: Session[] = []
  for (const [sid, msgs] of map) {
    const firstUserMsg = msgs.find((m) => m.role === 'user')
    const preview = firstUserMsg?.content ?? msgs[0]?.content ?? ''
    const created_at = msgs[0]?.created_at ?? ''
    const date = created_at.slice(0, 10)

    let dateLabel = date
    if (date === today) dateLabel = 'Hari ini'
    else if (date === yesterday) dateLabel = 'Kemarin'
    else {
      const d = new Date(date)
      dateLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
    }

    const time = created_at
      ? new Date(created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : ''

    sessions.push({
      session_id: sid,
      label: `${dateLabel}${time ? `, ${time}` : ''}`,
      preview: preview.slice(0, 70),
      created_at,
      messages: msgs,
    })
  }

  return sessions.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

interface HistoryDrawerProps {
  open: boolean
  onClose: () => void
  onRestore: (messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>, sessionId: string) => void
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
      .select('id, role, content, created_at, session_id')
      .order('created_at', { ascending: true })
      .limit(400)
      .then(({ data }) => {
        if (data) setSessions(groupBySession(data as HistoryRow[]))
        setLoading(false)
      })
  }, [open])

  async function handleDeleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId))
    await fetch(`/api/chat?session_id=${sessionId}`, { method: 'DELETE' })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-80 flex flex-col"
            style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-light)' }}
          >
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
                <div
                  key={s.session_id}
                  className="relative group flex items-center"
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                >
                  <button
                    onClick={() => {
                      onRestore(
                        s.messages.map((m, i) => ({ id: String(i), role: m.role, content: m.content })),
                        s.session_id
                      )
                      onClose()
                    }}
                    className="flex-1 text-left px-5 py-3.5 transition-colors"
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
                  <button
                    onClick={(e) => handleDeleteSession(s.session_id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 mr-2 rounded-lg flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    title="Hapus sesi"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div
              className="px-5 py-3 flex-shrink-0 text-center text-xs"
              style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)' }}
            >
              {sessions.length} sesi percakapan tersimpan
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
