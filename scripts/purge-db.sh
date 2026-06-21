#!/usr/bin/env bash
# purge-db.sh — Hapus semua data (tabel + auth users) dari Supabase
# Usage: bash scripts/purge-db.sh
# WARNING: destructive, tidak bisa di-undo.

set -euo pipefail

source "$(dirname "$0")/../.env.local" 2>/dev/null || { echo "ERROR: .env.local tidak ditemukan"; exit 1; }

SUPA_URL="$NEXT_PUBLIC_SUPABASE_URL"
SUPA_KEY="$SUPABASE_SERVICE_ROLE_KEY"

if [[ -z "$SUPA_URL" || -z "$SUPA_KEY" ]]; then
  echo "ERROR: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY kosong"
  exit 1
fi

delete_table() {
  local table="$1"
  local filter="${2:-id=neq.00000000-0000-0000-0000-000000000000}"
  echo -n "  DELETE $table ... "
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$SUPA_URL/rest/v1/$table?$filter" \
    -H "apikey: $SUPA_KEY" \
    -H "Authorization: Bearer $SUPA_KEY" \
    -H "Prefer: return=minimal")
  echo "HTTP $status"
}

echo ""
echo "=== PURGE SUPABASE ==="
echo "Target: $SUPA_URL"
echo ""

# ── Tabel data (urutan: child → parent agar FK tidak crash) ──────────────────
echo "[1/3] Menghapus tabel data ..."
delete_table "asset_value_logs"
delete_table "chat_history"
delete_table "transactions"
delete_table "budgets"
delete_table "goals"
delete_table "debts"
delete_table "assets"

# ── Auth users ───────────────────────────────────────────────────────────────
echo ""
echo "[2/3] Mengambil daftar auth users ..."
USER_IDS=$(curl -s "$SUPA_URL/auth/v1/admin/users?page=1&per_page=200" \
  -H "apikey: $SUPA_KEY" \
  -H "Authorization: Bearer $SUPA_KEY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for u in data.get('users', []):
    print(u['id'], u.get('email',''))
")

if [[ -z "$USER_IDS" ]]; then
  echo "  Tidak ada auth user ditemukan."
else
  echo "[3/3] Menghapus auth users ..."
  while IFS=' ' read -r uid email; do
    echo -n "  DELETE user $email ($uid) ... "
    status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$SUPA_URL/auth/v1/admin/users/$uid" \
      -H "apikey: $SUPA_KEY" \
      -H "Authorization: Bearer $SUPA_KEY")
    echo "HTTP $status"
  done <<< "$USER_IDS"
fi

echo ""
echo "=== SELESAI ==="
