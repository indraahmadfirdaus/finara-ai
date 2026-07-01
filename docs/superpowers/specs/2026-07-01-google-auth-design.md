# Auth Revamp: Google-Only Login

**Date:** 2026-07-01  
**Status:** Approved

## Problem

Supabase's email sending is capped at 2 emails/hour on the free tier. The current register flow sends a verification email on every sign-up, making the app unusable for more than 2 new users per hour.

## Solution

Replace email/password auth entirely with Google OAuth. Supabase handles the OAuth flow server-side — no new dependencies required.

## User Flow

```
/login
  → klik "Masuk dengan Google"
  → supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })
  → Google consent screen (Google-hosted, no email sent)
  → GET /auth/callback?code=...
  → exchangeCodeForSession (existing handler, unchanged)
  → redirect /chat
```

First-time users are auto-registered by Supabase on first OAuth sign-in — no separate register step needed.

## Files Changed

| File | Change |
|---|---|
| `src/app/(auth)/login/page.tsx` | Replace form with single Google button |
| `src/app/(auth)/register/page.tsx` | Delete — Google handles sign-up automatically |
| `src/proxy.ts` | Remove `/register` from `isAuthPage` list |
| `src/app/auth/callback/route.ts` | No change — already correct |

## Login Page Design

- Same logo/ambient glow layout as current login
- Card contains: heading "Masuk ke Finara" + Google OAuth button
- Button: white background, Google SVG icon (inline), text "Masuk dengan Google"
- Error state: if `?error=` query param present, show error message via AnimatePresence
- No register link — Google sign-in creates new accounts automatically
- `redirectTo` points to `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`

## Proxy Changes

```ts
// Before
const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')

// After
const isAuthPage = pathname.startsWith('/login')
```

## Supabase Dashboard Config (manual)

1. Authentication → Providers → Google → Enable
2. Paste Google OAuth Client ID + Secret
3. Add to Authorized Redirect URIs in Google Cloud Console:
   `https://vujzdsbholheoltccayf.supabase.co/auth/v1/callback`

## Google Cloud Console Config (manual)

1. Create OAuth 2.0 Client ID (Web application)
2. Authorized redirect URI: `https://vujzdsbholheoltccayf.supabase.co/auth/v1/callback`
3. For local dev also add: `http://localhost:3000/auth/callback`

## Out of Scope

- Email/password fallback
- Magic link login
- Phone auth
