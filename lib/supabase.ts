import { createClient } from "@supabase/supabase-js"

// Use the provided Supabase URL and anon key
const supabaseUrl = "https://iqpmkmqpwainpqggjsuw.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcG1rbXFwd2FpbnBxZ2dqc3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjY2MDAsImV4cCI6MjA1NzU0MjYwMH0.hCNLCIwDS0sMVkesB3kKWU6uSaTRdfXOSc4YeFIuYtg"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

