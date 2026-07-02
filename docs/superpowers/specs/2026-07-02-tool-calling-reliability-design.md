# Tool Calling Reliability — Design Spec
**Date:** 2026-07-02  
**Status:** Approved

## Problem

In multi-turn sessions, DeepSeek stops calling tools after several exchanges. Root cause: the server saves only `user` and `assistant` (text) messages to `chat_history`. Tool call + tool result messages are never persisted. On each new turn, the AI reconstructs context from flat text only — it sees prior confirmations ("Oke, sudah aku catat!") and pattern-matches toward another text reply instead of actually calling the tool again.

## Decision

**Approach A — Tool-augmented history** with system prompt hardening.

1. Add a `tool_calls_json JSONB` column to `chat_history`. Rows with `role = 'tool_call'` store the assistant's `tool_calls` array; rows with `role = 'tool'` store individual tool results.
2. On each API request, load history and reconstruct the full OpenAI message array including tool call/result pairs — not just text.
3. Harden the system prompt with explicit no-shortcut rules.
4. Switch `tool_choice` from `'auto'` to a reinforced `'auto'` (keep auto but ensure the system prompt forbids text-only confirmations for write intents).

## Architecture

### DB Schema Change

```sql
ALTER TABLE chat_history
  ADD COLUMN IF NOT EXISTS tool_calls_json JSONB,
  ADD COLUMN IF NOT EXISTS tool_call_id TEXT;
```

New `role` values persisted:
- `'tool_call'` — assistant message that contained tool_calls (content may be null/empty, tool_calls_json holds the array)
- `'tool'` — tool result message (tool_call_id identifies which call it answers)

Existing `'user'` and `'assistant'` roles unchanged.

### History Reconstruction (server)

```
DB rows → group and order by created_at →
  role=user         → { role: 'user', content }
  role=tool_call    → { role: 'assistant', content: null|text, tool_calls: tool_calls_json }
  role=tool         → { role: 'tool', tool_call_id, content }
  role=assistant    → { role: 'assistant', content }
```

History limit raised from 40 to 60 rows to account for tool call/result rows being additional entries.

### Persistence (after runCompletion)

After each successful `runCompletion` loop:
1. Save `role=user` message (existing)
2. For each tool-call turn in the loop: save `role=tool_call` with `tool_calls_json`
3. For each tool result: save `role=tool` with `tool_call_id` + result content
4. Save final `role=assistant` text (existing)

This is done by threading a `toolCallHistory` accumulator through `runCompletion`.

### System Prompt Hardening

Add these rules to `buildSystemPrompt`:

- "WAJIB panggil tool untuk SETIAP operasi tulis (add, update, delete, set, deposit, settle). JANGAN PERNAH konfirmasi tanpa benar-benar memanggil tool terlebih dahulu."
- "Jika kamu sudah memanggil tool di pesan sebelumnya dan berhasil, itu TIDAK berarti kamu boleh skip tool untuk permintaan baru yang serupa. Setiap permintaan baru = tool call baru."
- "JANGAN pernah menjawab 'sudah aku catat' atau sejenisnya tanpa tool call yang berhasil di turn ini."

## Files Changed

| File | Change |
|---|---|
| `src/app/api/chat/route.ts` | History reconstruction, tool call persistence, system prompt hardening |
| `supabase/schema.sql` | Add `tool_calls_json` + `tool_call_id` columns |

## Not Changed

- Client (`chat/page.tsx`) — no change needed, session handling is correct
- Tool definitions (`deepseek/tools.ts`) — no change needed
- All card components — no change needed

## Rollout Risk

Low. The new columns are additive (nullable). Old sessions without tool_call rows in history continue to work — they just get text-only context as before, which is the current behavior. New turns in any session immediately benefit.
