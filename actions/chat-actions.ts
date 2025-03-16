"use server"

import { supabase } from "@/lib/supabase"
import { getAuthenticatedClient } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

// Create a chat room between a shelter and business for a specific listing
export async function createChatRoom(listingId: string) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to start a chat" }
    }

    // Get the business_id from the listing
    const { data: listing, error: listingError } = await supabase
      .from("food_listings")
      .select("business_id")
      .eq("id", listingId)
      .single()

    if (listingError) {
      return { error: listingError.message }
    }

    // Check if a chat room already exists
    const { data: existingRoom, error: existingRoomError } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("listing_id", listingId)
      .eq("shelter_id", session.user.id)
      .single()

    if (existingRoom) {
      return { data: existingRoom }
    }

    // Create a new chat room
    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({
        id: uuidv4(),
        listing_id: listingId,
        business_id: listing.business_id,
        shelter_id: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      return { error: error.message }
    }

    return { data: data[0] }
  } catch (error: any) {
    return { error: error.message || "Failed to create chat room" }
  }
}

// Get all chat rooms for the current user
export async function getChatRooms() {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to view chats" }
    }

    // Get user type from profiles
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("user_id", session.user.id).single()

    const userType = profile?.user_type

    // Get chat rooms based on user type
    let query = supabase.from("chat_rooms").select(`
        *,
        food_listings (
          id,
          title,
          image_url
        )
      `)

    if (userType === "business") {
      query = query.eq("business_id", session.user.id)
    } else if (userType === "shelter") {
      query = query.eq("shelter_id", session.user.id)
    }

    const { data, error } = await query.order("updated_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to get chat rooms" }
  }
}

// Get a specific chat room
export async function getChatRoom(chatRoomId: string) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to view a chat" }
    }

    // Get the chat room
    const { data, error } = await supabase
      .from("chat_rooms")
      .select(`
        *,
        food_listings (
          id,
          title,
          image_url,
          business_name,
          business_id
        )
      `)
      .eq("id", chatRoomId)
      .single()

    if (error) {
      return { error: error.message }
    }

    // Check if user is part of this chat room
    if (data.business_id !== session.user.id && data.shelter_id !== session.user.id) {
      return { error: "You do not have permission to view this chat" }
    }

    // Get the other user's profile
    const otherUserId = data.business_id === session.user.id ? data.shelter_id : data.business_id
    const { data: otherUserProfile } = await supabase.from("profiles").select("*").eq("user_id", otherUserId).single()

    return { data, otherUserProfile }
  } catch (error: any) {
    return { error: error.message || "Failed to get chat room" }
  }
}

// Get messages for a specific chat room
export async function getChatMessages(chatRoomId: string) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to view messages" }
    }

    // Get the chat room to verify access
    const { data: chatRoom, error: chatRoomError } = await supabase
      .from("chat_rooms")
      .select("business_id, shelter_id")
      .eq("id", chatRoomId)
      .single()

    if (chatRoomError) {
      return { error: chatRoomError.message }
    }

    // Check if user is part of this chat room
    if (chatRoom.business_id !== session.user.id && chatRoom.shelter_id !== session.user.id) {
      return { error: "You do not have permission to view these messages" }
    }

    // Get messages
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_room_id", chatRoomId)
      .order("created_at", { ascending: true })

    if (error) {
      return { error: error.message }
    }

    // Mark messages as read
    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("chat_room_id", chatRoomId)
      .neq("sender_id", session.user.id)
      .eq("is_read", false)

    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to get messages" }
  }
}

// Send a message in a chat room
export async function sendMessage(chatRoomId: string, message: string) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to send a message" }
    }

    // Get the chat room to verify access
    const { data: chatRoom, error: chatRoomError } = await supabase
      .from("chat_rooms")
      .select("business_id, shelter_id")
      .eq("id", chatRoomId)
      .single()

    if (chatRoomError) {
      return { error: chatRoomError.message }
    }

    // Check if user is part of this chat room
    if (chatRoom.business_id !== session.user.id && chatRoom.shelter_id !== session.user.id) {
      return { error: "You do not have permission to send messages in this chat" }
    }

    // Create a timestamp for the message
    const timestamp = new Date().toISOString()

    // Create a message object with a temporary ID
    const messageData = {
      id: crypto.randomUUID(), // Generate a temporary UUID
      chat_room_id: chatRoomId,
      sender_id: session.user.id,
      message,
      created_at: timestamp,
      is_read: false,
    }

    // Send the message
    const { data, error } = await supabase.from("chat_messages").insert(messageData).select()

    if (error) {
      return { error: error.message }
    }

    // Update the chat room's last message and time
    await supabase
      .from("chat_rooms")
      .update({
        last_message: message,
        last_message_time: timestamp,
        updated_at: timestamp,
      })
      .eq("id", chatRoomId)

    // Revalidate paths
    revalidatePath(`/messages/${chatRoomId}`)
    revalidatePath("/messages")

    return { data: data[0] || messageData }
  } catch (error: any) {
    return { error: error.message || "Failed to send message" }
  }
}

// Get unread message count for the current user
export async function getUnreadMessageCount() {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { count: 0 }
    }

    // Get user type from profiles
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("user_id", session.user.id).single()

    const userType = profile?.user_type

    // Get chat rooms based on user type
    let chatRoomsQuery = supabase.from("chat_rooms").select("id")

    if (userType === "business") {
      chatRoomsQuery = chatRoomsQuery.eq("business_id", session.user.id)
    } else if (userType === "shelter") {
      chatRoomsQuery = chatRoomsQuery.eq("shelter_id", session.user.id)
    }

    const { data: chatRooms, error: chatRoomsError } = await chatRoomsQuery

    if (chatRoomsError || !chatRooms || chatRooms.length === 0) {
      return { count: 0 }
    }

    const chatRoomIds = chatRooms.map((room) => room.id)

    // Count unread messages
    const { count, error } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .in("chat_room_id", chatRoomIds)
      .neq("sender_id", session.user.id)
      .eq("is_read", false)

    if (error) {
      return { count: 0 }
    }

    return { count }
  } catch (error: any) {
    return { count: 0 }
  }
}

