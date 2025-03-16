"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Loader2, Building2, User } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getChatRoom, getChatMessages } from "@/actions/chat-actions"
import { ChatMessage } from "@/components/chat/chat-message"
import { ChatInput } from "@/components/chat/chat-input"
import { supabase } from "@/lib/supabase"

export default function ChatRoomPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading: authLoading, userType } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [chatRoom, setChatRoom] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatRoomId = params.id as string

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push("/")
      } else {
        loadChatRoom()
      }
    }
  }, [user, authLoading, router, chatRoomId])

  const loadChatRoom = async () => {
    setPageLoading(true)
    try {
      // Load chat room data
      const { data, error: roomError, otherUserProfile } = await getChatRoom(chatRoomId)

      if (roomError) {
        setError(roomError)
      } else {
        setChatRoom(data)
        setOtherUser(otherUserProfile)

        // Load messages
        const { data: messagesData, error: messagesError } = await getChatMessages(chatRoomId)

        if (messagesError) {
          setError(messagesError)
        } else {
          setMessages(messagesData || [])
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load chat")
    } finally {
      setPageLoading(false)
    }
  }

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!chatRoomId || !user) return

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat_room_${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          // Add the new message to the state if it doesn't already exist
          const newMessage = payload.new as any

          // Check if this message is already in our state (to avoid duplicates)
          setMessages((prev) => {
            // Check if we already have this message (by ID or content)
            const messageExists = prev.some(
              (msg) =>
                msg.id === newMessage.id ||
                (msg.sender_id === newMessage.sender_id &&
                  msg.message === newMessage.message &&
                  Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000),
            )

            if (messageExists) {
              return prev
            }

            return [...prev, newMessage]
          })

          // Mark message as read if it's not from the current user
          if (newMessage.sender_id !== user.id) {
            supabase.from("chat_messages").update({ is_read: true }).eq("id", newMessage.id).then()
          }

          // Scroll to bottom when new message arrives
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
          }, 50)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [chatRoomId, user])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Show loading state
  if (authLoading || pageLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !chatRoom) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Chat room not found"}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => router.push("/messages")}>
            <ArrowLeft size={16} className="mr-2" /> Back to Messages
          </Button>
        </div>
      </div>
    )
  }

  const otherUserName =
    userType === "business"
      ? otherUser?.shelter_name || "Food Shelter"
      : otherUser?.business_name || chatRoom.food_listings.business_name || "Business"

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push("/messages")}>
            <ArrowLeft size={16} className="mr-2" /> Back to Messages
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-muted-foreground/20 flex items-center justify-center mr-3">
                {userType === "business" ? (
                  <Building2 size={20} className="text-muted-foreground" />
                ) : (
                  <User size={20} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{otherUserName}</h2>
                <p className="text-sm text-muted-foreground">Re: {chatRoom.food_listings.title}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <ChatInput
              chatRoomId={chatRoomId}
              onMessageSent={(newMessage) => {
                if (newMessage && user) {
                  // Create a properly formatted message object
                  const formattedMessage = {
                    ...newMessage,
                    sender_id: user.id, // Use the actual user ID
                  }

                  // Add the new message to the local state immediately
                  setMessages((prev) => [...prev, formattedMessage])

                  // Scroll to bottom
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
                  }, 50)
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

