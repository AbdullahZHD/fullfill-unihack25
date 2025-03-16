"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Package, Clock, CheckCircle, XCircle, Loader2, Plus, Utensils, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { getBusinessListings } from "@/actions/listing-actions"
import { getBusinessRequests, acceptRequest, rejectRequest } from "@/actions/request-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function BusinessDashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, userType } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [listings, setListings] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [error, setError] = useState("")
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  // Add last loaded timestamp to control refresh frequency
  const lastLoadedRef = useRef<number>(0)
  // Track if the page is visible
  const isVisibleRef = useRef<boolean>(true)

  // Add visibility change listener
  useEffect(() => {
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push("/")
      } else if (userType !== "business") {
        // Redirect to shelter dashboard if not a business
        router.push("/shelter-dashboard")
      } else {
        // Only load data if we haven't loaded recently (within 30 seconds)
        const now = Date.now();
        if (now - lastLoadedRef.current > 30000 || listings.length === 0) {
          loadData();
          lastLoadedRef.current = now;
        } else {
          // Just mark as not loading if we're using cached data
          setPageLoading(false);
        }
      }
    }
  }, [user, authLoading, router, userType])

  const loadData = async () => {
    // Don't fetch data if the page isn't visible
    if (!isVisibleRef.current) {
      setPageLoading(false);
      return;
    }
    
    setPageLoading(true)
    try {
      // Load business data
      const [listingsResult, requestsResult] = await Promise.all([getBusinessListings(), getBusinessRequests()])

      if (listingsResult.error) {
        setError(listingsResult.error)
      } else {
        setListings(listingsResult.data || [])
      }

      if (requestsResult.error) {
        setError(requestsResult.error)
      } else {
        setRequests(requestsResult.data || [])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setPageLoading(false)
    }
  }

  // Add a manual refresh function for user-initiated refreshes
  const handleManualRefresh = () => {
    lastLoadedRef.current = 0; // Reset timestamp to force reload
    loadData();
  }

  // Update the handleAcceptRequest function to include pickup details

  const handleAcceptRequest = async (requestId: string, pickupDetails?: { time?: string; notes?: string }) => {
    setProcessingRequestId(requestId)
    try {
      const { error, success } = await acceptRequest(requestId, pickupDetails)
      if (error) {
        setError(error)
      } else if (success) {
        // Reload data
        loadData()
      }
    } catch (err: any) {
      setError(err.message || "Failed to accept request")
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequestId(requestId)
    try {
      const { error, success } = await rejectRequest(requestId)
      if (error) {
        setError(error)
      } else if (success) {
        // Reload data
        loadData()
      }
    } catch (err: any) {
      setError(err.message || "Failed to reject request")
    } finally {
      setProcessingRequestId(null)
    }
  }

  // Show loading state
  if (authLoading || pageLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Count pending requests
  const pendingRequests = requests.filter((req) => req.status === "pending")

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Business Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your food donations and requests</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2 items-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleManualRefresh}
              disabled={pageLoading}
              className="mr-2"
              title="Refresh"
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
            <Button className="bg-primary hover:bg-primary/90">
              <Link href="/donate" className="flex items-center">
                <Plus size={16} className="mr-2" /> Add New Listing
              </Link>
            </Button>
            <Button variant="outline">
              <Link href="/my-listings" className="flex items-center">
                <Package size={16} className="mr-2" /> View All Listings
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Dashboard Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Listings</CardTitle>
              <CardDescription>Food donations available for pickup</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {listings.filter((listing) => listing.status === "available").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <CardDescription>Requests waiting for your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pendingRequests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Claimed Donations</CardTitle>
              <CardDescription>Food donations that have been claimed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {listings.filter((listing) => listing.status === "claimed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="requests">Pending Requests</TabsTrigger>
            <TabsTrigger value="listings">Recent Listings</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Food Donation Requests</CardTitle>
                <CardDescription>Review and manage requests from food shelters</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="rounded-full bg-muted p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No Pending Requests</h3>
                    <p className="text-muted-foreground">
                      You don't have any pending requests from food shelters at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b">
                          <div className="flex flex-col md:flex-row justify-between mb-2">
                            <div>
                              <h3 className="font-medium text-foreground">
                                Request for: {request.food_listings.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                From: {request.shelter_name || "Anonymous Shelter"}
                              </p>
                            </div>
                            <div className="mt-2 md:mt-0">
                              <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="bg-muted/30 rounded-lg p-3 mb-4">
                            <p className="text-sm italic">"{request.message}"</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {request.pickup_time && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 mr-2 text-primary" />
                                <span>Preferred pickup: {request.pickup_time}</span>
                              </div>
                            )}
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-2 text-primary" />
                              <span>Requested {new Date(request.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {request.pickup_notes && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-1">Additional Notes:</h4>
                              <p className="text-sm text-muted-foreground">{request.pickup_notes}</p>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="bg-green-600 hover:bg-green-700 flex-1">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept Request
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Accept Food Request</DialogTitle>
                                  <DialogDescription>
                                    Confirm pickup details with the shelter. Once accepted, other requests for this
                                    listing will be automatically rejected.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="pickupTime">Pickup Time</Label>
                                    <Input
                                      id="pickupTime"
                                      placeholder={request.pickup_time || "e.g., Today between 2-4 PM"}
                                      defaultValue={request.pickup_time || ""}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="pickupNotes">Pickup Instructions (Optional)</Label>
                                    <Textarea
                                      id="pickupNotes"
                                      placeholder="Any special instructions for pickup"
                                      defaultValue={request.pickup_notes || ""}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {}}>
                                    Cancel
                                  </Button>
                                  <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      const timeInput = document.getElementById("pickupTime") as HTMLInputElement
                                      const notesInput = document.getElementById("pickupNotes") as HTMLTextAreaElement

                                      handleAcceptRequest(request.id, {
                                        time: timeInput?.value,
                                        notes: notesInput?.value,
                                      })
                                    }}
                                    disabled={!!processingRequestId}
                                  >
                                    {processingRequestId === request.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Confirm Acceptance
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex-1"
                              onClick={() => handleRejectRequest(request.id)}
                              disabled={!!processingRequestId}
                            >
                              {processingRequestId === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle>Recent Listings</CardTitle>
                <CardDescription>Your most recent food donations</CardDescription>
              </CardHeader>
              <CardContent>
                {listings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="rounded-full bg-muted p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Utensils className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No Listings Yet</h3>
                    <p className="text-muted-foreground mb-4">You haven't created any food donation listings yet.</p>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Link href="/donate">Create Your First Listing</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.slice(0, 5).map((listing) => (
                      <div key={listing.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <h3 className="font-medium text-foreground">{listing.title}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Pickup by {listing.pickup_by_time}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge
                            className={`${
                              listing.status === "available"
                                ? "bg-green-500 hover:bg-green-600"
                                : listing.status === "claimed"
                                  ? "bg-blue-500 hover:bg-blue-600"
                                  : "bg-red-500 hover:bg-red-600"
                            }`}
                          >
                            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {listings.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="link" className="text-primary">
                          <Link href="/my-listings">View All Listings</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

