'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Paperclip, Camera, X, Loader2, FileImage } from 'lucide-react'

interface ImageOCRProps {
  onResult: (text: string, imageUrl: string) => void
  disabled?: boolean
}

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function ImageOCR({ onResult, disabled }: ImageOCRProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  // Fixed position of the menu, computed from button position
  const [menuPos, setMenuPos] = useState<{ bottom: number; left: number } | null>(null)

  // Recompute position whenever menu opens
  useEffect(() => {
    if (menuOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setMenuPos({
        bottom: window.innerHeight - r.top + 8,
        left: r.left,
      })
    }
  }, [menuOpen])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handle(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  async function processFile(file: File) {
    setMenuOpen(false)
    const url = URL.createObjectURL(file)
    setPreview(url)
    setStatus('loading')

    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('ind+eng', 1, { logger: () => {} })
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      const cleaned = text.replace(/\s+/g, ' ').trim()
      if (!cleaned) {
        setStatus('error')
        return
      }
      setStatus('done')
      onResult(cleaned, url)
    } catch {
      setStatus('error')
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  function reset() {
    setStatus('idle')
    setPreview(null)
    setMenuOpen(false)
  }

  return (
    <div className="relative flex-shrink-0">
      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {/* Trigger button */}
      <motion.button
        ref={btnRef}
        type="button"
        disabled={disabled || status === 'loading'}
        whileTap={{ scale: 0.88 }}
        onClick={() => status === 'idle' ? setMenuOpen((v) => !v) : reset()}
        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
        style={{
          background: status === 'loading' ? 'var(--accent-dim)' : menuOpen ? 'var(--accent-dim)' : 'var(--bg-elevated)',
          color: status === 'loading' ? 'var(--accent-light)' : status === 'done' ? 'var(--success)' : status === 'error' ? 'var(--danger)' : 'var(--text-secondary)',
          border: '1px solid var(--border)',
        }}
        title="Scan struk / invoice"
      >
        {status === 'loading' ? (
          <Loader2 size={16} className="animate-spin" />
        ) : status === 'done' || status === 'error' ? (
          <X size={16} />
        ) : (
          <Paperclip size={16} />
        )}
      </motion.button>

      {/* Picker menu — rendered fixed to escape overflow:hidden parent */}
      <AnimatePresence>
        {menuOpen && menuPos && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-[200] rounded-2xl overflow-hidden shadow-xl"
            style={{
              bottom: menuPos.bottom,
              left: menuPos.left,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              minWidth: 180,
            }}
          >
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-left transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Camera size={16} style={{ color: 'var(--accent-light)' }} />
              Kamera
            </button>
            <div style={{ height: 1, background: 'var(--border-light)' }} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-left transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FileImage size={16} style={{ color: 'var(--accent-light)' }} />
              Pilih gambar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing overlay pill — also fixed */}
      <AnimatePresence>
        {status === 'loading' && preview && menuPos && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="fixed z-[200] flex items-center gap-2 px-3 py-2 rounded-2xl shadow-lg"
            style={{
              bottom: menuPos.bottom,
              left: menuPos.left,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              whiteSpace: 'nowrap',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Membaca teks...</span>
            <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: 'var(--accent-light)' }} />
          </motion.div>
        )}
        {status === 'error' && menuPos && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="fixed z-[200] px-3 py-2 rounded-2xl shadow-lg"
            style={{
              bottom: menuPos.bottom,
              left: menuPos.left,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="text-xs" style={{ color: 'var(--danger)' }}>Gagal baca teks — coba foto lebih terang</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
