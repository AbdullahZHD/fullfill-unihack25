"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Clock, Filter, ChevronDown, User, Loader2, List, MapIcon } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { getAllListings } from "@/actions/listing-actions"
import { getShelterRequests } from "@/actions/request-actions"
import { Badge } from "@/components/ui/badge"
import MapView from "@/components/map-view"

export default function ListingsPage() {
  const router = useRouter()
  const { user, isLoading, userType } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [listings, setListings] = useState<any[]>([])
  const [requestedListingIds, setRequestedListingIds] = useState<string[]>([])
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [foodType, setFoodType] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const lastLoadedRef = useRef<number>(0)
  const isVisibleRef = useRef<boolean>(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/shelter/login")
      } else if (userType !== "shelter") {
        router.push("/")
      } else {
        const now = Date.now();
        if (now - lastLoadedRef.current > 30000 || listings.length === 0) {
          loadData();
          lastLoadedRef.current = now;
        } else {
          setPageLoading(false);
        }
      }
    }
  }, [user, isLoading, router, userType])

  const loadData = async () => {
    if (!isVisibleRef.current) {
      setPageLoading(false);
      return;
    }
    
    setPageLoading(true)
    try {
      // Load listings first, which is more critical
      const listingsResult = await getAllListings();
      
      if (listingsResult.error) {
        setError(listingsResult.error)
      } else {
        setListings(listingsResult.data || [])
      }
      
      // Then try to load requests, with better error handling
      try {
        const requestsResult = await getShelterRequests();
        
        if (requestsResult.error) {
          console.error("Error loading requests:", requestsResult.error)
          // Don't set the main error - just log it
        } else if (requestsResult.data) {
          const requestedIds = requestsResult.data.map((request: any) => request.listing_id)
          setRequestedListingIds(requestedIds)
        }
      } catch (requestErr: any) {
        // Log the error but don't prevent the page from loading
        console.error("Error fetching requests:", requestErr.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load listings")
    } finally {
      setPageLoading(false)
    }
  }

  const handleManualRefresh = () => {
    lastLoadedRef.current = 0;
    loadData();
  }

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      searchTerm === "" ||
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.business_name && listing.business_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFoodType = foodType === "" || listing.food_type === foodType

    return matchesSearch && matchesFoodType
  })

  const isListingRequested = (listingId: string) => {
    return requestedListingIds.includes(listingId)
  }

  const toggleView = () => {
    setViewMode(viewMode === "list" ? "map" : "list")
  }

  if (isLoading || pageLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Available Food Donations</h1>
            <p className="text-muted-foreground mt-1">Find and claim surplus food for your shelter</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleManualRefresh}
              disabled={pageLoading}
              title="Refresh"
              className="bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${pageLoading ? "animate-spin" : ""}`}
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleView}
              className="bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
            >
              {viewMode === "list" ? <MapIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Search by food type, location, etc."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Food Type</label>
              <div className="relative">
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={foodType}
                  onChange={(e) => setFoodType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="prepared">Prepared Meals</option>
                  <option value="produce">Fresh Produce</option>
                  <option value="bakery">Bakery Items</option>
                  <option value="canned">Canned Goods</option>
                  <option value="dairy">Dairy Products</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-muted-foreground" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Pickup Time</label>
              <div className="relative">
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="">Any Time</option>
                  <option value="morning">Morning (6AM-12PM)</option>
                  <option value="afternoon">Afternoon (12PM-5PM)</option>
                  <option value="evening">Evening (5PM-9PM)</option>
                  <option value="night">Night (9PM-6AM)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <p className="text-muted-foreground">Showing {filteredListings.length} results</p>
          <div className="flex items-center">
            <span className="mr-2 text-sm text-muted-foreground">Sort by:</span>
            <select className="text-sm rounded-md border border-input bg-background px-3 py-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option>Newest</option>
              <option>Expiring Soon</option>
              <option>Quantity</option>
            </select>
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings found. Try adjusting your filters.</p>
          </div>
        ) : viewMode === "map" ? (
          <MapView listings={filteredListings} requestedListingIds={requestedListingIds} onToggleView={toggleView} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-card rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg"
              >
                <div className="relative h-48">
                  <img
                    src={listing.image_url || `/placeholder.svg?height=300&width=400`}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  {new Date(listing.expiration_date) <= new Date(new Date().getTime() + 24 * 60 * 60 * 1000) && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      Expiring Soon
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-foreground">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {listing.business_name || "Anonymous Business"}
                      </p>
                    </div>
                    <Badge
                      className={
                        isListingRequested(listing.id) ? "bg-blue-500 text-white" : "bg-primary/10 text-primary"
                      }
                    >
                      {isListingRequested(listing.id) ? "Requested" : "Available"}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin size={16} className="mr-1" />
                      <span>{listing.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock size={16} className="mr-1" />
                      <span>Pickup by {listing.pickup_by_time}</span>
                    </div>
                    {listing.serves && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User size={16} className="mr-1" />
                        <span>Serves {listing.serves}</span>
                      </div>
                    )}
                  </div>
                  <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                    <Link href={`/listings/${listing.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

