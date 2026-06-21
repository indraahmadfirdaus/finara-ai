# Features Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public `/features` page — a bento-grid visual showcase of all 8 Finara features with animated mini-demos, responsive across mobile/tablet/desktop — and wire it into the landing page CTA.

**Architecture:** Single self-contained `src/app/features/page.tsx` (~600 lines). No shared components — all demo components are inline for isolation. Sticky nav and footer are copy-pasted from `src/app/page.tsx` patterns, using the same `--land-*` CSS vars. `proxy.ts` whitelist gets `/features` added. Landing page secondary CTA button text+route changes.

**Tech Stack:** Next.js 16 App Router, Framer Motion v12 (`useInView`, `motion`, `AnimatePresence`), Lucide React v1.21, TypeScript, Tailwind v4 CSS vars.

## Global Constraints

- All colors via CSS vars (`--land-glass`, `--land-glass-border`, `--land-card-shadow`, `--accent`, `--success`, `--danger`, etc.) — no hardcoded hex except amber (`#FBB724`, `#F97316`, `#F59E0B`) and demo-specific colors (`#3B82F6` for scan blue)
- No imports from `src/app/(app)/` or `src/components/` — page is public and must have zero auth dependency
- All `inView` animations: `useInView(ref, { once: true, margin: '-40px' })`
- Loop animations (Chat, Scan): reset and replay after full sequence + 2s pause
- Responsive: mobile 1-col → tablet `sm` 2-col → desktop `lg` 3-col grid
- `npx tsc --noEmit` must pass clean before final commit
- No network requests — all animations are pure Framer Motion / CSS

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/proxy.ts` | Modify line 36 | Add `/features` to public routes |
| `src/app/page.tsx` | Modify ~line 1099 | Change secondary CTA: text + href |
| `src/app/features/page.tsx` | Create | Full features page |

---

### Task 1: Whitelist `/features` in proxy + change landing CTA

**Files:**
- Modify: `src/proxy.ts:36`
- Modify: `src/app/page.tsx` (hero secondary button, ~line 1098–1117)

**Interfaces:**
- Produces: `/features` is publicly accessible without login; landing page secondary button routes to `/features`

- [ ] **Step 1: Add `/features` to public routes in proxy.ts**

In `src/proxy.ts` line 36, change:
```ts
const isPublic = pathname === '/' || pathname === '/support' || isAuthPage || isApiRoute || isAuthCallback
```
to:
```ts
const isPublic = pathname === '/' || pathname === '/support' || pathname === '/features' || isAuthPage || isApiRoute || isAuthCallback
```

- [ ] **Step 2: Change landing page secondary CTA button**

In `src/app/page.tsx`, find the second `motion.button` inside the hero CTA div (the one with `onClick={() => router.push('/login')}` and text "Sudah punya akun"). Replace:
```tsx
<motion.button
  whileTap={{ scale: 0.97 }}
  onClick={() => router.push('/login')}
  className="flex items-center justify-center px-6 py-3.5 rounded-2xl text-sm font-medium"
  style={{
    background: 'var(--land-tile-btn)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--land-tile-btn-border)',
    transition: 'background 0.2s ease',
  }}
  onMouseEnter={(e) =>
    (e.currentTarget.style.background = 'var(--land-glass-border)')
  }
  onMouseLeave={(e) =>
    (e.currentTarget.style.background = 'var(--land-tile-btn)')
  }
>
  Sudah punya akun
</motion.button>
```
with:
```tsx
<motion.button
  whileTap={{ scale: 0.97 }}
  onClick={() => router.push('/features')}
  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-medium"
  style={{
    background: 'var(--land-tile-btn)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--land-tile-btn-border)',
    transition: 'background 0.2s ease',
  }}
  onMouseEnter={(e) =>
    (e.currentTarget.style.background = 'var(--land-glass-border)')
  }
  onMouseLeave={(e) =>
    (e.currentTarget.style.background = 'var(--land-tile-btn)')
  }
>
  Lihat fitur-fiturnya
</motion.button>
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output (clean).

- [ ] **Step 4: Commit**

```bash
git add src/proxy.ts src/app/page.tsx
git commit -m "feat: add /features to public routes and update landing CTA"
```

---

### Task 2: Scaffold `features/page.tsx` — shell + nav + hero + footer

