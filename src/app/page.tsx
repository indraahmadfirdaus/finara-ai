"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import MascotOrb, { type MascotState } from "@/components/landing/MascotOrb";

const DEMO = [
  { role: "user", text: "beli makan siang 28rb" },
  {
    role: "ai",
    text: "Siap, dicatat ya! 🍜",
    card: { label: "Makanan", amount: 28000, type: "expense" },
  },
  { role: "user", text: "rekap pengeluaran minggu ini" },
  {
    role: "ai",
    text: "Minggu ini kamu udah keluar **Rp 312.000**. Terbanyak di Makanan (47%). Masih aman! 👍",
  },
  { role: "user", text: "gaji masuk 5 juta" },
  {
    role: "ai",
    text: "Yeay gajian! 🎉 Rp 5.000.000 masuk ke pemasukan.",
    card: { label: "Gaji", amount: 5000000, type: "income" },
  },
];


function formatIDR(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--accent-light)" }}
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.16 }}
        />
      ))}
    </div>
  );
}

function MiniCard({
  label,
  amount,
  type,
}: {
  label: string;
  amount: number;
  type: string;
}) {
  const isIncome = type === "income";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="mt-2 px-3 py-2.5 rounded-xl flex items-center justify-between"
      style={{
        background: "var(--land-glass)",
        border: `1px solid ${isIncome ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
        borderLeft: `3px solid ${isIncome ? "var(--success)" : "var(--danger)"}`,
      }}
    >
      <span
        className="text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span
        className="text-xs font-bold"
        style={{ color: isIncome ? "var(--success)" : "var(--danger)" }}
      >
        {isIncome ? "+" : "-"}
        {formatIDR(amount)}
      </span>
    </motion.div>
  );
}

function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <strong
            key={i}
            style={{ color: "var(--text-primary)", fontWeight: 700 }}
          >
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// Animated theme icon — rotates out old, rotates in new
function ThemeIcon({ theme }: { theme: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: "flex" }}
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
      </motion.span>
    </AnimatePresence>
  );
}

function ChatDemo() {
  const [shown, setShown] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [userTypingIdx, setUserTypingIdx] = useState<number | null>(null);
  const [userTypingText, setUserTypingText] = useState("");
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function play() {
      await delay(800);
      if (cancelled) return;

      for (let i = 0; i < DEMO.length; i++) {
        const item = DEMO[i];
        if (item.role === "user") {
          setUserTypingIdx(i);
          setUserTypingText("");
          for (let c = 0; c <= item.text.length; c++) {
            if (cancelled) return;
            setUserTypingText(item.text.slice(0, c));
            await delay(38 + Math.random() * 28);
          }
          await delay(200);
          setUserTypingIdx(null);
          setShown((prev) => [...prev, i]);
          await delay(400);
        } else {
          setTyping(true);
          await delay(900 + Math.random() * 400);
          if (cancelled) return;
          setTyping(false);
          setShown((prev) => [...prev, i]);
          await delay(600);
        }
      }

      await delay(3000);
      if (!cancelled) {
        setShown([]);
        setTyping(false);
        setUserTypingIdx(null);
        setUserTypingText("");
        play();
      }
    }

    play();
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll only the messages container — never the page
  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown, typing, userTypingText]);

  return (
    <div
      className="w-full rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: "var(--land-surface)",
        border: "1px solid var(--land-glass-border)",
        height: 420,
        maxWidth: 380,
        boxShadow:
          "0 40px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(124,92,252,0.12), inset 0 1px 0 var(--land-glass-border)",
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--land-glass-border)" }}
      >
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-dim)" }}
        >
          <svg width="16" height="16" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="28" stroke="url(#dlg)" strokeWidth="3" />
            <path
              d="M22 38 Q29 28 36 36 Q43 44 50 34"
              stroke="url(#dlg)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="36" cy="36" r="3" fill="url(#dlg)" />
            <defs>
              <linearGradient
                id="dlg"
                x1="16"
                y1="16"
                x2="56"
                y2="56"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#A78BFA" />
                <stop offset="1" stopColor="#7C5CFC" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <p
            className="text-xs font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            finara
          </p>
          <div className="flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--success)" }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: 10 }}>Online</p>
          </div>
        </div>
      </div>

      {/* Scrollable messages */}
      <div
        ref={msgsRef}
        className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex-1 min-h-0" />

        <AnimatePresence initial={false}>
          {DEMO.map((item, i) => {
            if (!shown.includes(i)) return null;
            const isUser = item.role === "user";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className="px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%]"
                  style={
                    isUser
                      ? {
                          background:
                            "linear-gradient(135deg, var(--bubble-user-from), var(--bubble-user-to))",
                          color: "#fff",
                          borderBottomRightRadius: 4,
                        }
                      : {
                          background: "var(--land-chat-ai)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--land-chat-ai-border)",
                          borderBottomLeftRadius: 4,
                          transition: "background 0.25s ease",
                        }
                  }
                >
                  <InlineMd text={item.text} />
                </div>
                {!isUser && item.card && (
                  <div className="w-full max-w-[85%]">
                    <MiniCard {...item.card} />
                  </div>
                )}
              </motion.div>
            );
          })}

          {userTypingIdx !== null && (
            <motion.div
              key="user-typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end"
            >
              <div
                className="px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[85%]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--bubble-user-from), var(--bubble-user-to))",
                  color: "#fff",
                  borderBottomRightRadius: 4,
                }}
              >
                {userTypingText || " "}
                <span
                  className="inline-block w-0.5 h-3 ml-0.5 align-middle"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    animation: "cursor-blink 0.8s step-end infinite",
                  }}
                />
              </div>
            </motion.div>
          )}

          {typing && (
            <motion.div
              key="ai-typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2"
            >
              <div
                className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-dim)" }}
              >
                <svg width="12" height="12" viewBox="0 0 72 72" fill="none">
                  <circle
                    cx="36"
                    cy="36"
                    r="28"
                    stroke="#A78BFA"
                    strokeWidth="4"
                  />
                  <path
                    d="M22 38 Q29 28 36 36 Q43 44 50 34"
                    stroke="#A78BFA"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="36" cy="36" r="4" fill="#A78BFA" />
                </svg>
              </div>
              <div
                className="rounded-2xl"
                style={{
                  background: "var(--land-chat-ai)",
                  border: "1px solid var(--land-chat-ai-border)",
                  borderBottomLeftRadius: 4,
                  transition: "background 0.25s ease",
                }}
              >
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fake input */}
      <div className="px-3 pb-3 pt-1 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
          style={{
            background: "var(--land-chat-input-bg)",
            border: "1px solid var(--land-chat-input-border)",
            transition: "background 0.25s ease",
          }}
        >
          <span
            className="flex-1 text-xs"
            style={{ color: "var(--text-muted)", opacity: 0.5 }}
          >
            Ketik pesan...
          </span>
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#FBB724,#F97316)" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}


const INSIGHTS: Array<{ text: string; mascot: MascotState; chartType: 'bar' | 'line' | 'donut' }> = [
  {
    text: 'Wah, pengeluaran kamu minggu ini naik 23% dari biasanya. Terbanyak di Makanan. Hati-hati ya! 👀',
    mascot: 'worried',
    chartType: 'bar',
  },
  {
    text: 'Goal Liburan Bali kamu udah 60%! Tinggal Rp 2 juta lagi. Semangat! 🎯',
    mascot: 'excited',
    chartType: 'donut',
  },
  {
    text: 'Budget Transportasi masih aman, sisa 58%. Kamu lagi hemat nih! ✅',
    mascot: 'happy',
    chartType: 'line',
  },
]

function InsightChart({ type, inView }: { type: 'bar' | 'line' | 'donut'; inView: boolean }) {
  if (type === 'bar') {
    const bars = [40, 52, 45, 50, 55, 62, 90]
    return (
      <div className="flex items-end gap-1.5" style={{ height: 52 }}>
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.04 * i, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: 4,
              background: i === 6 ? 'var(--danger)' : 'var(--bg-elevated)',
              border: `1px solid ${i === 6 ? 'rgba(239,68,68,0.4)' : 'var(--border-light)'}`,
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>
    )
  }

  if (type === 'line') {
    // Points going down = hemat makin lama
    const pts = [[0,40],[1,35],[2,42],[3,30],[4,25],[5,18],[6,12]]
    const W = 240, H = 52
    const sx = (x: number) => (x / 6) * W
    const sy = (y: number) => (y / 100) * H
    const d = pts.map(([x,y], i) => `${i===0?'M':'L'}${sx(x)},${sy(y)}`).join(' ')
    const fill = `${d} L${sx(6)},${H} L${sx(0)},${H} Z`
    return (
      <div style={{ height: 52 }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="linegrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--success)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={fill}
            fill="url(#linegrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d={d}
            fill="none"
            stroke="var(--success)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
          {pts.map(([x,y], i) => (
            <motion.circle
              key={i}
              cx={sx(x)} cy={sy(y)} r={3}
              fill="var(--success)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.08 * i + 0.4, duration: 0.2 }}
            />
          ))}
        </svg>
      </div>
    )
  }

  // donut — 60% progress
  const pct = 0.6
  const R = 20, cx = 26, cy = 26
  const circ = 2 * Math.PI * R
  return (
    <div className="flex items-center gap-4" style={{ height: 52 }}>
      <svg width={52} height={52}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--bg-elevated)" strokeWidth={6} />
        <motion.circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
        />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="var(--accent)" fontWeight={700}>60%</text>
      </svg>
      <div className="flex flex-col gap-1.5 flex-1">
        {[
          { label: 'Terkumpul', val: 'Rp 3jt', color: 'var(--accent)' },
          { label: 'Sisa', val: 'Rp 2jt', color: 'var(--text-muted)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex items-center justify-between">
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightSection({ onInsightChange }: { onInsightChange: (state: MascotState) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [activeIdx, setActiveIdx] = useState(0)
  const onInsightChangeRef = useRef(onInsightChange)
  onInsightChangeRef.current = onInsightChange

  useEffect(() => {
    if (!inView) return
    onInsightChangeRef.current(INSIGHTS[0].mascot)
    const interval = setInterval(() => {
      setActiveIdx((prev) => {
        const next = (prev + 1) % INSIGHTS.length
        onInsightChangeRef.current(INSIGHTS[next].mascot)
        return next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [inView])

  return (
    <section
      id="section-insight"
      ref={ref}
      className="relative z-10 px-5 sm:px-8 lg:px-16 py-16"
    >
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <p
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Finara langsung kasih tau yang penting.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ga perlu buka-buka grafik. Finara yang analisis, kamu yang mutusin.
          </p>
        </motion.div>

        <div
          className="mx-auto rounded-2xl p-6"
          style={{
            maxWidth: 520,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* Header: orb with face + label */}
          <div className="flex items-center gap-2.5 mb-5">
            <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg,#A78BFA,#7C5CFC)',
                boxShadow: '0 0 10px 2px rgba(124,92,252,0.4)',
              }} />
              <div style={{
                position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                width: 18, height: 10, borderRadius: 3, background: 'rgba(0,0,0,0.32)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="6" viewBox="0 0 14 6" fill="none">
                  <path d="M1 5 Q3.5 1 6 5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                  <path d="M8 5 Q10.5 1 13 5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </svg>
              </div>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Finara Insight</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>analisis otomatis dari data kamu</p>
            </div>
          </div>

          {/* Carousel slides */}
          <div style={{ overflow: 'hidden' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeIdx}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              >
                {/* Chart for this slide */}
                <div className="mb-4">
                  <InsightChart type={INSIGHTS[activeIdx].chartType} inView={inView} />
                </div>

                {/* Insight text */}
                <div
                  className="text-sm leading-relaxed text-left px-4 py-3 rounded-xl"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    borderBottomLeftRadius: 4,
                    minHeight: 72,
                  }}
                >
                  {INSIGHTS[activeIdx].text}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {INSIGHTS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveIdx(i)
                  onInsightChange(INSIGHTS[i].mascot)
                }}
                style={{
                  width: i === activeIdx ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === activeIdx ? 'var(--accent)' : 'var(--border)',
                  transition: 'width 0.3s ease, background 0.3s ease',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MiniOrb({ state }: { state: 'angry' | 'happy' }) {
  const isAngry = state === 'angry'
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #A78BFA 0%, #7C5CFC 100%)',
        boxShadow: `0 0 12px 2px ${isAngry ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.5)'}`,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Layar mini */}
      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        width: 18, height: 10, borderRadius: 3, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isAngry ? (
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
            <line x1="1" y1="1" x2="5" y2="3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="13" y1="1" x2="9" y2="3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            <ellipse cx="4" cy="6" rx="2" ry="1.5" fill="white" />
            <ellipse cx="10" cy="6" rx="2" ry="1.5" fill="white" />
          </svg>
        ) : (
          <svg width="14" height="6" viewBox="0 0 14 6" fill="none">
            <path d="M1 5 Q3.5 1 6 5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M8 5 Q10.5 1 13 5" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>
        )}
      </div>
    </div>
  )
}

function CareSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const cards = [
    {
      state: 'angry' as const,
      bg: 'rgba(239,68,68,0.05)',
      border: 'var(--danger)',
      shadow: 'rgba(239,68,68,0.15)',
      quote: '"Ini beneran ga diatur?? Udah 3x makan di restoran mahal minggu ini."',
      delay: 0,
    },
    {
      state: 'happy' as const,
      bg: 'rgba(34,197,94,0.05)',
      border: 'var(--success)',
      shadow: 'rgba(34,197,94,0.15)',
      quote: '"Wah, tabungan kamu naik bulan ini! Proud of you 🎉"',
      delay: 0.12,
    },
  ]

  return (
    <section
      id="section-care"
      ref={ref}
      className="relative z-10 px-5 sm:px-8 lg:px-16 py-16"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <p
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Finara tuh... perhatian banget.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Seneng kalau kamu nabung. Khawatir kalau boros. Bahkan bisa marah.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {cards.map((card) => (
            <motion.div
              key={card.state}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ type: 'spring', stiffness: 280, damping: 22, delay: card.delay }}
              className="rounded-2xl p-5 relative"
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
                boxShadow: `0 0 20px ${card.shadow}`,
              }}
            >
              {/* Mini orb pojok kanan atas */}
              <div className="absolute top-4 right-4">
                <MiniOrb state={card.state} />
              </div>
              <p
                className="text-sm leading-relaxed italic pr-10 mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {card.quote}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SoonBadge() {
  return (
    <span
      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
      style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
    >
      <motion.span
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        ···
      </motion.span>
      SOON
    </span>
  )
}

function PlatformSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  const platforms = [
    {
      name: 'Telegram',
      color: '#229ED9',
      bg: 'rgba(34,158,217,0.08)',
      border: 'rgba(34,158,217,0.3)',
      soon: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
            stroke="#229ED9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      color: '#25D366',
      bg: 'rgba(37,211,102,0.06)',
      border: 'rgba(37,211,102,0.2)',
      soon: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"
            stroke="#25D366" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <section
      id="section-platform"
      ref={ref}
      className="relative z-10 px-5 sm:px-8 lg:px-16 py-16"
    >
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <p
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Ga cuma di sini.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Finara bakal hadir di platform chat favoritmu. Coming soon.
          </p>
        </motion.div>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {platforms.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between px-5 py-4 rounded-2xl"
              style={{
                background: p.bg,
                border: `1px solid ${p.border}`,
                opacity: 0.65,
                cursor: 'not-allowed',
              }}
            >
              <div className="flex items-center gap-3">
                {p.icon}
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {p.name}
                </span>
              </div>
              <SoonBadge />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>('idle')
  const [showBubble, setShowBubble] = useState(false)
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const careAngerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerMascot = useCallback((state: MascotState) => {
    setMascotState(state)
    setShowBubble(true)
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
    bubbleTimerRef.current = setTimeout(() => setShowBubble(false), 4000)
  }, [])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections: Array<{ id: string; state: MascotState }> = [
      { id: 'section-hero',     state: 'wave' },
      { id: 'section-care',     state: 'worried' },
      { id: 'section-platform', state: 'excited' },
      { id: 'section-cta',      state: 'happy' },
    ]

    const observers: IntersectionObserver[] = []

    sections.forEach(({ id, state }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          if (state === 'worried') {
            triggerMascot('worried')
            if (careAngerTimerRef.current) clearTimeout(careAngerTimerRef.current)
            careAngerTimerRef.current = setTimeout(() => triggerMascot('angry'), 1500)
          } else {
            triggerMascot(state)
          }
        },
        { threshold: 0.35 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => {
      observers.forEach((obs) => obs.disconnect())
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      if (careAngerTimerRef.current) clearTimeout(careAngerTimerRef.current)
    }
  }, [triggerMascot])

  useEffect(() => {
    const timer = setTimeout(() => triggerMascot('wave'), 800)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: "var(--land-bg)",
        color: "var(--text-primary)",
        transition: "background 0.25s ease, color 0.15s ease",
      }}
    >
      {/* Ambient orbs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          style={{
            position: "absolute",
            top: "-15%",
            right: "-5%",
            width: "55vw",
            height: "55vw",
            maxWidth: 640,
            maxHeight: 640,
            borderRadius: "50%",
            background: `radial-gradient(circle, var(--land-orb-purple) 0%, transparent 65%)`,
            transition: "background 0.4s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "-8%",
            width: "42vw",
            height: "42vw",
            maxWidth: 480,
            maxHeight: 480,
            borderRadius: "50%",
            background: `radial-gradient(circle, var(--land-orb-gold) 0%, transparent 65%)`,
            transition: "background 0.4s ease",
          }}
        />
      </div>

      {/* Sticky nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 sm:px-8 lg:px-16"
        style={{
          background: scrolled ? "var(--land-surface)" : "transparent",
          borderBottom: scrolled
            ? "1px solid var(--land-separator)"
            : "1px solid transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
          transition:
            "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
        }}
      >
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 72 72" fill="none">
            <circle
              cx="36"
              cy="36"
              r="34"
              stroke="url(#navg)"
              strokeWidth="2.5"
            />
            <path
              d="M20 38 Q27 28 36 36 Q45 44 52 34"
              stroke="url(#navg)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="36" cy="36" r="3.5" fill="url(#navg)" />
            <defs>
              <linearGradient
                id="navg"
                x1="16"
                y1="16"
                x2="56"
                y2="56"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#A78BFA" />
                <stop offset="1" stopColor="#7C5CFC" />
              </linearGradient>
            </defs>
          </svg>
          <span
            className="text-sm font-bold"
            style={{ letterSpacing: "-0.02em" }}
          >
            finara
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle with animated icon */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={toggle}
            className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
            style={{
              background: "var(--land-nav-btn)",
              color: "var(--text-secondary)",
              border: "1px solid var(--land-glass-border)",
              transition: "background 0.2s ease",
            }}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--land-glass-border)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--land-nav-btn)")
            }
          >
            <ThemeIcon theme={theme} />
          </motion.button>

          {/* Support developer */}
          <motion.button
            onClick={() => router.push("/support")}
            whileTap={{ scale: 0.93 }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: "rgba(251,183,36,0.12)",
              color: "#FBB724",
              border: "1px solid rgba(251,183,36,0.25)",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "rgba(251,183,36,0.2)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "rgba(251,183,36,0.12)")
            }
          >
            ☕ Support
          </motion.button>

          <button
            onClick={() => router.push("/login")}
            className="hidden sm:block px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            Masuk
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/login")}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-black"
            style={{ background: "linear-gradient(135deg,#FBB724,#F97316)" }}
          >
            Daftar
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero — top padding accounts for fixed nav height */}
      <section id="section-hero" className="relative z-10 px-5 sm:px-8 lg:px-16 pt-28 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          {/* Left copy — narrower on desktop so demo has room */}
          <div className="w-full lg:w-[46%] text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent-light)",
                border: "1px solid rgba(124,92,252,0.25)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              AI Finance Assistant · Bahasa Indonesia
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.18,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-[1.15] mb-4"
              style={{ letterSpacing: "-0.03em" }}
            >
              Catat keuangan{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg,#A78BFA 0%,#7C5CFC 50%,#FBB724 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                cukup dengan chat
              </span>
            </motion.h1>


            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5 }}
              className="text-sm sm:text-base leading-relaxed mb-7 lg:max-w-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Ketik kayak chat biasa — Finara langsung ngerti dan catat.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/login")}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-black"
                style={{
                  background: "linear-gradient(135deg,#FBB724 0%,#F97316 100%)",
                }}
              >
                Mulai gratis sekarang
                <ArrowRight size={15} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/features")}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold"
                style={{
                  background: "var(--accent-dim)",
                  color: "var(--accent-light)",
                  border: "1px solid rgba(124,92,252,0.35)",
                  transition: "background 0.2s ease, border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(124,92,252,0.22)";
                  e.currentTarget.style.borderColor = "rgba(124,92,252,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--accent-dim)";
                  e.currentTarget.style.borderColor = "rgba(124,92,252,0.35)";
                }}
              >
                Lihat fitur-fiturnya
              </motion.button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.52 }}
              className="mt-4 text-xs"
              style={{ color: "var(--text-muted)", opacity: 0.6 }}
            >
              Gratis selamanya · Data aman & terenkripsi
            </motion.p>
          </div>

          {/* Right — chat demo, takes remaining 54% on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full lg:flex-1 flex justify-center lg:justify-end"
          >
            <ChatDemo />
          </motion.div>
        </div>
      </section>

      <MascotOrb
        state={mascotState}
        showBubble={showBubble}
      />

      <CareSection />

      <PlatformSection />

      <InsightSection onInsightChange={(s) => triggerMascot(s)} />

      {/* CTA section */}
      <section id="section-cta" className="relative z-10 px-5 sm:px-8 lg:px-16 py-16 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Siap punya asisten keuangan yang beneran perhatian?
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-sm mb-8"
          style={{ color: 'var(--text-muted)' }}
        >
          Gratis. Mulai sekarang.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/login')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-black"
            style={{ background: 'linear-gradient(135deg,#FBB724 0%,#F97316 100%)' }}
          >
            Mulai gratis sekarang
            <ArrowRight size={15} />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 px-5 sm:px-8 lg:px-16 py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid var(--land-separator)" }}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 72 72" fill="none">
            <circle
              cx="36"
              cy="36"
              r="34"
              stroke="var(--accent)"
              strokeWidth="2.5"
            />
            <path
              d="M20 38 Q27 28 36 36 Q45 44 52 34"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="36" cy="36" r="3.5" fill="var(--accent)" />
          </svg>
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            finara · v1.0 Beta
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 text-center">
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)", opacity: 0.6 }}
          >
            Dibuat oleh{" "}
            <span
              className="font-semibold"
              style={{ color: "var(--text-secondary)", opacity: 1 }}
            >
              indrafrds
            </span>
          </span>
          <motion.button
            onClick={() => router.push("/support")}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: "rgba(251,183,36,0.1)",
              color: "#FBB724",
              border: "1px solid rgba(251,183,36,0.22)",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "rgba(251,183,36,0.2)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "rgba(251,183,36,0.1)")
            }
          >
            ☕ Support di Saweria
          </motion.button>
        </div>
      </footer>
    </div>
  );
}
