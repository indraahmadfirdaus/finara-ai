# Calendar Feature — Design Spec
**Date:** 2026-07-02
**Status:** Approved

---

## Overview

A calendar-first view showing daily income/expense summaries inline on each date cell. Tapping a date opens a bottom-sheet drawer with the full transaction list for that day. Added as a sub-item under the "Daftar" nav group.

---

## Route & Navigation

- **Route:** `src/app/(app)/calendar/page.tsx`
- **Nav entry:** Add `{ href: '/calendar', icon: CalendarDays, label: 'Kalender' }` to `LIST_SUBS` in both:
  - `src/components/layout/SideNav.tsx`
  - `src/components/layout/BottomNav.tsx`

---

## Data Flow

1. Page mounts → fetch `GET /api/transactions?date_from=YYYY-MM-01&date_to=YYYY-MM-31&limit=500`
2. Client aggregates result into `Map<string, { income: number, expense: number, txs: Transaction[] }>` keyed by `YYYY-MM-DD`
3. Month navigation (prev/next) → re-fetch with new month's date range
4. Date cell tapped → open `DayDrawer` with pre-loaded data from map (no additional request)

No new API endpoints required. Reuses existing `GET /api/transactions`.

---

## Components

### `CalendarPage` (`src/app/(app)/calendar/page.tsx`)
- State: `activeMonth` (Date), `selectedDate` (string | null), `txMap` (Map), `loading` (bool)
- On mount and on `activeMonth` change: fetch transactions for the full month
- Renders: `TopBar`, desktop header, `MonthSummaryBar`, `CalendarGrid`, `DayDrawer`

### `MonthSummaryBar`
Inline component (no separate file — small enough).
Shows total income (green) + total expense (red) + net balance for the active month.
Same visual style as the summary bar in transactions page.

### `CalendarGrid`
- 7-column CSS grid
- Header row: `Min Sen Sel Rab Kam Jum Sab` — `text-[10px] font-semibold text-muted`, centered
- Padding day cells (prev/last month overflow): `opacity-25`, not clickable
- Active month cells: clickable, spring tap scale

**Date cell anatomy:**
```
┌──────────────┐
│ 25           │  text-sm font-semibold, top-left
│ +50rb/−45rb  │  text-[9px], compact formatCompactIDR, bottom area
└──────────────┘
```

Cell states:
- **Today:** border `1px solid var(--accent)`, date number color `var(--accent-light)`
- **Has transactions:** summary line shown — income `var(--success)`, expense `var(--danger)`
- **Empty day:** no summary line
- **Selected (drawer open):** background `var(--accent-dim)`
- **Tap feedback:** `whileTap={{ scale: 0.92 }}`

Summary format: `+{formatCompactIDR(income)}/−{formatCompactIDR(expense)}`
- If income = 0: show only `−{expense}`
- If expense = 0: show only `+{income}`
- If both: show both separated by `/`

### Month navigation header
```
[ChevronLeft]  Juni 2026  [ChevronRight]
```
- Centered layout, full width
- Month/year text: `text-base font-bold`
- On change: animate grid with direction-aware `x` slide

### `DayDrawer`
Bottom sheet, rendered via `AnimatePresence` at root of `CalendarPage`.

Structure:
```
drag handle (w-10 h-1 rounded-full bg-border, centered)
date title: formatDate(selectedDate)  — text-base font-semibold
summary line: +Rp X / −Rp Y  — text-sm, colored
divider
scrollable transaction list (`max-h-[50vh] overflow-y-auto`)
```

Transaction row (read-only):
- Category icon (36×36, rounded-xl) — via `getCategoryMeta()`
- Note or category name — text-sm font-medium
- Category label — text-xs text-muted
- Amount — text-sm font-semibold, green/red
- No delete button — drawer is read-only

Backdrop: `rgba(0,0,0,0.4) blur(2px)`, click to close. Same pattern as BottomNav drawer.

---

## Responsive Behaviour

| Breakpoint | Grid cells | Drawer |
|---|---|---|
| Mobile (default) | `h-14` | Full-width, `rounded-t-2xl`, `pb-safe` |
| Desktop (`lg:`) | `h-16` | `max-w-lg mx-auto`, still bottom sheet |

Page content max-width: `lg:max-w-3xl lg:mx-auto lg:px-6` (matches transactions page).

---

## Animations

| Element | Animation |
|---|---|
| Page enter | `<PageTransition>` wrapper |
| Month grid change (next) | `x: 20 → 0, opacity: 0 → 1`, duration 0.2 |
| Month grid change (prev) | `x: -20 → 0, opacity: 0 → 1`, duration 0.2 |
| DayDrawer enter | `y: '100%' → 0`, spring `stiffness: 380, damping: 34` |
| DayDrawer exit | `y: '100%'`, via `AnimatePresence` |
| Date cell tap | `whileTap={{ scale: 0.92 }}` |
| Transaction rows in drawer | stagger `0.04s`, `x: -6 → 0, opacity: 0 → 1` |
| Backdrop | `opacity: 0 → 1`, duration 0.18 |

---

## Conventions Checklist

- All colors via CSS variables — no hardcoded hex
- Amounts via `formatCompactIDR()` (cell) and `formatIDR()` (drawer)
- Dates via `formatDate()` and `getMonthKey()` from `date.ts`
- Page wrapped in `<PageTransition>`
- API route verified via `supabase.auth.getUser()` (existing route, no change needed)
- No new DB schema changes required
