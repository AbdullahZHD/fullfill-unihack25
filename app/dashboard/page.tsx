"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"

// Loading component for suspense boundary
function LoadingFallback() {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, userType } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to login page if not authenticated
        router.push("/login")
      } else if (userType === "business") {
        // Redirect to business dashboard if business
        router.push("/business-dashboard")
      } else if (userType === "shelter") {
        // Redirect to shelter dashboard if shelter
        router.push("/shelter-dashboard")
      }
    }
  }, [user, isLoading, router, userType])

  // Show loading state while checking auth
  if (isLoading) {
    return <LoadingFallback />
  }

  // This should never render as we redirect in the useEffect
  return <Suspense fallback={<LoadingFallback />}></Suspense>
}

