"use server"

import { supabase } from "@/lib/supabase"
import { getAuthenticatedClient } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

// Type for the listing form data
export type ListingFormData = {
  title: string
  description: string
  foodType: string
  quantity: number
  quantityUnit: string
  expirationDate: string
  pickupByTime: string
  location: string
  serves: string
  imageUrl?: string
}

// Add cache management
type CacheEntry = {
  data: any;
  timestamp: number;
  expiry: number;
}

// Simple in-memory cache with a 60 second expiry by default
const cache: Record<string, CacheEntry> = {};

function getCachedData(key: string): any | null {
  const entry = cache[key];
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.expiry) {
    // Cache expired
    delete cache[key];
    return null;
  }
  
  return entry.data;
}

function setCachedData(key: string, data: any, expiryMs: number = 60000) {
  const now = Date.now();
  cache[key] = {
    data,
    timestamp: now,
    expiry: now + expiryMs
  };
}

// Create a new listing
export async function createListing(formData: ListingFormData) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to create a listing" }
    }

    // Get the business name from the profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("user_id", session.user.id)
      .single()

    // Create the listing
    const { data, error } = await supabase
      .from("food_listings")
      .insert({
        id: uuidv4(),
        title: formData.title,
        description: formData.description,
        food_type: formData.foodType,
        quantity: formData.quantity,
        quantity_unit: formData.quantityUnit,
        expiration_date: formData.expirationDate,
        pickup_by_time: formData.pickupByTime,
        location: formData.location,
        business_id: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "available",
        image_url: formData.imageUrl || null,
        serves: formData.serves || null,
        business_name: profileData?.business_name || null,
      })
      .select()

    if (error) {
      return { error: error.message }
    }

    // Revalidate the listings page
    revalidatePath("/listings")
    revalidatePath("/my-listings")
    
    // Clear caches
    delete cache['all_listings'];
    if (session?.user) {
      delete cache[`business_listings_${session.user.id}`];
    }

    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to create listing" }
  }
}

// Get all listings
export async function getAllListings() {
  try {
    // Check cache first (5 second expiry for listings to keep them fresh)
    const cacheKey = 'all_listings';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return { data: cachedData };
    }

    const { data, error } = await supabase
      .from("food_listings")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    // Cache the result
    setCachedData(cacheKey, data, 5000); // 5 seconds cache for listings
    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to fetch listings" }
  }
}

// Get listings for a specific business
export async function getBusinessListings() {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to view your listings" }
    }

    // Check cache first
    const cacheKey = `business_listings_${session.user.id}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return { data: cachedData };
    }

    const { data, error } = await supabase
      .from("food_listings")
      .select("*")
      .eq("business_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    // Cache the result (longer cache for own listings)
    setCachedData(cacheKey, data, 10000); // 10 seconds cache
    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to fetch listings" }
  }
}

// Get a specific listing
export async function getListing(id: string) {
  try {
    // Check cache first
    const cacheKey = `listing_${id}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return { data: cachedData };
    }

    const { data, error } = await supabase.from("food_listings").select("*").eq("id", id).single()

    if (error) {
      return { error: error.message }
    }

    // Cache the result
    setCachedData(cacheKey, data, 10000); // 10 seconds cache
    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to fetch listing" }
  }
}

// Update a listing
export async function updateListing(id: string, formData: Partial<ListingFormData>) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to update a listing" }
    }

    // Check if the user owns this listing
    const { data: listing } = await supabase.from("food_listings").select("business_id").eq("id", id).single()

    if (!listing) {
      return { error: "Listing not found" }
    }

    if (listing.business_id !== session.user.id) {
      return { error: "You do not have permission to update this listing" }
    }

    // Update the listing
    const { data, error } = await supabase
      .from("food_listings")
      .update({
        title: formData.title,
        description: formData.description,
        food_type: formData.foodType,
        quantity: formData.quantity,
        quantity_unit: formData.quantityUnit,
        expiration_date: formData.expirationDate,
        pickup_by_time: formData.pickupByTime,
        location: formData.location,
        updated_at: new Date().toISOString(),
        serves: formData.serves,
        image_url: formData.imageUrl,
      })
      .eq("id", id)
      .select()

    if (error) {
      return { error: error.message }
    }

    // Revalidate the listings page
    revalidatePath("/listings")
    revalidatePath("/my-listings")
    revalidatePath(`/listings/${id}`)

    // Clear caches
    delete cache['all_listings'];
    if (session?.user) {
      delete cache[`business_listings_${session.user.id}`];
    }

    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to update listing" }
  }
}

// Delete a listing
export async function deleteListing(id: string) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to delete a listing" }
    }

    // Check if the user owns this listing
    const { data: listing } = await supabase.from("food_listings").select("business_id").eq("id", id).single()

    if (!listing) {
      return { error: "Listing not found" }
    }

    if (listing.business_id !== session.user.id) {
      return { error: "You do not have permission to delete this listing" }
    }

    // Delete the listing
    const { error } = await supabase.from("food_listings").delete().eq("id", id)

    if (error) {
      return { error: error.message }
    }

    // Revalidate the listings page
    revalidatePath("/listings")
    revalidatePath("/my-listings")

    // Clear caches
    delete cache['all_listings'];
    if (session?.user) {
      delete cache[`business_listings_${session.user.id}`];
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to delete listing" }
  }
}

// Mark a listing as claimed
export async function claimListing(id: string) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to claim a listing" }
    }

    // Update the listing status
    const { data, error } = await supabase
      .from("food_listings")
      .update({
        status: "claimed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      return { error: error.message }
    }

    // Revalidate the listings page
    revalidatePath("/listings")
    revalidatePath("/my-listings")
    revalidatePath(`/listings/${id}`)

    // Clear caches
    delete cache['all_listings'];
    if (session?.user) {
      delete cache[`business_listings_${session.user.id}`];
    }

    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to claim listing" }
  }
}

