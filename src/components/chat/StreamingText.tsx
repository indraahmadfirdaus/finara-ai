'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
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
  type: 'text' | 'table' | CardType
  content: string
}

// Exported so ChatBubble can inspect segments without re-implementing the regex
export function parseContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = []
  // Match card blocks and markdown tables (lines starting with |)
  const blockRegex = /```card:(transaction|summary|goal|debt|budget)\n([\s\S]*?)```|((?:\|.+\|\n?)+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    }

    if (match[1]) {
      // card block
      segments.push({ type: match[1] as CardType, content: match[2].trim() })
    } else if (match[3]) {
      // markdown table
      segments.push({ type: 'table', content: match[3].trim() })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) })
  }

  return segments
}

function parseMarkdownTable(raw: string): { headers: string[]; rows: string[][] } | null {
  const lines = raw.trim().split('\n').filter((l) => l.trim())
  if (lines.length < 2) return null

  const parseRow = (line: string) =>
    line.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1)

  const headers = parseRow(lines[0])
  // lines[1] is the separator (---|---), skip it
  const rows = lines.slice(2).map(parseRow)

  if (headers.length === 0) return null
  return { headers, rows }
}

function MarkdownTable({ raw }: { raw: string }) {
  const table = useMemo(() => parseMarkdownTable(raw), [raw])
  if (!table) return <pre className="text-xs overflow-x-auto">{raw}</pre>

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="mt-2 rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-semibold"
                  style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr
                key={ri}
                style={ri < table.rows.length - 1 ? { borderBottom: '1px solid var(--border-light)' } : {}}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-2"
                    style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
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

  const hasRich = segments.some((s) => s.type !== 'text')

  return (
    <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1

        if (seg.type === 'text') {
          const trimmed = seg.content.replace(/^\n+|\n+$/g, '')
          if (!trimmed) return null
          // Text adjacent to cards renders without a bubble wrapper (parent already full-width)
          // Text-only messages keep bubble styling applied by ChatBubble
          return (
            <span key={i} className={hasRich ? 'block px-4 py-3 rounded-3xl mb-1' : ''} style={hasRich ? { background: 'var(--bubble-ai)', border: '1px solid var(--bubble-ai-border)', borderBottomLeftRadius: 6 } : {}}>
              {renderTextSegment(seg.content, isLast, isStreaming)}
            </span>
          )
        }

        if (seg.type === 'table') {
          return <MarkdownTable key={i} raw={seg.content} />
        }

        return <div key={i}>{renderCard(seg.type as CardType, seg.content)}</div>
      })}
      {isStreaming && segments.length === 0 && (
        <span className="cursor-blink inline-block w-0.5 h-4 ml-0.5 align-middle" style={{ background: 'var(--accent)' }} />
      )}
    </div>
  )
}
