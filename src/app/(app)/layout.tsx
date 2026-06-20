import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/BottomNav'
import { ToastProvider } from '@/components/shared/Toast'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <ToastProvider>
      <div className="min-h-screen pb-20" style={{ background: '#0D0D14' }}>
        {children}
        <BottomNav />
      </div>
    </ToastProvider>
  )
}
