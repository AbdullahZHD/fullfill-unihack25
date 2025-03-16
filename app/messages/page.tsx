"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, MessageSquare, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { getChatRooms } from "@/actions/chat-actions"
import { format } from "date-fns"

export default function MessagesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, userType } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [chatRooms, setChatRooms] = useState<any[]>([])
  const [error, setError] = useState("")

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push("/")
      } else {
        loadChatRooms()
      }
    }
  }, [user, authLoading, router])

  const loadChatRooms = async () => {
    setPageLoading(true)
    try {
      const { data, error } = await getChatRooms()
      if (error) {
        setError(error)
      } else {
        setChatRooms(data || [])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load chat rooms")
    } finally {
      setPageLoading(false)
    }
  }

  // Navigate to the appropriate dashboard based on user type
  const navigateToDashboard = () => {
    if (userType === "business") {
      router.push("/business-dashboard")
    } else if (userType === "shelter") {
      router.push("/shelter-dashboard")
    } else {
      router.push("/")
    }
  }

  // Show loading state
  if (authLoading || pageLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Button variant="outline" onClick={navigateToDashboard}>
              <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">Communicate with businesses and shelters</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {chatRooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <MessageSquare size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">No Messages Yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You don't have any active conversations. Start a conversation by requesting a food donation.
              </p>
              <Button className="bg-primary hover:bg-primary/90">
                <Link href="/listings">Browse Food Listings</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Conversations</CardTitle>
              <CardDescription>Chat with businesses and shelters about food donations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {chatRooms.map((room) => (
                  <Link key={room.id} href={`/messages/${room.id}`}>
                    <div className="flex items-center p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                      <div className="h-12 w-12 rounded-full bg-muted-foreground/20 flex items-center justify-center mr-4">
                        <MessageSquare size={20} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{room.food_listings.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {room.last_message || "No messages yet"}
                        </p>
                      </div>
                      {room.last_message_time && (
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(room.last_message_time), "MMM d, h:mm a")}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