**Files:**
- Create: `src/app/features/page.tsx`

**Interfaces:**
- Produces: `FeaturesPage` default export, renders sticky nav + ambient orbs + hero section + bottom CTA strip + footer. Bento grid area left as `{/* BENTO GRID */}` placeholder comment.

- [ ] **Step 1: Create `src/app/features/page.tsx` with shell**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  ArrowRight, ArrowLeft, Sun, Moon,
  MessageCircle, BarChart2, Target, HandCoins,
  Landmark, ScanLine, Zap, ShieldCheck,
} from 'lucide-react'
import { useTheme } from '@/lib/theme'

// ── Animated theme icon (same pattern as landing page) ──────────────────────
function ThemeIcon({ theme }: { theme: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'flex' }}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </motion.span>
    </AnimatePresence>
  )
}

export default function FeaturesPage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: 'var(--land-bg)',
        color: 'var(--text-primary)',
        transition: 'background 0.25s ease, color 0.15s ease',
      }}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div style={{
          position: 'absolute', top: '-15%', right: '-5%',
          width: '55vw', height: '55vw', maxWidth: 640, maxHeight: 640,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--land-orb-purple) 0%, transparent 65%)',
          transition: 'background 0.4s ease',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-8%',
          width: '42vw', height: '42vw', maxWidth: 480, maxHeight: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--land-orb-gold) 0%, transparent 65%)',
          transition: 'background 0.4s ease',
        }} />
      </div>

      {/* Sticky nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 sm:px-8 lg:px-16"
        style={{
          background: scrolled ? 'var(--land-surface)' : 'transparent',
          borderBottom: scrolled ? '1px solid var(--land-separator)' : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2.5"
        >
          <svg width="26" height="26" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" stroke="url(#fn1)" strokeWidth="2.5" />
            <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="url(#fn1)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="36" r="3.5" fill="url(#fn1)" />
            <defs>
              <linearGradient id="fn1" x1="16" y1="16" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A78BFA" /><stop offset="1" stopColor="#7C5CFC" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-sm font-bold" style={{ letterSpacing: '-0.02em' }}>finara</span>
        </button>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={toggle}
            className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'var(--land-nav-btn)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--land-glass-border)',
              transition: 'background 0.2s ease',
            }}
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          >
            <ThemeIcon theme={theme} />
          </motion.button>
          <button
            onClick={() => router.push('/login')}
            className="hidden sm:block px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Masuk
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/register')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-black"
            style={{ background: 'linear-gradient(135deg,#FBB724,#F97316)' }}
          >
            Daftar
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 px-5 sm:px-8 lg:px-16 pt-32 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
          style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent-light)',
            border: '1px solid rgba(124,92,252,0.25)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Semua yang bisa Finara lakukan
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-[1.15] mb-4"
          style={{ letterSpacing: '-0.03em' }}
        >
          Satu chat,{' '}
          <span style={{
            background: 'linear-gradient(135deg,#A78BFA 0%,#7C5CFC 50%,#FBB724 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            semua terkontrol
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          Dari catat belanja sampai pantau aset — semuanya lewat obrolan biasa.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/register')}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-black"
          style={{ background: 'linear-gradient(135deg,#FBB724 0%,#F97316 100%)' }}
        >
          Coba gratis sekarang
          <ArrowRight size={15} />
        </motion.button>
      </section>

      {/* BENTO GRID — added in Task 3 */}

      {/* Bottom CTA strip */}
      <section className="relative z-10 px-5 sm:px-8 lg:px-16 py-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="text-xl font-bold mb-6"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Siap coba Finara?
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/register')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg,#FBB724 0%,#F97316 100%)' }}
          >
            Daftar Gratis
            <ArrowRight size={15} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-medium"
            style={{
              background: 'var(--land-tile-btn)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--land-tile-btn-border)',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--land-glass-border)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--land-tile-btn)')}
          >
            <ArrowLeft size={15} />
            Kembali ke beranda
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 px-5 sm:px-8 lg:px-16 py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: '1px solid var(--land-separator)' }}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" stroke="var(--accent)" strokeWidth="2.5" />
            <path d="M20 38 Q27 28 36 36 Q45 44 52 34" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="36" r="3.5" fill="var(--accent)" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>finara · v1.0 Beta</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          Dibuat oleh{' '}
          <span className="font-semibold" style={{ color: 'var(--text-secondary)', opacity: 1 }}>indrafrds</span>
        </span>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/page.tsx
