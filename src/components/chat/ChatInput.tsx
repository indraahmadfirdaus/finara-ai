'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

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
      className="fixed bottom-16 left-0 right-0 z-30 px-4 py-3"
      style={{ background: 'linear-gradient(to top, var(--bg-base) 70%, transparent)' }}
    >
      <div className="max-w-lg mx-auto flex items-end gap-2">
        <div
          className="flex-1 rounded-3xl flex items-end overflow-hidden"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            rows={1}
            className="flex-1 px-4 py-3.5 resize-none bg-transparent outline-none text-sm leading-relaxed placeholder:opacity-40"
            style={{ color: 'var(--text-primary)', maxHeight: 120 }}
            disabled={disabled}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onSubmit}
          disabled={!canSend}
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all"
          style={
            canSend
              ? { background: 'linear-gradient(135deg, #FBB724 0%, #F97316 100%)' }
              : { background: 'var(--bg-elevated)', border: '1px solid var(--border)' }
          }
        >
          {loading ? (
            <Loader2 size={18} style={{ color: canSend ? 'black' : 'var(--text-muted)' }} className="animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke={canSend ? 'black' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={canSend ? 'black' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </motion.button>
      </div>
    </div>
  )
}
