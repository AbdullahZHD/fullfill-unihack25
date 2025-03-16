"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogIn, Moon, Sun, LogOut, Building2, Utensils, Package, LayoutDashboard } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/context/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUnreadMessageCount } from "@/actions/chat-actions"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const { user, signOut, isLoading, userType } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        const { count } = await getUnreadMessageCount()
        setUnreadCount(count || 0)
      }

      fetchUnreadCount()

      // Set up interval to check for new messages
      const interval = setInterval(fetchUnreadCount, 30000) // Check every 30 seconds

      return () => clearInterval(interval)
    }
  }, [user])

  // Determine if user is a business or shelter
  const isBusiness = userType === "business"
  const isShelter = userType === "shelter"

  // Ensure the toggle works on the first click using the resolvedTheme directly
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href={user ? (userType === "business" ? "/business-dashboard" : "/shelter-dashboard") : "/"}
              className="flex items-center"
            >
              <img 
                src="/logo.png" 
                alt="FoodShare Logo" 
                className="h-10 w-auto" 
                style={{ display: 'block' }} // Ensures no extra space around the SVG
              />
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {!isLoading && user && (
              <Link href="/dashboard" className="text-foreground/80 hover:text-primary transition-colors">
                Dashboard
              </Link>
            )}
            {!isLoading && user && (
              <Link href="/messages" className="text-foreground/80 hover:text-primary transition-colors relative">
                Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            {isShelter && (
              <Link href="/listings" className="text-foreground/80 hover:text-primary transition-colors">
                Find Food
              </Link>
            )}
            {isBusiness && (
              <>
                <Link href="/my-listings" className="text-foreground/80 hover:text-primary transition-colors">
                  My Listings
                </Link>
              </>
            )}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
            )}

            {!isLoading && !user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                      <LogIn size={16} className="mr-2" /> Login
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/business/login" className="flex items-center">
                        <Utensils size={16} className="mr-2" /> Business Login
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/shelter/login" className="flex items-center">
                        <Building2 size={16} className="mr-2" /> Shelter Login
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <User size={16} className="mr-2" /> Register
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/business/signup" className="flex items-center">
                        <Utensils size={16} className="mr-2" /> Register Business
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/shelter/signup" className="flex items-center">
                        <Building2 size={16} className="mr-2" /> Register Shelter
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : !isLoading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    {isBusiness ? <Utensils size={16} className="mr-2" /> : <Building2 size={16} className="mr-2" />}
                    {user.email?.split("@")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{isBusiness ? "Business Account" : "Shelter Account"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard size={16} className="mr-2" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {isBusiness ? (
                    <DropdownMenuItem asChild>
                      <Link href="/my-listings" className="flex items-center">
                        <Package size={16} className="mr-2" /> My Listings
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/listings" className="flex items-center">
                        <Package size={16} className="mr-2" /> Find Food
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-500 focus:text-red-500">
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground/80 hover:text-primary hover:bg-muted focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {!isLoading && user && (
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {!isLoading && user && (
              <Link
                href="/messages"
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted relative"
                onClick={() => setIsMenuOpen(false)}
              >
                Messages
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            {isShelter && (
              <Link
                href="/listings"
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Food
              </Link>
            )}
            {isBusiness && (
              <>
                <Link
                  href="/my-listings"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Listings
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            {!isLoading && !user ? (
              <div className="mt-3 px-2 space-y-1">
                <div className="px-3 py-2 font-medium text-foreground">Login</div>
                <Link
                  href="/business/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Utensils size={16} className="inline mr-2" /> Business Login
                </Link>
                <Link
                  href="/shelter/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Building2 size={16} className="inline mr-2" /> Shelter Login
                </Link>
                <div className="px-3 py-2 font-medium text-foreground mt-4">Register</div>
                <Link
                  href="/business/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Utensils size={16} className="inline mr-2" /> Register Business
                </Link>
                <Link
                  href="/shelter/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Building2 size={16} className="inline mr-2" /> Register Shelter
                </Link>
              </div>
            ) : !isLoading && user ? (
              <div>
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    {isBusiness ? (
                      <Utensils size={24} className="text-foreground/60" />
                    ) : (
                      <Building2 size={24} className="text-foreground/60" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-foreground">{user.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {isBusiness ? "Business Account" : "Shelter Account"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} className="inline mr-2" /> Dashboard
                  </Link>
                  {isBusiness ? (
                    <Link
                      href="/my-listings"
                      className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Listings
                    </Link>
                  ) : (
                    <Link
                      href="/listings"
                      className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-muted"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Find Food
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:text-red-700 hover:bg-muted"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  )
}

