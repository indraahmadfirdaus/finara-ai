import {
  Utensils, Car, ShoppingBag, Zap, Heart, GraduationCap, Gamepad2,
  Home, Plane, Coffee, Gift, Briefcase, TrendingUp, Banknote, Repeat,
  PiggyBank, Shirt, Smartphone, Dumbbell, Baby, Dog, Music, BookOpen,
  Wrench, Bus, Fuel, CreditCard, DollarSign,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CategoryMeta {
  icon: LucideIcon
  bg: string
  color: string
}

const MAP: Record<string, CategoryMeta> = {
  // Food & drink
  makan:       { icon: Utensils,    bg: 'rgba(251,146,60,0.15)',  color: '#FB923C' },
  makanan:     { icon: Utensils,    bg: 'rgba(251,146,60,0.15)',  color: '#FB923C' },
  minum:       { icon: Coffee,      bg: 'rgba(161,98,7,0.15)',    color: '#A16207' },
  minuman:     { icon: Coffee,      bg: 'rgba(161,98,7,0.15)',    color: '#A16207' },
  kopi:        { icon: Coffee,      bg: 'rgba(161,98,7,0.15)',    color: '#A16207' },
  restoran:    { icon: Utensils,    bg: 'rgba(251,146,60,0.15)',  color: '#FB923C' },
  food:        { icon: Utensils,    bg: 'rgba(251,146,60,0.15)',  color: '#FB923C' },
  'food & drink': { icon: Utensils, bg: 'rgba(251,146,60,0.15)', color: '#FB923C' },

  // Transport
  transport:   { icon: Car,         bg: 'rgba(99,102,241,0.15)', color: '#818CF8' },
  transportasi:{ icon: Car,         bg: 'rgba(99,102,241,0.15)', color: '#818CF8' },
  bensin:      { icon: Fuel,        bg: 'rgba(99,102,241,0.15)', color: '#818CF8' },
  parkir:      { icon: Car,         bg: 'rgba(99,102,241,0.15)', color: '#818CF8' },
  ojek:        { icon: Bus,         bg: 'rgba(99,102,241,0.15)', color: '#818CF8' },
  grab:        { icon: Car,         bg: 'rgba(99,102,241,0.15)', color: '#818CF8' },
  gojek:       { icon: Car,         bg: 'rgba(99,102,241,0.15)', color: '#818CF8' },

  // Shopping
  belanja:     { icon: ShoppingBag, bg: 'rgba(236,72,153,0.15)', color: '#F472B6' },
  shopping:    { icon: ShoppingBag, bg: 'rgba(236,72,153,0.15)', color: '#F472B6' },
  baju:        { icon: Shirt,       bg: 'rgba(236,72,153,0.15)', color: '#F472B6' },
  pakaian:     { icon: Shirt,       bg: 'rgba(236,72,153,0.15)', color: '#F472B6' },

  // Bills & utilities
  tagihan:     { icon: Zap,         bg: 'rgba(234,179,8,0.15)',  color: '#EAB308' },
  listrik:     { icon: Zap,         bg: 'rgba(234,179,8,0.15)',  color: '#EAB308' },
  air:         { icon: Zap,         bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
  internet:    { icon: Smartphone,  bg: 'rgba(234,179,8,0.15)',  color: '#EAB308' },
  utilities:   { icon: Zap,         bg: 'rgba(234,179,8,0.15)',  color: '#EAB308' },
  pulsa:       { icon: Smartphone,  bg: 'rgba(234,179,8,0.15)',  color: '#EAB308' },
  telepon:     { icon: Smartphone,  bg: 'rgba(234,179,8,0.15)',  color: '#EAB308' },

  // Health
  kesehatan:   { icon: Heart,       bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
  health:      { icon: Heart,       bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
  obat:        { icon: Heart,       bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
  dokter:      { icon: Heart,       bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
  rumah_sakit: { icon: Heart,       bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
  gym:         { icon: Dumbbell,    bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
  olahraga:    { icon: Dumbbell,    bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },

  // Education
  pendidikan:  { icon: GraduationCap, bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },
  education:   { icon: GraduationCap, bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },
  sekolah:     { icon: GraduationCap, bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },
  kursus:      { icon: BookOpen,    bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },
  buku:        { icon: BookOpen,    bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },

  // Entertainment
  hiburan:     { icon: Gamepad2,    bg: 'rgba(16,185,129,0.15)', color: '#34D399' },
  entertainment:{ icon: Gamepad2,  bg: 'rgba(16,185,129,0.15)', color: '#34D399' },
  game:        { icon: Gamepad2,    bg: 'rgba(16,185,129,0.15)', color: '#34D399' },
  musik:       { icon: Music,       bg: 'rgba(16,185,129,0.15)', color: '#34D399' },
  streaming:   { icon: Music,       bg: 'rgba(16,185,129,0.15)', color: '#34D399' },
  bioskop:     { icon: Gamepad2,    bg: 'rgba(16,185,129,0.15)', color: '#34D399' },
  nonton:      { icon: Gamepad2,    bg: 'rgba(16,185,129,0.15)', color: '#34D399' },

  // Home
  rumah:       { icon: Home,        bg: 'rgba(20,184,166,0.15)', color: '#2DD4BF' },
  sewa:        { icon: Home,        bg: 'rgba(20,184,166,0.15)', color: '#2DD4BF' },
  kontrakan:   { icon: Home,        bg: 'rgba(20,184,166,0.15)', color: '#2DD4BF' },
  kos:         { icon: Home,        bg: 'rgba(20,184,166,0.15)', color: '#2DD4BF' },
  perlengkapan:{ icon: Wrench,      bg: 'rgba(20,184,166,0.15)', color: '#2DD4BF' },

  // Travel
  travel:      { icon: Plane,       bg: 'rgba(14,165,233,0.15)', color: '#38BDF8' },
  liburan:     { icon: Plane,       bg: 'rgba(14,165,233,0.15)', color: '#38BDF8' },
  hotel:       { icon: Plane,       bg: 'rgba(14,165,233,0.15)', color: '#38BDF8' },
  wisata:      { icon: Plane,       bg: 'rgba(14,165,233,0.15)', color: '#38BDF8' },

  // Gifts & social
  hadiah:      { icon: Gift,        bg: 'rgba(244,63,94,0.15)',  color: '#FB7185' },
  gift:        { icon: Gift,        bg: 'rgba(244,63,94,0.15)',  color: '#FB7185' },
  donasi:      { icon: Gift,        bg: 'rgba(244,63,94,0.15)',  color: '#FB7185' },
  sosial:      { icon: Gift,        bg: 'rgba(244,63,94,0.15)',  color: '#FB7185' },

  // Income sources
  gaji:        { icon: Briefcase,   bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  salary:      { icon: Briefcase,   bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  freelance:   { icon: Briefcase,   bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  bisnis:      { icon: Briefcase,   bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  bonus:       { icon: TrendingUp,  bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  investasi:   { icon: TrendingUp,  bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  investment:  { icon: TrendingUp,  bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  dividen:     { icon: TrendingUp,  bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  transfer:    { icon: Repeat,      bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  pemasukan:   { icon: Banknote,    bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  income:      { icon: Banknote,    bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },

  // Savings / debt
  tabungan:    { icon: PiggyBank,   bg: 'rgba(124,92,252,0.15)', color: '#A78BFA' },
  savings:     { icon: PiggyBank,   bg: 'rgba(124,92,252,0.15)', color: '#A78BFA' },
  hutang:      { icon: CreditCard,  bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
  cicilan:     { icon: CreditCard,  bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },

  // Kids / pets
  anak:        { icon: Baby,        bg: 'rgba(251,207,232,0.3)', color: '#F9A8D4' },
  hewan:       { icon: Dog,         bg: 'rgba(161,98,7,0.15)',   color: '#D97706' },
  peliharaan:  { icon: Dog,         bg: 'rgba(161,98,7,0.15)',   color: '#D97706' },
}

function normalize(cat: string): string {
  return cat.toLowerCase().trim()
}

export function getCategoryMeta(category: string, type?: 'income' | 'expense'): CategoryMeta {
  const key = normalize(category)

  // Exact match
  if (MAP[key]) return MAP[key]

  // Partial match — first key that the category string contains or vice versa
  for (const [k, v] of Object.entries(MAP)) {
    if (key.includes(k) || k.includes(key)) return v
  }

  // Fallback by type
  if (type === 'income') {
    return { icon: Banknote, bg: 'rgba(34,197,94,0.15)', color: '#4ADE80' }
  }
  return { icon: DollarSign, bg: 'rgba(161,161,170,0.15)', color: '#A1A1AA' }
}
