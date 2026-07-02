export type ToolLedger = Map<string, number>

export function createLedger(): ToolLedger {
  return new Map()
}

export function recordToolSuccess(ledger: ToolLedger, toolName: string): void {
  ledger.set(toolName, (ledger.get(toolName) ?? 0) + 1)
}

// card type + _action → the tool that must have succeeded this request
const CARD_ACTION_TOOL: Record<string, string> = {
  'transaction:created': 'add_transaction',
  'transaction:updated': 'update_transaction',
  'transaction:deleted': 'delete_transaction',
  'budget:created': 'set_budget',
  'budget:updated': 'set_budget',
  'goal:created': 'add_goal',
  'goal:updated': 'deposit_goal',
  'debt:created': 'add_debt',
  'debt:updated': 'settle_debt',
  'asset:created': 'add_asset',
  'asset:updated': 'update_asset_value',
  'asset:deleted': 'delete_asset',
}

const WRITE_ACTIONS = new Set(['created', 'updated', 'deleted'])
const CARD_HEADER_REGEX = /^```card:([a-z]+)\s*\n([\s\S]*?)```\s*$/

// true = card may stream to the user (write cards debit one ledger credit).
// false = fake claim: withhold. Fail-closed for anything that claims an _action.
export function evaluateCardBlock(block: string, ledger: ToolLedger): boolean {
  const match = block.match(CARD_HEADER_REGEX)
  if (!match) return !block.includes('_action')
  const cardType = match[1]
  let parsed: unknown
  try {
    parsed = JSON.parse(match[2].trim())
  } catch {
    return !match[2].includes('_action')
  }
  const action = (parsed as { _action?: unknown })._action
  if (typeof action !== 'string' || !WRITE_ACTIONS.has(action)) return true
  const tool = CARD_ACTION_TOOL[`${cardType}:${action}`]
  if (!tool) return false
  const credit = ledger.get(tool) ?? 0
  if (credit <= 0) return false
  ledger.set(tool, credit - 1)
  return true
}

// Advisory heuristic: counts money-looking tokens ("25rb", "5jt", "1.500.000").
const MONEY_REGEX = /\d[\d.,]*\s*(?:rb|ribu|k|jt|juta)\b|\b\d{1,3}(?:[.,]\d{3})+\b|\b\d{4,}\b/gi

export function countMoneyMentions(text: string): number {
  return (text.match(MONEY_REGEX) ?? []).length
}
