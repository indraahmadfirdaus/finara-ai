'use client'

import { useMemo } from 'react'
import TransactionCard from './cards/TransactionCard'
import SummaryCard from './cards/SummaryCard'
import GoalCard from './cards/GoalCard'
import DebtCard from './cards/DebtCard'
import BudgetCard from './cards/BudgetCard'

interface StreamingTextProps {
  content: string
  isStreaming?: boolean
}

type CardType = 'transaction' | 'summary' | 'goal' | 'debt' | 'budget'

interface ParsedSegment {
  type: 'text' | CardType
  content: string
}

function parseContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = []
  const cardRegex = /```card:(transaction|summary|goal|debt|budget)\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = cardRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    }
    segments.push({ type: match[1] as CardType, content: match[2].trim() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) })
  }

  return segments
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Split on **bold**, *italic*, then render each token
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={i}>{token.slice(1, -1)}</em>
    }
    return token
  })
}

function renderTextSegment(text: string, isLast: boolean, isStreaming: boolean): React.ReactNode {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {renderInlineMarkdown(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
      {isStreaming && isLast && (
        <span className="cursor-blink inline-block w-0.5 h-4 ml-0.5 align-middle" style={{ background: 'var(--accent)' }} />
      )}
    </>
  )
}

function renderCard(type: CardType, content: string) {
  try {
    const data = JSON.parse(content)
    switch (type) {
      case 'transaction': return <TransactionCard data={data} />
      case 'summary': return <SummaryCard data={data} />
      case 'goal': return <GoalCard data={data} />
      case 'debt': return <DebtCard data={data} />
      case 'budget': return <BudgetCard data={data} />
    }
  } catch {
    return null
  }
}

export default function StreamingText({ content, isStreaming = false }: StreamingTextProps) {
  const segments = useMemo(() => parseContent(content), [content])

  return (
    <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return (
            <span key={i}>
              {renderTextSegment(seg.content, i === segments.length - 1, isStreaming)}
            </span>
          )
        }
        return <div key={i}>{renderCard(seg.type, seg.content)}</div>
      })}
      {isStreaming && segments.length === 0 && (
        <span className="cursor-blink inline-block w-0.5 h-4 ml-0.5 align-middle" style={{ background: 'var(--accent)' }} />
      )}
    </div>
  )
}
