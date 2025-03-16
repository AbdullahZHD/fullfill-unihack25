"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { getListing, updateListing, type ListingFormData } from "@/actions/listing-actions"

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading: authLoading, userType } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const id = params.id as string

  const [formData, setFormData] = useState<ListingFormData>({
    title: "",
    description: "",
    foodType: "",
    quantity: 1,
    quantityUnit: "servings",
    expirationDate: "",
    pickupByTime: "",
    location: "",
    serves: "",
  })

  // Check if user is authenticated and is a business
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to business login if not authenticated
        router.push("/business/login")
      } else if (userType !== "business") {
        // Redirect to home if not a business
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
      } else if (data) {
        // Check if the user owns this listing
        if (data.business_id !== user?.id) {
          setError("You do not have permission to edit this listing")
          setTimeout(() => {
            router.push("/my-listings")
          }, 2000)
          return
        }

        // Format date for input field (YYYY-MM-DD)
        const formattedDate = data.expiration_date ? new Date(data.expiration_date).toISOString().split("T")[0] : ""

        setFormData({
          title: data.title,
          description: data.description,
          foodType: data.food_type,
          quantity: data.quantity,
          quantityUnit: data.quantity_unit,
          expirationDate: formattedDate,
          pickupByTime: data.pickup_by_time,
          location: data.location,
          serves: data.serves || "",
          imageUrl: data.image_url || "",
        })
      }
    } catch (err: any) {
      setError(err.message || "Failed to load listing")
    } finally {
      setPageLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: Number.parseInt(value) || 0,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const { data, error } = await updateListing(id, formData)

      if (error) {
        throw new Error(error)
      }

      // Redirect to my listings page
      router.push("/my-listings")
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the listing")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading || pageLoading) {
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
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push("/my-listings")}>
            <ArrowLeft size={16} className="mr-2" /> Back to My Listings
          </Button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground">Edit Food Listing</h1>
          <p className="mt-2 text-lg text-muted-foreground">Update the details of your food donation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Food Donation Details</CardTitle>
            <CardDescription>Update information about the food you're sharing with shelters</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Listing Title</Label>
                  <Input
                    id="title"
                    placeholder="E.g., Fresh Sandwiches, Leftover Catering Food"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the food, including any dietary information (vegetarian, contains nuts, etc.)"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="foodType">Food Type</Label>
                    <Select
                      value={formData.foodType}
                      onValueChange={(value) => handleSelectChange("foodType", value)}
                      disabled={isSubmitting}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select food type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prepared">Prepared Meals</SelectItem>
                        <SelectItem value="produce">Fresh Produce</SelectItem>
                        <SelectItem value="bakery">Bakery Items</SelectItem>
                        <SelectItem value="canned">Canned Goods</SelectItem>
                        <SelectItem value="dairy">Dairy Products</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serves">Serves</Label>
                    <Input
                      id="serves"
                      placeholder="E.g., 2-4, 6-8, 10-12 people"
                      value={formData.serves}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex space-x-4">
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={handleNumberChange}
                        required
                        disabled={isSubmitting}
                      />
                      <Select
                        value={formData.quantityUnit}
                        onValueChange={(value) => handleSelectChange("quantityUnit", value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="servings">Servings</SelectItem>
                          <SelectItem value="pounds">Pounds</SelectItem>
                          <SelectItem value="items">Items</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Expiration/Best By Date</Label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                        size={16}
                      />
                      <Input
                        id="expirationDate"
                        type="date"
                        className="pl-10"
                        value={formData.expirationDate}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupByTime">Pickup By</Label>
                  <div className="relative">
                    <Clock
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={16}
                    />
                    <Input
                      id="pickupByTime"
                      type="time"
                      className="pl-10"
                      value={formData.pickupByTime}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Pickup Location</Label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      size={16}
                    />
                    <Input
                      id="location"
                      placeholder="Address or general area"
                      className="pl-10"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For privacy reasons, exact address will only be shared with confirmed shelter recipients
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl || ""}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">Provide a URL to an image of the food (optional)</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => router.push("/my-listings")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Listing"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

