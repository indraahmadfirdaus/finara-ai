# Finara — AI Finance Assistant

## What it is & how to run

Finara is a web-based AI personal finance assistant for Indonesians. You manage your money by chatting with it — "beli makan 25k", "rekap bulan ini", "set budget makanan 1jt" — and it records, summarizes, and visualizes everything.

```bash
# 1. Clone and install
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY, DEEPSEEK_API_KEY

# 3. Run Supabase schema
# Paste supabase/schema.sql into Supabase SQL editor and execute

# 4. Start
npm run dev  # → http://localhost:3000
```

## Who it's for & the one job it does well

Target: Indonesians 20–35 who currently track money in Excel or a notes app. The one job: **record a transaction as fast as typing a message to a friend.** No forms, no dropdowns, no manual categorization — just say what you spent and Finara figures out the rest.

## Why this problem & how we know it's worth solving

Most Indonesians who try to track finances quit within a week because apps are too much work. The friction is the form. We know this because Cleo grew to millions of users in the UK doing exactly this — conversational finance — but nothing comparable exists for Indonesia in Bahasa Indonesia. Manual tracking apps dominate (Money Manager, Finansialku) but they're all form-first.

## What's already out there & why we built this anyway

- **Finansialku, Money Manager**: manual entry, form-heavy, no AI. Good for power users, too much friction for casual trackers.
- **Cleo (UK)**: the closest product. Works well, but English-only, UK banking, no Indonesian market.
- **Bank apps**: show history but can't record cash or cross-bank transactions.

We built this because no Indonesian-first, AI-first, conversational finance tool exists. The market gap is real and the LLM cost is now low enough to make it free.

## Scope: in vs out

**In scope:**
- Chat-based transaction recording (13 AI tools)
- Dashboard with spending chart, budget progress, balance summary
- Goals (savings targets with deposits)
- Debts & IOUs (owe/lent tracking, settle flow)
- Budget limits per category
- Email auth with Supabase

**Out of scope:**
- Bank API integration (read transactions automatically)
- Recurring transactions / subscriptions
- Multi-currency
- Shared budgets / family accounts
- Push notifications / reminders
- Mobile app (this is a PWA-ready web app)

## Assumptions made

- Users speak Indonesian (all AI responses are in Bahasa Indonesia)
- Amounts fit in a bigint (no trillion-rupiah edge cases handled)
- DeepSeek reliably parses Indonesian financial phrasing ("15k" = 15,000, "1jt" = 1,000,000)
- Users verify AI-recorded transactions before treating them as ground truth
- Supabase handles auth email deliverability — no custom SMTP configured

## 3 questions for real users before building more

1. Do you currently track finances at all, and what made you quit the last tool you tried?
2. When the AI gets the category wrong (e.g., marks "grab" as Transportasi instead of Makanan), would you fix it or just leave it?
3. What's the one financial insight you wish you had every month but don't?

## How we'd know it's working & what's next

**Working if:** a new user records 5+ transactions in their first session without leaving the chat page; DAU/MAU > 30%.

**Next:**
- Bank statement import (CSV) to seed history
- Weekly spending recap pushed via WhatsApp
- Budget alert notifications when 80% spent
- Natural language date parsing improvements ("kemarin sore", "minggu lalu")
- Voice input for hands-free recording
