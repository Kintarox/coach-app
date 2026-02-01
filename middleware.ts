import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Initialisiere die Antwort
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Supabase Client für den Server erstellen
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 3. User-Session prüfen
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Pfad-Logik
  const path = request.nextUrl.pathname
  const isPublicPage = path === '/login' || path === '/register'

  // Szenario A: Nicht eingeloggt, will auf private Seite -> Redirect zu Login
  if (!user && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Szenario B: Eingeloggt, will auf Login-Seite -> Redirect zum Dashboard
  if (user && isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Matcht alle Pfade außer:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Bilder (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}