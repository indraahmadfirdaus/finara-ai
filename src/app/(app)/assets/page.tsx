'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatIDR, formatCompactIDR } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Plus, X, Loader2, Landmark, TrendingUp, Home, Car, Package, Clock, ArrowRight } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import PageTransition from '@/components/layout/PageTransition'
import AnimatedNumber from '@/components/shared/AnimatedNumber'
import SkeletonLoader from '@/components/shared/SkeletonLoader'
import EmptyState from '@/components/shared/EmptyState'

type AssetType = 'bank' | 'investment' | 'property' | 'vehicle' | 'other'

interface Asset {
  id: string
  name: string
  type: AssetType
  institution: string | null
  value: number
  note: string | null
}

interface ValueLog {
  id: string
  old_value: number
  new_value: number
  note: string | null
  created_at: string
}

const TYPE_META: Record<AssetType, { label: string; icon: typeof Landmark; accent: string; iconBg: string; iconColor: string }> = {
  bank:       { label: 'Rekening & Tabungan', icon: Landmark,   accent: 'var(--accent)',         iconBg: 'var(--accent-dim)',       iconColor: 'var(--accent-light)' },
  investment: { label: 'Investasi',           icon: TrendingUp, accent: 'var(--success)',         iconBg: 'rgba(34,197,94,0.12)',    iconColor: 'var(--success)' },
  property:   { label: 'Properti',            icon: Home,       accent: '#F59E0B',                iconBg: 'rgba(245,158,11,0.12)',   iconColor: '#F59E0B' },
  vehicle:    { label: 'Kendaraan',           icon: Car,        accent: 'var(--text-secondary)',  iconBg: 'var(--bg-elevated)',      iconColor: 'var(--text-secondary)' },
  other:      { label: 'Lainnya',             icon: Package,    accent: 'var(--text-muted)',      iconBg: 'var(--bg-elevated)',      iconColor: 'var(--text-muted)' },
}

const TYPE_ORDER: AssetType[] = ['bank', 'investment', 'property', 'vehicle', 'other']

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: 'bank',       label: 'Rekening & Tabungan' },
  { value: 'investment', label: 'Investasi' },
  { value: 'property',   label: 'Properti' },
  { value: 'vehicle',    label: 'Kendaraan' },
  { value: 'other',      label: 'Lainnya' },
]

