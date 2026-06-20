interface SkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'chart'
  lines?: number
  className?: string
}

function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />
}

export default function SkeletonLoader({ variant = 'text', lines = 3, className = '' }: SkeletonProps) {
  if (variant === 'avatar') {
    return <SkeletonBox className={`w-10 h-10 rounded-full ${className}`} />
  }

  if (variant === 'chart') {
    return (
      <div className={`space-y-3 ${className}`}>
        <SkeletonBox className="w-48 h-48 rounded-full mx-auto" />
        <div className="flex flex-wrap gap-2 justify-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} className="w-20 h-4" />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={`rounded-2xl p-4 space-y-3 ${className}`}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <SkeletonBox className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-3 w-20" />
          </div>
          <SkeletonBox className="h-5 w-20" />
        </div>
        <SkeletonBox className="h-2 w-full" />
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}
