import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Finara — AI Finance Assistant',
  description: 'Asisten keuangan pribadi bertenaga AI untuk Indonesia. Catat transaksi, pantau budget, dan kelola keuangan dengan mudah.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  keywords: ['keuangan pribadi', 'finance', 'AI', 'Indonesia', 'catat pengeluaran', 'budget'],
  authors: [{ name: 'Finara' }],
  applicationName: 'Finara',
  openGraph: {
    title: 'Finara — AI Finance Assistant',
    description: 'Asisten keuangan pribadi bertenaga AI untuk Indonesia.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F0F14',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} h-full`} data-theme="dark" suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
