'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { History, SquarePen } from 'lucide-react'
import ChatBubble, { type Message } from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import HistoryDrawer from '@/components/chat/HistoryDrawer'
import { createClient } from '@/lib/supabase/client'

const SUGGESTIONS = [
  { label: 'Rekap bulan ini', text: 'rekap keuangan bulan ini' },
  { label: 'Catat pengeluaran', text: 'catat pengeluaran' },
  { label: 'Cek saldo', text: 'berapa saldo saya?' },
  { label: 'Hutangku', text: 'hutang aku ke siapa saja?' },
  { label: 'Buat anggaran', text: 'bantu aku buat anggaran bulanan' },
  { label: 'Goals tabungan', text: 'lihat goals tabungan saya' },
]

const WELCOME_HINTS = [
  'beli makan siang 25k',
  'rekap bulan ini',
  'buka dashboard',
  'hutang aku ke siapa?',
]

function WelcomeMessage({ onHint }: { onHint: (h: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-10 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="mb-5"
      >
        <svg width="56" height="56" viewBox="0 0 72 72" fill="none">
          <circle cx="36" cy="36" r="34" stroke="url(#wg1)" strokeWidth="2" />
          <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="url(#wg1)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M20 44 Q27 34 36 42 Q45 50 52 40" stroke="url(#wg2)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.6" />
          <circle cx="36" cy="36" r="3.5" fill="url(#wg1)" />
          <defs>
            <linearGradient id="wg1" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A78BFA" /><stop offset="100%" stopColor="#7C5CFC" />
            </linearGradient>
            <linearGradient id="wg2" x1="20" y1="36" x2="52" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FBB724" /><stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        Halo! Aku Finara 👋
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Coba tanya atau catat sesuatu
      </p>

      <div className="flex flex-wrap gap-2 justify-center">
        {WELCOME_HINTS.map((hint) => (
          <motion.button
            key={hint}
            whileTap={{ scale: 0.95 }}
            onClick={() => onHint(hint)}
            className="px-3.5 py-2 rounded-2xl text-xs font-medium"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent-light)',
              border: '1px solid rgba(124,92,252,0.25)',
            }}
          >
            {hint}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
    supabase
      .from('chat_history')
      .select('role, content')
      .order('created_at', { ascending: true })
      .limit(40)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(data.map((row, i) => ({
            id: String(i),
            role: row.role as 'user' | 'assistant',
            content: row.content,
          })))
        }
      })
  }, [])

  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg }
    const typingMsg: Message = { id: Date.now().toString() + '-typing', role: 'assistant', content: '', isTyping: true }

    setMessages((prev) => [...prev, userMsg, typingMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: msg }] }),
      })
      if (!res.ok) throw new Error('API error')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let assistantContent = ''
      const assistantId = Date.now().toString() + '-assistant'

      setMessages((prev) => prev.map((m) => m.isTyping ? { ...m, id: assistantId, isTyping: false, isStreaming: true } : m))

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'text') {
              assistantContent += event.content
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: assistantContent, isStreaming: true } : m))
            } else if (event.type === 'navigate') {
              router.push(event.page)
            } else if (event.type === 'done') {
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m))
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.filter((m) => !m.isTyping).concat({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Finara lagi sibuk, coba lagi ya 😅',
        })
      )
    } finally {
      setLoading(false)
    }
  }, [input, loading, router])

  function startNewChat() {
    setMessages([])
    setInput('')
  }

  const userInitial = userEmail ? userEmail[0].toUpperCase() : 'K'
  const showSuggestions = messages.length > 0 && !loading

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header — sticky */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Left: logo + status */}
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" stroke="url(#hg1)" strokeWidth="2.5" />
            <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="url(#hg1)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="36" r="3.5" fill="url(#hg1)" />
            <defs>
              <linearGradient id="hg1" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#A78BFA" /><stop offset="100%" stopColor="#7C5CFC" />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              finara
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Online</p>
            </div>
          </div>
        </div>

        {/* Right: new chat + history */}
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {messages.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }}
                onClick={startNewChat}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}
                title="Chat baru"
              >
                <SquarePen size={15} />
              </motion.button>
            )}
          </AnimatePresence>
          <button
            onClick={() => setHistoryOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            title="Riwayat chat"
          >
            <History size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ paddingBottom: showSuggestions ? '9rem' : '6rem' }}
      >
        {messages.length === 0 && !loading && (
          <WelcomeMessage onHint={(h) => sendMessage(h)} />
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} userInitial={userInitial} />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed left-0 right-0 z-20 px-4 pb-1"
            style={{ bottom: 'calc(4rem + 68px)' }}
          >
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => sendMessage(s.text)}
                  disabled={loading}
                  className="flex-shrink-0 px-3.5 py-2 rounded-2xl text-xs font-medium transition-opacity disabled:opacity-40"
                  style={{
                    background: 'var(--bg-surface)',
                    color: 'var(--accent-light)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={() => sendMessage()}
        loading={loading}
      />

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestore={(msgs) => setMessages(msgs)}
      />
    </div>
  )
}
