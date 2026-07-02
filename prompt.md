read CLAUDE.md and docs/superpowers/plans/2026-06-20-finara-plan.md in full before doing anything.

  Execute the grand implementation plan end-to-end for Finara — an AI-powered personal finance assistant. This is a full agentic
  automation run. Work through all 6 phases sequentially, completing every step before moving to the next.

  ## Critical rules (from CLAUDE.md — do not skip)
  - UI/UX IS the product. Framer Motion animations are NOT optional — implement every animation listed in CLAUDE.md Animation Reference.
  - Dark premium theme: bg #0F0F14, surface #1A1A24, accent purple #7C5CFC. No light backgrounds anywhere.
  - Mobile-first: design every component at 375px first.
  - All AI responses in Bahasa Indonesia (casual, warm).
  - Optimistic UI in chat — user messages appear instantly.
  - DeepSeek API key and Supabase service role key are SERVER-SIDE ONLY. Never expose to browser.
  - Currency always stored as bigint IDR, displayed with formatIDR() utility.
  - TypeScript strict — no any, no @ts-ignore.
  - Zod validation on every API route.

  ## Working directory
  /Users/indra/Documents/nyoba/finara

  ## What to build
  Full-stack Next.js 15 app with:
  1. Supabase email auth (register + email verification + login + forgot password)
  2. AI chat interface (DeepSeek streaming + function calling → 13 tools)
  3. Rich response cards rendered inside chat bubbles (TransactionCard, SummaryCard, GoalCard, DebtCard, BudgetCard)
  4. Dashboard page (animated balance, donut chart, budget progress bars, recent transactions)
  5. Transactions page (grouped by date, filter by type/category)
  6. Budgets page (per category, animated progress, color-coded warning)
  7. Goals page (progress cards, deposit flow)
  8. Debts page (owe/lent tabs, settle flow)
  9. Bottom navigation (5 tabs, spring animation on active)
  10. Page transitions (Framer Motion fade)
  11. Toast system, skeleton loaders, empty states (Lottie)

  ## Phase execution order
  Execute phases 1 → 2 → 3 → 4 → 5 → 6 in order.
  After each phase, verify the checkpoint items listed in the plan before proceeding.

  ## Environment variables
  Leave these empty in .env.example and .env.local — do NOT fill them in:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - DEEPSEEK_API_KEY
  - NEXT_PUBLIC_APP_URL


  ## Supabase schema
  Write the complete schema to supabase/schema.sql with all tables and RLS policies as defined in the plan. Do NOT run it against any
  database — leave it for the human to paste into Supabase SQL editor.

  ## DeepSeek client setup
  Use the openai npm package with baseURL: 'https://api.deepseek.com' and model: 'deepseek-chat'. This is OpenAI-compatible.

  ## Deploy prep
  - Ensure npm run build succeeds before finishing
  - Ensure npm run typecheck is clean
  - Write complete README.md covering all 9 submission sections from the plan
  - Do NOT deploy to Vercel — leave that for the human

  ## Git
  Commit after each phase with a meaningful commit message. Use real commits, not one giant final commit.

  ## Done when
  - npm run build succeeds with no errors
  - npm run typecheck is clean
  - All pages render correctly on npm run dev
  - supabase/schema.sql is complete
  - README.md is complete
  - .env.local exists with empty placeholder values
  - All animations are implemented (not stubbed/TODO)

  ## Readme
  **keep it short, a few lines each**
  - What it is, and how to run it.
  - Who it's for, and the one job it has to do well.
  - Why this problem, and how you know it's worth solving.
  - What's already out there for it, and why you built this anyway.
  - What you put in scope, what you left out, and why.
  - Where you didn't have answers, what you assumed.
  - Three questions you'd ask a real user before building more.
  - How you'd know it's working, and what you'd do next.

  ---
