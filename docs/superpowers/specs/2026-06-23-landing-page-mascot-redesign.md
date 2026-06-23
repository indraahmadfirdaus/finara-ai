# Landing Page Redesign — Maskot AI Orb + Scroll Companion

**Date:** 2026-06-23
**Scope:** `src/app/page.tsx` (landing page only — `/features` page disentuh nanti)
**Approach:** Opsi A — Maskot scroll companion, fixed position, ekspresi kontekstual per section

---

## 1. Konteks & Motivasi

Landing page saat ini terlalu "AI-generated" — kontennya finance-heavy, grafik-berat, dan tidak engaging untuk user awam. Prinsip utama Finara adalah **chat-first AI finance assistant**, tapi landing page tidak mencerminkan itu.

Tujuan redesign:
- Hadirkan **karakter/maskot AI** sebagai gimmick utama yang memorable
- Ganti section yang berat jadi lebih **singkat, conversational, dan bikin "WIH"**
- Tonjolkan bahwa Finara bisa dipakai di platform lain (Telegram)
- Tone: teman perhatian yang relatable, bukan software finance yang kaku

---

## 2. Struktur Halaman Baru

```
[NAV]           — tidak berubah
[HERO]          — tidak berubah secara layout, + maskot entry animation
[SECTION 2]     — "Finara Paling Perhatian" (baru)
[SECTION 3]     — "Chat di Mana Aja" (baru)
[SECTION 4]     — "Insight, Bukan Sekadar Angka" (replace DashboardPreview)
[CTA]           — disederhanakan
[FOOTER]        — tidak berubah
```

**Dihapus:** `DashboardPreview` (3 panel grafik) dan `FeatureTile` section ("Kenapa Finara?") — digantikan Section 2, 3, 4.

---

## 3. Maskot AI Orb — Komponen `MascotOrb`

### Visual

- **Bentuk:** Bola 64px (desktop) / 48px (mobile)
- **Material:** Glass/metallic, gradient `#A78BFA → #7C5CFC`, rim light `rgba(255,255,255,0.15)` tipis
- **Layar:** Rounded rect di depan orb, nampilin "mata" — dua elemen SVG/div yang berubah per ekspresi
- **Posisi:** `fixed`, kanan layar, vertikal center — `right: 24px`, `top: 50%`, `transform: translateY(-50%)`
- **z-index:** 40 (di bawah nav yang z-50)
- **Mobile:** Tetap visible tapi lebih kecil (48px), bubble max-width 160px

### Floating Animation (idle)

```tsx
animate={{ y: [0, -8, 0] }}
transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
```

### State & Ekspresi

| State | Mata (SVG) | Glow color | Bubble text |
|---|---|---|---|
| `idle` | `· ·` berkedip pelan setiap 4 detik | `rgba(124,92,252,0.3)` | — |
| `wave` | `^ ^` arc happy | `rgba(124,92,252,0.6)` | *"Hei! Gue Finara, asisten keuangan kamu 👋"* |
| `worried` | `> <` nervous arc | `rgba(245,158,11,0.5)` | *"Eh, pengeluaranmu naik nih... 👀"* |
| `angry` | `> <` + brow line turun | `rgba(239,68,68,0.5)` | *"Ini beneran ga diatur?? 😤"* |
| `excited` | `★ ★` | `rgba(6,182,212,0.5)` | *"Kamu bisa chat aku di Telegram sekarang!"* |
| `happy` | `^ ^` + shimmer ring | `rgba(34,197,94,0.5)` | *"Ayo! Gue udah nunggu nih 🎉"* |

Glow diimplementasi sebagai `box-shadow` pada orb container:
```tsx
boxShadow: `0 0 24px 4px ${glowColor}`
```

### Bubble Chat

