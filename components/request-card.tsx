import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Clock, MapPin, Calendar, Building, MessageSquare, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface RequestCardProps {
  request: any
  status: "pending" | "accepted" | "rejected"
}

export function RequestCard({ request, status }: RequestCardProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  // Get time ago
  const getTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  // Get status badge
  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      case "accepted":
        return <Badge className="bg-green-500 hover:bg-green-600">Accepted</Badge>
      case "rejected":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>
    }
  }

  return (
    <Card className={`overflow-hidden ${status === "rejected" ? "border-red-200 bg-red-50/30" : ""}`}>
      <div className="relative">
        <img
          src={request.food_listings.image_url || `/placeholder.svg?height=120&width=400`}
          alt={request.food_listings.title}
          className="w-full h-32 object-cover"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/50 to-transparent">
          <div className="p-4">
            <div className="flex justify-between">
              <h3 className="font-medium text-white text-lg">{request.food_listings.title}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-white/90 text-sm">{request.food_listings.business_name || "Anonymous Business"}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {status === "accepted" && (
          <div className="mb-4 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span>
              {request.pickup_time ? `Pickup: ${request.pickup_time}` : "Contact business for pickup details"}
            </span>
          </div>
        )}

        {status === "rejected" && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800">Request Declined</h4>
                <p className="text-sm text-red-700">
                  This food may no longer be available. Try requesting other listings.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">Pickup by {request.food_listings.pickup_by_time}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">Expires {formatDate(request.food_listings.expiration_date)}</span>
          </div>
        </div>

        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
          <span className="truncate">{request.food_listings.location}</span>
        </div>

        {request.message && status === "pending" && (
          <>
            <Separator className="my-3" />
            <div className="text-sm text-muted-foreground italic">
              "{request.message.length > 100 ? `${request.message.substring(0, 100)}...` : request.message}"
            </div>
            <div className="text-xs text-muted-foreground mt-2">Requested {getTimeAgo(request.created_at)}</div>
          </>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
          <Link href={`/messages`}>
            <MessageSquare className="h-3.5 w-3.5" />
            Message
          </Link>
        </Button>
        <Button className="flex-1 gap-1 bg-primary hover:bg-primary/90" size="sm" asChild>
          <Link href={`/listings/${request.listing_id}`}>
            <Building className="h-3.5 w-3.5" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

