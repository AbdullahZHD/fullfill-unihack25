"use server"

import { supabase } from "@/lib/supabase"
import { getAuthenticatedClient } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

// Type for the request form data
export type RequestFormData = {
  message: string
  pickupTime?: string
  pickupNotes?: string
}

// Import the cache functions from listing-actions
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

// Clear cache after creating, accepting, or rejecting requests
function clearRequestCache(userId: string, listingId?: string) {
  delete cache[`shelter_requests_${userId}`];
  delete cache[`business_requests_${userId}`];
  if (listingId) {
    delete cache[`listing_requests_${listingId}`];
  }
}

// Create a new request
export async function createRequest(listingId: string, formData: RequestFormData) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to request food" }
    }

    // Get the shelter name from the profile
    const { data: profileData } = await supabase.from("profiles").select("shelter_name").eq("user_id", session.user.id).single()

    // Create the request
    const { data, error } = await supabase
      .from("food_requests")
      .insert({
        id: uuidv4(),
        listing_id: listingId,
        shelter_id: session.user.id,
        shelter_name: profileData?.shelter_name || null,
        status: "pending",
        message: formData.message,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pickup_time: formData.pickupTime || null,
        pickup_notes: formData.pickupNotes || null,
      })
      .select()

    if (error) {
      return { error: error.message }
    }

    // Revalidate the listings page
    revalidatePath("/listings")
    revalidatePath(`/listings/${listingId}`)
    revalidatePath("/dashboard")

    // Clear cache for the business and shelter
    clearRequestCache(session.user.id, listingId)

    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to create request" }
  }
}

// Get requests for a specific listing
export async function getRequestsForListing(listingId: string) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to view requests" }
    }

    // Check cache first
    const cacheKey = `listing_requests_${listingId}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return { data: cachedData };
    }

    // Get the listing to check ownership
    const { data: listing } = await supabase.from("food_listings").select("business_id").eq("id", listingId).single()

    if (!listing) {
      return { error: "Listing not found" }
    }

    if (listing.business_id !== session.user.id) {
      return { error: "You do not have permission to view these requests" }
    }

    // Get the requests
    const { data, error } = await supabase
      .from("food_requests")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    // Cache the result
    setCachedData(cacheKey, data, 5000); // 5 seconds cache
    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to fetch requests" }
  }
}

// Get all requests for a business's listings
export async function getBusinessRequests() {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to view requests" }
    }

    // Check cache first
    const cacheKey = `business_requests_${session.user.id}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return { data: cachedData };
    }

    // Get all listings for this business
    const { data: listings } = await supabase.from("food_listings").select("id").eq("business_id", session.user.id)

    if (!listings || listings.length === 0) {
      return { data: [] }
    }

    const listingIds = listings.map((listing) => listing.id)

    // Get all requests for these listings
    const { data, error } = await supabase
      .from("food_requests")
      .select(`
        *,
        food_listings (
          id,
          title,
          food_type,
          status
        )
      `)
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    // Cache the result
    setCachedData(cacheKey, data, 5000); // 5 seconds cache
    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to fetch requests" }
  }
}

// Get all requests for a shelter
export async function getShelterRequests() {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to view your requests" }
    }

    // Check cache first
    const cacheKey = `shelter_requests_${session.user.id}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return { data: cachedData };
    }

    // Get the requests
    const { data, error } = await supabase
      .from("food_requests")
      .select(`
        *,
        food_listings (
          id,
          title,
          food_type,
          status,
          business_name,
          location,
          expiration_date,
          pickup_by_time,
          quantity,
          quantity_unit
        )
      `)
      .eq("shelter_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    // Cache the result
    setCachedData(cacheKey, data, 5000); // 5 seconds cache
    return { data }
  } catch (error: any) {
    return { error: error.message || "Failed to fetch requests" }
  }
}

// Accept a request
export async function acceptRequest(requestId: string, pickupDetails?: { time?: string; notes?: string }) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to accept requests" }
    }

    // Get the request with food listing info
    const { data: requestData, error: requestDataError } = await supabase
      .from("food_requests")
      .select("listing_id")
      .eq("id", requestId)
      .single()

    if (requestDataError || !requestData) {
      return { error: "Request not found" }
    }

    // Now get the listing to check ownership
    const { data: listing, error: listingError } = await supabase
      .from("food_listings")
      .select("business_id")
      .eq("id", requestData.listing_id)
      .single()

    if (listingError || !listing) {
      return { error: "Listing not found" }
    }

    // Check if user owns the listing
    if (listing.business_id !== session.user.id) {
      return { error: "You do not have permission to accept this request" }
    }

    // Start a transaction
    // 1. Update the request status to accepted
    const { error: requestError } = await supabase
      .from("food_requests")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
        pickup_time: pickupDetails?.time || null,
        pickup_notes: pickupDetails?.notes || null,
      })
      .eq("id", requestId)

    if (requestError) {
      return { error: requestError.message }
    }

    // 2. Update the listing status to claimed
    const { error: listingError2 } = await supabase
      .from("food_listings")
      .update({
        status: "claimed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestData.listing_id)

    if (listingError2) {
      return { error: listingError2.message }
    }

    // 3. Reject all other requests for this listing
    const { error: rejectError } = await supabase
      .from("food_requests")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("listing_id", requestData.listing_id)
      .neq("id", requestId)

    if (rejectError) {
      return { error: rejectError.message }
    }

    // Revalidate the relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/my-listings")
    revalidatePath(`/my-listings/${requestData.listing_id}`)

    // Clear cache for the business and shelter
    clearRequestCache(session.user.id, requestData.listing_id)

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to accept request" }
  }
}

// Reject a request
export async function rejectRequest(requestId: string) {
  try {
    // Get the authenticated client
    const { supabase, session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { error: "You must be logged in to reject requests" }
    }

    // Get the request with food listing info
    const { data: requestData, error: requestDataError } = await supabase
      .from("food_requests")
      .select("listing_id")
      .eq("id", requestId)
      .single()

    if (requestDataError || !requestData) {
      return { error: "Request not found" }
    }

    // Now get the listing to check ownership
    const { data: listing, error: listingError } = await supabase
      .from("food_listings")
      .select("business_id")
      .eq("id", requestData.listing_id)
      .single()

    if (listingError || !listing) {
      return { error: "Listing not found" }
    }

    // Check if user owns the listing
    if (listing.business_id !== session.user.id) {
      return { error: "You do not have permission to reject this request" }
    }

    // Update the request status to rejected
    const { error } = await supabase
      .from("food_requests")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (error) {
      return { error: error.message }
    }

    // Revalidate the relevant paths
    revalidatePath("/dashboard")
    revalidatePath("/my-listings")

    // Clear cache for the business and shelter
    clearRequestCache(session.user.id, requestData.listing_id)

    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to reject request" }
  }
}

