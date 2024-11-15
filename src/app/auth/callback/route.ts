import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Get the protocol and host from headers
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host')
  
  // Construct the redirect URL using the original protocol and host
  const redirectUrl = `${protocol}://${host}`

  return NextResponse.redirect(redirectUrl)
} 