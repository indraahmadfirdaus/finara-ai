'use client'

import { useRef, useState } from 'react'
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
  const [status, setStatus] = useState<Status>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  async function processFile(file: File) {
    setMenuOpen(false)
    const url = URL.createObjectURL(file)
    setPreview(url)
    setStatus('loading')

    try {
      // Dynamic import so Tesseract worker only loads when needed
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('ind+eng', 1, {
        logger: () => {},
      })
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
        type="button"
        disabled={disabled || status === 'loading'}
        whileTap={{ scale: 0.88 }}
        onClick={() => status === 'idle' ? setMenuOpen((v) => !v) : reset()}
        className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors"
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

      {/* Picker menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute bottom-12 left-0 z-50 rounded-2xl overflow-hidden shadow-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', minWidth: 180 }}
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

      {/* Processing overlay pill */}
      <AnimatePresence>
        {status === 'loading' && preview && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-12 left-0 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl shadow-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Membaca teks...</span>
            <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: 'var(--accent-light)' }} />
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-12 left-0 z-50 px-3 py-2 rounded-2xl shadow-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
          >
            <span className="text-xs" style={{ color: 'var(--danger)' }}>Gagal baca teks — coba foto lebih terang</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
