# Chat Tool-Calling Reliability — Design Spec

**Tanggal:** 2026-07-02
**Status:** Approved (brainstorm session)
**Scope:** Server-side only (`/api/chat/route.ts` + prompt) + migrasi kolom `source`. Tanpa perubahan client, tanpa perubahan format SSE/card.

---

## 1. Problem

Dua keluhan produksi yang masih terjadi setelah fix `tool_calls_json` (2026-07-02):

1. **Satu bubble berisi banyak transaksi** — sebagian item tidak masuk ke tabel `transactions`, padahal AI menjawab seolah semua tercatat. **Ini kasus prioritas #1.**
2. **Chat di session dengan history panjang** — AI berhenti memanggil tool dan hanya membalas teks konfirmasi palsu.

## 2. Root Causes (hasil audit `route.ts`)

| # | Root cause | Lokasi | Dampak |
|---|---|---|---|
| RC1 | History query `order ascending + limit(80)` mengambil 80 baris **TERLAMA**, bukan terbaru | `route.ts:633-645` | Di session panjang, konteks terbaru hilang total |
| RC2 | Truncation bisa memutus pasangan `tool_call ↔ tool` | idem | API error / perilaku tak terduga |
| RC3 | Tool result lama di-replay verbatim (JSON besar) → context bloat | `reconstructMessages()` | Kepatuhan tool-calling DeepSeek turun drastis di konteks panjang |
| RC4 | Tidak ada aturan multi-item; tidak ada verifikasi klaim vs eksekusi | system prompt + loop | Model catat 2 dari 4 item, atau menulis card `_action:created` **tanpa tool call sama sekali** (kartu palsu) |
| RC5 | Aturan tool calling terkubur di tengah system prompt ~1.300 token, makin jauh dari pesan user saat history panjang | `buildSystemPrompt()` | Recency effect: aturan diabaikan |
| RC6 | Request tanpa `session_id` me-load history **semua session** milik user | `route.ts:640` | Konteks tercampur antar-room |

## 3. Design — "Grounded Tool Loop"

### Komponen 1 — Smart History Window

Fungsi pure baru `buildHistoryWindow(rows)` menggantikan pemakaian langsung `reconstructMessages`:

1. **Fetch**: `order('created_at', { ascending: false }).limit(160)` lalu `reverse()` → 160 baris **terbaru**, urutan kronologis. (Fix RC1)
2. **Turn grouping**: satu turn = baris `user` s/d sebelum baris `user` berikutnya. Baris orphan di awal window (sisa turn terpotong) dibuang → pasangan `tool_call ↔ tool` tidak pernah putus. (Fix RC2)
3. **Tiered fidelity** (Fix RC3):
   - `FULL_TURNS = 8` turn terakhir: full fidelity (user, tool_call, tool, assistant). Konten tool result > `1500` char dipangkas dengan suffix `…[dipangkas]`.
   - Turn lebih lama: hanya teks `user` + `assistant`; tool rows di-drop; blok ` ```card:...``` ` di teks assistant diganti placeholder `[kartu ditampilkan]` (card JSON lama = contoh "konfirmasi tanpa tool" yang memancing pattern-matching).
   - Budget total window ± `24000` char; jika lewat, buang turn tertua lebih dulu.
4. **No session = no history**: jika request tanpa `session_id`, skip query history sepenuhnya. (Fix RC6)

### Komponen 2 — Prompt Restructuring + Recency Reinforcement

