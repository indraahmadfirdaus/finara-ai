// Canonical category list — single source of truth for AI, forms, and charts.
// No overlap: food/drink merged into "Makanan & Minuman", etc.

export const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja',
  'Hiburan',
  'Kesehatan',
  'Pendidikan',
  'Tagihan & Utilitas',
  'Rumah',
  'Travel',
  'Perawatan Diri',
  'Anak & Keluarga',
  'Hewan Peliharaan',
  'Sosial & Hadiah',
  'Cicilan & Hutang',
  'Lainnya',
]

export const INCOME_CATEGORIES = [
  'Gaji',
  'Freelance',
  'Bisnis',
  'Investasi',
  'Bonus',
  'Hadiah',
  'Transfer Masuk',
  'Lainnya',
]

// Hex color per category — unique, distinguishable on dark backgrounds
export const CATEGORY_COLORS: Record<string, string> = {
  // Expense
  'Makanan & Minuman': '#FB923C',   // orange
  'Transportasi':      '#818CF8',   // indigo
  'Belanja':           '#F472B6',   // pink
  'Hiburan':           '#34D399',   // emerald
  'Kesehatan':         '#F87171',   // red
  'Pendidikan':        '#A78BFA',   // violet
  'Tagihan & Utilitas':'#FBBF24',   // amber
  'Rumah':             '#2DD4BF',   // teal
  'Travel':            '#38BDF8',   // sky
  'Perawatan Diri':    '#E879F9',   // fuchsia
  'Anak & Keluarga':   '#F9A8D4',   // pink-light
  'Hewan Peliharaan':  '#D97706',   // amber-dark
  'Sosial & Hadiah':   '#FB7185',   // rose
  'Cicilan & Hutang':  '#EF4444',   // red-vivid
  'Lainnya':           '#6B7280',   // gray
  // Income
  'Gaji':              '#4ADE80',   // green
  'Freelance':         '#10B981',   // emerald
  'Bisnis':            '#34D399',   // emerald-light
  'Investasi':         '#22C55E',   // green-mid
  'Bonus':             '#86EFAC',   // green-pale
  'Hadiah':            '#C084FC',   // purple
  'Transfer Masuk':    '#60A5FA',   // blue
}
