"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  Clock,
  Calendar,
  MapPin,
  User,
  Package,
  Info,
  ArrowLeft,
  Building,
  Phone,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getListing } from "@/actions/listing-actions"
import { createRequest } from "@/actions/request-actions"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createChatRoom } from "@/actions/chat-actions"

export default function ListingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading: authLoading, userType } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [listing, setListing] = useState<any>(null)
  const [error, setError] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [requestFormData, setRequestFormData] = useState({
    message: "",
    pickupTime: "",
    pickupNotes: "",
  })

  const id = params.id as string

  // Check if user is authenticated and is a shelter
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to shelter login if not authenticated
        router.push("/shelter/login")
      } else if (userType !== "shelter") {
        // Redirect to home if not a shelter
        router.push("/")
      } else {
        loadListing()
      }
    }
  }, [user, authLoading, router, userType, id])

  const loadListing = async () => {
    setPageLoading(true)
    try {
      const { data, error } = await getListing(id)
      if (error) {
        setError(error)
      } else {
        setListing(data)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load listing")
    } finally {
      setPageLoading(false)
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
    setIsRequesting(true)
    setError("")

    try {
      const { data, error } = await createRequest(id, {
        message: requestFormData.message,
        pickupTime: requestFormData.pickupTime,
        pickupNotes: requestFormData.pickupNotes,
      })

      if (error) {
        throw new Error(error)
      }

      setRequestSuccess(true)
      setRequestDialogOpen(false)

      // Reset form
      setRequestFormData({
        message: "",
        pickupTime: "",
        pickupNotes: "",
      })
    } catch (err: any) {
      setError(err.message || "Failed to submit request")
    } finally {
      setIsRequesting(false)
    }
  }

  const handleStartChat = async () => {
    try {
      const { data, error } = await createChatRoom(id)

      if (error) {
        setError(error)
        return
      }

      // Navigate to the chat room
      router.push(`/messages/${data.id}`)
    } catch (err: any) {
      setError(err.message || "Failed to start chat")
    }
  }

  // Show loading state
  if (authLoading || pageLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading listing details...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !listing) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Listing not found"}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => router.push("/listings")}>
            <ArrowLeft size={16} className="mr-2" /> Back to Listings
          </Button>
        </div>
      </div>
    )
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  // Check if listing is expiring soon (within 24 hours)
  const isExpiringSoon = new Date(listing.expiration_date) <= new Date(new Date().getTime() + 24 * 60 * 60 * 1000)

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push("/listings")}>
            <ArrowLeft size={16} className="mr-2" /> Back to Listings
          </Button>
        </div>

        {requestSuccess && (
          <Alert className="mb-6 bg-primary/10 border-primary/20">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary font-medium">
              Your request has been submitted successfully. You'll be notified when the business responds.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Image */}
          <div className="md:col-span-1">
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={listing.image_url || `/placeholder.svg?height=400&width=400`}
                alt={listing.title}
                className="w-full h-64 object-cover"
              />
            </div>

            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-medium text-foreground flex items-center mb-4">
                  <Building size={18} className="mr-2 text-muted-foreground" /> Business Information
                </h3>
                <p className="text-foreground font-medium">{listing.business_name || "Anonymous Business"}</p>
                <p className="text-sm text-muted-foreground mb-4">{listing.location}</p>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone size={16} className="mr-2" /> Call Business
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl font-bold text-foreground">{listing.title}</h1>
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

            <div className="flex items-center mb-6">
              <p className="text-muted-foreground">Posted {formatDate(listing.created_at)}</p>
              {isExpiringSoon && (
                <Badge variant="outline" className="ml-2 bg-yellow-500/10 text-yellow-700 border-yellow-200">
                  Expiring Soon
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Calendar size={18} className="mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Expiration Date</p>
                  <p className="font-medium">{formatDate(listing.expiration_date)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock size={18} className="mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Pickup By</p>
                  <p className="font-medium">{listing.pickup_by_time}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Package size={18} className="mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">
                    {listing.quantity} {listing.quantity_unit}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <User size={18} className="mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Serves</p>
                  <p className="font-medium">{listing.serves || "Not specified"}</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line">{listing.description}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Pickup Location</h2>
              <div className="flex items-start">
                <MapPin size={18} className="mr-2 text-muted-foreground mt-0.5" />
                <p className="text-muted-foreground">{listing.location}</p>
              </div>
            </div>

            <Alert className="mb-6 bg-blue-500/10 border-blue-500/20">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Request this food to express your interest. The business will review your request and contact you if
                approved.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="lg" onClick={handleStartChat} disabled={listing.status !== "available"}>
                Message Business
              </Button>
              <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    size="lg"
                    disabled={listing.status !== "available"}
                  >
                    {listing.status === "available" ? "Request This Food" : "No Longer Available"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Request Food Donation</DialogTitle>
                    <DialogDescription>
                      Send a request to the business for this food donation. Provide details about your shelter and when
                      you can pick up the food.
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