const containerVariants = { animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }
const itemVariants = {
  initial: { opacity: 0, x: -6 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } },
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [totalAssets, setTotalAssets] = useState(0)
  const [totalDebts, setTotalDebts] = useState(0)
  const [loading, setLoading] = useState(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<AssetType>('bank')
  const [formInstitution, setFormInstitution] = useState('')
  const [formValue, setFormValue] = useState('')
  const [formNote, setFormNote] = useState('')
  const [saving, setSaving] = useState(false)

  const [updateAsset, setUpdateAsset] = useState<Asset | null>(null)
  const [updateValue, setUpdateValue] = useState('')
  const [updateNote, setUpdateNote] = useState('')
  const [updating, setUpdating] = useState(false)

  const [logAsset, setLogAsset] = useState<Asset | null>(null)
  const [logs, setLogs] = useState<ValueLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const [assetsRes, debtsRes] = await Promise.all([
      fetch('/api/assets'),
      fetch('/api/debts?settled=false'),
    ])
    const assetsData = await assetsRes.json()
    const debtsData = await debtsRes.json()
    setAssets(assetsData.assets ?? [])
    setTotalAssets(assetsData.total ?? 0)
    const debtTotal = (debtsData.debts ?? [])
      .filter((d: { type: string }) => d.type === 'owe')
      .reduce((s: number, d: { amount: number }) => s + d.amount, 0)
    setTotalDebts(debtTotal)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  async function handleCreate() {
    if (!formName || !formValue) return
    setSaving(true)
    await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formName,
        type: formType,
        institution: formInstitution || undefined,
        value: Math.round(parseFloat(formValue)),
        note: formNote || undefined,
      }),
    })
    await fetchAssets()
    setSaving(false)
    setShowAddModal(false)
    setFormName(''); setFormType('bank'); setFormInstitution(''); setFormValue(''); setFormNote('')
  }

  async function handleUpdate() {
    if (!updateAsset || !updateValue) return
    setUpdating(true)
    await fetch('/api/assets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: updateAsset.id,
        value: Math.round(parseFloat(updateValue)),
        log_note: updateNote || undefined,
      }),
    })
    await fetchAssets()
    setUpdating(false)
    setUpdateAsset(null)
    setUpdateValue(''); setUpdateNote('')
  }

  async function handleShowLogs(asset: Asset) {
    setLogAsset(asset)
    setLogsLoading(true)
    const res = await fetch(`/api/assets/logs?asset_id=${asset.id}`)
    const data = await res.json()
    setLogs(data.logs ?? [])
    setLogsLoading(false)
  }

  const grouped = TYPE_ORDER.reduce<Record<AssetType, Asset[]>>((acc, t) => {
    acc[t] = assets.filter((a) => a.type === t)
    return acc
  }, { bank: [], investment: [], property: [], vehicle: [], other: [] })

  const netWorth = totalAssets - totalDebts

  return (
    <PageTransition>
      <TopBar
        title="Aset"
        action={
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={14} />
            Tambah
          </motion.button>
        }
      />

      <div className="px-4 pt-3 pb-6 lg:max-w-3xl lg:mx-auto lg:px-6">
        {/* Hero net worth */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="rounded-2xl p-5 mb-5"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Total Aset</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                <AnimatedNumber value={totalAssets} currency />
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {assets.length} aset
              </p>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Net Worth</p>
              <p className="text-xl font-bold" style={{ color: netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                <AnimatedNumber value={netWorth} currency />
              </p>
              {totalDebts > 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
                  &minus; {formatCompactIDR(totalDebts)} hutang
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonLoader key={i} variant="card" />)}
          </div>
        ) : assets.length === 0 ? (
          <EmptyState
            title="Belum ada aset"
            description="Catat aset kamu — rekening, investasi, properti, dan lainnya"
            icon="🏦"
          />
        ) : (
          <div className="space-y-5">
            {TYPE_ORDER.map((type) => {
              const group = grouped[type]
              if (group.length === 0) return null
              const meta = TYPE_META[type]
              const Icon = meta.icon
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={13} style={{ color: meta.accent }} />
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      {meta.label}
                    </p>
                  </div>
                  <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-2">
                    {group.map((asset) => (
                      <motion.div
                        key={asset.id}
                        variants={itemVariants}
                        className="rounded-xl overflow-hidden"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-stretch">
                          <div className="w-1 flex-shrink-0 rounded-l-xl" style={{ background: meta.accent }} />
                          <div className="flex-1 p-3 pl-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: meta.iconBg }}
                              >
                                <Icon size={15} style={{ color: meta.iconColor }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                  {asset.name}
                                </p>
                                {asset.institution && (
                                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    {asset.institution}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold" style={{ color: meta.accent }}>
                                  {formatIDR(asset.value)}
                                </p>
                                <div className="flex items-center justify-end gap-1.5 mt-1">
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleShowLogs(asset)}
                                    className="p-1 rounded-lg"
                                    style={{ background: 'var(--bg-surface)' }}
                                  >
                                    <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => { setUpdateAsset(asset); setUpdateValue(String(asset.value)) }}
                                    className="text-[10px] px-2 py-1 rounded-lg font-medium"
                                    style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}
                                  >
                                    Update
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Asset Modal */}
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-5 lg:bottom-8 lg:left-auto lg:right-8 lg:w-96"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tambah Aset</h3>
                <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama aset (misal: BCA Tahapan)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <select value={formType} onChange={(e) => setFormType(e.target.value as AssetType)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                  {ASSET_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input type="text" value={formInstitution} onChange={(e) => setFormInstitution(e.target.value)}
                  placeholder="Institusi/platform (opsional)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <input type="number" value={formValue} onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Nilai (Rp)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Catatan (opsional)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate}
                  disabled={saving || !formName || !formValue}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'var(--accent)' }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  Simpan Aset
                </motion.button>
              </div>
            </motion.div>
          </>
        )}

        {/* Update Value Modal */}
        {updateAsset && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setUpdateAsset(null)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-5 lg:bottom-8 lg:left-auto lg:right-8 lg:w-96"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Update Nilai</h3>
                <button onClick={() => setUpdateAsset(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{updateAsset.name}</p>
              <div className="space-y-3">
                <input type="number" value={updateValue} onChange={(e) => setUpdateValue(e.target.value)}
                  placeholder="Nilai baru (Rp)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <input type="text" value={updateNote} onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Alasan update (opsional)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }} />
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleUpdate}
                  disabled={updating || !updateValue}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: 'var(--accent)' }}>
                  {updating ? <Loader2 size={15} className="animate-spin" /> : null}
                  Simpan Perubahan
                </motion.button>
              </div>
            </motion.div>
          </>
        )}

        {/* Value Log Bottom Sheet */}
        {logAsset && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setLogAsset(null)} />
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto lg:bottom-8 lg:left-auto lg:right-8 lg:w-96 lg:rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Histori Nilai</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{logAsset.name}</p>
                </div>
                <button onClick={() => setLogAsset(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
              {logsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <SkeletonLoader key={i} variant="card" />)}
                </div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  Belum ada histori perubahan nilai
                </p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
                          {formatIDR(log.old_value)}
                        </span>
                        <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                          {formatIDR(log.new_value)}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{log.note}</p>
                      )}
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
