import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Initialer Response vorbereiten
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Supabase Client erstellen (in einem Try-Catch, damit nichts abstürzt)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            response = NextResponse.next({
              request: { headers: request.headers },
            })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // 3. User prüfen
    const { data: { user } } = await supabase.auth.getUser()

    // --- DIE REGELN --- //

    const path = request.nextUrl.pathname;

    // A. User ist EINGELOGGT
    if (user) {
      // Wenn er auf der Startseite oder beim Login ist -> Ab ins Dashboard
      if (path === '/' || path === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // B. User ist NICHT EINGELOGGT (Fremder)
    if (!user) {
      // Er will auf geschützte Bereiche (Dashboard, Profil, etc.) -> Ab zum Login
      // Oder er ist auf der Startseite -> Auch zum Login
      if (path.startsWith('/dashboard') || path === '/' || path.startsWith('/training')) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

  } catch (e) {
    // Falls Supabase kurz Schluckauf hat, lassen wir den User sicherheitshalber zum Login
    console.error('Middleware Error:', e)
    // Optional: return NextResponse.redirect(new URL('/login', request.url));
  }

  return response
}

export const config = {
  // Wichtig: Matcher ignoriert Bilder, CSS, Icons etc.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}