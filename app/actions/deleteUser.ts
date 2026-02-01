'use server'

import { createClient } from '@supabase/supabase-js'

export async function deleteUserAction(userId: string) {
  // Admin-Client mit Generalschlüssel erstellen
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // 1. Auth-User löschen (Der Login-Account)
  // Das ist der wichtigste Schritt.
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (authError) {
    return { success: false, error: authError.message }
  }

  // 2. Profil zur Sicherheit auch explizit löschen
  // (Falls in der Datenbank kein "On Delete Cascade" eingestellt ist)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    // Auth ist weg, aber Profil hing noch -> nicht schlimm, aber gut zu wissen
    console.error("Profil konnte nicht gelöscht werden:", profileError)
  }

  return { success: true }
}