1. **Restruktur `buildSystemPrompt`**: blok "ATURAN WAJIB TOOL CALLING" pindah ke paling atas, ditambah:
   - **Aturan multi-item (prioritas #1):** "Jika user menyebut BEBERAPA transaksi dalam satu pesan, panggil `add_transaction` SATU KALI PER ITEM — boleh beberapa tool_calls sekaligus dalam satu turn. Sebelum menulis jawaban akhir, hitung ulang: jumlah tool call sukses HARUS sama dengan jumlah item yang user sebut. Jika ada yang belum, panggil tool-nya sekarang."
   - **Aturan kartu:** "DILARANG menulis card dengan `_action` created/updated/deleted kecuali tool call yang sesuai BERHASIL di turn ini. Kartu tanpa tool akan ditolak sistem."
2. **Reminder injection** (Fix RC5): satu system message pendek (±60 token, **tidak dipersist** ke `chat_history`) disisipkan tepat sebelum pesan user terbaru, mengulang inti aturan tool + aturan multi-item.
3. **Multi-item hint (deterministik, advisory)**: regex penghitung mention uang di pesan user (`\d+\s*(rb|ribu|k|jt|juta|000)`, dsb). Jika terdeteksi ≥ 2, reminder ditambah: "Pesan ini tampaknya berisi ±N item — pastikan jumlah tool call sesuai." Advisory saja (bukan enforcement) untuk hindari false positive.

### Komponen 3 — Card Gate (validasi sebelum flush)

Streaming sudah mem-buffer card block sampai ` ``` ` penutup — validasi ditumpangkan di titik flush:

1. **Ledger tool sukses** per request: `Record<toolName, credit>` — di-increment setiap tool result mengandung `"success":true`.
2. Saat card block lengkap: jika card punya `_action` write, cocokkan dan **debit** ledger sesuai mapping:

   | Card + `_action` | Tool yang harus sukses |
   |---|---|
   | transaction/created | `add_transaction` |
   | transaction/updated | `update_transaction` |
   | transaction/deleted | `delete_transaction` |
   | budget/created, budget/updated | `set_budget` |
   | goal/created | `add_goal` |
   | goal/updated | `deposit_goal` |
   | debt/created | `add_debt` |
   | debt/updated | `settle_debt` |
   | asset/created | `add_asset` |
   | asset/updated | `update_asset_value` |
   | asset/deleted | `delete_asset` |

3. **Kredit habis / tidak ada → kartu palsu**: tidak di-enqueue ke stream, di-strip dari `finalAssistantContent` yang dipersist (agar tidak meracuni history turn berikutnya), dan flag `violationDetected = true`.
4. Card read-only (`card:summary`, card list tanpa `_action`) selalu lolos.
5. Card dengan `_action` tapi JSON tidak bisa di-parse → dianggap palsu (ditahan).

### Komponen 4 — Corrective Retry (self-healing, maks 1×)

Setelah loop completion selesai:

1. Trigger jika: `violationDetected` **atau** (teks final mengandung klaim konfirmasi + tidak ada satupun mutating tool sukses padahal ada card write yang ditahan).
2. Jalankan **satu** completion tambahan: push assistant content final + system message korektif: *"PELANGGARAN: kamu menampilkan konfirmasi tanpa tool call yang berhasil. Item yang kamu klaim belum tersimpan di database. Panggil tool yang diperlukan SEKARANG hanya untuk item yang belum tersimpan — jangan duplikasi tool call yang sudah sukses (lihat riwayat tool di atas)."*
3. Retry masuk loop tool yang sama → tool call asli → Card Gate meloloskan card yang kini punya kredit.
4. Flag `retryUsed` mencegah retry kedua. Jika retry pun melanggar lagi: kirim teks jujur ke user bahwa pencatatan gagal (SSE `text`), tanpa kartu sukses.

### Komponen 5 — Kolom `source` (dev analytics)

Tracking asal record untuk kebutuhan analisis dev ke depan.

1. **Migrasi** `supabase/migrations/004_record_source.sql` + update `supabase/schema.sql`:

   ```sql
   -- Tabel: transactions, budgets, goals, debts, assets
   ALTER TABLE <t> ADD COLUMN source TEXT CHECK (source IN ('chat', 'manual'));
   ```

   - Nullable, **tanpa default** — baris lama bernilai `NULL` (= legacy/unknown, jangan diklaim 'manual' padahal asalnya chat).
   - Semua insert baru WAJIB set eksplisit.
2. **Chat route** (`executeTool`): semua insert/upsert create (`add_transaction`, `set_budget`, `add_goal`, `add_debt`, `add_asset`) menyertakan `source: 'chat'`.
3. **API routes manual** (`/api/transactions`, `/api/budgets`, `/api/goals`, `/api/debts`, `/api/assets` — handler POST): insert menyertakan `source: 'manual'`.
4. `source` = asal **pembuatan** record; update tidak mengubah `source`. `asset_value_logs` di luar scope (derivable dari flow).
5. Tidak ada perubahan UI — kolom murni untuk analytics.

## 4. Data Flow (request dengan banyak transaksi)

```
User: "tadi jajan kopi 25rb, bensin 50rb, sama makan siang 35rb"
  → proxy auth → POST /api/chat
  → load 160 baris terbaru → buildHistoryWindow (8 turn full, sisanya teks)
  → messages = [system(restruktur)] + window + [system reminder + hint "±3 item"] + [user]
  → completion #1: 3× add_transaction (paralel/serial) → execute → ledger {add_transaction: 3}
  → completion #2: teks + 3 card:transaction _action:created
  → Card Gate: 3 kartu debit 3 kredit → semua lolos ke stream
  → persist: user, tool_call, 3× tool, assistant (source='chat' di 3 row transactions)
  → SSE done
```

Jalur pelanggaran: completion langsung menulis card tanpa tool → Gate menahan kartu → corrective retry → tool call sungguhan → kartu asli mengalir.

## 5. Error Handling

- `buildHistoryWindow` dan card-gate matcher = pure functions dengan input tervalidasi; row malformed (mis. `tool_calls_json` null pada role `tool_call`) di-skip, bukan crash.
- Kegagalan corrective retry tidak boleh menjatuhkan stream — fallback ke pesan error jujur, `done` event tetap terkirim.
- Kegagalan parse JSON card → kartu ditahan (fail-closed untuk write claims, fail-open untuk teks biasa).
- Migrasi `source` backward-compatible (nullable, no default) — kode lama yang belum deploy tetap jalan.

## 6. Testing

**Unit (pure functions):**
- `buildHistoryWindow`: window > limit, orphan tool rows di awal, turn grouping, tiered stripping, budget char.
- Card gate matcher: setiap mapping card→tool, kredit habis, card tanpa `_action`, JSON rusak.

**Manual (skenario prioritas):**
1. **[PRIORITAS #1] 1 bubble berisi 3–5 transaksi** → semua masuk tabel `transactions` dengan `source='chat'`, jumlah kartu = jumlah item.
2. Session dengan 100+ baris history → tambah transaksi → tool tetap terpanggil.
3. Restore session lama dari HistoryDrawer → langsung catat transaksi → berhasil.
4. Input manual dari halaman `/transactions` → row `source='manual'`.
5. `npx tsc --noEmit` bersih.

## 7. Out of Scope (fase berikutnya)

- Server-generated cards (kartu di-generate server dari tool result, bukan model) — menghilangkan seluruh kelas kartu palsu secara arsitektural.
- Rolling summary via LLM untuk turn sangat lama.
- Nilai `source` tambahan (mis. `'ocr'`) — struktur kolom sudah siap menampung.
