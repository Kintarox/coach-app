'use server'

import { createClient } from '@supabase/supabase-js'

// HIER DEINEN KOPIERTEN LINK EINFÜGEN:
const DEFAULT_AVATAR_URL = "https://jtywvnzdgejhntcuczgj.supabase.co/storage/v1/object/public/avatars/default.png"; 

export async function createNewUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const role = formData.get('role') as string

  // 1. Admin-Client erstellen
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

  // 2. User in Supabase Auth anlegen
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName }
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  if (!authData.user) {
    return { success: false, error: "User konnte nicht erstellt werden." }
  }

  // 3. Profil erstellen (MIT STANDARD BILD)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      role: role,
      avatar_url: DEFAULT_AVATAR_URL // <--- Hier wird das Bild gesetzt!
    })

  if (profileError) {
    return { success: false, error: "Auth OK, aber Profil-Fehler: " + profileError.message }
  }

  return { success: true }
}