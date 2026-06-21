# Features Page — Design Spec
**Date:** 2026-06-21  
**Status:** Approved

---

## Goal

Halaman publik `/features` yang menjelaskan semua fitur Finara secara visual dan UX-friendly — tanpa perlu login. Targetnya: orang yang belum tahu Finara langsung mengerti cara kerjanya dan terdorong daftar.

---

## Route & Auth

- **Path:** `src/app/features/page.tsx`
- **Public:** ya — tambahkan `/features` ke whitelist di `src/proxy.ts`
- **No layout wrapper:** standalone page (sama seperti landing page), bukan `(app)` group

---

## Landing Page Change

Di `src/app/page.tsx`, ganti button hero kedua:
- **Before:** "Sudah punya akun" → `/login`
- **After:** "Lihat fitur-fiturnya" → `/features`
- Style tetap sama (ghost/secondary button)

---

## Page Anatomy

```
Sticky Nav
  └─ Logo · Theme toggle · ☕ Support · Masuk · Daftar
     (identik dengan landing page — copy logika scrolled state)

Hero kecil (pt-28 untuk clear nav)
  └─ Label chip: "Semua yang bisa Finara lakukan"
  └─ H1: "Satu chat, semua terkontrol"
  └─ Subtext: "Dari catat belanja sampai pantau aset — semuanya lewat obrolan biasa."
  └─ CTA button: "Coba gratis sekarang →" → /register

Bento Grid (8 tile)
  └─ Tiap tile: accent icon · judul · 1 kalimat desc · mini-demo animasi

Bottom CTA Strip
  └─ "Siap coba Finara?" + [Daftar Gratis] + [← Kembali ke beranda]

Footer
  └─ Identik dengan landing page
```

---

## Bento Grid — Layout

### Desktop lg (3-col grid, ~4 rows)
```
┌──────────────┬──────────────┬──────────────┐
│ Chat Natural │  Dashboard   │  Anggaran    │
│  (row-span-2)│  (row-span-2)│  & Goals     │
│  mini chat   │  sparkline + │  progress bar│
│  typing demo │  donut anim  │  anim        │
├──────────────┼──────────────┴──────────────┤
│ Hutang &     │  Aset (col-span-2)           │
│ Piutang      │  net worth counter + bars    │
├──────────────┴──────────────┬──────────────┤
│ Scan Struk (col-span-2)     │  Privasi     │
│ fake scan line + fields     │  shield anim │
├─────────────────────────────┴──────────────┤
│ AI Proaktif (col-span-3 / full width)      │
│ 3 insight chip stagger                     │
└────────────────────────────────────────────┘
```

### Tablet sm (2-col grid)
- Chat Natural: col-span-2 (full width, pendek)
- Dashboard + Anggaran: side by side
- Hutang + Aset: side by side
- Scan Struk: col-span-2
- Privasi + AI Proaktif: side by side

### Mobile (1-col, full width)
Semua tile stack vertikal. Urutan: Chat → Dashboard → Anggaran → Hutang → Aset → Scan → Privasi → AI Proaktif.

---

## Tile Specs

### 1. Chat Natural
- **Accent color:** `var(--accent)` (purple)
- **Icon:** `MessageCircle`
- **Desc:** "Ketik kayak chat biasa — Finara langsung ngerti dan simpan."
- **Mini-demo:** Typing animation loop ~6 detik
  - User bubble muncul karakter per karakter: `"beli kopi 25rb"`
  - Typing dots AI (0.9 detik)
  - AI reply muncul: `"Siap dicatat! ☕"` + mini transaction card
  - Pause 2 detik → reset → loop
- **Height:** tall (`row-span-2` on lg)

### 2. Dashboard
- **Accent color:** `var(--accent)` (purple)
- **Icon:** `BarChart2`
- **Desc:** "Saldo, tren, dan breakdown kategori — semuanya realtime."
- **Mini-demo:** `inView`-triggered
  - Saldo number count-up: 0 → Rp 3,6 Jt
  - Sparkline SVG draw animation (stroke-dashoffset)
  - Pemasukan/Pengeluaran label fade in
- **Height:** tall (`row-span-2` on lg)

