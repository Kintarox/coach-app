import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const cookieStore = req.cookies
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Wir können hier keine Cookies setzen, da wir in einer Route sind,
          // aber wir brauchen die Methode für den Client.
        },
        remove(name: string, options: CookieOptions) {
           // Dasselbe hier.
        },
      },
    }
  )

  // 1. Supabase Session beenden
  await supabase.auth.signOut()

  // 2. Redirect zur Login-Seite erzwingen und Cookies dabei killen
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  
  const response = NextResponse.redirect(url)

  // 3. Hier löschen wir die Cookies manuell und brutal aus dem Browser
  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')
  // Falls du einen Projekt-spezifischen Cookie-Namen hast (Standard bei Vercel oft):
  // response.cookies.delete(`sb-${process.env.NEXT_PUBLIC_SUPABASE_REFERENCE_ID}-auth-token`)

  return response
}