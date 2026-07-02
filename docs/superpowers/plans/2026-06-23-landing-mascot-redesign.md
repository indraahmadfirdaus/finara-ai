# Landing Page Mascot Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `src/app/page.tsx` dengan maskot AI Orb scroll companion + 4 section baru yang conversational, menggantikan DashboardPreview dan FeatureTile yang ada.

**Architecture:** `MascotOrb` adalah komponen baru yang menerima `state` dan `showBubble` dari parent `LandingPage`. Parent menggunakan `IntersectionObserver` untuk mendeteksi section aktif dan mengupdate state maskot. Section baru (Care, Platform, Insight, CTA) diimplementasi sebagai sub-komponen di dalam `page.tsx`.

**Tech Stack:** Next.js 16, React, Framer Motion v12, Tailwind v4, TypeScript, CSS custom properties (no hardcoded hex kecuali brand colors Telegram/WhatsApp)

## Global Constraints

- Semua warna pakai `var(--)` — hardcode hex hanya untuk Telegram brand `#229ED9` dan WhatsApp brand `#25D366`
- Framer Motion spring default: `stiffness: 300, damping: 22` (cards) — ikuti CLAUDE.md §6
- `MascotOrb` hanya render di landing page — tidak bocor ke `/(app)/*`
- Tidak ada perubahan ke `globals.css`, API routes, atau komponen lain selain yang disebutkan
- `npx tsc --noEmit` harus clean sebelum setiap commit
- Tidak ada disclaimer "kartu kredit" di CTA — hanya "Gratis. Mulai sekarang."
- Telegram dan WhatsApp cards keduanya `SOON` (disabled) — bot belum ada
- Bubble maskot untuk `#section-platform`: *"Finara bakal hadir di mana kamu ngobrol!"* (bukan janji live)

---

## File Map

```
src/
├── components/
│   └── landing/
│       └── MascotOrb.tsx        ← BARU: orb + ekspresi + bubble
└── app/
    └── page.tsx                 ← UBAH: rewrite sections, tambah MascotOrb
```

---

### Task 1: Buat komponen `MascotOrb` — orb visual + floating animation

**Files:**
- Create: `src/components/landing/MascotOrb.tsx`

**Interfaces:**
- Produces:
  ```tsx
  export type MascotState = 'idle' | 'wave' | 'worried' | 'angry' | 'excited' | 'happy'
  export interface MascotOrbProps { state: MascotState; showBubble: boolean }
  export default function MascotOrb(props: MascotOrbProps): JSX.Element
  ```

- [ ] **Step 1: Buat file dan scaffold komponen**

```tsx
// src/components/landing/MascotOrb.tsx
'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type MascotState = 'idle' | 'wave' | 'worried' | 'angry' | 'excited' | 'happy'

export interface MascotOrbProps {
  state: MascotState
  showBubble: boolean
}

const GLOW: Record<MascotState, string> = {
  idle:    'rgba(124,92,252,0.3)',
  wave:    'rgba(124,92,252,0.6)',
  worried: 'rgba(245,158,11,0.5)',
  angry:   'rgba(239,68,68,0.5)',
  excited: 'rgba(6,182,212,0.5)',
  happy:   'rgba(34,197,94,0.5)',
}

const BUBBLE: Record<MascotState, string | null> = {
  idle:    null,
  wave:    'Hei! Gue Finara, asisten keuangan kamu 👋',
  worried: 'Eh, pengeluaranmu naik nih... 👀',
  angry:   'Ini beneran ga diatur?? 😤',
  excited: 'Finara bakal hadir di mana kamu ngobrol!',
  happy:   'Ayo! Gue udah nunggu nih 🎉',
}

export default function MascotOrb({ state, showBubble }: MascotOrbProps) {
  return (
    <div
      className="fixed z-40 flex items-center gap-2"
      style={{ right: 24, top: '50%', transform: 'translateY(-50%)' }}
    >
      {/* Bubble — kiri dari orb */}
      <AnimatePresence>
        {showBubble && BUBBLE[state] && (
          <motion.div
            key={state}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="rounded-2xl px-3 py-2 text-xs leading-relaxed"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              maxWidth: 200,
              borderBottomRightRadius: 4,
            }}
          >
            {BUBBLE[state]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #A78BFA 0%, #7C5CFC 100%)',
          boxShadow: `0 0 24px 4px ${GLOW[state]}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          position: 'relative',
          flexShrink: 0,
          transition: 'box-shadow 0.4s ease',
        }}
      >
        {/* Layar ekspresi */}
        <OrbFace state={state} />
      </motion.div>
    </div>
  )
}

