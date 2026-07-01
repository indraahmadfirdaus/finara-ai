"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MessageCircle,
  ShieldCheck,
  Zap,
  BarChart2,
  Target,
  BookOpen,
  HandCoins,
  Landmark,
  ScanLine,
} from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";

const features = [
  {
    icon: MessageCircle,
    title: "Chat Natural",
    desc: 'Catat transaksi cukup dengan ketik seperti chat biasa. "Beli makan siang 25k" — Finara langsung simpan.',
  },
  {
    icon: BarChart2,
    title: "Rekap & Dashboard",
    desc: "Ringkasan pemasukan, pengeluaran, dan saldo realtime. Lengkap dengan grafik tren dan breakdown per kategori.",
  },
  {
    icon: Target,
    title: "Anggaran & Goals",
    desc: "Set budget bulanan per kategori dan buat target tabungan. Finara pantau progres dan kasih peringatan saat mendekati batas.",
  },
  {
    icon: HandCoins,
    title: "Hutang & Piutang",
    desc: "Catat siapa yang berhutang atau kamu hutangi. Tandai lunas saat sudah dibayar.",
  },
  {
    icon: Landmark,
    title: "Manajemen Aset",
    desc: "Pantau total kekayaan bersih dari rekening, investasi, properti, hingga kendaraan dalam satu tempat.",
  },
  {
    icon: ScanLine,
    title: "Scan Struk",
    desc: "Foto struk belanja dan Finara ekstrak detailnya otomatis — tidak perlu ketik manual.",
  },
  {
    icon: Zap,
    title: "AI Proaktif",
    desc: "Finara beri insight saat ada pola pengeluaran tidak biasa, budget hampir habis, atau tagihan jatuh tempo.",
  },
  {
    icon: ShieldCheck,
    title: "Privasi Terjaga",
    desc: "Data keuanganmu hanya bisa diakses oleh akunmu sendiri, dilindungi Row Level Security di level database.",
  },
];

const stack = [
  { label: "AI", value: "DeepSeek AI" },
  { label: "Framework", value: "Next.js 16 + React 19" },
  { label: "Styling", value: "Tailwind CSS v4" },
  { label: "Database", value: "Supabase (PostgreSQL)" },
  { label: "Auth", value: "Supabase Auth" },
  { label: "Animasi", value: "Framer Motion v12" },
  { label: "Grafik", value: "Recharts" },
];

const usage = [
  {
    q: "Catat pengeluaran",
    a: '"Beli bensin 50k" atau "makan siang 25rb di warteg"',
  },
  {
    q: "Catat pemasukan",
    a: '"Gaji masuk 5 juta" atau "terima transfer 200k dari Budi"',
  },
  { q: "Lihat rekap", a: '"Rekap bulan ini" atau "pengeluaran minggu ini"' },
  {
    q: "Kelola budget",
    a: '"Set budget makanan 1 juta bulan ini" atau "budget saya apa aja?"',
  },
  {
    q: "Goals tabungan",
    a: '"Buat goal liburan Bali target 5 juta" atau "tambah 200k ke goal Bali"',
  },
  {
    q: "Hutang & piutang",
    a: '"Catat hutang ke Budi 150k untuk kopi" atau "Budi sudah bayar"',
  },
  {
    q: "Cek aset",
    a: '"Berapa total aset saya?" atau "update saldo BCA jadi 3 juta"',
  },
  {
    q: "Navigasi",
    a: '"Buka dashboard" atau "lihat daftar transaksi bulan lalu"',
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <PageTransition>
      <div
        className="min-h-screen lg:max-w-2xl lg:mx-auto"
        style={{ background: "var(--bg-base)" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10"
          style={{
            background: "var(--header-bg)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Tentang Finara
          </p>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center pt-10 pb-8 px-6 text-center"
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 72 72"
            fill="none"
            className="mb-5"
          >
            <rect width="72" height="72" rx="18" fill="var(--accent-dim)" />
            <circle
              cx="36"
              cy="36"
              r="28"
              stroke="url(#abg1)"
              strokeWidth="5"
            />
            <path
              d="M20 38 Q27 28 36 36 Q45 44 52 34"
              stroke="url(#abg1)"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M20 44 Q27 34 36 42 Q45 50 52 40"
              stroke="url(#abg2)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.55"
            />
            <circle cx="36" cy="36" r="4.5" fill="url(#abg1)" />
            <defs>
              <linearGradient
                id="abg1"
                x1="16"
                y1="16"
                x2="56"
                y2="56"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#7C5CFC" />
              </linearGradient>
              <linearGradient
                id="abg2"
                x1="20"
                y1="36"
                x2="52"
                y2="36"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#FBB724" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
            </defs>
          </svg>

          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            finara
          </h1>
          <p
            className="text-sm leading-relaxed max-w-xs"
            style={{ color: "var(--text-muted)" }}
          >
            Asisten keuangan pribadi bertenaga AI untuk orang Indonesia. Kelola
            transaksi, anggaran, hutang, sampai aset — cukup dengan ngobrol.
          </p>
          <div
            className="mt-4 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent-light)",
            }}
          >
            v1.0 · Beta
          </div>
        </motion.div>

        {/* Fitur */}
        <div className="px-4">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Fitur
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.05 }}
                  className="flex items-start gap-4 px-5 py-4"
                  style={
                    i < features.length - 1
                      ? { borderBottom: "1px solid var(--border-light)" }
                      : undefined
                  }
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--accent-dim)" }}
                  >
                    <Icon size={16} style={{ color: "var(--accent-light)" }} />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold mb-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {f.title}
                    </p>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Cara pakai */}
        <div className="px-4 mt-6">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Cara Pakai
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            {usage.map((item, i) => (
              <motion.div
                key={item.q}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                className="px-5 py-3.5"
                style={
                  i < usage.length - 1
                    ? { borderBottom: "1px solid var(--border-light)" }
                    : undefined
                }
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <BookOpen
                    size={11}
                    style={{ color: "var(--accent-light)", flexShrink: 0 }}
                  />
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "var(--accent-light)" }}
                  >
                    {item.q}
                  </p>
                </div>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="px-4 mt-6">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Dibangun dengan
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            {stack.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.04 }}
                className="flex items-center justify-between px-5 py-3.5"
                style={
                  i < stack.length - 1
                    ? { borderBottom: "1px solid var(--border-light)" }
                    : undefined
                }
              >
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {s.label}
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.value}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <p
          className="text-center text-xs py-8"
          style={{ color: "var(--text-muted)" }}
        >
          Finara · Dibuat dengan ❤️ untuk Indonesia
        </p>
      </div>
    </PageTransition>
  );
}
