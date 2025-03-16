"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

type UserType = "business" | "shelter" | null

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  userType: UserType
  signUp: (
    email: string,
    password: string,
    userType: UserType,
    metadata?: any,
  ) => Promise<{
    error: any | null
    data: any | null
  }>
  signIn: (
    email: string,
    password: string,
    userType: UserType,
  ) => Promise<{
    error: any | null
    data: any | null
  }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to set cookies
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; samesite=lax; secure`
}

// Helper function to clear a cookie
const clearCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=lax; secure`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userType, setUserType] = useState<UserType>(null)
  const router = useRouter()
  // Add last fetch timestamp to control refresh frequency
  const [lastAuthCheck, setLastAuthCheck] = useState<number>(0)

  useEffect(() => {
    // Get session from storage - only if not recently fetched
    const getSession = async () => {
      // Skip fetching if we've checked auth in the last 5 minutes
      const now = Date.now();
      if (now - lastAuthCheck < 5 * 60 * 1000 && user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true)
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Error getting session:", error)
      }

      setSession(session)
      setUser(session?.user || null)
      setLastAuthCheck(now);

      // Store tokens in cookies if session exists
      if (session?.access_token && session?.refresh_token) {
        setCookie('sb-access-token', session.access_token)
        setCookie('sb-refresh-token', session.refresh_token)
      }

      // Get user type from metadata if available
      if (session?.user?.user_metadata?.user_type) {
        setUserType(session.user.user_metadata.user_type)
      }

      setIsLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user || null)
      setLastAuthCheck(Date.now());

      // Update cookies when session changes
      if (session?.access_token && session?.refresh_token) {
        setCookie('sb-access-token', session.access_token)
        setCookie('sb-refresh-token', session.refresh_token)
      } else {
        // Clear cookies on sign out
        clearCookie('sb-access-token')
        clearCookie('sb-refresh-token')
      }

      // Get user type from metadata if available
      if (session?.user?.user_metadata?.user_type) {
        setUserType(session.user.user_metadata.user_type)
      } else {
        setUserType(null)
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Update the signUp function to include user type
  const signUp = async (email: string, password: string, userType: UserType, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          user_type: userType,
        },
        // This bypasses the email verification requirement
        emailRedirectTo: undefined,
      },
    })

    if (data.user) {
      setUserType(userType)

      // Create a profile for the new user
      try {
        // Note: In a real app, you would use a server action here
        // For simplicity, we're doing it directly in the client
        await supabase.from("profiles").insert({
          user_id: data.user.id,
          user_type: userType,
          business_name: metadata?.business_name || null,
          shelter_name: metadata?.shelter_name || null,
          address: metadata?.address || null,
          phone: metadata?.phone || null,
          description: metadata?.description || null,
          contact_person: metadata?.contact_person || null,
        })
      } catch (profileError) {
        console.error("Error creating profile:", profileError)
      }
    }

    return { data, error }
  }

  const signIn = async (email: string, password: string, userType: UserType) => {
    try {
      // First authenticate with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error, data: null };
      }

      if (!data.user) {
        return { error: new Error("Authentication failed"), data: null };
      }

      // Now check if the user type matches what's in their profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", data.user.id)
        .single();

      if (profileError) {
        // Sign out since we authenticated but couldn't verify user type
        await supabase.auth.signOut();
        return { 
          error: new Error("Could not verify user type. Please try again."),
          data: null 
        };
      }

      // Compare the requested user type with the one in the database
      if (profileData.user_type !== userType) {
        // Sign out if the types don't match
        await supabase.auth.signOut();
        return { 
          error: new Error(`Access denied. This account is registered as a ${profileData.user_type}, not a ${userType}.`),
          data: null 
        };
      }

      // User type matches, proceed with login
      setUserType(userType);

      // Store tokens in cookies
      if (data.session?.access_token && data.session?.refresh_token) {
        setCookie('sb-access-token', data.session.access_token);
        setCookie('sb-refresh-token', data.session.refresh_token);
      }

      // Update user metadata with user_type if it doesn't exist
      if (!data.user.user_metadata?.user_type) {
        await supabase.auth.updateUser({
          data: { user_type: userType },
        });
      }

      return { data, error: null };
    } catch (err: any) {
      console.error("Sign in error:", err);
      return { 
        error: new Error(err.message || "An error occurred during sign in"),
        data: null 
      };
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    // Clear auth cookies
    clearCookie('sb-access-token')
    clearCookie('sb-refresh-token')
    setUserType(null)
    router.push("/login")
  }

  const value = {
    user,
    session,
    isLoading,
    userType,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

