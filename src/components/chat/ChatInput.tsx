'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  loading?: boolean
}

export default function ChatInput({ value, onChange, onSubmit, disabled = false, loading = false }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && !loading && value.trim()) onSubmit()
    }
  }

  const canSend = !disabled && !loading && value.trim().length > 0

  return (
    <div
      className="fixed bottom-16 left-0 right-0 z-30 px-3 py-2"
      style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border-light)' }}
    >
      <div className="max-w-lg mx-auto flex items-end gap-2">
        <div
          className="flex-1 rounded-2xl overflow-hidden flex items-end transition-all"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan... (contoh: beli makan 25k)"
            rows={1}
            className="flex-1 px-4 py-3 resize-none bg-transparent outline-none text-sm leading-relaxed"
            style={{ color: 'var(--text-primary)', maxHeight: 120 }}
            disabled={disabled}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onSubmit}
          disabled={!canSend}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
          style={{ background: canSend ? 'var(--accent)' : 'var(--bg-surface)' }}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Send size={18} style={{ color: canSend ? 'white' : 'var(--text-muted)' }} />
          )}
        </motion.button>
      </div>
    </div>
  )
}
