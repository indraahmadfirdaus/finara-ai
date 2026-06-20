# Finara — AI Finance Assistant

Finara is a personal finance assistant for Indonesians. Track your money by chatting — "beli makan 25k", "rekap bulan ini", "set budget makanan 1jt" — no forms, no dropdowns.

Built with Next.js 16, Supabase, DeepSeek AI, and Framer Motion.

---

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev  # → http://localhost:3000
```

**Required env vars:**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `DEEPSEEK_API_KEY` | DeepSeek API key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL (e.g. `https://finara.app`) — used in email verification links |

Then paste `supabase/schema.sql` into your Supabase SQL editor and run it.

---

## Routes

| Path | Description |
|---|---|
| `/` | Landing page (public) |
| `/chat` | AI chat (protected) |
| `/dashboard` | Spending overview + charts |
| `/transactions` | Transaction list |
| `/goals` | Savings goals |
| `/debts` | Debts & IOUs |
| `/budgets` | Budget limits per category |
| `/profile` | Account settings |

---

## What it can do

Chat with Finara to:
- Record income and expenses in plain Indonesian
- Get spending summaries ("rekap minggu ini")
- Edit or delete past transactions
- Set and track budget limits
- Create and deposit to savings goals
- Track who owes you and who you owe
- Navigate to any screen ("buka dashboard")
- Scan receipts via camera or image upload (OCR)

---

## Deploying

1. Set all env vars in your hosting platform (Vercel, Railway, etc.)
2. In Supabase Dashboard → **Authentication → URL Configuration**:
   - Set **Site URL** to your production domain
   - Add `https://yourdomain.com/auth/callback` to **Redirect URLs**
3. Deploy — the app is stateless, no extra infra needed

---

## Support the developer

If you find this useful: [saweria.co/indrafrds](https://saweria.co/indrafrds) ☕