- Muncul dari kiri orb: `initial={{ x: 16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}`
- Spring: `stiffness: 320, damping: 24`
- Rounded bubble `rounded-2xl`, `rounded-br-sm` (tail effect)
- Max-width: 200px desktop, 160px mobile
- Background: `var(--bg-surface)`, border `1px solid var(--border)`
- Text: `text-xs`, warna `var(--text-primary)`
- Auto-dismiss setelah **4 detik** via `setTimeout` — kecuali user hover orb
- `AnimatePresence` untuk exit: `opacity: 0, x: 8`

### Scroll Detection

Pakai `IntersectionObserver` pada setiap section dengan `id` anchor:

```
#section-hero     → state: 'wave'
#section-care     → state: 'angry' (lalu setelah 2 detik → 'worried')
#section-platform → state: 'excited'
#section-insight  → state mengikuti insight aktif (worried/excited/happy)
#section-cta      → state: 'happy'
```

State change selalu lewat `AnimatePresence` — mata lama fade out, mata baru fade in.

### Props Interface

```tsx
type MascotState = 'idle' | 'wave' | 'worried' | 'angry' | 'excited' | 'happy'

interface MascotOrbProps {
  state: MascotState
  showBubble: boolean    // parent kontrol kapan bubble tampil
}
```

State dikelola di `LandingPage` parent via `useState<MascotState>`, diupdate oleh `IntersectionObserver` callbacks.

---

## 4. Section 2 — "Finara Paling Perhatian"

**ID:** `#section-care`

**Headline:** `Finara tuh... perhatian banget.`
**Sub:** `Seneng kalau kamu nabung. Khawatir kalau boros. Bahkan bisa marah.`

### Layout

Dua kartu side-by-side di desktop, stack di mobile:

**Kartu Marah** (kiri):
- Border: `1px solid var(--danger)`, box-shadow: `0 0 20px rgba(239,68,68,0.15)`
- Background: `rgba(239,68,68,0.05)`
- Mini orb di pojok kanan atas: 32px, state `angry`
- Quote: *"Ini beneran ga diatur?? Udah 3x makan di restoran mahal minggu ini."*
- Font quote: italic, `var(--text-secondary)`

**Kartu Perhatian** (kanan):
- Border: `1px solid var(--success)`, box-shadow: `0 0 20px rgba(34,197,94,0.15)`
- Background: `rgba(34,197,94,0.05)`
- Mini orb di pojok kanan atas: 32px, state `happy`
- Quote: *"Wah, tabungan kamu naik bulan ini! Proud of you 🎉"*

### Animasi

- Kartu enter: `initial={{ opacity: 0, y: 24 }}`, spring `stiffness: 280, damping: 22`
- Kartu kiri delay 0, kartu kanan delay 0.12
- Saat `#section-care` masuk viewport → maskot orb utama: `worried` (1.5 detik) → `angry`

---

## 5. Section 3 — "Chat di Mana Aja"

**ID:** `#section-platform`

**Headline:** `Ga cuma di sini.`
**Sub:** `Finara udah bisa diajak ngobrol di Telegram. WhatsApp? Coming soon.`

### Layout

Dua pill/card besar, centered, max-width 480px, stack vertikal:

**Telegram Card:**
- Background: `rgba(37,99,235,0.08)`, border: `1px solid rgba(37,99,235,0.3)`
- Icon Telegram (SVG atau lucide Send), label "Telegram", badge `● LIVE` (green dot)
- CTA text: `"Coba sekarang →"` — seluruh card clickable
- Subtle shimmer animation (CSS `@keyframes` shimmer) di border

**WhatsApp Card:**
- Opacity: 0.5, `cursor: not-allowed`
- Background: `rgba(34,197,94,0.05)`, border: `1px solid rgba(34,197,94,0.15)`
- Icon WhatsApp, label "WhatsApp", badge `SOON` dengan animated `···` typing dots
- Tidak clickable

### Animasi

- Cards enter: stagger 0.1s, `y: 20 → 0`
- Saat section masuk viewport → maskot: `excited`, bubble *"Kamu bisa chat aku di Telegram sekarang!"*

### Note implementasi

