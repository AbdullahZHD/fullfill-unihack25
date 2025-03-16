"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, Info, AlertCircle, CheckCircle2, Loader2, Upload, Camera, Sparkles, Edit, PlayCircle, ArrowRight, Scan } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { createListing, type ListingFormData } from "@/actions/listing-actions"
import { analyzeFoodImage } from "@/actions/ai-actions"

export default function DonatePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, userType } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("ai")
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [imageUploaded, setImageUploaded] = useState(false)

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

  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [base64Image, setBase64Image] = useState<string>("")
  const [analysisNotification, setAnalysisNotification] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanDirection, setScanDirection] = useState<'down' | 'up'>('down')

  // Add new state for detailed error info
  const [errorDetails, setErrorDetails] = useState<string>("")

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
        setPageLoading(false)
      }
    }
  }, [user, authLoading, router, userType])

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setError("")
      setErrorDetails("")
      setImageUploaded(true)
      setAnalysisComplete(false)

      // Validate file type and size
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!validImageTypes.includes(file.type.toLowerCase()) && 
          !file.type.toLowerCase().startsWith('image/')) {
        throw new Error(`Unsupported image format: ${file.type || "unknown"}. Please use JPEG or PNG.`);
      }

      // Check file size (limit to 10MB)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        throw new Error(`Image too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB.`);
      }

      // Create a preview of the uploaded image
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const result = event.target.result as string
          setImagePreview(result)
          setFormData(prev => ({ ...prev, imageUrl: result }))
        }
      }
      reader.readAsDataURL(file)

      // Read file as base64 for AI processing with better error handling
      const base64Reader = new FileReader()
      base64Reader.onload = async (event) => {
        try {
          if (event.target?.result) {
            const base64String = event.target.result.toString()
            setBase64Image(base64String)
          }
        } catch (err: any) {
          console.error("Error processing base64 image:", err);
          setError(`Error processing image: ${err.message || "Unknown error"}`);
          setErrorDetails(`Image type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);
          setImageUploaded(false);
        }
      }
      base64Reader.onerror = (err) => {
        console.error("FileReader error:", err);
        setError("Error reading image file. Please try another image.");
        setErrorDetails(`Image type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);
        setImageUploaded(false);
      }
      base64Reader.readAsDataURL(file)
    } catch (err: any) {
      console.error("Error in handleImageUpload:", err);
      setError(err.message || "Error processing image");
      setErrorDetails(`Image type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB`);
      setImageUploaded(false);
    }
  }

  // Add a scanning animation function
  const startScanningAnimation = () => {
    setIsScanning(true)
    setScanProgress(0)
    setScanDirection('down')
    
    // Animate the scanner
    const animationDuration = 1500; // ms
    const framesPerSecond = 60;
    const totalFrames = animationDuration / (1000 / framesPerSecond);
    let frame = 0;

    const animate = () => {
      if (frame <= totalFrames) {
        const progress = frame / totalFrames;
        
        // First half - scan down
        if (progress < 0.5) {
          setScanProgress(progress * 2); // 0 to 1
          setScanDirection('down');
        }
        // Second half - scan up
        else {
          setScanProgress(1 - ((progress - 0.5) * 2)); // 1 to 0
          setScanDirection('up');
        }
        
        frame++;
        requestAnimationFrame(animate);
      } else {
        setIsScanning(false);
        // After animation completes, start the actual analysis
        performAnalysis();
      }
    };

    requestAnimationFrame(animate);
  };

  // Separate the analysis from the animation
  const performAnalysis = async () => {
    if (!base64Image) return;
    
    try {
      setIsAnalyzing(true);
      setError("");
      setErrorDetails("");
      
      // Call the server action to analyze the image
      const result = await analyzeFoodImage(base64Image);
      
      if (result.error) {
        // Update error message and switch to manual tab when AI fails
        setError(result.error);
        setErrorDetails(result.details || "No additional details available");
        setActiveTab("manual");
        setImageUploaded(false);
        
        // Show the error for 5 seconds then clear it
        setTimeout(() => {
          setError("");
          setErrorDetails("");
        }, 10000);
      } else {
        // Update form with AI detected values
        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title,
          description: result.description || prev.description,
          foodType: result.foodType || prev.foodType,
          quantity: result.quantity || prev.quantity,
          quantityUnit: result.quantityUnit || prev.quantityUnit,
          serves: result.serves || prev.serves,
        }));
        
        // Set analysis complete flag
        setAnalysisComplete(true);
        
        // Show notification
        setAnalysisNotification(true);
        
        // Automatically switch to the manual tab with filled form
        setActiveTab("manual");
        
        // Reset the AI scanner part to allow for new image uploads
        // but keep the image data for the form
        setImageUploaded(false);
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          setAnalysisNotification(false);
        }, 5000);
      }
    } catch (err: any) {
      // More detailed error handling
      console.error("Error in performAnalysis:", err);
      const errorMessage = "We couldn't analyze your food image. Please use manual entry instead.";
      setError(errorMessage);
      setErrorDetails(err.message || "Unknown error occurred during analysis");
      setActiveTab("manual");
      setImageUploaded(false);
      
      // Show error for 10 seconds then clear it
      setTimeout(() => {
        setError("");
        setErrorDetails("");
      }, 10000);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Update the handleAnalyzeImage to trigger the scanning animation first
  const handleAnalyzeImage = () => {
    if (!base64Image) return;
    startScanningAnimation();
  };

  const resetImageAnalysis = () => {
    setImageUploaded(false)
    setAnalysisComplete(false)
    setImagePreview(null)
    setBase64Image("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const { data, error } = await createListing(formData)

      if (error) {
        throw new Error(error)
      }

      setSubmitted(true)

      // Reset form after 3 seconds and redirect to my listings
      setTimeout(() => {
        router.push("/my-listings")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the listing")
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
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground">Share Your Surplus Food</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            List your extra food to help reduce waste and support local food shelters
          </p>
        </div>

        {submitted ? (
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-center text-foreground">Donation Listed Successfully!</CardTitle>
              <CardDescription className="text-center">
                Thank you for sharing your surplus food with the community.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Your donation is now available for food shelters to view and claim. You'll receive notifications when a
                shelter is interested in your food donation.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
                onClick={() => router.push("/my-listings")}
              >
                View My Listings
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <Alert className="mb-8 bg-blue-500/10 border-blue-500/20 dark:bg-blue-900/20 dark:border-blue-900/30">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">Food Safety Guidelines</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                Please ensure all food is properly stored, labeled with ingredients, and safe for consumption. Only
                share food that you would feel comfortable eating yourself.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Food Donation Details</CardTitle>
                <CardDescription>Provide information about the food you're sharing with shelters</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-6 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <AlertTitle className="text-amber-800 dark:text-amber-300 font-medium mb-1">
                          {error.includes("unexpected response") ? "Server Error" : "Image Analysis Failed"}
                        </AlertTitle>
                        <AlertDescription className="text-amber-700 dark:text-amber-400">
                          {error || "We couldn't analyze your food image."}
                          {errorDetails && (
                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                              {errorDetails}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-medium">
                            Please use manual entry to provide your food donation details instead. {imagePreview ? "Your image has been saved." : ""}
                          </p>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}

                <Tabs defaultValue="ai" value={activeTab} onValueChange={setActiveTab} className="mb-8">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ai" className="flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" /> AI Food Scanner
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center justify-center gap-2">
                      <Edit className="h-4 w-4" /> Manual Entry
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="ai" className="mt-4">
                    {/* AI Image Upload Section */}
                    <div className="border-2 border-dashed rounded-lg p-6 bg-muted/30 text-center">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                          <Sparkles className="h-5 w-5 text-amber-400" /> 
                          AI-Powered Food Scanner
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload a photo of your food and our AI will automatically fill out the form!
                        </p>
                      </div>

                      {/* Step 1: Upload Image */}
                      {!imageUploaded && (
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                          {analysisComplete && (
                            <div className="mb-4 p-3 bg-blue-500/10 rounded-md">
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                <Info className="h-4 w-4 inline-block mr-1" />
                                Your image was analyzed! You can upload another image if needed.
                              </p>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isAnalyzing || isSubmitting}
                          />
                          
                          {/* Unified input that works for both camera and file selection */}
                          <input
                            id="universalImageInput"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isAnalyzing || isSubmitting}
                          />
                          
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() => document.getElementById('universalImageInput')?.click()}
                              disabled={isAnalyzing || isSubmitting}
                              className="flex gap-2"
                            >
                              <Camera size={18} className="mr-1" /> Upload or Take Photo
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Show Preview and Analyze Button */}
                      {imageUploaded && !analysisComplete && (
                        <div className="mt-4">
                          <div className="mb-6">
                            <div className="relative w-full max-w-xs mx-auto rounded-md overflow-hidden aspect-square">
                              {imagePreview ? (
                                <>
                                  <img 
                                    src={imagePreview}
                                    alt="Food preview" 
                                    className="w-full h-full object-cover" 
                                  />
                                  {isScanning && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      {/* Scanning beam animation */}
                                      <div className="absolute inset-0 overflow-hidden">
                                        <div 
                                          className={`absolute left-0 right-0 h-1.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 z-10 transition-all duration-300 ease-in-out`}
                                          style={{ 
                                            top: `${scanDirection === 'down' ? scanProgress * 100 : 100 - scanProgress * 100}%`,
                                            boxShadow: `0 0 15px 2px ${scanDirection === 'down' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.6)'}`,
                                            opacity: 0.8
                                          }}
                                        />
                                        {/* Full screen overlay with scan lines */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/5 mix-blend-overlay z-0 pointer-events-none" 
                                          style={{
                                            backgroundSize: '100% 10px',
                                            backgroundImage: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.03) 2px, transparent 2px)',
                                          }}
                                        />
                                      </div>
                                      {/* Center scanning icon */}
                                      <div className="relative z-10 bg-primary/10 p-3 rounded-full animate-pulse">
                                        <Scan className="h-8 w-8 text-primary" />
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <p className="text-sm text-muted-foreground">No preview available</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={resetImageAnalysis}
                              disabled={isAnalyzing || isScanning}
                              className="flex items-center gap-1"
                            >
                              Remove
                            </Button>
                            
                            <Button
                              type="button"
                              variant="default"
                              size="lg"
                              onClick={handleAnalyzeImage}
                              disabled={isAnalyzing || isScanning}
                              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                            >
                              {isAnalyzing || isScanning ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  {isScanning ? "Scanning..." : "Analyzing..."}
                                </>
                              ) : (
                                <>
                                  <PlayCircle size={18} />
                                  Analyze Food
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {isAnalyzing && (
                            <div className="mt-4 text-sm text-muted-foreground">
                              <p>Our AI is identifying your food and extracting details...</p>
                            </div>
                          )}
                          
                          {isScanning && (
                            <div className="mt-4 text-sm text-muted-foreground">
                              <p>Scanning food image for analysis...</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="mt-6">
                    {analysisNotification && (
                      <Alert className="mb-4 bg-green-500/10 border-green-500/20 dark:bg-green-900/20 dark:border-green-900/30">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-300">Analysis Complete</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                          We've analyzed your food image and filled in the details. Please review and complete any missing information.
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => setActiveTab("ai")} 
                            className="text-green-600 dark:text-green-400 p-0 h-auto ml-1"
                          >
                            Try another image?
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-6">
                        {imagePreview && (
                          <div className="flex items-center space-x-4 mb-4 p-4 bg-muted/30 rounded-lg">
                            <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                              {imagePreview ? (
                                <img 
                                  src={imagePreview}
                                  alt="Food preview" 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <p className="text-xs text-muted-foreground">No image</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Food Image Uploaded</h4>
                              <p className="text-xs text-muted-foreground">
                                {analysisComplete 
                                  ? "AI analysis complete. Please review the details below." 
                                  : "You can complete the form manually or go back to analyze with AI."}
                              </p>
                            </div>
                          </div>
                        )}
                      
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

                        <Alert
                          variant="destructive"
                          className="bg-amber-500/10 border-amber-500/20 dark:bg-amber-900/20 dark:border-amber-900/30"
                        >
                          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <AlertTitle className="text-amber-800 dark:text-amber-300">Important</AlertTitle>
                          <AlertDescription className="text-amber-700 dark:text-amber-400">
                            By submitting this listing, you confirm that the food is safe for consumption and properly
                            handled.
                          </AlertDescription>
                        </Alert>
                      </div>

                      <div className="mt-8 flex justify-end">
                        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Donation"
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

