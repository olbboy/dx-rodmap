import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - auth (auth routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|auth).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const response = await updateSession(request)

  // For dashboard and protected routes
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/profile') || url.pathname.startsWith('/settings')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }
  }

  return response
} 