git commit -m "feat: scaffold /features page shell with nav, hero, footer"
```

---

### Task 3: Bento grid — layout shell + 4 simpler tiles (Anggaran, Hutang, Privasi, AI Proaktif)

**Files:**
- Modify: `src/app/features/page.tsx` — add grid shell + 4 `inView`-triggered tiles

**Interfaces:**
- Consumes: `useInView` from framer-motion, CSS vars from globals.css
- Produces: Responsive bento grid container, 4 tiles with animated demos visible on scroll

- [ ] **Step 1: Add grid shell and 4 tiles to `features/page.tsx`**

Directly before the `{/* Bottom CTA strip */}` comment, replace `{/* BENTO GRID — added in Task 3 */}` with:

```tsx
{/* Bento Grid */}
<section className="relative z-10 px-5 sm:px-8 lg:px-16 pb-8 max-w-6xl mx-auto w-full">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

    {/* Tile: Chat Natural — placeholder, filled in Task 4 */}
    <div className="sm:col-span-1 lg:col-span-1 lg:row-span-2 rounded-2xl min-h-[320px] sm:min-h-[360px]"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />

    {/* Tile: Dashboard — placeholder, filled in Task 4 */}
    <div className="sm:col-span-1 lg:col-span-1 lg:row-span-2 rounded-2xl min-h-[320px] sm:min-h-[360px]"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />

    {/* Tile 3: Anggaran & Goals */}
    <AnggrangTile />

    {/* Tile 4: Hutang & Piutang */}
    <HutangTile />

    {/* Tile 5: Aset — placeholder, filled in Task 5 */}
    <div className="sm:col-span-2 lg:col-span-2 rounded-2xl min-h-[160px]"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />

    {/* Tile 6: Scan Struk — placeholder, filled in Task 5 */}
    <div className="sm:col-span-2 lg:col-span-2 rounded-2xl min-h-[160px]"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />

    {/* Tile 7: Privasi */}
    <PrivasiTile />

    {/* Tile 8: AI Proaktif */}
    <AITile />

  </div>
