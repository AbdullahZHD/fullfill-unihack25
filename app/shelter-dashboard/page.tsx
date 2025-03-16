"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Package, Clock, MapPin, Search, Loader2, Building2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { getShelterRequests } from "@/actions/request-actions"

export default function ShelterDashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, userType } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [error, setError] = useState("")
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
      } else if (userType !== "shelter") {
        // Redirect to business dashboard if not a shelter
        router.push("/dashboard")
      } else {
        // Only load data if we haven't loaded recently (within 30 seconds)
        const now = Date.now();
        if (now - lastLoadedRef.current > 30000 || requests.length === 0) {
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
      const { data, error } = await getShelterRequests()

      if (error) {
        setError(error)
      } else {
        setRequests(data || [])
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
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

  // Count requests by status
  const pendingRequests = requests.filter((req) => req.status === "pending")
  const acceptedRequests = requests.filter((req) => req.status === "accepted")
  const rejectedRequests = requests.filter((req) => req.status === "rejected")

  const RequestCard = ({ request, status }: { request: any; status: string }) => {
    const badgeColor =
      status === "accepted"
        ? "bg-green-500 hover:bg-green-600"
        : status === "pending"
          ? "bg-yellow-500 hover:bg-yellow-600"
          : "bg-red-500 hover:bg-red-600"

    return (
      <div className="border rounded-lg p-4">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <h3 className="font-medium text-foreground">{request.food_listings.title}</h3>
            <p className="text-sm text-muted-foreground">
              From: {request.food_listings.business_name || "Anonymous Business"}
            </p>
          </div>
          <div className="mt-2 md:mt-0">
            <Badge className={badgeColor}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
          </div>
        </div>

        {status === "pending" && <p className="text-sm mb-4">{request.message}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Pickup Details</h4>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>Pickup by {request.food_listings.pickup_by_time}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{request.food_listings.location}</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Food Information</h4>
            <p className="text-sm text-muted-foreground">
              Type: {request.food_listings.food_type.charAt(0).toUpperCase() + request.food_listings.food_type.slice(1)}
            </p>
            <p className="text-sm text-muted-foreground">
              Expires: {formatDate(request.food_listings.expiration_date)}
            </p>
          </div>
        </div>

        <Button className="w-full bg-primary hover:bg-primary/90">
          <Link href={`/listings/${request.listing_id}`}>View Details</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Food Shelter Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your food donation requests</p>
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
              <Link href="/listings" className="flex items-center">
                <Search size={16} className="mr-2" /> Browse Food Listings
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
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <CardDescription>Requests waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pendingRequests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Accepted Requests</CardTitle>
              <CardDescription>Food donations you can pick up</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{acceptedRequests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Rejected Requests</CardTitle>
              <CardDescription>Requests that were not accepted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{rejectedRequests.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="accepted" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="accepted">
            <Card>
              <CardHeader>
                <CardTitle>Accepted Requests</CardTitle>
                <CardDescription>Food donations you can pick up</CardDescription>
              </CardHeader>
              <CardContent>
                {acceptedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="rounded-full bg-muted p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No Accepted Requests</h3>
                    <p className="text-muted-foreground mb-4">You don't have any accepted food requests yet.</p>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Link href="/listings">Find Food</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {acceptedRequests.map((request) => (
                      <RequestCard key={request.id} request={request} status="accepted" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>Requests waiting for approval</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="rounded-full bg-muted p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No Pending Requests</h3>
                    <p className="text-muted-foreground">You don't have any pending food requests at the moment.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingRequests.map((request) => (
                      <RequestCard key={request.id} request={request} status="pending" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Requests</CardTitle>
                <CardDescription>Requests that were not accepted</CardDescription>
              </CardHeader>
              <CardContent>
                {rejectedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="rounded-full bg-muted p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No Rejected Requests</h3>
                    <p className="text-muted-foreground">You don't have any rejected food requests.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rejectedRequests.map((request) => (
                      <RequestCard key={request.id} request={request} status="rejected" />
                    ))}
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