### 3. Anggaran & Goals
- **Accent color:** `#F59E0B` (amber)
- **Icon:** `Target`
- **Desc:** "Set budget bulanan dan pantau progress tabungan kamu."
- **Mini-demo:** `inView`-triggered, stagger 0.15s per bar
  - 3 progress bars animate width 0 → value:
    - Makanan: 72% (warning amber)
    - Transport: 40% (accent)
    - Goals Bali: 60% (success green)
- **Height:** normal

### 4. Hutang & Piutang
- **Accent color:** `var(--success)` + `var(--danger)` dual
- **Icon:** `HandCoins`
- **Desc:** "Catat siapa yang berhutang atau kamu hutangi, selesaikan satu tap."
- **Mini-demo:** `inView`-triggered
  - 2 chip muncul stagger: "Budi · Rp 50.000 · hutang" (red) + "Sari · Rp 120.000 · piutang" (green)
  - Setelah 1.5 detik: chip Budi fade + strikethrough → badge "Lunas" muncul
- **Height:** normal

### 5. Aset
- **Accent color:** `var(--success)` (green)
- **Icon:** `Landmark`
- **Desc:** "Pantau total kekayaan bersih dari rekening hingga investasi."
- **Mini-demo:** `inView`-triggered
  - Total net worth count-up: 0 → Rp 87,5 Jt
  - 4 mini bars animate (Rekening, Investasi, Properti, Kendaraan)
- **Width:** wide (`col-span-2` on lg/sm)

### 6. Scan Struk
- **Accent color:** `#3B82F6` (blue)
- **Icon:** `ScanLine`
- **Desc:** "Foto struk — Finara ekstrak detail transaksi otomatis."
- **Mini-demo:** loop animation
  - Fake "foto struk" (rounded rect dengan garis-garis teks)
  - Scan line sweep dari atas ke bawah (2 detik)
  - 3 field hasil muncul stagger: Merchant · Rp · Tanggal
  - Pause 2 detik → reset → loop
- **Width:** wide (`col-span-2` on lg/sm)

### 7. Privasi
- **Accent color:** `var(--success)` (green)
- **Icon:** `ShieldCheck`
- **Desc:** "Data kamu dienkripsi dan hanya bisa diakses akunmu sendiri."
- **Mini-demo:** `inView`-triggered
  - Shield icon subtle pulse animation
  - 3 label muncul stagger: "🔒 Encrypted", "🛡️ Row Level Security", "🚫 No Data Sharing"
- **Height:** normal

### 8. AI Proaktif
- **Accent color:** `#FBB724` (amber)
- **Icon:** `Zap`
- **Desc:** "Finara kasih insight proaktif — budget hampir habis, pola pengeluaran aneh, dan lainnya."
- **Mini-demo:** `inView`-triggered, stagger 0.2s per chip
  - 3 insight bubble muncul: "⚠️ Budget Makanan 85% terpakai", "📈 Pengeluaran naik 23% vs minggu lalu", "🎯 Goal Bali sudah 60%!"
- **Width:** full (`col-span-3` on lg, `col-span-2` on sm, full on mobile)

---

## Visual Language

Ikuti landing page persis:
- CSS vars: `--land-glass`, `--land-glass-border`, `--land-card-shadow`, `--land-bg`, dll
- Ambient orbs: identik
- Tile: `background: var(--land-glass)`, `border: 1px solid var(--land-glass-border)`, `rounded-2xl`, `boxShadow: var(--land-card-shadow)`
- Entry animation per tile: `initial={{ opacity: 0, y: 20 }}`, stagger `delay: i * 0.07`, `ease: [0.22, 1, 0.36, 1]`
- Semua entry animation pakai `useInView` (`once: true, margin: "-40px"`)

---

## File Structure

```
src/app/features/page.tsx        ← new public page
src/proxy.ts                     ← add /features to whitelist
src/app/page.tsx                 ← change hero secondary button
```

No new shared components — semua demo diimplementasi inline dalam `features/page.tsx` untuk isolasi dan kesederhanaan. File akan panjang (~500-700 baris) tapi self-contained.

---

## Constraints

- Tidak ada network request — semua animasi pure Framer Motion + CSS
- Tidak import dari `(app)` components — page ini public, tidak boleh ada auth dependency
- Responsive wajib: mobile 1-col, tablet 2-col, desktop 3-col
- Semua animasi harus `inView`-triggered (tidak langsung jalan saat page load) kecuali tile Chat Natural dan Scan Struk yang loop
- `npx tsc --noEmit` harus clean sebelum selesai