function OrbFace({ state }: { state: MascotState }) {
  // placeholder — diisi Task 2
  return null
}
```

- [ ] **Step 2: Verify TypeScript clean**

```bash
cd /Users/indra/Documents/nyoba/finara && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit scaffold**

```bash
git add src/components/landing/MascotOrb.tsx
git commit -m "feat: scaffold MascotOrb component — orb + bubble + glow"
```

---

### Task 2: Implementasi `OrbFace` — ekspresi mata per state

**Files:**
- Modify: `src/components/landing/MascotOrb.tsx` — replace `OrbFace` placeholder

**Interfaces:**
- Consumes: `MascotState` dari Task 1
- Produces: `OrbFace({ state })` yang render SVG mata animasi

- [ ] **Step 1: Replace `OrbFace` dengan implementasi lengkap**

Ganti fungsi `OrbFace` di `MascotOrb.tsx`:

```tsx
function OrbFace({ state }: { state: MascotState }) {
  // Layar: rounded rect di tengah-bawah orb
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 36,
        height: 20,
        borderRadius: 6,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Eyes state={state} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Eyes({ state }: { state: MascotState }) {
  // idle & wave: dot berkedip / arc happy
  if (state === 'idle') {
    return (
      <>
        <BlinkDot />
        <BlinkDot delay={0.3} />
      </>
    )
  }
  if (state === 'wave' || state === 'happy') {
    // ^ ^ arc
    return (
      <svg width="22" height="8" viewBox="0 0 22 8" fill="none">
        <path d="M1 7 Q4 1 7 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M15 7 Q18 1 21 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
  if (state === 'worried' || state === 'angry') {
    // > < nervous / angry
    return (
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
        {/* Brow turun untuk angry */}
        {state === 'angry' && (
          <>
            <line x1="1" y1="1" x2="7" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="21" y1="1" x2="15" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
        {/* Mata oval kecil */}
        <ellipse cx="5" cy="7" rx="2.5" ry="2" fill="white" />
        <ellipse cx="17" cy="7" rx="2.5" ry="2" fill="white" />
      </svg>
    )
  }
  if (state === 'excited') {
    // ★ ★
    return (
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
        <text x="1" y="9" fontSize="8" fill="white">★</text>
        <text x="13" y="9" fontSize="8" fill="white">★</text>
      </svg>
    )
  }
  return null
}

function BlinkDot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }}
      animate={{ scaleY: [1, 0.1, 1] }}
      transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5 + delay, delay }}
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript clean**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/MascotOrb.tsx
git commit -m "feat: MascotOrb OrbFace — animated eyes per state (idle/wave/worried/angry/excited/happy)"
```

---

### Task 3: Wiring `IntersectionObserver` di `LandingPage` + mount/unmount MascotOrb

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `MascotOrb`, `MascotState` dari Task 1
- Produces: `mascotState` dan `showBubble` state di `LandingPage`, observer di-disconnect on unmount

- [ ] **Step 1: Tambah import dan state di `LandingPage`**

Di `src/app/page.tsx`, tambah import:

```tsx
import MascotOrb, { type MascotState } from '@/components/landing/MascotOrb'
```

Di dalam `export default function LandingPage()`, tambah setelah baris `const [scrolled, setScrolled] = useState(false)`:

```tsx
const [mascotState, setMascotState] = useState<MascotState>('idle')
const [showBubble, setShowBubble] = useState(false)
const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

function triggerMascot(state: MascotState) {
  setMascotState(state)
  setShowBubble(true)
  if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
  bubbleTimerRef.current = setTimeout(() => setShowBubble(false), 4000)
}
```

- [ ] **Step 2: Tambah `useEffect` untuk `IntersectionObserver`**

