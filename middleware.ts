import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Wir bereiten die Antwort vor
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // SICHERHEITS-NETZ: Der gesamte Supabase-Teil wird überwacht
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Wenn Keys fehlen, brechen wir leise ab (Seite lädt trotzdem)
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Middleware: Supabase Keys fehlen! Auth wird übersprungen.')
      return response
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
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

    // Session aktualisieren
    await supabase.auth.getUser()

  } catch (e) {
    // WENN ETWAS SCHIEF GEHT: NICHT ABSTÜRZEN!
    // Wir loggen den Fehler für dich, aber lassen den User auf die Seite.
    console.error('Middleware Error:', e)
    return response
  }

  return response
}

export const config = {
  matcher: [
    // Wir schließen ALLES Statische aus, um Fehlerquellen zu minimieren
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}