- Bot Telegram **belum ada** — Telegram card di landing tetap tampil sebagai `SOON` (disabled, sama seperti WhatsApp) sampai bot siap
- Integrasi Telegram sesungguhnya ada **di dalam app** (post-login): di screen `/chat` akan ada chip "Hubungkan Telegram" yang membantu user konek dan sinkronisasi session
- Landing page section ini tetap dipertahankan sebagai **teaser** — user tahu fitur ini coming, bukan dijanjikan sekarang

---

## 6. Section 4 — "Insight, Bukan Sekadar Angka"

**ID:** `#section-insight`

**Menggantikan:** `DashboardPreview` yang lama (dihapus sepenuhnya)

**Headline:** `Finara langsung kasih tau yang penting.`
**Sub:** `Ga perlu buka-buka grafik. Finara yang analisis, kamu yang mutusin.`

### Layout

Card besar centered, max-width 520px, berisi:
- Header: mini orb 28px + label *"Finara berkata..."*
- Bubble insight yang auto-rotate setiap 3 detik
- Dot indicator (3 dots) — clickable untuk manual navigate

### 3 Insight yang Dirotate

```
[1] "Wah, pengeluaran kamu minggu ini naik 23% dari biasanya.
     Terbanyak di Makanan. Hati-hati ya! 👀"
     → maskot state: 'worried'

[2] "Goal Liburan Bali kamu udah 60%! Tinggal Rp 2 juta lagi.
     Semangat! 🎯"
     → maskot state: 'excited'

[3] "Budget Transportasi masih aman, sisa 58%.
     Kamu lagi hemat nih! ✅"
     → maskot state: 'happy'
```

### Animasi Bubble Rotate

```tsx
// Bubble masuk dari bawah, keluar ke atas
initial={{ opacity: 0, y: 16 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -12 }}
transition={{ type: 'spring', stiffness: 300, damping: 24 }}
```

`AnimatePresence mode="wait"` untuk ensure exit selesai sebelum next masuk.

Setiap kali insight aktif berubah → update maskot state sesuai tabel di atas.

---

## 7. CTA Section

**ID:** `#section-cta`

**Copy:**
```
Siap punya asisten keuangan yang beneran perhatian?
Gratis. Mulai sekarang.
```

- Button: existing `"Mulai gratis sekarang"` gradient orange-gold
- Saat section masuk viewport → maskot: `happy`, bubble *"Ayo! Gue udah nunggu nih 🎉"*
- Tidak ada disclaimer tambahan (kartu kredit, enkripsi, dll)

---

## 8. Perubahan Font (Nice-to-have)

Kamu menyebut font sekarang terlalu "AI-generated". Opsi yang bisa dipertimbangkan:
- Headline: tambah `font-feature-settings: 'ss01'` pada Geist untuk karakter yang lebih personal
- Atau: swap headline weight ke 800 (`font-extrabold`) untuk lebih bold, less corporate
- Implementasi font baru harus diskusi dulu — tidak dimasukkan ke scope ini supaya tidak melanggar konvensi di CLAUDE.md (Geist is default, jangan tambah font tanpa diskusi)

---

## 9. File yang Diubah

| File | Perubahan |
|---|---|
| `src/app/page.tsx` | Rewrite keseluruhan — hapus DashboardPreview + FeatureTile, tambah 4 section baru + MascotOrb |
| `src/components/landing/MascotOrb.tsx` | Komponen baru — orb + bubble + ekspresi |

Tidak ada perubahan ke `globals.css`, API routes, atau komponen lain.

---

## 10. Checklist Sebelum PR

- [ ] `MascotOrb` tidak render di route `/(app)/*` — hanya di landing dan `/features` kalau nanti dimasukkan
- [ ] Semua warna pakai `var(--)` — tidak ada hardcode hex kecuali warna Telegram/WhatsApp brand
- [ ] Bubble auto-dismiss tidak memory leak (clearTimeout on unmount)
- [ ] `IntersectionObserver` di-disconnect on unmount
- [ ] Mobile: orb tidak menutupi konten penting, bisa di-tap untuk dismiss bubble
- [ ] `npx tsc --noEmit` clean sebelum PR
