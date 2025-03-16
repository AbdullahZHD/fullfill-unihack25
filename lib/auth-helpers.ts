// Authentication helper functions for server components and actions
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

// Helper function to get the authenticated Supabase client in server actions
export async function getAuthenticatedClient() {
  // Supabase credentials (matching the ones in supabase.ts)
  const supabaseUrl = "https://iqpmkmqpwainpqggjsuw.supabase.co"
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcG1rbXFwd2FpbnBxZ2dqc3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjY2MDAsImV4cCI6MjA1NzU0MjYwMH0.hCNLCIwDS0sMVkesB3kKWU6uSaTRdfXOSc4YeFIuYtg"
  
  // Create a fresh Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })
  
  // Get auth token from cookies
  const cookieStore = cookies()
  const supabaseAccessToken = cookieStore.get('sb-access-token')?.value
  const supabaseRefreshToken = cookieStore.get('sb-refresh-token')?.value
  
  // If we have a token, set it on the client
  if (supabaseAccessToken && supabaseRefreshToken) {
    await supabase.auth.setSession({
      access_token: supabaseAccessToken,
      refresh_token: supabaseRefreshToken
    })
  }
  
  // Get the current user session
  const { data: { session } } = await supabase.auth.getSession()
  
  return { supabase, session }
} 