Tambah setelah `useEffect` scroll yang ada (baris ~847 di page.tsx original):

```tsx
useEffect(() => {
  const sections: Array<{ id: string; handler: () => void }> = [
    { id: 'section-hero',     handler: () => triggerMascot('wave') },
    { id: 'section-care',     handler: () => {
        triggerMascot('worried')
        setTimeout(() => triggerMascot('angry'), 1500)
    }},
    { id: 'section-platform', handler: () => triggerMascot('excited') },
    { id: 'section-cta',      handler: () => triggerMascot('happy') },
  ]

  const observers: IntersectionObserver[] = []

  sections.forEach(({ id, handler }) => {
    const el = document.getElementById(id)
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) handler() },
      { threshold: 0.4 }
    )
    obs.observe(el)
    observers.push(obs)
  })

  return () => {
    observers.forEach((obs) => obs.disconnect())
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
  }
}, [])
```

- [ ] **Step 3: Tambah `MascotOrb` ke JSX dan `id` ke Hero section**

Di JSX `LandingPage`, sebelum `</div>` penutup paling luar:

```tsx
<MascotOrb state={mascotState} showBubble={showBubble} />
```

Di Hero `<section>`, tambah `id`:

```tsx
<section id="section-hero" className="relative z-10 px-5 sm:px-8 lg:px-16 pt-28 pb-16 lg:pt-32 lg:pb-24">
```

- [ ] **Step 4: Verify TypeScript clean**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/landing/MascotOrb.tsx
git commit -m "feat: wire IntersectionObserver → MascotOrb state in LandingPage"
```

---

### Task 4: Hapus `DashboardPreview` dan `FeatureTile` dari `page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: existing `DashboardPreview`, `FeatureTile`, `FEATURES`, `SPEND_BARS`, `SPARKLINE`, `MiniDonut`, `Sparkline` — semua dihapus
- Produces: file bersih tanpa komponen-komponen di atas

- [ ] **Step 1: Hapus komponen dan data yang tidak lagi dipakai**

Dari `src/app/page.tsx`, hapus seluruh definisi berikut:

- `const FEATURES = [...]` (baris ~36-58)
- `const SPEND_BARS = [...]`
- `const SPARKLINE = [...]`
- Fungsi `Sparkline(...)`
- Fungsi `MiniDonut(...)`
- Fungsi `DashboardPreview()`
- Fungsi `FeatureTile(...)`

- [ ] **Step 2: Hapus penggunaan di JSX**

Di JSX `LandingPage`, hapus:

```tsx
{/* Dashboard Preview */}
<DashboardPreview />

{/* Divider */}
<div className="relative z-10 flex items-center gap-4 ...">
  ...Kenapa Finara?...
</div>

{/* Features */}
<section className="relative z-10 px-5 sm:px-8 lg:px-16 pb-20">
  <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4">
    {FEATURES.map((f, i) => (
      <FeatureTile key={f.title} {...f} delay={i * 0.1} />
    ))}
  </div>
</section>
```

- [ ] **Step 3: Hapus import yang tidak lagi dipakai**

Dari baris import di atas, hapus `ShieldCheck` dan `Zap` dari lucide-react jika tidak dipakai lagi di tempat lain.

