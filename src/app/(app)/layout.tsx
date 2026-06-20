import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/BottomNav'
import SideNav from '@/components/layout/SideNav'
import { ToastProvider } from '@/components/shared/Toast'
import { SideNavProvider } from '@/lib/sidenavContext'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <SideNavProvider>
      <ToastProvider>
        <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
          {/* Desktop sidebar — hidden on mobile */}
          <SideNav />

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile: bottom nav + bottom padding. Desktop: no bottom nav */}
            <main className="flex-1 pb-20 lg:pb-0">
              {children}
            </main>
            <BottomNav />
          </div>
        </div>
      </ToastProvider>
    </SideNavProvider>
  )
}
