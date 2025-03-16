"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { sendMessage } from "@/actions/chat-actions"

type ChatInputProps = {
  chatRoomId: string
  onMessageSent?: (message?: any) => void
}

export function ChatInput({ chatRoomId, onMessageSent }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update the handleSubmit function to immediately update the UI
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return

    setIsSubmitting(true)

    // Create a temporary message object with current timestamp
    const tempMessage = {
      id: `temp-${Date.now()}`,
      chat_room_id: chatRoomId,
      sender_id: "current-user", // Will be replaced with actual user ID
      message: message.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
    }

    // Immediately notify parent component about the new message
    if (onMessageSent) {
      onMessageSent(tempMessage)
    }

    // Clear input field right away for better UX
    const messageCopy = message.trim()
    setMessage("")

    try {
      // Send the message to the server
      await sendMessage(chatRoomId, messageCopy)
      // Note: We don't need to update UI here as it's already updated
    } catch (error) {
      console.error("Failed to send message:", error)
      // Could add error handling here to notify user
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-background">
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[60px] resize-none"
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          size="icon"
          className="h-[60px] bg-primary hover:bg-primary/90"
          disabled={isSubmitting || !message.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}

