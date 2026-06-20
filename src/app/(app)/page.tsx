'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import ChatBubble, { type Message } from '@/components/chat/ChatBubble'
import ChatInput from '@/components/chat/ChatInput'
import { createClient } from '@/lib/supabase/client'

function WelcomeMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold text-white mb-4"
        style={{ background: 'var(--accent)' }}
      >
        F
      </div>
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        Halo! Aku Finara 👋
      </h2>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Asisten keuangan pribadimu. Mau catat apa hari ini?
      </p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {[
          'beli makan siang 25k',
          'rekap bulan ini',
          'buka dashboard',
          'hutang aku ke siapa?',
        ].map((hint) => (
          <span
            key={hint}
            className="px-3 py-1.5 rounded-full text-xs"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid var(--accent)' }}
          >
            {hint}
          </span>
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)

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
          setMessages(
            data.map((row, i) => ({
              id: String(i),
              role: row.role as 'user' | 'assistant',
              content: row.content,
            }))
          )
        }
        isFirstLoad.current = false
      })
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const typingMsg: Message = {
      id: Date.now().toString() + '-typing',
      role: 'assistant',
      content: '',
      isTyping: true,
    }

    setMessages((prev) => [...prev, userMsg, typingMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] }),
      })

      if (!res.ok) throw new Error('API error')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let assistantContent = ''
      const assistantId = Date.now().toString() + '-assistant'

      setMessages((prev) =>
        prev.map((m) =>
          m.isTyping ? { ...m, id: assistantId, isTyping: false, isStreaming: true } : m
        )
      )

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'text') {
              assistantContent += event.content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent, isStreaming: true } : m
                )
              )
            } else if (event.type === 'navigate') {
              router.push(event.page)
            } else if (event.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, isStreaming: false } : m
                )
              )
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => !m.isTyping)
          .concat({
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Finara lagi sibuk, coba lagi ya 😅',
          })
      )
    } finally {
      setLoading(false)
    }
  }, [input, loading, router])

  const userInitial = userEmail ? userEmail[0].toUpperCase() : 'K'

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-light)', background: 'var(--bg-base)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
          style={{ background: 'var(--accent)' }}
        >
          F
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Finara
          </p>
          <p className="text-xs" style={{ color: 'var(--success)' }}>
            Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-4">
        {messages.length === 0 && !loading && <WelcomeMessage />}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} userInitial={userInitial} />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={sendMessage}
        loading={loading}
      />
    </div>
  )
}