</section>
```

Then add these 4 component functions **above** the `FeaturesPage` default export:

```tsx
// ── Tile: Anggaran & Goals ────────────────────────────────────────────────────
function AnggrangTile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const bars = [
    { label: 'Makanan', pct: 72, color: '#F59E0B' },
    { label: 'Transport', pct: 40, color: 'var(--accent)' },
    { label: 'Goal Bali', pct: 60, color: 'var(--success)' },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)' }}>
          <Target size={16} style={{ color: '#F59E0B' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Anggaran & Goals</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Set budget bulanan dan pantau progress tabungan kamu.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {bars.map((bar, i) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{bar.label}</span>
              <span className="text-xs font-semibold" style={{ color: bar.color }}>{bar.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--land-separator)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: bar.color }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${bar.pct}%` } : { width: 0 }}
                transition={{ duration: 0.7, delay: 0.25 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Tile: Hutang & Piutang ────────────────────────────────────────────────────
function HutangTile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setSettled(true), 2200)
    return () => clearTimeout(t)
  }, [inView])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.21, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.12)' }}>
          <HandCoins size={16} style={{ color: 'var(--success)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Hutang & Piutang</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Catat siapa yang berhutang, selesaikan satu tap.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {/* Chip: Budi — settles after inView */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={inView ? { opacity: settled ? 0.35 : 1, x: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--danger)', textDecoration: settled ? 'line-through' : 'none' }}>Budi</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rp 50.000</span>
          </div>
          <AnimatePresence>
            {settled && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}
              >
                Lunas ✓
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
        {/* Chip: Sari */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Sari</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rp 120.000</span>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Tile: Privasi ─────────────────────────────────────────────────────────────
function PrivasiTile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const labels = ['🔒 Encrypted', '🛡️ Row Level Security', '🚫 No Data Sharing']

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.12)' }}>
          <motion.div
            animate={inView ? { scale: [1, 1.12, 1] } : {}}
            transition={{ delay: 0.4, duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
          </motion.div>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Privasi Terjaga</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Data kamu dienkripsi dan hanya bisa diakses akunmu sendiri.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {labels.map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.35 + i * 0.15, duration: 0.4 }}
            className="text-xs px-3 py-2 rounded-xl font-medium"
            style={{ background: 'rgba(34,197,94,0.08)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.15)' }}
          >
            {label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Tile: AI Proaktif ─────────────────────────────────────────────────────────
function AITile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const insights = [
    { emoji: '⚠️', text: 'Budget Makanan 85% terpakai' },
    { emoji: '📈', text: 'Pengeluaran naik 23% vs minggu lalu' },
    { emoji: '🎯', text: 'Goal Bali sudah 60%!' },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.0, ease: [0.22, 1, 0.36, 1] }}
      className="sm:col-span-2 lg:col-span-3 rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(251,183,36,0.12)' }}>
          <Zap size={16} style={{ color: '#FBB724' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Proaktif</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Finara kasih insight otomatis — budget hampir habis, pola pengeluaran aneh, dan lainnya.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {insights.map((ins, i) => (
          <motion.div
            key={ins.text}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.2, type: 'spring', stiffness: 320, damping: 24 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
            style={{ background: 'rgba(251,183,36,0.1)', color: '#FBB724', border: '1px solid rgba(251,183,36,0.2)' }}
          >
            <span>{ins.emoji}</span>
            {ins.text}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/page.tsx
git commit -m "feat: add bento grid shell + 4 simple tiles (Anggaran, Hutang, Privasi, AI)"
```

---

### Task 4: Bento grid — Chat Natural tile + Dashboard tile (loop + complex demos)

**Files:**
- Modify: `src/app/features/page.tsx` — replace the two tall placeholder divs with `ChatTile` and `DashboardTile` components

**Interfaces:**
- Consumes: `useInView`, `useEffect`, `useRef`, `useState` already imported in Task 2
- Produces: `ChatTile` (typing loop, ~6s cycle), `DashboardTile` (count-up + sparkline draw on inView)

- [ ] **Step 1: Add `ChatTile` component above `FeaturesPage`**

Add this function above `AnggrangTile`:

```tsx
function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)) }

const CHAT_DEMO = [
  { role: 'user', text: 'beli kopi 25rb' },
  { role: 'ai', text: 'Siap dicatat! ☕', card: { label: 'Makanan & Minuman', amount: 25000, type: 'expense' } },
  { role: 'user', text: 'gaji masuk 5 juta' },
  { role: 'ai', text: 'Yeay gajian! 🎉', card: { label: 'Gaji', amount: 5000000, type: 'income' } },
]

function ChatTile() {
  const [shown, setShown] = useState<number[]>([])
  const [typing, setTyping] = useState(false)
  const [userTypingIdx, setUserTypingIdx] = useState<number | null>(null)
  const [userTypingText, setUserTypingText] = useState('')
  const msgsRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const startedRef = useRef(false)

  useEffect(() => {
    if (!inView || startedRef.current) return
    startedRef.current = true
    let cancelled = false

    async function play() {
      await delay(500)
      if (cancelled) return
      for (let i = 0; i < CHAT_DEMO.length; i++) {
        const item = CHAT_DEMO[i]
        if (item.role === 'user') {
          setUserTypingIdx(i)
          setUserTypingText('')
          for (let c = 0; c <= item.text.length; c++) {
            if (cancelled) return
            setUserTypingText(item.text.slice(0, c))
            await delay(40 + Math.random() * 25)
          }
          await delay(200)
          setUserTypingIdx(null)
          setShown((prev) => [...prev, i])
          await delay(400)
        } else {
          setTyping(true)
          await delay(850)
          if (cancelled) return
          setTyping(false)
          setShown((prev) => [...prev, i])
          await delay(700)
        }
      }
      await delay(2000)
      if (!cancelled) {
        setShown([]); setTyping(false); setUserTypingIdx(null); setUserTypingText('')
        play()
      }
    }

    play()
    return () => { cancelled = true }
  }, [inView])

  useEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown, typing, userTypingText])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.0, ease: [0.22, 1, 0.36, 1] }}
      className="sm:col-span-1 lg:col-span-1 lg:row-span-2 rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)', minHeight: 320 }}
    >
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent-dim)' }}>
          <MessageCircle size={16} style={{ color: 'var(--accent-light)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Chat Natural</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ketik kayak chat biasa — Finara langsung ngerti.</p>
        </div>
      </div>

      {/* Mini chat window */}
      <div
        className="flex-1 rounded-xl overflow-hidden flex flex-col"
        style={{ background: 'var(--land-surface)', border: '1px solid var(--land-glass-border)', minHeight: 200 }}
      >
        <div ref={msgsRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2" style={{ scrollbarWidth: 'none' }}>
          <div className="flex-1 min-h-0" />
          <AnimatePresence initial={false}>
            {CHAT_DEMO.map((item, i) => {
              if (!shown.includes(i)) return null
              const isUser = item.role === 'user'
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className="px-2.5 py-1.5 rounded-xl text-xs leading-relaxed max-w-[85%]"
                    style={isUser
                      ? { background: 'linear-gradient(135deg,var(--bubble-user-from),var(--bubble-user-to))', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: 'var(--land-chat-ai)', color: 'var(--text-primary)', border: '1px solid var(--land-chat-ai-border)', borderBottomLeftRadius: 4 }
                    }
                  >
                    {item.text}
                  </div>
                  {!isUser && item.card && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="w-full max-w-[85%] mt-1 px-2.5 py-1.5 rounded-xl flex items-center justify-between"
                      style={{
                        background: 'var(--land-glass)',
                        border: `1px solid ${item.card.type === 'income' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        borderLeft: `3px solid ${item.card.type === 'income' ? 'var(--success)' : 'var(--danger)'}`,
                      }}
                    >
                      <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{item.card.label}</span>
                      <span className="text-[10px] font-bold" style={{ color: item.card.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {item.card.type === 'income' ? '+' : '-'}Rp {item.card.amount.toLocaleString('id-ID')}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
            {userTypingIdx !== null && (
              <motion.div key="utyping" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                <div className="px-2.5 py-1.5 rounded-xl text-xs max-w-[85%]"
                  style={{ background: 'linear-gradient(135deg,var(--bubble-user-from),var(--bubble-user-to))', color: '#fff', borderBottomRightRadius: 4 }}>
                  {userTypingText || ' '}
                  <span className="inline-block w-0.5 h-3 ml-0.5 align-middle" style={{ background: 'rgba(255,255,255,0.7)', animation: 'cursor-blink 0.8s step-end infinite' }} />
                </div>
              </motion.div>
            )}
            {typing && (
              <motion.div key="aityping" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl w-fit"
                style={{ background: 'var(--land-chat-ai)', border: '1px solid var(--land-chat-ai-border)' }}>
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-light)' }}
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.16 }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Add `DashboardTile` component above `FeaturesPage`**

Add after `ChatTile`:

```tsx
const SPARKLINE_PTS = [40, 55, 38, 70, 52, 88, 63, 95, 72, 110, 84, 128]

function DashboardTile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const target = 3600000
    const duration = 1200
    const start = performance.now()
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setCount(Math.round(target * ease))
      if (t < 1) requestAnimationFrame(step)
    }
    const raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView])

  // Sparkline
  const W = 300, H = 52
  const min = Math.min(...SPARKLINE_PTS), max = Math.max(...SPARKLINE_PTS)
  const pts = SPARKLINE_PTS.map((v, i) => {
    const x = (i / (SPARKLINE_PTS.length - 1)) * W
    const y = H - ((v - min) / (max - min)) * (H - 10) - 5
    return `${x},${y}`
  })
  const polyline = pts.join(' ')
  const totalLength = 320 // approximate path length

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="sm:col-span-1 lg:col-span-1 lg:row-span-2 rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)', minHeight: 320 }}
    >
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent-dim)' }}>
          <BarChart2 size={16} style={{ color: 'var(--accent-light)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Dashboard</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Saldo, tren, dan breakdown kategori — realtime.</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 flex-shrink-0">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Saldo bulan ini</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Rp {count.toLocaleString('id-ID')}
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>▲ 12%</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>vs bulan lalu</span>
        </div>
      </div>

      <div className="overflow-hidden flex-shrink-0">
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="ftspk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,${H} ${polyline} ${W},${H}`} fill="url(#ftspk)" />
          <motion.polyline
            points={polyline}
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
      </div>

      <div className="flex gap-4 flex-shrink-0">
        {[
          { label: 'Pemasukan', val: '+Rp 5 Jt', color: 'var(--success)' },
          { label: 'Pengeluaran', val: '-Rp 1,4 Jt', color: 'var(--danger)' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 + i * 0.15, duration: 0.4 }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
            <p className="text-sm font-semibold" style={{ color: item.color }}>{item.val}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Replace placeholder divs with `ChatTile` and `DashboardTile`**

In the bento grid section added in Task 3, replace:
```tsx
{/* Tile: Chat Natural — placeholder, filled in Task 4 */}
<div className="sm:col-span-1 lg:col-span-1 lg:row-span-2 rounded-2xl min-h-[320px] sm:min-h-[360px]"
  style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />

{/* Tile: Dashboard — placeholder, filled in Task 4 */}
<div className="sm:col-span-1 lg:col-span-1 lg:row-span-2 rounded-2xl min-h-[320px] sm:min-h-[360px]"
  style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />
```
with:
```tsx
<ChatTile />
<DashboardTile />
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output (clean).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/page.tsx
git commit -m "feat: add ChatTile (loop typing demo) and DashboardTile (count-up + sparkline)"
```

---

### Task 5: Bento grid — Aset tile + Scan Struk tile

**Files:**
- Modify: `src/app/features/page.tsx` — add `AsetTile` and `ScanTile`, replace placeholders

**Interfaces:**
- Consumes: `useInView`, `useEffect`, `useRef`, `useState`, `AnimatePresence` already imported
- Produces: `AsetTile` (net-worth count-up + 4 mini bars), `ScanTile` (scan line loop + field reveal)

- [ ] **Step 1: Add `AsetTile` above `FeaturesPage`**

Add after `DashboardTile`:

```tsx
function AsetTile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    const target = 87500000
    const duration = 1400
    const start = performance.now()
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setCount(Math.round(target * ease))
      if (t < 1) requestAnimationFrame(step)
    }
    const raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView])

  const asetBars = [
    { label: 'Rekening', pct: 57, color: 'var(--accent)' },
    { label: 'Investasi', pct: 34, color: 'var(--success)' },
    { label: 'Properti', pct: 80, color: '#F59E0B' },
    { label: 'Kendaraan', pct: 22, color: 'var(--text-secondary)' },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="sm:col-span-2 lg:col-span-2 rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.12)' }}>
          <Landmark size={16} style={{ color: 'var(--success)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Manajemen Aset</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Pantau total kekayaan bersih dari rekening hingga investasi.</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-shrink-0">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Aset</p>
          <p className="text-xl font-bold" style={{ color: 'var(--success)', letterSpacing: '-0.03em' }}>
            Rp {count.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {asetBars.map((bar, i) => (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{bar.label}</span>
                <span className="text-xs font-semibold" style={{ color: bar.color }}>{bar.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--land-separator)' }}>
                <motion.div className="h-full rounded-full" style={{ background: bar.color }}
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${bar.pct}%` } : { width: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Add `ScanTile` above `FeaturesPage`**

Add after `AsetTile`:

```tsx
function ScanTile() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle')
  const startedRef = useRef(false)

  useEffect(() => {
    if (!inView || startedRef.current) return
    startedRef.current = true
    let cancelled = false

    async function play() {
      await delay(400)
      if (cancelled) return
      setPhase('scanning')
      await delay(2200)
      if (cancelled) return
      setPhase('done')
      await delay(2500)
      if (cancelled) return
      setPhase('idle')
      await delay(300)
      if (!cancelled) play()
    }

    play()
    return () => { cancelled = true }
  }, [inView])

  const fields = [
    { label: 'Merchant', value: 'Indomaret' },
    { label: 'Total', value: 'Rp 87.500' },
    { label: 'Tanggal', value: '21 Jun 2026' },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      className="sm:col-span-2 lg:col-span-2 rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.12)' }}>
          <ScanLine size={16} style={{ color: '#3B82F6' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Scan Struk</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Foto struk — Finara ekstrak detail transaksi otomatis.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Fake receipt */}
        <div className="relative rounded-xl overflow-hidden flex-shrink-0 w-28 sm:w-32"
          style={{ background: 'var(--land-surface)', border: '1px solid var(--land-glass-border)', height: 100 }}>
          {/* Fake text lines */}
          {[20, 35, 50, 65, 80].map((top) => (
            <div key={top} className="absolute h-1 rounded-full" style={{ top, left: 10, right: 10, background: 'var(--land-separator)', opacity: 0.6 }} />
          ))}
          {/* Scan line */}
          {phase === 'scanning' && (
            <motion.div
              className="absolute left-0 right-0 h-0.5"
              style={{ background: 'rgba(59,130,246,0.8)', boxShadow: '0 0 8px rgba(59,130,246,0.6)' }}
              initial={{ top: 0 }}
              animate={{ top: 100 }}
              transition={{ duration: 2, ease: 'linear' }}
            />
          )}
          {phase === 'done' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center rounded-xl"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <span className="text-xs font-semibold" style={{ color: '#3B82F6' }}>✓ Terbaca</span>
            </motion.div>
          )}
        </div>

        {/* Extracted fields */}
        <div className="flex-1 flex flex-col gap-2">
          {phase === 'idle' && (
            <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>Arahkan kamera ke struk...</p>
          )}
          <AnimatePresence>
            {phase === 'done' && fields.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.18, type: 'spring', stiffness: 320, damping: 24 }}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl"
                style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)' }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.label}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{f.value}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Replace placeholder divs with `AsetTile` and `ScanTile`**

In the bento grid, replace:
```tsx
{/* Tile 5: Aset — placeholder, filled in Task 5 */}
<div className="sm:col-span-2 lg:col-span-2 rounded-2xl min-h-[160px]"
  style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />

{/* Tile 6: Scan Struk — placeholder, filled in Task 5 */}
<div className="sm:col-span-2 lg:col-span-2 rounded-2xl min-h-[160px]"
  style={{ background: 'var(--land-glass)', border: '1px solid var(--land-glass-border)', boxShadow: 'var(--land-card-shadow)' }} />
```
with:
```tsx
<AsetTile />
<ScanTile />
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output (clean).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/page.tsx
git commit -m "feat: add AsetTile (count-up + bars) and ScanTile (scan line loop)"
```

---

### Task 6: Add `cursor-blink` keyframe + final polish

**Files:**
- Modify: `src/app/globals.css` — add `@keyframes cursor-blink`
- Modify: `src/app/features/page.tsx` — verify grid ordering is correct on all breakpoints, add section label above bento grid

**Interfaces:**
- Consumes: `cursor-blink` animation referenced in `ChatTile`
- Produces: Fully polished, responsive features page ready for production

- [ ] **Step 1: Add `cursor-blink` keyframe to `globals.css`**

In `src/app/globals.css`, append after the last `[data-theme="light"]` closing brace:

```css
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

(Note: this keyframe is already used by the landing page chat demo — if it's already present in the file, skip this step.)

- [ ] **Step 2: Add section label above bento grid**

In `features/page.tsx`, directly before the `<section className="relative z-10 px-5 sm:px-8 lg:px-16 pb-8 max-w-6xl mx-auto w-full">` bento grid section, add:

```tsx
<div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-16 mb-4 text-center">
  <motion.p
    initial={{ opacity: 0, y: 8 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.4 }}
    className="text-xs font-semibold uppercase tracking-widest"
    style={{ color: 'var(--accent-light)' }}
  >
    8 fitur dalam satu tempat
  </motion.p>
</div>
```

- [ ] **Step 3: Full TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output (clean).

- [ ] **Step 4: Verify responsive grid visually**

Start dev server and check:
```bash
npm run dev
```
Open `http://localhost:3000/features` and verify:
- Mobile (< 640px): all tiles stack single column
- Tablet (640px–1023px): 2-column grid, AI Proaktif spans 2 cols
- Desktop (≥ 1024px): 3-column grid, Chat and Dashboard are tall (row-span-2), AI Proaktif spans full 3 cols
- All animations trigger on scroll into view
- Chat loop restarts correctly
- Scan loop restarts correctly
- Landing page `/` shows "Lihat fitur-fiturnya" button that routes to `/features`
- `/features` is accessible without login

- [ ] **Step 5: Final commit**

```bash
git add src/app/globals.css src/app/features/page.tsx
git commit -m "feat: complete /features page — bento grid with 8 animated tiles, responsive"
```
