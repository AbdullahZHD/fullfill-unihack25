import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Skip middleware for public routes
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon')
  ) {
    return response
  }

  // Get auth tokens from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value

  // If no tokens, allow the request to continue (auth will be checked in server actions)
  if (!accessToken || !refreshToken) {
    return response
  }

  // Initialize Supabase
  const supabaseUrl = "https://iqpmkmqpwainpqggjsuw.supabase.co"
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcG1rbXFwd2FpbnBxZ2dqc3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjY2MDAsImV4cCI6MjA1NzU0MjYwMH0.hCNLCIwDS0sMVkesB3kKWU6uSaTRdfXOSc4YeFIuYtg"
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  })

  try {
    // Set the session in the client
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    // Get the session (this will refresh the token if needed)
    const { data: { session } } = await supabase.auth.getSession()

    // If we have a new session, update the cookies
    if (session && (session.access_token !== accessToken || session.refresh_token !== refreshToken)) {
      response.cookies.set('sb-access-token', session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      })
      
      response.cookies.set('sb-refresh-token', session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      })
    }
  } catch (error) {
    console.error('Middleware auth error:', error)
  }

  return response
}

// Apply middleware to all routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
