"use client"

import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

type ChatMessageProps = {
  message: {
    id: string
    sender_id: string
    message: string
    created_at: string
    is_read: boolean
  }
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuth()
  const isOwnMessage = message.sender_id === user?.id

  // Format the timestamp
  const timestamp = new Date(message.created_at)
  const formattedTime = format(timestamp, "h:mm a")

  return (
    <div className={cn("flex mb-4", isOwnMessage ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <p className="text-sm">{message.message}</p>
        <div className={cn("text-xs mt-1", isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {formattedTime}
          {isOwnMessage && <span className="ml-2">{message.is_read ? "Read" : "Delivered"}</span>}
        </div>
      </div>
    </div>
  )
}

