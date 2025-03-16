"use server"

import { supabase } from "@/lib/supabase"
import { getAuthenticatedClient } from "@/lib/auth-helpers"

// Function to create a profile for a new user
export async function createProfile(userId: string, userType: "business" | "shelter", metadata: any) {
  try {
    const profileData = {
      user_id: userId,
      user_type: userType,
      business_name: metadata.business_name || null,
      shelter_name: metadata.shelter_name || null,
      address: metadata.address || null,
      phone: metadata.phone || null,
      description: metadata.description || null,
      contact_person: metadata.contact_person || null,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("profiles").insert(profileData).select()

    if (error) {
      console.error("Error creating profile:", error)
      return { error: error.message }
    }

    return { data }
  } catch (error: any) {
    console.error("Error in createProfile:", error)
    return { error: error.message || "Failed to create profile" }
  }
}

// Function to check if tables exist and create them if they don't
export async function checkAndCreateTables() {
  try {
    // Get authenticated client for admin functions
    const { supabase, session } = await getAuthenticatedClient()
    
    // Check if food_listings table exists
    const { data: foodListingsExists, error: foodListingsError } = await supabase
      .from("food_listings")
      .select("id")
      .limit(1)

    // Check if profiles table exists
    const { data: profilesExists, error: profilesError } = await supabase.from("profiles").select("id").limit(1)

    // If both tables exist, we're good
    if (foodListingsExists && profilesExists) {
      return { success: true, message: "Tables already exist" }
    }

    // If tables don't exist, we need to create them
    // Note: This would typically be done through the Supabase SQL editor
    // For this example, we'll just return an error message

    return {
      success: false,
      message: "Database tables don't exist. Please run the SQL script in the Supabase SQL Editor.",
    }
  } catch (error: any) {
    console.error("Error checking tables:", error)
    return { error: error.message || "Failed to check tables" }
  }
}