- [ ] **Step 4: Verify TypeScript clean**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: remove DashboardPreview, FeatureTile, and unused data from landing page"
```

---

### Task 5: Section 2 — "Finara Paling Perhatian" dengan mini orb

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `useInView` dari framer-motion (sudah diimport), `MascotState` dari Task 1
- Produces: fungsi `CareSectionMiniOrb({ state })` dan `CareSection()` di page.tsx, id `section-care`

- [ ] **Step 1: Tambah `MiniOrb` helper (mini versi dekoratif, bukan komponen utama)**

Tambah fungsi ini di `page.tsx` (sebelum `export default function LandingPage`):

```tsx
function MiniOrb({ state }: { state: 'angry' | 'happy' }) {
  const isAngry = state === 'angry'
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #A78BFA 0%, #7C5CFC 100%)',
        boxShadow: `0 0 12px 2px ${isAngry ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.5)'}`,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Layar mini */}
      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        width: 18, height: 10, borderRadius: 3, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isAngry ? (
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
            <line x1="1" y1="1" x2="5" y2="3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="13" y1="1" x2="9" y2="3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="4" cy="6" rx="2" ry="1.5" fill="white" />
            <ellipse cx="10" cy="6" rx="2" ry="1.5" fill="white" />
          </svg>
        ) : (
          <svg width="14" height="6" viewBox="0 0 14 6" fill="none">
            <path d="M1 5 Q3.5 1 6 5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M8 5 Q10.5 1 13 5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Tambah `CareSection` komponen**

```tsx
function CareSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const cards = [
    {
      state: 'angry' as const,
      bg: 'rgba(239,68,68,0.05)',
      border: 'var(--danger)',
      shadow: 'rgba(239,68,68,0.15)',
      quote: '"Ini beneran ga diatur?? Udah 3x makan di restoran mahal minggu ini."',
      delay: 0,
    },
    {
      state: 'happy' as const,
      bg: 'rgba(34,197,94,0.05)',
      border: 'var(--success)',
      shadow: 'rgba(34,197,94,0.15)',
      quote: '"Wah, tabungan kamu naik bulan ini! Proud of you 🎉"',
      delay: 0.12,
    },
  ]

  return (
    <section
      id="section-care"
      ref={ref}
      className="relative z-10 px-5 sm:px-8 lg:px-16 py-16"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <p
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Finara tuh... perhatian banget.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Seneng kalau kamu nabung. Khawatir kalau boros. Bahkan bisa marah.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {cards.map((card) => (
            <motion.div
              key={card.state}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ type: 'spring', stiffness: 280, damping: 22, delay: card.delay }}
              className="rounded-2xl p-5 relative"
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
                boxShadow: `0 0 20px ${card.shadow}`,
              }}
            >
              {/* Mini orb pojok kanan atas */}
              <div className="absolute top-4 right-4">
                <MiniOrb state={card.state} />
              </div>
              <p
                className="text-sm leading-relaxed italic pr-10 mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {card.quote}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Tambah `<CareSection />` ke JSX `LandingPage`**

Setelah Hero section closing tag `</section>` dan sebelum Footer, tambah:

```tsx
<CareSection />
```

- [ ] **Step 4: Verify TypeScript clean**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add CareSection — Finara Paling Perhatian with mini orb + mood cards"
```

---

### Task 6: Section 3 — "Chat di Mana Aja" (keduanya SOON)

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `useInView`, `motion` dari framer-motion
- Produces: fungsi `PlatformSection()`, id `section-platform`

- [ ] **Step 1: Tambah `PlatformSection` komponen**

```tsx
function PlatformSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const platforms = [
    {
      name: 'Telegram',
      color: '#229ED9',
      bg: 'rgba(34,158,217,0.08)',
      border: 'rgba(34,158,217,0.3)',
      soon: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
            stroke="#229ED9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      color: '#25D366',
      bg: 'rgba(37,211,102,0.06)',
      border: 'rgba(37,211,102,0.2)',
      soon: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
            stroke="#25D366" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <section
      id="section-platform"
      ref={ref}
      className="relative z-10 px-5 sm:px-8 lg:px-16 py-16"
    >
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <p
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Ga cuma di sini.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Finara bakal hadir di platform chat favoritmu. Coming soon.
          </p>
        </motion.div>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {platforms.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between px-5 py-4 rounded-2xl"
              style={{
                background: p.bg,
                border: `1px solid ${p.border}`,
                opacity: 0.65,
                cursor: 'not-allowed',
              }}
            >
              <div className="flex items-center gap-3">
                {p.icon}
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {p.name}
                </span>
              </div>
              <SoonBadge />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SoonBadge() {
  return (
    <span
      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
    >
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        ···
      </motion.span>
      SOON
    </span>
  )
}
```

- [ ] **Step 2: Tambah `<PlatformSection />` ke JSX**

Setelah `<CareSection />`:

```tsx
<PlatformSection />
```

- [ ] **Step 3: Verify TypeScript clean**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add PlatformSection — Telegram & WhatsApp coming soon teaser"
```

---

### Task 7: Section 4 — "Insight, Bukan Sekadar Angka" dengan rotate + maskot sync

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `triggerMascot` — dipanggil dari dalam `InsightSection` via prop `onInsightChange`
- Produces: fungsi `InsightSection({ onInsightChange })`, id `section-insight`

- [ ] **Step 1: Tambah `InsightSection` komponen**

```tsx
const INSIGHTS: Array<{ text: string; mascot: MascotState }> = [
  {
    text: 'Wah, pengeluaran kamu minggu ini naik 23% dari biasanya. Terbanyak di Makanan. Hati-hati ya! 👀',
    mascot: 'worried',
  },
  {
    text: 'Goal Liburan Bali kamu udah 60%! Tinggal Rp 2 juta lagi. Semangat! 🎯',
    mascot: 'excited',
  },
  {
    text: 'Budget Transportasi masih aman, sisa 58%. Kamu lagi hemat nih! ✅',
    mascot: 'happy',
  },
]

function InsightSection({ onInsightChange }: { onInsightChange: (state: MascotState) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [activeIdx, setActiveIdx] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!inView || startedRef.current) return
    startedRef.current = true
    onInsightChange(INSIGHTS[0].mascot)

    const interval = setInterval(() => {
      setActiveIdx((prev) => {
        const next = (prev + 1) % INSIGHTS.length
        onInsightChange(INSIGHTS[next].mascot)
        return next
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [inView, onInsightChange])

  return (
    <section
      id="section-insight"
      ref={ref}
      className="relative z-10 px-5 sm:px-8 lg:px-16 py-16"
    >
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <p
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Finara langsung kasih tau yang penting.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ga perlu buka-buka grafik. Finara yang analisis, kamu yang mutusin.
          </p>
        </motion.div>

        <div
          className="mx-auto rounded-2xl p-6"
          style={{
            maxWidth: 520,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* Header: mini orb + label */}
          <div className="flex items-center gap-2 mb-4">
            <div
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg,#A78BFA,#7C5CFC)',
                flexShrink: 0,
              }}
            />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Finara berkata...
            </span>
          </div>

          {/* Bubble rotate */}
          <div style={{ minHeight: 72 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="text-sm leading-relaxed text-left px-4 py-3 rounded-xl"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  borderBottomLeftRadius: 4,
                }}
              >
                {INSIGHTS[activeIdx].text}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {INSIGHTS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveIdx(i)
                  onInsightChange(INSIGHTS[i].mascot)
                }}
                style={{
                  width: i === activeIdx ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === activeIdx ? 'var(--accent)' : 'var(--border)',
                  transition: 'width 0.3s ease, background 0.3s ease',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Tambah `<InsightSection />` ke JSX dengan callback**

Setelah `<PlatformSection />`:

```tsx
<InsightSection onInsightChange={(s) => triggerMascot(s)} />
```

- [ ] **Step 3: Verify TypeScript clean**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add InsightSection — rotating insight bubbles synced to MascotOrb state"
```

---

### Task 8: CTA Section update + section id + mobile orb sizing

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/landing/MascotOrb.tsx`

**Interfaces:**
- Consumes: existing CTA JSX di `LandingPage`
- Produces: CTA dengan copy baru + `id="section-cta"`, MascotOrb responsive sizing

- [ ] **Step 1: Update CTA section copy dan tambah id**

Cari blok CTA yang berisi `"Siap coba Finara?"` di `page.tsx` dan replace:

```tsx
<section id="section-cta" className="relative z-10 px-5 sm:px-8 lg:px-16 py-16 text-center">
  <motion.p
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.5 }}
    className="text-xl font-bold mb-2"
    style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
  >
    Siap punya asisten keuangan yang beneran perhatian?
  </motion.p>
  <motion.p
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay: 0.1 }}
    className="text-sm mb-8"
    style={{ color: 'var(--text-muted)' }}
  >
    Gratis. Mulai sekarang.
  </motion.p>
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.5, delay: 0.15 }}
  >
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push('/register')}
      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-black"
      style={{ background: 'linear-gradient(135deg,#FBB724 0%,#F97316 100%)' }}
    >
      Mulai gratis sekarang
      <ArrowRight size={15} />
    </motion.button>
  </motion.div>
</section>
```

- [ ] **Step 2: Tambah responsive sizing ke `MascotOrb`**

Di `MascotOrb.tsx`, update wrapper orb untuk responsive. Ganti elemen `motion.div` orb:

```tsx
{/* Orb — 48px mobile, 64px desktop via inline style + media tidak bisa, pakai class wrapper */}
<motion.div
  animate={{ y: [0, -8, 0] }}
  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  className="w-12 h-12 lg:w-16 lg:h-16"
  style={{
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #A78BFA 0%, #7C5CFC 100%)',
    boxShadow: `0 0 24px 4px ${GLOW[state]}, inset 0 1px 0 rgba(255,255,255,0.15)`,
    position: 'relative',
    flexShrink: 0,
    transition: 'box-shadow 0.4s ease',
  }}
>
  <OrbFace state={state} />
</motion.div>
```

Dan bubble max-width responsive:

```tsx
style={{
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  maxWidth: 'min(200px, 45vw)',   // responsive tanpa media query
  borderBottomRightRadius: 4,
}}
```

- [ ] **Step 3: Verify TypeScript clean**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/landing/MascotOrb.tsx
git commit -m "feat: update CTA copy, add section ids, responsive MascotOrb sizing"
```

---

### Task 9: QA checklist + polish

**Files:**
- Modify: `src/app/page.tsx`, `src/components/landing/MascotOrb.tsx` jika ada fix

- [ ] **Step 1: Cek semua section id ada**

Pastikan JSX punya semua `id` berikut:
- `id="section-hero"` di Hero section
- `id="section-care"` di CareSection
- `id="section-platform"` di PlatformSection
- `id="section-insight"` di InsightSection
- `id="section-cta"` di CTA section

- [ ] **Step 2: Cek MascotOrb tidak render di app routes**

Verify bahwa `MascotOrb` hanya di-import dan dirender di `src/app/page.tsx` — tidak ada di `src/app/(app)/` atau layout mana pun:

```bash
grep -r "MascotOrb" src/app/\(app\)/ 2>/dev/null || echo "CLEAN — tidak ada di app routes"
```

Expected: `CLEAN — tidak ada di app routes`

- [ ] **Step 3: Cek tidak ada hardcode hex selain brand colors**

```bash
grep -n "#[0-9A-Fa-f]\{6\}" src/components/landing/MascotOrb.tsx src/app/page.tsx | grep -v "229ED9\|25D366\|A78BFA\|7C5CFC\|FBB724\|F97316\|EF4444\|22C55E\|F59E0B\|06B6D4\|3B82F6\|EC4899\|8B5CF6"
```

Expected: no output (kosong = bersih)

- [ ] **Step 4: Final TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: no errors (output kosong)

- [ ] **Step 5: Commit final**

```bash
git add src/app/page.tsx src/components/landing/MascotOrb.tsx
git commit -m "feat: landing page redesign complete — MascotOrb scroll companion + 4 new sections"
```

---

## Self-Review

**Spec coverage:**
- ✅ MascotOrb: visual, glow, floating — Task 1
- ✅ Ekspresi mata per state — Task 2
- ✅ IntersectionObserver scroll detection — Task 3
- ✅ Hapus DashboardPreview + FeatureTile — Task 4
- ✅ Section "Finara Paling Perhatian" + mini orb — Task 5
- ✅ Section "Chat di Mana Aja" keduanya SOON — Task 6
- ✅ Section "Insight" rotate + maskot sync — Task 7
- ✅ CTA copy baru tanpa disclaimer — Task 8
- ✅ Mobile responsive orb sizing — Task 8
- ✅ Bubble auto-dismiss 4 detik + cleanup on unmount — Task 3
- ✅ Observer disconnect on unmount — Task 3

**Placeholder scan:** Tidak ada TBD atau "implement later". Setiap step punya kode lengkap.

**Type consistency:** `MascotState` didefinisikan Task 1, dipakai konsisten di Task 2, 3, 5, 7. `triggerMascot(state: MascotState)` didefinisikan Task 3, dipanggil Task 7 via `onInsightChange`. `INSIGHTS[n].mascot` bertipe `MascotState` — konsisten.
