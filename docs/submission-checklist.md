# Submission Checklist

> Status as of 2026-06-21

---

## 1. Public GitHub Repo ✅ / ⚠️

- **Repo:** https://github.com/indraahmadfirdaus/finara-ai
- **Status:** Repo exists with real commit history. Need to **verify it is set to Public** (couldn't confirm via CLI — check on GitHub → Settings → Change visibility).
- **Commit history:** Real, granular commits (feat/fix prefixes, meaningful messages). ✅

---

## 2. Live URL ✅

- **URL:** https://finara-ai.vercel.app
- **Status:** Deployed and live.
- **Demo account:** `demo.finara@mail.com` / `just4dem0`
  - Pre-loaded: 23 transaksi (Juni 2026), 5 budget, 3 goals, 3 hutang, 3 aset

---

## 3. README ✅

README.md covers all required sections:
- What it is and how to run (setup instructions, env vars, schema step) ✅
- Who it's for and the one job it does well ✅
- Why this problem / market context ✅
- Scope: in vs out ✅
- Assumptions made ✅
- Success metrics and what's next ✅

**No changes needed.**

---

## 4. How You Used AI ⬜

This section needs to be written. Suggested content (edit to match your actual experience):

```
## How I used AI

Claude Code was a key part of my workflow while building this project. I used it to accelerate implementation tasks such as generating component scaffolds, assisting with Supabase queries, troubleshooting SSE streaming issues, and iterating on prompts for DeepSeek tool calls. This helped reduce repetitive engineering work and allowed me to focus more on architecture, integration, and testing.

While AI significantly improved development speed, I treated its output as a starting point rather than a final solution. My role was to define requirements, provide context, review the generated code, and validate the implementation through testing to ensure it met both the technical requirements and the intended user experience.
```

**Action:** Write your own version — pick a real incident where AI output looked correct but wasn't.

---

## 5. Loom (Optional) ⬜

Not recorded yet. Suggested flow (2–3 min):
1. Landing page → register or log in
2. Chat: type "beli kopi 25k" → show transaction card appear
3. Chat: "rekap bulan ini" → show summary card
4. Dashboard: show spending chart + budget bars
5. Chat: OCR a receipt image

---

## Summary

| Item | Status | Blocker |
|---|---|---|
| Public GitHub repo | ⚠️ Verify visibility | Manual check on GitHub |
| Live URL | ✅ https://finara-ai.vercel.app | — |
| README | ✅ Done | — |
| AI usage notes | ⬜ Not written | Write 3–4 sentences |
| Loom | ⬜ Optional | Record after deploy |
