'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InsightCard from './InsightCard'
import type { InsightCard as InsightCardType } from '@/lib/dashboard/insightTypes'

type State = 'idle' | 'loading' | 'loaded' | 'error'

const CACHE_KEY = 'finara_insight_cache'
const CACHE_TTL_MS = 10 * 60 * 1000

interface Cache {
  insights: InsightCardType[]
  generated_at: string
  cached_at: number
}

function loadCache(): Cache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache: Cache = JSON.parse(raw)
    if (Date.now() - cache.cached_at > CACHE_TTL_MS) return null
    return cache
  } catch {
    return null
  }
}

function saveCache(insights: InsightCardType[], generated_at: string) {
  try {
    const cache: Cache = { insights, generated_at, cached_at: Date.now() }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

export default function InsightSection() {
  const [uiState, setUiState] = useState<State>('idle')
  const [insights, setInsights] = useState<InsightCardType[]>([])
  const [generatedAt, setGeneratedAt] = useState<string>('')

  useEffect(() => {
    const cache = loadCache()
    if (cache) {
      setInsights(cache.insights)
      setGeneratedAt(cache.generated_at)
      setUiState('loaded')
    }
  }, [])

  const fetchInsights = useCallback(async (bypassCache = false) => {
    if (!bypassCache) {
      const cache = loadCache()
      if (cache) {
        setInsights(cache.insights)
        setGeneratedAt(cache.generated_at)
        setUiState('loaded')
        return
      }
    }

    setUiState('loading')
    try {
      const res = await fetch('/api/dashboard/insight')
      const data = await res.json()
      if (data.insights?.length > 0) {
        setInsights(data.insights)
        setGeneratedAt(data.generated_at)
        saveCache(data.insights, data.generated_at)
        setUiState('loaded')
      } else {
        setUiState('error')
      }
    } catch {
      setUiState('error')
    }
  }, [])

  const relativeTime = (iso: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
      if (diff < 60) return 'Baru saja'
      if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
      return `${Math.floor(diff / 3600)} jam lalu`
    } catch {
      return 'Baru saja'
    }
  }

  return (
    <div>
      {/* Idle: large orb */}
      <AnimatePresence>
        {uiState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.3 } }}
            className="flex flex-col items-center py-7 gap-4 px-4"
          >
            <div className="relative w-[88px] h-[88px] flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(124,92,252,0.25) 0%, transparent 70%)',
                  animation: 'orbPulse 3s ease-in-out infinite',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  inset: -8,
                  background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
                  animation: 'orbPulse 3s ease-in-out infinite 0.8s',
                }}
              />
              <div
                className="relative z-10 w-[60px] h-[60px] rounded-full flex items-center justify-center text-xl"
                style={{
                  background: 'linear-gradient(135deg, #7C5CFC 0%, #A78BFA 55%, #6B46FC 100%)',
                  boxShadow: '0 0 0 1px rgba(124,92,252,0.5), 0 10px 40px rgba(124,92,252,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
                  animation: 'orbFloat 4s ease-in-out infinite',
                }}
              >
                ✦
              </div>
            </div>

            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Finara siap menganalisis keuanganmu
            </p>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => fetchInsights(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(167,139,250,0.1))',
                border: '1px solid rgba(124,92,252,0.4)',
                color: 'var(--accent-light)',
                boxShadow: '0 2px 16px rgba(124,92,252,0.15)',
              }}
            >
              <span>✦</span>
              Tanya Insight Finara
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading / loaded / error: insight card wrapper */}
      <AnimatePresence>
        {(uiState === 'loading' || uiState === 'loaded' || uiState === 'error') && (
          <motion.div
            key="section"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-4 mt-5 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {/* Header with small orb */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-light)' }}
            >
              <div
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #7C5CFC, #A78BFA)',
                  boxShadow: '0 4px 16px rgba(124,92,252,0.4)',
                }}
              >
                ✦
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: -3,
                    border: '1px solid rgba(124,92,252,0.35)',
                    animation: 'ringPulse 2.5s ease-in-out infinite',
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-[13px]" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  Insight Finara
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {uiState === 'loading' ? 'Menganalisis...' : relativeTime(generatedAt)}
                </p>
              </div>
              <button
                onClick={() => fetchInsights(true)}
                disabled={uiState === 'loading'}
                className="text-[11px] font-semibold px-3 py-1 rounded-full"
                style={{
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(124,92,252,0.25)',
                  color: uiState === 'loading' ? 'var(--text-muted)' : 'var(--accent-light)',
                  cursor: uiState === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: uiState === 'loading' ? 0.5 : 1,
                }}
              >
                ↺ Perbarui
              </button>
            </div>

            {/* Skeleton */}
            {uiState === 'loading' && (
              <div className="p-3 flex flex-col gap-2">
                {[70, 90, 60].map((w, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 flex gap-3"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 shimmer" />
                    <div className="flex-1 flex flex-col gap-2 pt-1">
                      <div className="h-2.5 rounded shimmer" style={{ width: `${w}%` }} />
                      <div className="h-2 rounded shimmer" style={{ width: '88%' }} />
                      <div className="h-2 rounded shimmer" style={{ width: '55%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loaded cards */}
            {uiState === 'loaded' && (
              <div className="p-3 flex flex-col gap-2">
                {insights.map((card, i) => (
                  <InsightCard key={i} card={card} index={i} />
                ))}
              </div>
            )}

            {/* Error */}
            {uiState === 'error' && (
              <div className="p-6 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Finara gagal menganalisis saat ini.
                </p>
                <button
                  onClick={() => fetchInsights(true)}
                  className="mt-3 text-xs font-semibold"
                  style={{ color: 'var(--accent-light)' }}
                >
                  Coba lagi
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.2); opacity: 0.3; }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
