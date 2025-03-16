"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  MapPin,
  List,
  Coffee,
  ShoppingBag,
  Utensils,
  Layers,
  Locate,
  ZoomIn,
  ZoomOut,
  X,
  Loader2,
  MessageSquare,
  Clock,
  User,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createChatRoom } from "@/actions/chat-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { createRequest } from "@/actions/request-actions"

type MapViewProps = {
  listings: any[]
  requestedListingIds: string[]
  onToggleView: () => void
}

// Mapbox access token from the provided key
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiYWJkdWxsYWh6aGQiLCJhIjoiY204N2gwbGEyMGZzaTJucHo4d2Jlemc3diJ9.tYSNE4VWGPmRvnjEw8ZARA"

// Optimize Mapbox script loading with a cached flag
let mapboxScriptLoaded = false;

export default function MapView({ listings, requestedListingIds, onToggleView }: MapViewProps) {
  const router = useRouter()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)

  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapboxLoaded, setMapboxLoaded] = useState(false)
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite">("streets")
  const [activePopup, setActivePopup] = useState<any>(null)
  const [isLocatingUser, setIsLocatingUser] = useState(false)
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [showDetailCard, setShowDetailCard] = useState(false)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [requestFormData, setRequestFormData] = useState({
    message: "",
    pickupTime: "",
    pickupNotes: "",
  })

  const isMobile = useMobile()

  // Function to get icon based on food type
  const getFoodIcon = (type: string) => {
    switch (type) {
      case "prepared":
        return <Utensils className="h-4 w-4" />
      case "bakery":
        return <Coffee className="h-4 w-4" />
      default:
        return <ShoppingBag className="h-4 w-4" />
    }
  }

  // Check if a listing has been requested
  const isListingRequested = (listingId: string) => {
    return requestedListingIds.includes(listingId)
  }

  // Handle starting a chat with a business
  const handleStartChat = async (listingId: string) => {
    setIsStartingChat(true)
    try {
      const { data, error } = await createChatRoom(listingId)

      if (error) {
        console.error("Error starting chat:", error)
        return
      }

      // Navigate to the chat room
      router.push(`/messages/${data.id}`)
    } catch (err: any) {
      console.error("Failed to start chat:", err)
    } finally {
      setIsStartingChat(false)
    }
  }

  const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setRequestFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedListing) return

    setIsRequesting(true)

    try {
      const { data, error } = await createRequest(selectedListing.id, {
        message: requestFormData.message,
        pickupTime: requestFormData.pickupTime,
        pickupNotes: requestFormData.pickupNotes,
      })

      if (error) {
        throw new Error(error)
      }

      setRequestSuccess(true)
      setRequestDialogOpen(false)

      // Add the listing ID to requested IDs
      requestedListingIds.push(selectedListing.id)

      // Reset form
      setRequestFormData({
        message: "",
        pickupTime: "",
        pickupNotes: "",
      })

      // Close the detail card after a short delay
      setTimeout(() => {
        setRequestSuccess(false)
        setShowDetailCard(false)
      }, 3000)
    } catch (err: any) {
      console.error("Failed to submit request:", err)
    } finally {
      setIsRequesting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  // Add markers to the map
  const addMarkers = useCallback(
    (map: any) => {
      // Clear existing markers
      if (markersRef.current.length) {
        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []
      }

      // Add new markers
      listings.forEach((listing) => {
        // Extract coordinates from the location string or use default coordinates
        // In a real app, you would have actual lat/lng in your database
        // For this demo, we'll generate random coordinates around NYC
        const lat = listing.lat || 40.7128 + (Math.random() * 0.05 - 0.025)
        const lng = listing.lng || -74.006 + (Math.random() * 0.05 - 0.025)

        // Create custom marker element
        const el = document.createElement("div")
        el.className = "custom-marker"
        el.innerHTML = `
        <div class="${
          isListingRequested(listing.id)
            ? "bg-blue-500"
            : new Date(listing.expiration_date) <= new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
              ? "bg-yellow-500"
              : "bg-emerald-500"
        } 
          text-white flex items-center justify-center w-10 h-10 rounded-full shadow-lg cursor-pointer transition-all hover:scale-110">
          ${
            listing.food_type === "prepared"
              ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-utensils"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>'
              : listing.food_type === "bakery"
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-coffee"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-shopping-bag"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
          }
          ${
            new Date(listing.expiration_date) <= new Date(new Date().getTime() + 24 * 60 * 60 * 1000) &&
            !isListingRequested(listing.id)
              ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>'
              : ""
          }
        </div>
      `

        // Create marker
        const marker = new (window as any).mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map)

        // Add event listeners
        el.addEventListener("click", () => {
          // Close any open popup
          if (activePopup) {
            activePopup.remove()
            setActivePopup(null)
          }

          // Set the selected listing
          setSelectedListing({ ...listing, lat, lng })
          setShowDetailCard(true)

          // Pan to marker
          map.flyTo({
            center: [lng, lat],
            zoom: 15,
            speed: 1.2,
          })
        })

        markersRef.current.push(marker)
      })
    },
    [listings, requestedListingIds],
  )

  // Add user location marker
  const addUserLocationMarker = useCallback((map: any, location: { lat: number; lng: number }) => {
    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
    }

    // Create custom marker element
    const el = document.createElement("div")
    el.className = "user-location-marker"
    el.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </div>
    `

    // Create marker
    const marker = new (window as any).mapboxgl.Marker(el).setLngLat([location.lng, location.lat]).addTo(map)

    userMarkerRef.current = marker
  }, [])

  // Initialize the map
  const initializeMap = useCallback(() => {
    if (mapContainerRef.current && mapboxLoaded) {
      console.log("Initializing map")
      const initialLocation = userLocation || { lat: 40.7128, lng: -74.006 } // NYC as default

      const map = new (window as any).mapboxgl.Map({
        container: mapContainerRef.current,
        style:
          mapStyle === "streets"
            ? "mapbox://styles/mapbox/streets-v12"
            : "mapbox://styles/mapbox/satellite-streets-v12",
        center: [initialLocation.lng, initialLocation.lat],
        zoom: 12,
        accessToken: MAPBOX_ACCESS_TOKEN,
      })

      // Add navigation control (the +/- zoom buttons)
      const nav = new (window as any).mapboxgl.NavigationControl({
        showCompass: false,
        visualizePitch: false,
      })
      map.addControl(nav, "bottom-right")

      // Disable map rotation using touch rotation gesture.
      map.touchZoomRotate.disableRotation()

      map.on("load", () => {
        console.log("Map loaded")
        setMapLoaded(true)
        mapInstanceRef.current = map
        addMarkers(map)

        if (userLocation) {
          addUserLocationMarker(map, userLocation)
        }
      })

      map.on("error", (error: any) => {
        console.error("Map error:", error)
        alert("Failed to initialize map. Please refresh the page and try again.")
      })
    }
  }, [userLocation, mapStyle, mapboxLoaded, addMarkers, addUserLocationMarker])

  // Get user location
  const getUserLocation = useCallback(() => {
    setIsLocatingUser(true)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Got user location")
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          setUserLocation(newLocation)

          // If map is already loaded, update user marker and center map
          if (mapInstanceRef.current) {
            addUserLocationMarker(mapInstanceRef.current, newLocation)

            mapInstanceRef.current.flyTo({
              center: [newLocation.lng, newLocation.lat],
              zoom: 14,
              speed: 1.5,
            })
          }

          setIsLocatingUser(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setIsLocatingUser(false)

          // Don't block the map if location fails, just show a message
          if (error.code === 1) {
            // PERMISSION_DENIED
            console.log("Location permission denied")
          } else {
            console.log("Location error:", error.message)
          }

          // Initialize map anyway with default location
          if (!mapLoaded && mapboxLoaded) {
            initializeMap()
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    } else {
      console.log("Geolocation not supported")
      setIsLocatingUser(false)

      // Initialize map anyway with default location
      if (!mapLoaded && mapboxLoaded) {
        initializeMap()
      }
    }
  }, [addUserLocationMarker, initializeMap, mapLoaded, mapboxLoaded])

  // Toggle map style
  const toggleMapStyle = useCallback(() => {
    const newStyle = mapStyle === "streets" ? "satellite" : "streets"
    setMapStyle(newStyle)

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setStyle(
        newStyle === "streets" ? "mapbox://styles/mapbox/streets-v12" : "mapbox://styles/mapbox/satellite-streets-v12",
      )
    }
  }, [mapStyle, mapInstanceRef])

  // Zoom controls
  const handleZoom = useCallback((direction: "in" | "out") => {
    if (!mapInstanceRef.current) return

    const currentZoom = mapInstanceRef.current.getZoom()
    mapInstanceRef.current.zoomTo(direction === "in" ? currentZoom + 1 : currentZoom - 1, { duration: 300 })
  }, [])

  // Initialize map when Mapbox is loaded
  useEffect(() => {
    if (mapboxLoaded && !mapInstanceRef.current) {
      console.log("Mapbox loaded, initializing map")
      // Short timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeMap()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [mapboxLoaded, initializeMap])

  // Get user location on initial load, but don't block map initialization
  useEffect(() => {
    getUserLocation()

    // Fallback: If after 5 seconds we still don't have a map, try to initialize anyway
    const fallbackTimer = setTimeout(() => {
      if (!mapLoaded && mapboxLoaded && !mapInstanceRef.current) {
        console.log("Fallback: Initializing map without user location")
        initializeMap()
      }
    }, 5000)

    return () => clearTimeout(fallbackTimer)
  }, [getUserLocation, mapLoaded, mapboxLoaded, initializeMap])

  // Load Mapbox scripts - only load once across all instances
  useEffect(() => {
    // If already loaded globally, just set the state
    if (mapboxScriptLoaded) {
      setMapboxLoaded(true);
      return;
    }
    
    // Only load once
    if (document.getElementById("mapbox-gl-script")) {
      setMapboxLoaded(true);
      mapboxScriptLoaded = true;
      return;
    }

    // Load CSS
    const linkElement = document.createElement("link")
    linkElement.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
    linkElement.rel = "stylesheet"
    document.head.appendChild(linkElement)

    // Load JS
    const script = document.createElement("script")
    script.id = "mapbox-gl-script"
    script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
    script.async = true
    script.onload = () => {
      console.log("Mapbox script loaded successfully")
      setMapboxLoaded(true)
      mapboxScriptLoaded = true;
    }
    script.onerror = (error) => {
      console.error("Error loading Mapbox script:", error)
      alert("Failed to load map. Please refresh the page and try again.")
    }
    document.body.appendChild(script)

    return () => {
      // Don't remove the script on unmount, as we want to keep it loaded
      // Only remove if the component throws an error during loading
      if (!mapboxScriptLoaded) {
        script.remove()
        linkElement.remove()
      }
    }
  }, [])

  // Update markers when map style changes
  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      // We need to wait for the style to load before adding markers
      mapInstanceRef.current.once("style.load", () => {
        addMarkers(mapInstanceRef.current)

        if (userLocation) {
          addUserLocationMarker(mapInstanceRef.current, userLocation)
        }
      })
    }
  }, [mapStyle, mapLoaded, addMarkers, userLocation, addUserLocationMarker])

  return (
    <>
      {/* Load Mapbox scripts directly in useEffect instead of using next/script */}
      <div className="relative w-full h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] rounded-lg overflow-hidden border border-border">
        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full h-full bg-muted/30 relative">
          {/* Loading Skeleton */}
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50 backdrop-blur-sm">
              <div className="text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
                <Skeleton className="h-4 w-32 mx-auto" />
                <p className="mt-4 text-sm text-muted-foreground">Loading interactive map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Map Controls */}
        <TooltipProvider>
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
                  onClick={onToggleView}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>List View</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
                  onClick={toggleMapStyle}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{mapStyle === "streets" ? "Satellite View" : "Street View"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
                  onClick={getUserLocation}
                  disabled={isLocatingUser}
                >
                  {isLocatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Find My Location</p>
              </TooltipContent>
            </Tooltip>

            {showDetailCard && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
                    onClick={() => {
                      setShowDetailCard(false)
                      setSelectedListing(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Close Details</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
                  onClick={() => handleZoom("in")}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Zoom In</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background"
                  onClick={() => handleZoom("out")}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Detailed Listing Card */}
        {showDetailCard && selectedListing && (
          <div className="absolute left-4 top-4 z-20 w-80 md:w-96">
            <Card className="bg-background/95 backdrop-blur-sm shadow-lg border-border">
              <CardContent className="p-4">
                {requestSuccess && (
                  <div className="mb-4 p-2 bg-primary/10 text-primary rounded-md text-sm font-medium">
                    Your request has been submitted successfully!
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-foreground">{selectedListing.title}</h3>
                  <Badge
                    className={
                      isListingRequested(selectedListing.id) ? "bg-blue-500 text-white" : "bg-primary/10 text-primary"
                    }
                  >
                    {isListingRequested(selectedListing.id) ? "Requested" : "Available"}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {selectedListing.business_name || "Anonymous Business"}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate">Pickup by {selectedListing.pickup_by_time}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate">Expires {formatDate(selectedListing.expiration_date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{selectedListing.location}</span>
                  </div>
                  {selectedListing.serves && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User size={14} className="mr-1 flex-shrink-0" />
                      <span className="truncate">Serves {selectedListing.serves}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/listings/${selectedListing.id}`)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleStartChat(selectedListing.id)}
                    disabled={isStartingChat}
                  >
                    {isStartingChat ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <MessageSquare className="h-3 w-3 mr-1" />
                    )}
                    Message
                  </Button>
                </div>

                <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full mt-2 bg-primary hover:bg-primary/90"
                      disabled={isListingRequested(selectedListing.id)}
                    >
                      {isListingRequested(selectedListing.id) ? "Already Requested" : "Request This Food"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Request Food Donation</DialogTitle>
                      <DialogDescription>
                        Send a request to the business for this food donation. Provide details about your shelter and
                        when you can pick up the food.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRequestSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="message">Message to Business</Label>
                          <Textarea
                            id="message"
                            placeholder="Introduce your shelter and explain why you need this food donation"
                            value={requestFormData.message}
                            onChange={handleRequestChange}
                            required
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pickupTime">Preferred Pickup Time</Label>
                          <Input
                            id="pickupTime"
                            placeholder="e.g., 'Between 2-4 PM' or 'After 5 PM'"
                            value={requestFormData.pickupTime}
                            onChange={handleRequestChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pickupNotes">Additional Notes</Label>
                          <Textarea
                            id="pickupNotes"
                            placeholder="Any additional information about pickup or special requirements"
                            value={requestFormData.pickupNotes}
                            onChange={handleRequestChange}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setRequestDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isRequesting}>
                          {isRequesting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Request"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mobile bottom sheet with listing preview */}
        {isMobile && (
          <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm p-4 rounded-t-xl shadow-lg border-t border-border z-10">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3"></div>
            <h3 className="font-medium text-sm mb-2">Nearby Food ({listings.length})</h3>
            <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4">
              {listings.slice(0, 6).map((listing) => (
                <Card
                  key={listing.id}
                  className={cn(
                    "flex-shrink-0 w-40 cursor-pointer transition-all",
                    selectedListing?.id === listing.id ? "border-primary" : "",
                  )}
                  onClick={() => {
                    // Extract coordinates or use default
                    const lat = listing.lat || 40.7128 + (Math.random() * 0.05 - 0.025)
                    const lng = listing.lng || -74.006 + (Math.random() * 0.05 - 0.025)

                    setSelectedListing({ ...listing, lat, lng })
                    setShowDetailCard(true)

                    // Pan to marker
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo({
                        center: [lng, lat],
                        zoom: 15,
                        speed: 1.2,
                      })
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="font-medium text-xs">{listing.title}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {listing.business_name || "Anonymous Business"}
                    </div>
                    <div className="flex items-center text-[10px] mt-1">
                      <MapPin className="h-2 w-2 mr-1" />
                      <span>{listing.location}</span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-1 flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/listings/${listing.id}`)
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-1 flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartChat(listing.id)
                        }}
                        disabled={isStartingChat}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

