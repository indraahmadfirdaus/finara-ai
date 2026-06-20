import SkeletonLoader from '@/components/shared/SkeletonLoader'

export default function AppLoading() {
  return (
    <div className="px-4 pt-16 space-y-4" style={{ background: 'var(--bg-base)' }}>
      <SkeletonLoader variant="card" />
      <SkeletonLoader variant="card" />
      <SkeletonLoader variant="card" />
    </div>
  )
}
