"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Database, ArrowRight, Loader2 } from "lucide-react"
import { checkAndCreateTables } from "@/actions/setup-actions"
import Link from "next/link"

export default function SetupPage() {
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const checkTables = async () => {
      try {
        const result = await checkAndCreateTables()
        if (result.success) {
          setStatus("success")
          setMessage(result.message)
        } else {
          setStatus("error")
          setMessage(result.message || result.error || "Unknown error")
        }
      } catch (error: any) {
        setStatus("error")
        setMessage(error.message || "Failed to check database tables")
      }
    }

    checkTables()
  }, [])

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Database className="mr-2" /> Database Setup
          </CardTitle>
          <CardDescription>Set up your Supabase database for the FoodShare application</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "checking" && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">Checking database tables...</p>
            </div>
          )}

          {status === "success" && (
            <Alert className="bg-green-500/10 border-green-500/20 mb-6">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">{message}</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <>
              <Alert className="bg-red-500/10 border-red-500/20 mb-6">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Database Setup Required</AlertTitle>
                <AlertDescription className="text-red-700">{message}</AlertDescription>
              </Alert>

              <div className="mt-6 space-y-4">
                <h3 className="font-medium text-lg">Follow these steps:</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to the SQL Editor</li>
                  <li>Create a new query</li>
                  <li>Copy and paste the SQL code below</li>
                  <li>Run the query to create the necessary tables</li>
                </ol>

                <div className="bg-muted p-4 rounded-md overflow-auto max-h-60 text-sm">
                  <pre>{`-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('business', 'shelter')),
  business_name TEXT,
  shelter_name TEXT,
  address TEXT,
  phone TEXT,
  description TEXT,
  contact_person TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create food_listings table
CREATE TABLE IF NOT EXISTS public.food_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  food_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  quantity_unit TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  pickup_by_time TEXT NOT NULL,
  location TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'expired')),
  image_url TEXT,
  serves TEXT,
  business_name TEXT
);

-- Create food_requests table
CREATE TABLE IF NOT EXISTS public.food_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.food_listings(id) ON DELETE CASCADE,
  shelter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shelter_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pickup_time TEXT,
  pickup_notes TEXT
);

-- Create RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for food_listings
ALTER TABLE public.food_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view available listings
CREATE POLICY "Anyone can view available listings"
  ON public.food_listings FOR SELECT
  USING (true);

-- Only businesses can insert their own listings
CREATE POLICY "Businesses can insert their own listings"
  ON public.food_listings FOR INSERT
  WITH CHECK (auth.uid() = business_id);

-- Only businesses can update their own listings
CREATE POLICY "Businesses can update their own listings"
  ON public.food_listings FOR UPDATE
  USING (auth.uid() = business_id);

-- Only businesses can delete their own listings
CREATE POLICY "Businesses can delete their own listings"
  ON public.food_listings FOR DELETE
  USING (auth.uid() = business_id);

-- Create RLS policies for food_requests
ALTER TABLE public.food_requests ENABLE ROW LEVEL SECURITY;

-- Shelters can view their own requests
CREATE POLICY "Shelters can view their own requests"
  ON public.food_requests FOR SELECT
  USING (auth.uid() = shelter_id);

-- Businesses can view requests for their listings
CREATE POLICY "Businesses can view requests for their listings"
  ON public.food_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.food_listings
      WHERE food_listings.id = food_requests.listing_id
      AND food_listings.business_id = auth.uid()
    )
  );

-- Shelters can insert their own requests
CREATE POLICY "Shelters can insert their own requests"
  ON public.food_requests FOR INSERT
  WITH CHECK (auth.uid() = shelter_id);

-- Businesses can update requests for their listings
CREATE POLICY "Businesses can update requests for their listings"
  ON public.food_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.food_listings
      WHERE food_listings.id = food_requests.listing_id
      AND food_listings.business_id = auth.uid()
    )
  );`}</pre>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          {status === "success" && (
            <Button className="bg-primary hover:bg-primary/90">
              <Link href="/" className="flex items-center">
                Go to Homepage <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
          )}
          {status === "error" && (
            <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary/90">
              Check Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

