'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { History, SquarePen, Coffee } from 'lucide-react'
import ChatBubble, { type Message } from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import HistoryDrawer from '@/components/chat/HistoryDrawer'
import ImageOCR from '@/components/chat/ImageOCR'
import { createClient } from '@/lib/supabase/client'
import { useSideNav } from '@/lib/sidenavContext'

const WELCOME_HINTS = [
  { label: 'Catat pengeluaran', text: 'beli makan siang 25k' },
  { label: 'Rekap bulan ini', text: 'rekap keuangan bulan ini' },
  { label: 'Cek saldo', text: 'berapa saldo saya?' },
  { label: 'Fitur Finara', text: 'fitur-fitur Finara ada apa saja?' },
  { label: 'Buat anggaran', text: 'bantu aku buat anggaran bulanan' },
  { label: 'Goals tabungan', text: 'lihat goals tabungan saya' },
  { label: 'Hutang saya', text: 'hutang aku ke siapa saja?' },
  { label: 'Analisis pengeluaran', text: 'analisis pengeluaran saya minggu ini' },
]

function WelcomeMessage({ onHint }: { onHint: (h: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center px-6 text-center"
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
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {WELCOME_HINTS.map((hint) => (
          <motion.button
            key={hint.text}
            whileTap={{ scale: 0.95 }}
            onClick={() => onHint(hint.text)}
            className="px-3.5 py-2 rounded-2xl text-xs font-medium"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent-light)',
              border: '1px solid rgba(124,92,252,0.25)',
            }}
          >
            {hint.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

const SESSION_KEY = 'finara_chat_session_id'

export default function ChatPage() {
  const router = useRouter()
  const { collapsed } = useSideNav()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true) // track whether we should auto-scroll

  // Always scroll to bottom immediately (no animation jank)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = bottomRef.current
    if (!el) return
    el.scrollIntoView({ behavior, block: 'end' })
  }, [])

  // During streaming: only follow if user hasn't scrolled up
  const scrollFollowIfAtBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    if (distFromBottom < 120) {
      scrollToBottom('smooth')
    }
  }, [scrollToBottom])

  // Track when user manually scrolls up — disable auto-follow
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    function onScroll() {
      const distFromBottom = container!.scrollHeight - container!.scrollTop - container!.clientHeight
      autoScrollRef.current = distFromBottom < 120
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll on messages change — force for new user message, follow for streaming
  useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    // Force scroll when user sends (new user message or typing indicator appears)
    if (lastMsg.role === 'user' || lastMsg.isTyping) {
      autoScrollRef.current = true
      // Use rAF so DOM has updated before measuring
      requestAnimationFrame(() => scrollToBottom('smooth'))
    } else if (autoScrollRef.current) {
      requestAnimationFrame(() => scrollFollowIfAtBottom())
    }
  }, [messages, scrollToBottom, scrollFollowIfAtBottom])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })

    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) {
      // Restore messages for existing session so navigating away and back keeps history
      setSessionId(existing)
      supabase
        .from('chat_history')
        .select('id, role, content, created_at')
        .eq('session_id', existing)
        .order('created_at', { ascending: true })
        .limit(200)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setMessages(
              data.map((r) => ({
                id: r.id as string,
                role: r.role as 'user' | 'assistant',
                content: r.content as string,
              }))
            )
          }
        })
    } else {
      const id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
      setSessionId(id)
    }
  }, [])

  useEffect(() => {
    if (messages.length === 0) return
    const el = bottomRef.current
    if (!el) return
    // Use scrollTop on the scroll container to avoid viewport jump from keyboard on mobile
    const container = el.parentElement
    if (container) {
      const maxScroll = container.scrollHeight - container.clientHeight
      // Only scroll if near the bottom already (not if user has scrolled up to read history)
      if (maxScroll - container.scrollTop < 300) {
        container.scrollTo({ top: maxScroll, behavior: 'smooth' })
      }
    }
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
        body: JSON.stringify({ messages: [{ role: 'user', content: msg }], session_id: sessionId }),
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
              if (event.session_id) setSessionId(event.session_id)
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
  }, [input, loading, router, sessionId])

  function startNewChat() {
    const newId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, newId)
    setSessionId(newId)
    setMessages([])
    setInput('')
  }

  const userInitial = userEmail ? userEmail[0].toUpperCase() : 'K'

  return (
    <>
      {/*
        Mobile: full-screen flex column with fixed-positioned input
        Desktop: fills the right column of the sidebar layout, h-screen flex column
      */}
      <div className="flex flex-col h-screen lg:h-screen" style={{ background: 'var(--bg-base)' }}>

        {/* Header */}
        <div
          className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--header-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Logo — hidden on desktop since sidebar shows it */}
          <div className="flex items-center gap-3 lg:hidden">
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
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>finara</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Online</p>
              </div>
            </div>
          </div>

          {/* Desktop: page title */}
          <p className="hidden lg:block text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Chat</p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Support page — mobile only */}
            <motion.button
              onClick={() => router.push('/support')}
              whileTap={{ scale: 0.88 }}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(251,183,36,0.12)',
                color: '#FBB724',
                border: '1px solid rgba(251,183,36,0.22)',
              }}
              title="Dukung Developer"
            >
              <Coffee size={16} />
            </motion.button>

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

        {/* Welcome screen — not scrollable, centered, shown only when no messages */}
        {messages.length === 0 && !loading && (
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <WelcomeMessage onHint={(h) => sendMessage(h)} />
          </div>
        )}

        {/* Messages — scrollable area, only rendered when there are messages */}
        {(messages.length > 0 || loading) && (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 lg:px-8"
            style={{ paddingBottom: '6rem' }}
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} userInitial={userInitial} />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input — fixed on mobile, accounts for sidebar on desktop */}
        <div
          className="fixed bottom-16 left-0 right-0 z-30 px-4 py-3 lg:bottom-0 lg:left-[var(--sidenav-w,256px)]"
          style={{ background: 'linear-gradient(to top, var(--bg-base) 70%, transparent)', transition: 'left 0.28s cubic-bezier(0.32,0,0.16,1)' }}
        >
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <div
              className="flex-1 rounded-3xl flex items-end overflow-hidden"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
            >
              <div className="flex items-end px-2 py-2 flex-shrink-0">
                <ImageOCR
                  disabled={loading}
                  onResult={(ocrText) => {
                    const prompt = `Ini hasil scan struk/invoice:\n\n${ocrText}\n\nTolong parse dan catat transaksinya.`
                    sendMessage(prompt)
                  }}
                />
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
                }}
                placeholder="Ketik pesan..."
                rows={1}
                className="flex-1 py-3.5 pr-4 resize-none bg-transparent outline-none text-sm leading-relaxed placeholder:opacity-40"
                style={{ color: 'var(--text-primary)', maxHeight: 120 }}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
              style={
                input.trim() && !loading
                  ? { background: 'linear-gradient(135deg, #FBB724 0%, #F97316 100%)' }
                  : { background: 'var(--bg-elevated)', border: '1px solid var(--border)' }
              }
            >
              {loading ? (
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke={input.trim() ? 'black' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim() ? 'black' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </motion.button>
          </div>
        </div>

      </div>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestore={(msgs, sid) => {
          sessionStorage.setItem(SESSION_KEY, sid)
          setSessionId(sid)
          setMessages(msgs)
        }}
      />
    </>
  )
}
