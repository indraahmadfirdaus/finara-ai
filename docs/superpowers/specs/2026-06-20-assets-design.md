# Fitur Aset — Design Spec
**Tanggal:** 2026-06-20  
**Status:** Approved

---

## Ringkasan

Fitur aset memungkinkan user mencatat dan memantau semua aset kekayaan mereka secara manual — rekening bank, investasi, properti, kendaraan, dan lainnya. Setiap perubahan nilai dicatat dalam log histori. Dashboard menampilkan total aset dan net worth (aset dikurangi hutang aktif).

---

## 1. Database Schema

### Tabel `assets`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES auth.users NOT NULL
name        text NOT NULL
type        text NOT NULL CHECK (type IN ('bank', 'investment', 'property', 'vehicle', 'other'))
institution text                          -- "Bibit", "BCA", "Antam" (opsional)
value       bigint NOT NULL DEFAULT 0     -- nilai terkini dalam rupiah
note        text
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

### Tabel `asset_value_logs`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
asset_id    uuid REFERENCES assets(id) ON DELETE CASCADE
user_id     uuid NOT NULL
old_value   bigint NOT NULL
new_value   bigint NOT NULL
note        text
created_at  timestamptz DEFAULT now()
```

### RLS
Kedua tabel menggunakan Row Level Security dengan policy `auth.uid() = user_id`. Tidak perlu filter manual di query — scoped otomatis.

### Trigger `updated_at`
Supabase trigger sederhana untuk auto-update `assets.updated_at` setiap kali baris diupdate.

---

## 2. Tipe Aset

| type | Label | Icon (lucide) |
|---|---|---|
| `bank` | Rekening & Tabungan | `Landmark` |
| `investment` | Investasi | `TrendingUp` |
| `property` | Properti | `Home` |
| `vehicle` | Kendaraan | `Car` |
| `other` | Lainnya | `Package` |

---

## 3. API Routes

### `GET /api/assets`
Kembalikan semua aset user, diurutkan `type ASC, name ASC`.

Response:
```json
{
  "assets": [
    {
      "id": "uuid",
      "name": "Reksadana Bibit",
      "type": "investment",
      "institution": "Bibit",
      "value": 200000000,
      "note": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "total": 200000000
}
```

### `POST /api/assets`
Buat aset baru.

Body:
```json
{
  "name": "Reksadana Bibit",
  "type": "investment",
  "institution": "Bibit",
  "value": 200000000,
  "note": "Reksa dana campuran"
}
```

Validasi dengan Zod: `name` wajib, `type` harus salah satu enum, `value` >= 0.

### `PATCH /api/assets`
Update nilai aset. Otomatis insert ke `asset_value_logs` dengan `old_value` diambil dari row saat ini.

Body:
```json
{
  "id": "uuid",
  "value": 215000000,
  "note": "Update Juni 2026"
}
```

Juga mendukung update field lain (`name`, `institution`, `note`) tanpa membuat log (hanya update metadata, bukan nilai).

### `DELETE /api/assets`
Hapus aset. Cascade ke `asset_value_logs`.

Query param: `?id=uuid`

### `GET /api/assets/logs`
Ambil histori perubahan nilai satu aset, diurutkan `created_at DESC`.

Query param: `?asset_id=uuid`

Response:
```json
{
  "logs": [
    {
      "id": "uuid",
      "old_value": 200000000,
      "new_value": 215000000,
      "note": "Update Juni 2026",
      "created_at": "2026-06-20T..."
    }
  ]
}
```

---

## 4. AI Tools

Ditambahkan ke `src/lib/deepseek/tools.ts`:

### `add_asset`
```typescript
{
  name: 'add_asset',
  description: 'Catat aset baru (rekening, investasi, properti, kendaraan, dll)',
  parameters: {
    name: string,       // wajib — nama aset
    type: enum ['bank', 'investment', 'property', 'vehicle', 'other'],  // wajib
    value: number,      // wajib — nilai awal dalam rupiah
    institution: string, // opsional — institusi/platform
    note: string,       // opsional
  }
}
```

### `update_asset_value`
```typescript
{
  name: 'update_asset_value',
  description: 'Update nilai aset yang sudah ada. Otomatis mencatat histori perubahan.',
  parameters: {
    asset_name: string, // wajib — nama aset (fuzzy match di server)
    value: number,      // wajib — nilai baru dalam rupiah
    note: string,       // opsional — alasan update
  }
}
```

### `get_assets`
```typescript
{
  name: 'get_assets',
  description: 'Lihat semua aset dan total net worth',
  parameters: {
    type: enum ['bank', 'investment', 'property', 'vehicle', 'other', 'all'], // opsional, default 'all'
  }
}
```

### `delete_asset`
```typescript
{
  name: 'delete_asset',
  description: 'Hapus aset berdasarkan nama',
  parameters: {
    asset_name: string, // wajib
  }
}
```

`navigate_to` tool: tambah `/assets` ke enum `page`.

---

## 5. Chat Card

Format dari AI:

````
```card:asset
{
  "name": "Reksadana Bibit",
  "type": "investment",
  "institution": "Bibit",
  "value": 200000000,
  "_action": "created"
}
```
````

Untuk list aset (dari `get_assets`):
````
```card:asset
{
  "items": [
    { "name": "BCA Tahapan", "type": "bank", "value": 50000000 },
    { "name": "Reksadana Bibit", "type": "investment", "value": 200000000 }
  ],
  "total": 250000000
}
```
````

### Komponen `AssetCard.tsx`
Mengikuti pola §3 CLAUDE.md persis:
- Accent bar kiri: warna per tipe (`bank`=`var(--accent)`, `investment`=`var(--success)`, `property`=`#F59E0B`, `vehicle`=`var(--text-secondary)`, `other`=`var(--text-muted)`)
- Icon dari tipe aset (Landmark/TrendingUp/Home/Car/Package)
- Nama + institusi sebagai subtitle
- Nilai aset (formatIDR) di kanan
- `_action` badge jika ada

---

## 6. Halaman `/assets`

**File:** `src/app/(app)/assets/page.tsx`

### Struktur UI

```
TopBar "Aset" | tombol + Tambah

┌─────────────────────────────────────────┐
│  TOTAL ASET              NET WORTH       │
│  AnimatedNumber          AnimatedNumber  │
│  Rp 250.000.000          Rp 200.000.000  │
│  5 aset                  - Rp 50jt hutang│
└─────────────────────────────────────────┘

[Rekening & Tabungan]
  • BCA Tahapan  —  Rp 50.000.000  [Update]

[Investasi]
  • Reksadana Bibit  Bibit  —  Rp 200.000.000  [Update]

[Properti]
  (tidak ditampilkan jika tidak ada aset di tipe ini)
...
```

### Komponen & Logic

- `fetchAssets()` — GET /api/assets, simpan ke state
- `fetchNetWorth()` — GET /api/assets untuk total, GET /api/debts untuk hutang aktif, hitung selisih
- Aset digroup client-side berdasarkan `type`
- Tipe yang tidak punya aset: tidak ditampilkan (tidak ada empty state per tipe)
- Global empty state jika tidak ada aset sama sekali

### Modals

**Modal Tambah Aset:**
- Input: Nama aset, Tipe (dropdown), Institusi (text, opsional), Nilai awal (number), Catatan (opsional)
- POST /api/assets → fetchAssets()

**Modal Update Nilai:**
- Trigger: tombol "Update nilai" di tiap card, atau tap card
- Input: Nilai baru (number pre-filled dengan nilai saat ini), Catatan (opsional)
- PATCH /api/assets → fetchAssets()

**Bottom Sheet Value Log:**
- Trigger: tap ikon histori (Clock) di card
- GET /api/assets/logs?asset_id=...
- Tampilkan list: tanggal + `Rp X → Rp Y` + catatan

### Animasi

- Page enter: `PageTransition`
- Net worth hero: `AnimatedNumber`
- List: `staggerChildren: 0.05`
- Card enter: spring stiffness 300, damping 22
- Modal: spring y: 50→0

---

## 7. Dashboard Widget

**File:** `src/components/dashboard/AssetNetWorth.tsx`

Posisi: setelah Budget Progress di `dashboard/page.tsx`.

```
┌──────────────────────────────────┐
│  Total Aset          Net Worth   │
│  Rp 250jt            Rp 200jt   │
│  5 aset         - Rp 50jt hutang │
└──────────────────────────────────┘
```

- Data diambil server-side di `getDashboardData()` — tambah query `assets` dan agregasi hutang aktif
- Tap seluruh widget → navigate ke `/assets`
- Jika tidak ada aset: widget tidak ditampilkan (conditional render)

---

## 8. Navigasi

### SideNav (`src/components/layout/SideNav.tsx`)
Tambah ke `LIST_SUBS`:
```tsx
{ href: '/assets', icon: Landmark, label: 'Aset' }
```

### BottomNav (`src/components/layout/BottomNav.tsx`)
Masuk ke drawer Daftar — tidak ada tab baru di MAIN_TABS.

---

## 9. Checklist Implementasi

- [ ] Jalankan migrasi SQL: buat tabel `assets` + `asset_value_logs` + trigger `updated_at` + RLS policies
- [ ] Buat `src/app/api/assets/route.ts` (GET, POST, PATCH, DELETE)
- [ ] Buat `src/app/api/assets/logs/route.ts` (GET)
- [ ] Tambah 4 tool baru ke `src/lib/deepseek/tools.ts`
- [ ] Tambah `/assets` ke `navigate_to` enum
- [ ] Buat `src/components/chat/cards/AssetCard.tsx`
- [ ] Register `card:asset` di `src/components/chat/StreamingText.tsx`
- [ ] Buat `src/app/(app)/assets/page.tsx`
- [ ] Buat `src/components/dashboard/AssetNetWorth.tsx`
- [ ] Update `src/app/(app)/dashboard/page.tsx` — query assets + render widget
- [ ] Update `src/components/layout/SideNav.tsx` — tambah Aset ke LIST_SUBS
- [ ] Update `src/components/layout/BottomNav.tsx` — tambah Aset ke drawer
- [ ] Update system prompt AI — dokumentasikan tool aset + format card:asset
- [ ] `npx tsc --noEmit` clean
