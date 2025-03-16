"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Utensils, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"

// Instead of dynamic import, we'll create a custom client component
export default function Home() {
  const { user, userType, isLoading } = useAuth()
  const router = useRouter()
  const [isSplineLoaded, setIsSplineLoaded] = useState(false)
  const [splineComponent, setSplineComponent] = useState<React.ComponentType<any> | null>(null)
  const splineInstanceRef = useRef<any>(null)

  // Load Spline component only on client side
  useEffect(() => {
    // Import on client-side only
    import('@splinetool/react-spline').then((module) => {
      setSplineComponent(() => module.default)
    })
  }, [])

  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (!isLoading && user) {
      if (userType === "business") {
        router.push("/business-dashboard")
      } else if (userType === "shelter") {
        router.push("/shelter-dashboard")
      }
    }
  }, [user, userType, isLoading, router])
  
  const handleSplineLoad = (spline: any) => {
    setIsSplineLoaded(true)
    splineInstanceRef.current = spline;
    
    // Try to set camera position if the API allows
    if (spline && spline.setZoom) {
      try {
        // Revert to previous zoom level
        spline.setZoom(0.7); // Previous zoom level
      } catch (e) {
        console.log("Could not set zoom", e);
      }
    }
  }

  // If still loading or user is authenticated, show minimal content (will be redirected)
  if (isLoading || user) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to dashboard...</p>
    </div>
  }

  // Original landing page content for non-authenticated users
  return (
    <div className="min-h-screen relative">
      {/* Spline background with overlay - fixed position */}
      <div className="fixed inset-0 w-full h-full z-0 scale-[1.15] origin-center">
        {splineComponent && React.createElement(splineComponent, {
          scene: "https://prod.spline.design/6DJTXl9tSYx3LK1i/scene.splinecode",
          onLoad: handleSplineLoad,
          className: "w-full h-full"
        })}
        {/* Slightly lighter gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black/85 transition-opacity duration-1000"></div>
      </div>

      {/* Content - scrollable container */}
      <div className="relative z-10 min-h-screen">
        {/* Hero Section */}
        <section className="py-8 px-4 sm:py-10 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5 drop-shadow-md">
              Share Food, <span className="text-primary">Reduce Waste</span>
            </h1>
            <p className="text-xl text-white max-w-2xl mx-auto mb-8 drop-shadow-sm">
              Connecting surplus food from businesses with food shelters that need it most
            </p>

            {/* Clear User Path Selection */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="border border-white/20 hover:border-primary hover:shadow-lg transition-all bg-white/10 dark:bg-black/30 backdrop-blur-xl shadow-xl rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl text-white">I'm a Food Shelter</CardTitle>
                  <CardDescription className="text-white">Find and claim available food donations in your area</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-xl">
                    <Building2 size={40} className="text-primary" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center pb-4">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    <Link href="/shelter/signup" className="flex items-center gap-2">
                      Register Shelter <ArrowRight size={18} />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border border-white/20 hover:border-primary hover:shadow-lg transition-all bg-white/10 dark:bg-black/30 backdrop-blur-xl shadow-xl rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl text-white">I'm a Business</CardTitle>
                  <CardDescription className="text-white">Share your surplus food with registered food shelters</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-xl">
                    <Utensils size={40} className="text-primary" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center pb-4">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    <Link href="/business/signup" className="flex items-center gap-2">
                      Register Business <ArrowRight size={18} />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works section */}
        <section className="py-6 px-4 sm:py-8 sm:px-6 lg:px-8 mt-auto mb-16 md:mb-24 bg-transparent backdrop-blur-lg border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-bold text-white drop-shadow-sm">How It Works</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-2">
              <div className="border border-white/20 bg-white/10 dark:bg-black/30 backdrop-blur-xl rounded-xl p-4 sm:p-6 text-center shadow-lg">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Businesses Share Food</h3>
                <p className="text-sm sm:text-base text-white">
                  Restaurants and cafeterias list their surplus food with details about quantity and pickup time.
                </p>
              </div>

              <div className="border border-white/20 bg-white/10 dark:bg-black/30 backdrop-blur-xl rounded-xl p-4 sm:p-6 text-center shadow-lg">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Food Shelters Claim</h3>
                <p className="text-sm sm:text-base text-white">
                  Registered food shelters browse available donations and claim what they need for their communities.
                </p>
              </div>

              <div className="border border-white/20 bg-white/10 dark:bg-black/30 backdrop-blur-xl rounded-xl p-4 sm:p-6 text-center shadow-lg">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Easy Coordination</h3>
                <p className="text-sm sm:text-base text-white">
                  Shelters coordinate pickup details directly with food providers to efficiently distribute resources.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

