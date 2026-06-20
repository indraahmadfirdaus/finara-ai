# Finara — Agent Rules

## STOP: Read this before touching any file

### Next.js version
This project runs **Next.js 16.2.9** — not the version you were trained on. Breaking changes exist.
Read `node_modules/next/dist/docs/` before writing any route, layout, or config code.

Key differences from older Next.js:
- `middleware.ts` is **deprecated and renamed to `proxy.ts`** — the exported function must be named `proxy`, not `middleware`. Auth guard lives in `src/proxy.ts`.
- Proxy defaults to the **Node.js runtime** (not Edge). Do not set `runtime = 'edge'` in proxy files.
- Use `unstable_instant` export on routes if fixing slow client-side navigations (see `docs/01-app/02-guides/instant-navigation.md`).
- Heed all deprecation notices in the docs.

### Dependency versions (actual installed)
| Package | Version |
|---|---|
| next | 16.2.9 |
| framer-motion | ^12 |
| tailwindcss | ^4 |
| zod | ^4 |
| @supabase/ssr | ^0.12 |
| openai | ^6 (used as DeepSeek SDK) |
| lucide-react | ^1.21 |
| recharts | ^3 |

APIs within these packages may differ from training data. Check actual types before using.

---

## Project conventions

### Auth & routing
- Auth guard: `src/proxy.ts` — exported function is `proxy()`, not `middleware()`
- Protected routes: all `/(app)/*` — redirect unauthenticated users to `/splash`
- Whitelisted paths: `/splash`, `/login`, `/register`, `/auth/callback`, `/_next/*`, `/api/*`, `/favicon.ico`
- Never trust `userId` from request body — always verify via `supabase.auth.getUser()` server-side

### Supabase
- Browser client: `src/lib/supabase/client.ts` → `createClient()` from `@supabase/ssr` `createBrowserClient`
- Server client: `src/lib/supabase/server.ts` → `createClient()` from `@supabase/ssr` `createServerClient` (async, uses `cookies()`)
- RLS is enabled on all tables — all queries are automatically scoped to `auth.uid()`
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only — never expose to browser

### DeepSeek / AI
- DeepSeek is called via the `openai` npm package with `baseURL: 'https://api.deepseek.com'`
- Model: `deepseek-chat`
- Client: `src/lib/deepseek/client.ts` → `getDeepseekClient()`
- `DEEPSEEK_API_KEY` is server-side only — only used in `src/app/api/chat/route.ts`
- All tool execution is server-side — client only sees text + card blocks

### Theming
- CSS custom properties on `[data-theme="dark"]` and `[data-theme="light"]` on `<html>` — NOT on `:root`
- Combining `:root` with `[data-theme="dark"]` in one block causes dark values to always win (Tailwind v4 specificity bug)
- `ThemeProvider` in `src/lib/theme.tsx` — reads localStorage on mount, sets `data-theme` attribute
- Default SSR: `data-theme="dark"` on `<html>` in `src/app/layout.tsx` with `suppressHydrationWarning`
- Always use `var(--bg-base)`, `var(--text-primary)` etc. — never hardcode hex like `#0D0D14`

### Chat session isolation
- `chat_history` table has a `session_id uuid` column (added via migration)
- Each browser tab gets one `session_id` stored in `sessionStorage` under key `finara_chat_session_id`
- New chat (SquarePen button): generates new UUID, writes to `sessionStorage`
- Restore from history: writes restored session's UUID to `sessionStorage`
- API (`/api/chat`): reads `session_id` from request body, scopes history query to that session, saves messages with that `session_id`, returns `session_id` in `done` SSE event

### Layout
- Mobile-first, bottom nav (`src/components/layout/BottomNav.tsx`) — `lg:hidden`
- Desktop: sidebar (`src/components/layout/SideNav.tsx`) — `hidden lg:flex`, 256px wide
- App shell: `src/app/(app)/layout.tsx` — flex row, sidebar + main column
- Chat input: `fixed bottom-16 left-0 right-0 lg:bottom-0 lg:left-64`
- Suggestion chips: `fixed ... lg:left-64` to offset sidebar
- `TopBar` and `BottomNav` are `lg:hidden`

### Animations (Framer Motion v12)
- Every list: stagger children with `containerVariants` / `itemVariants`
- Every page mount: `PageTransition` wrapper (`src/components/layout/PageTransition.tsx`)
- Numbers: `AnimatedNumber` from `src/components/shared/AnimatedNumber.tsx`
- Progress bars: animated width from 0 on mount
- Buttons: `whileTap={{ scale: 0.95 }}` or `0.9`
- `AnimatePresence` required for exit animations (modals, drawers, conditional elements)

### Category icons
- Use `getCategoryMeta(category, type?)` from `src/lib/utils/categoryIcon.tsx`
- Returns `{ icon: LucideIcon, bg: string, color: string }`
- 50+ keyword → icon mappings; falls back by type (income/expense) if no match

### Currency & dates
- Always `formatIDR(amount)` from `src/lib/utils/currency.ts` — never format inline
- Store amounts as `bigint` in DB, display as formatted string
- Date helpers in `src/lib/utils/date.ts`: `getPeriodRange`, `getMonthKey`, `getTodayKey`, `formatRelative`

---

## What NOT to do
- Do not write `middleware.ts` — it's deprecated. Use `proxy.ts`.
- Do not hardcode hex colors — use CSS vars.
- Do not commit without running `npx tsc --noEmit` first.
- Do not expose `DEEPSEEK_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Do not generate `session_id` in component state initializer (`useState(() => uuid())`) — it reruns on every mount. Use `sessionStorage`.
- Do not combine `:root { }` and `[data-theme="dark"] { }` in the same CSS block.
- Do not trust client-sent `userId` in API routes — always use `supabase.auth.getUser()`.
- Do not commit directly to `main` — use feature branches and PR.
