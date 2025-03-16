"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Edit, Trash2, Clock, MapPin, Package, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { getBusinessListings, deleteListing } from "@/actions/listing-actions"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function MyListingsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, userType } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [listings, setListings] = useState<any[]>([])
  const [error, setError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
        loadListings()
      }
    }
  }, [user, authLoading, router, userType])

  const loadListings = async () => {
    setPageLoading(true)
    try {
      const { data, error } = await getBusinessListings()
      if (error) {
        setError(error)
      } else {
        setListings(data || [])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load listings")
    } finally {
      setPageLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const { error, success } = await deleteListing(id)
      if (error) {
        setError(error)
      } else if (success) {
        // Remove the deleted listing from the state
        setListings(listings.filter((listing) => listing.id !== id))
        setShowDeleteDialog(false)
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete listing")
    } finally {
      setIsDeleting(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading || pageLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading your listings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Food Listings</h1>
            <p className="text-muted-foreground mt-1">Manage your food donations</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Link href="/donate" className="flex items-center">
              <Plus size={16} className="mr-2" /> Add New Listing
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {listings.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Package size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">No Listings Yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven't created any food donation listings yet. Start sharing your surplus food with shelters in
                need.
              </p>
              <Button className="bg-primary hover:bg-primary/90">
                <Link href="/donate">Create Your First Listing</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={listing.image_url || `/placeholder.svg?height=300&width=400`}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    className={`absolute top-3 right-3 ${
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
                <CardHeader className="pb-2">
                  <CardTitle>{listing.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{listing.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Clock size={16} className="mr-1" />
                      <span>Pickup by {listing.pickup_by_time}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin size={16} className="mr-1" />
                      <span className="truncate">{listing.location}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <Link href={`/my-listings/${listing.id}/edit`} className="flex items-center">
                      <Edit size={14} className="mr-1" /> Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      setDeleteId(listing.id)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 size={14} className="mr-1" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

