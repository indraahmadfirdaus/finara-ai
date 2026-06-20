'use client'

import dynamic from 'next/dynamic'

const SpendingChart = dynamic(() => import('@/components/dashboard/SpendingChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-40">
      <div className="shimmer w-40 h-40 rounded-full" />
    </div>
  ),
})

export default function SpendingChartClient({
  data,
}: {
  data: { category: string; amount: number }[]
}) {
  return <SpendingChart data={data} />
}
