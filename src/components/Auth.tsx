import { createClient } from '@/utils/supabase/server'

interface AuthProps {
    authorized: boolean;
}

export async function Auth({authorized}: AuthProps) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    
  if (error || !data?.user) { 
    // Return that the user is not authorized
    return false
  }

    return true
}

