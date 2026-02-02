import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const cookieStore = req.cookies
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { },
        remove(name: string, options: CookieOptions) { },
      },
    }
  )

  // Session beenden
  await supabase.auth.signOut()

  const url = req.nextUrl.clone()
  url.pathname = '/login'

  // WICHTIG: status: 303 erzwingt GET für die Zielseite!
  const response = NextResponse.redirect(url, {
    status: 303,
  })

  // Cookies sicherheitshalber löschen
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
        response.cookies.delete(cookie.name)
    }
  })

  return response
}