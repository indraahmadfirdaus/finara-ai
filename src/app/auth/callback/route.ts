import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('[auth/callback] GET hit — url:', request.url)
  console.log('[auth/callback] params — code:', code ? `${code.slice(0, 12)}...` : 'MISSING', '| next:', next, '| origin:', origin)

  if (!code) {
    console.error('[auth/callback] No code in URL — redirecting to login with error')
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  console.log('[auth/callback] calling exchangeCodeForSession ...')
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  console.log('[auth/callback] exchangeCodeForSession result:', {
    userId: data?.user?.id,
    userEmail: data?.user?.email,
    error: error?.message,
    errorStatus: error?.status,
  })

  if (!error) {
    const dest = `${origin}${next}`
    console.log('[auth/callback] success — redirecting to:', dest)
    return NextResponse.redirect(dest)
  }

  console.error('[auth/callback] error — redirecting to login with error')
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
