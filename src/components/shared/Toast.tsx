'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    const t = setTimeout(onRemove, 3000)
    return () => clearTimeout(t)
  }, [onRemove])

  const icons = { success: CheckCircle, error: XCircle, info: Info }
  const colors = {
    success: 'var(--success)',
    error: 'var(--danger)',
    info: 'var(--accent)',
  }

  const Icon = icons[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm w-full"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <Icon size={16} style={{ color: colors[toast.type], flexShrink: 0 }} />
      <p className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
        {toast.message}
      </p>
      <button onClick={onRemove} style={{ color: 'var(--text-muted)' }}>
        <X size={14} />
      </button>
    </motion.div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center w-full px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={() => remove(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
