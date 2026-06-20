import {
  UtensilsCrossed, Car, ShoppingBag, Zap, Heart, GraduationCap, Gamepad2,
  Home, Plane, Coffee, Gift, Briefcase, TrendingUp, Banknote, Repeat,
  PiggyBank, Shirt, Smartphone, Dumbbell, Baby, Dog, Music, BookOpen,
  Wrench, Bus, Fuel, CreditCard, DollarSign, Sparkles, Users, Wallet,
  Building2, Laptop, Receipt, Droplets,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CategoryMeta {
  icon: LucideIcon
  bg: string
  color: string
}

// Canonical categories → icon + palette
const CANONICAL: Record<string, CategoryMeta> = {
  'Makanan & Minuman': { icon: UtensilsCrossed, bg: 'rgba(251,146,60,0.15)',  color: '#FB923C' },
  'Transportasi':      { icon: Car,             bg: 'rgba(129,140,248,0.15)', color: '#818CF8' },
  'Belanja':           { icon: ShoppingBag,     bg: 'rgba(244,114,182,0.15)', color: '#F472B6' },
  'Hiburan':           { icon: Gamepad2,        bg: 'rgba(52,211,153,0.15)',  color: '#34D399' },
  'Kesehatan':         { icon: Heart,           bg: 'rgba(248,113,113,0.15)', color: '#F87171' },
  'Pendidikan':        { icon: GraduationCap,   bg: 'rgba(167,139,250,0.15)', color: '#A78BFA' },
  'Tagihan & Utilitas':{ icon: Receipt,         bg: 'rgba(251,191,36,0.15)',  color: '#FBBF24' },
  'Rumah':             { icon: Home,            bg: 'rgba(45,212,191,0.15)',  color: '#2DD4BF' },
  'Travel':            { icon: Plane,           bg: 'rgba(56,189,248,0.15)',  color: '#38BDF8' },
  'Perawatan Diri':    { icon: Sparkles,        bg: 'rgba(232,121,249,0.15)', color: '#E879F9' },
  'Anak & Keluarga':   { icon: Baby,            bg: 'rgba(249,168,212,0.25)', color: '#F9A8D4' },
  'Hewan Peliharaan':  { icon: Dog,             bg: 'rgba(217,119,6,0.15)',   color: '#D97706' },
  'Sosial & Hadiah':   { icon: Gift,            bg: 'rgba(251,113,133,0.15)', color: '#FB7185' },
  'Cicilan & Hutang':  { icon: CreditCard,      bg: 'rgba(239,68,68,0.15)',   color: '#EF4444' },
  'Lainnya':           { icon: DollarSign,      bg: 'rgba(107,114,128,0.15)', color: '#6B7280' },
  // Income
  'Gaji':              { icon: Briefcase,       bg: 'rgba(74,222,128,0.15)',  color: '#4ADE80' },
  'Freelance':         { icon: Laptop,          bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
  'Bisnis':            { icon: Building2,       bg: 'rgba(52,211,153,0.15)',  color: '#34D399' },
  'Investasi':         { icon: TrendingUp,      bg: 'rgba(34,197,94,0.15)',   color: '#22C55E' },
  'Bonus':             { icon: Wallet,          bg: 'rgba(134,239,172,0.15)', color: '#86EFAC' },
  'Hadiah':            { icon: Gift,            bg: 'rgba(192,132,252,0.15)', color: '#C084FC' },
  'Transfer Masuk':    { icon: Repeat,          bg: 'rgba(96,165,250,0.15)',  color: '#60A5FA' },
}

// Keyword → canonical category (for fuzzy matching free-text categories)
const KEYWORD_MAP: Record<string, string> = {
  // Makanan & Minuman
  makan:              'Makanan & Minuman',
  makanan:            'Makanan & Minuman',
  minum:              'Makanan & Minuman',
  minuman:            'Makanan & Minuman',
  kopi:               'Makanan & Minuman',
  restoran:           'Makanan & Minuman',
  warung:             'Makanan & Minuman',
  cafe:               'Makanan & Minuman',
  food:               'Makanan & Minuman',
  drink:              'Makanan & Minuman',
  'f&b':              'Makanan & Minuman',
  'food & drink':     'Makanan & Minuman',
  'food & beverage':  'Makanan & Minuman',
  snack:              'Makanan & Minuman',
  jajan:              'Makanan & Minuman',
  grocery:            'Makanan & Minuman',
  groceries:          'Makanan & Minuman',
  supermarket:        'Makanan & Minuman',
  bahan:              'Makanan & Minuman',

  // Transportasi
  transport:          'Transportasi',
  transportasi:       'Transportasi',
  bensin:             'Transportasi',
  parkir:             'Transportasi',
  ojek:               'Transportasi',
  grab:               'Transportasi',
  gojek:              'Transportasi',
  bus:                'Transportasi',
  kereta:             'Transportasi',
  commuter:           'Transportasi',
  taksi:              'Transportasi',
  taxi:               'Transportasi',
  toll:               'Transportasi',
  tol:                'Transportasi',
  fuel:               'Transportasi',

  // Belanja
  belanja:            'Belanja',
  shopping:           'Belanja',
  baju:               'Belanja',
  pakaian:            'Belanja',
  sepatu:             'Belanja',
  tas:                'Belanja',
  fashion:            'Belanja',
  aksesoris:          'Belanja',

  // Hiburan
  hiburan:            'Hiburan',
  entertainment:      'Hiburan',
  game:               'Hiburan',
  gaming:             'Hiburan',
  musik:              'Hiburan',
  music:              'Hiburan',
  streaming:          'Hiburan',
  netflix:            'Hiburan',
  spotify:            'Hiburan',
  bioskop:            'Hiburan',
  nonton:             'Hiburan',
  konser:             'Hiburan',
  event:              'Hiburan',

  // Kesehatan
  kesehatan:          'Kesehatan',
  health:             'Kesehatan',
  obat:               'Kesehatan',
  dokter:             'Kesehatan',
  rumah_sakit:        'Kesehatan',
  rs:                 'Kesehatan',
  klinik:             'Kesehatan',
  gym:                'Kesehatan',
  olahraga:           'Kesehatan',
  fitness:            'Kesehatan',
  apotek:             'Kesehatan',

  // Pendidikan
  pendidikan:         'Pendidikan',
  education:          'Pendidikan',
  sekolah:            'Pendidikan',
  kuliah:             'Pendidikan',
  kursus:             'Pendidikan',
  buku:               'Pendidikan',
  les:                'Pendidikan',
  seminar:            'Pendidikan',
  workshop:           'Pendidikan',

  // Tagihan & Utilitas
  tagihan:            'Tagihan & Utilitas',
  utilities:          'Tagihan & Utilitas',
  listrik:            'Tagihan & Utilitas',
  air:                'Tagihan & Utilitas',
  internet:           'Tagihan & Utilitas',
  pulsa:              'Tagihan & Utilitas',
  telepon:            'Tagihan & Utilitas',
  gas:                'Tagihan & Utilitas',
  iuran:              'Tagihan & Utilitas',
  subscription:       'Tagihan & Utilitas',
  langganan:          'Tagihan & Utilitas',

  // Rumah
  rumah:              'Rumah',
  sewa:               'Rumah',
  kontrakan:          'Rumah',
  kos:                'Rumah',
  perlengkapan:       'Rumah',
  furnitur:           'Rumah',
  renovasi:           'Rumah',
  dekorasi:           'Rumah',
  perabotan:          'Rumah',

  // Travel
  travel:             'Travel',
  liburan:            'Travel',
  hotel:              'Travel',
  wisata:             'Travel',
  tiket:              'Travel',
  pesawat:            'Travel',
  vacation:           'Travel',
  trip:               'Travel',

  // Perawatan Diri
  perawatan:          'Perawatan Diri',
  skincare:           'Perawatan Diri',
  salon:              'Perawatan Diri',
  barbershop:         'Perawatan Diri',
  kecantikan:         'Perawatan Diri',
  beauty:             'Perawatan Diri',
  spa:                'Perawatan Diri',
  makeup:             'Perawatan Diri',

  // Anak & Keluarga
  anak:               'Anak & Keluarga',
  keluarga:           'Anak & Keluarga',
  family:             'Anak & Keluarga',
  bayi:               'Anak & Keluarga',
  susu:               'Anak & Keluarga',
  popok:              'Anak & Keluarga',
  mainan:             'Anak & Keluarga',

  // Hewan Peliharaan
  hewan:              'Hewan Peliharaan',
  peliharaan:         'Hewan Peliharaan',
  pet:                'Hewan Peliharaan',
  kucing:             'Hewan Peliharaan',
  anjing:             'Hewan Peliharaan',

  // Sosial & Hadiah
  hadiah:             'Sosial & Hadiah',
  gift:               'Sosial & Hadiah',
  donasi:             'Sosial & Hadiah',
  sosial:             'Sosial & Hadiah',
  sedekah:            'Sosial & Hadiah',
  arisan:             'Sosial & Hadiah',
  pesta:              'Sosial & Hadiah',

  // Cicilan & Hutang
  hutang:             'Cicilan & Hutang',
  cicilan:            'Cicilan & Hutang',
  kredit:             'Cicilan & Hutang',
  kpr:                'Cicilan & Hutang',
  angsuran:           'Cicilan & Hutang',
  debt:               'Cicilan & Hutang',

  // Income
  gaji:               'Gaji',
  salary:             'Gaji',
  upah:               'Gaji',
  freelance:          'Freelance',
  bisnis:             'Bisnis',
  business:           'Bisnis',
  usaha:              'Bisnis',
  investasi:          'Investasi',
  investment:         'Investasi',
  dividen:            'Investasi',
  saham:              'Investasi',
  bonus:              'Bonus',
  thr:                'Bonus',
  transfer:           'Transfer Masuk',
  pemasukan:          'Transfer Masuk',
  income:             'Transfer Masuk',
  tabungan:           'Transfer Masuk',
  savings:            'Transfer Masuk',
}

function normalize(cat: string): string {
  return cat.toLowerCase().trim()
}

export function getCategoryMeta(category: string, type?: 'income' | 'expense'): CategoryMeta {
  const key = normalize(category)

  // 1. Exact canonical match (case-insensitive)
  const canonicalKey = Object.keys(CANONICAL).find(k => k.toLowerCase() === key)
  if (canonicalKey) return CANONICAL[canonicalKey]

  // 2. Keyword → canonical
  const mappedCategory = KEYWORD_MAP[key]
  if (mappedCategory && CANONICAL[mappedCategory]) return CANONICAL[mappedCategory]

  // 3. Partial keyword scan
  for (const [kw, cat] of Object.entries(KEYWORD_MAP)) {
    if (key.includes(kw) || kw.includes(key)) {
      if (CANONICAL[cat]) return CANONICAL[cat]
    }
  }

  // 4. Fallback by type
  if (type === 'income') {
    return { icon: Banknote, bg: 'rgba(74,222,128,0.15)', color: '#4ADE80' }
  }
  return { icon: DollarSign, bg: 'rgba(107,114,128,0.15)', color: '#6B7280' }
}
