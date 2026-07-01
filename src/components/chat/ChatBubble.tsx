'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileImage } from 'lucide-react'
import StreamingText, { parseContent } from './StreamingText'
import TypingIndicator from './TypingIndicator'
import MascotOrb from '@/components/landing/MascotOrb'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  displayContent?: string  // shown in bubble; falls back to content when absent
  isStreaming?: boolean
  isTyping?: boolean
}

// Returns the filename if the content is an OCR scan message, otherwise null
function parseScanMessage(content: string): string | null {
  const match = content.match(/^\[scan:(.+?)\]\n/)
  return match ? match[1] : null
}

interface ChatBubbleProps {
  message: Message
  userInitial?: string
}

export default function ChatBubble({ message, userInitial = 'K' }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  // Determine if this assistant message has any card/table segments (rendered full-width outside bubble)
  const hasRichContent = useMemo(() => {
    if (isUser || message.isTyping) return false
    return parseContent(message.content).some((s) => s.type !== 'text')
  }, [isUser, message.isTyping, message.content])

  const avatar = !isUser && (
    <div className="flex-shrink-0 mb-0.5">
      <MascotOrb
        state={message.isStreaming ? 'excited' : message.isTyping ? 'wave' : 'happy'}
        showBubble={false}
        inline
        size={32}
      />
    </div>
  )

  // User bubble — simple, no rich content
  if (isUser) {
    const scanFileName = parseScanMessage(message.content)
    const displayText = message.displayContent ?? message.content

    return (
      <motion.div
        initial={{ x: 20, opacity: 0, y: 8 }}
        animate={{ x: 0, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="flex items-end gap-2.5 flex-row-reverse"
      >
        {scanFileName ? (
          // Image attachment pill
          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5 max-w-[78%]"
            style={{
              background: 'linear-gradient(135deg, var(--bubble-user-from) 0%, var(--bubble-user-to) 100%)',
              borderRadius: '20px 20px 4px 20px',
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >
              <FileImage size={16} color="white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white leading-tight truncate max-w-[160px]">{scanFileName}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Gambar dikirim</p>
            </div>
          </div>
        ) : (
          <div
            className="max-w-[78%] px-4 py-3"
            style={{
              background: 'linear-gradient(135deg, var(--bubble-user-from) 0%, var(--bubble-user-to) 100%)',
              color: 'white',
              borderRadius: '20px 20px 4px 20px',
            }}
          >
            <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{displayText}</p>
          </div>
        )}
        <div
          className="w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-bold flex-shrink-0 mb-0.5"
          style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid rgba(124,92,252,0.3)' }}
        >
          {userInitial}
        </div>
      </motion.div>
    )
  }

  // Typing indicator
  if (message.isTyping) {
    return (
      <motion.div
        initial={{ x: -20, opacity: 0, y: 8 }}
        animate={{ x: 0, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="flex items-end gap-2.5 flex-row"
      >
        {avatar}
        <div
          className="max-w-[78%] px-4 py-3"
          style={{ background: 'var(--bubble-ai)', border: '1px solid var(--bubble-ai-border)', borderRadius: '20px 20px 20px 4px' }}
        >
          <TypingIndicator />
        </div>
      </motion.div>
    )
  }

  // Assistant message with potential rich content (cards/tables)
  // Cards and tables render full-width outside the bubble max-width constraint
  if (hasRichContent) {
    return (
      <motion.div
        initial={{ x: -20, opacity: 0, y: 8 }}
        animate={{ x: 0, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="flex items-start gap-2.5 flex-row"
      >
        {avatar}
        {/* Full-width column so cards are not capped at 78% */}
        <div className="flex-1 min-w-0">
          <StreamingText content={message.content} isStreaming={message.isStreaming} />
        </div>
      </motion.div>
    )
  }

  // Plain assistant text bubble
  return (
    <motion.div
      initial={{ x: -20, opacity: 0, y: 8 }}
      animate={{ x: 0, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="flex items-end gap-2.5 flex-row"
    >
      {avatar}
      <div
        className="max-w-[78%] px-4 py-3"
        style={{ background: 'var(--bubble-ai)', border: '1px solid var(--bubble-ai-border)', borderRadius: '20px 20px 20px 4px' }}
      >
        <StreamingText content={message.content} isStreaming={message.isStreaming} />
      </div>
    </motion.div>
  )
}
