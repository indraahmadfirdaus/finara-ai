'use client'

import { motion } from 'framer-motion'
import StreamingText from './StreamingText'
import TypingIndicator from './TypingIndicator'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  isTyping?: boolean
}

interface ChatBubbleProps {
  message: Message
  userInitial?: string
}

export default function ChatBubble({ message, userInitial = 'K' }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ x: isUser ? 20 : -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mb-0.5"
        style={{
          background: isUser ? 'var(--accent-dim)' : 'var(--accent)',
          color: isUser ? 'var(--accent)' : 'white',
          border: isUser ? '1px solid var(--accent)' : 'none',
        }}
      >
        {isUser ? userInitial : 'F'}
      </div>

      {/* Bubble */}
      <div
        className="max-w-[82%] px-4 py-3 rounded-2xl"
        style={
          isUser
            ? {
                background: 'var(--accent)',
                color: 'white',
                borderBottomRightRadius: 4,
              }
            : {
                background: 'var(--bg-surface)',
                borderBottomLeftRadius: 4,
              }
        }
      >
        {message.isTyping ? (
          <TypingIndicator />
        ) : isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <StreamingText content={message.content} isStreaming={message.isStreaming} />
        )}
      </div>
    </motion.div>
  )
}
