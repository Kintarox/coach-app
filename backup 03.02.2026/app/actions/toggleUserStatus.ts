'use server'

import { createClient } from '@supabase/supabase-js'

export async function toggleUserStatusAction(userId: string, newStatus: string) {
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

  // 1. Profil-Status ändern (Das, was du in der Tabelle siehst)
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ status: newStatus })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Optional: Wenn du den User "richtig" hart sperren willst, sodass er sich auch
  // bei Supabase Auth nicht mehr einloggen kann (nicht nur im Profil):
  if (newStatus === 'banned') {
     // Ban für 100 Jahre
     await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '876000h' }) 
  } else {
     // Entsperren
     await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '0h' }) 
  }

  return { success: true }
}