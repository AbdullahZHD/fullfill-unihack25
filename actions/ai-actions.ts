"use server"

import { getAuthenticatedClient } from "@/lib/auth-helpers"
import openai from "@/lib/openai"
import { v4 as uuidv4 } from "uuid"

// Type for food analysis response
export interface FoodAnalysisResult {
  title: string
  description: string
  foodType: string
  quantity: number
  quantityUnit: string
  serves: string
  error?: string
  details?: string  // Add details field for additional error information
}

/**
 * Analyzes a food image and extracts relevant details
 */
export async function analyzeFoodImage(imageBase64: string): Promise<FoodAnalysisResult> {
  try {
    // Get the authenticated client to ensure user is logged in
    const { session } = await getAuthenticatedClient()
    
    if (!session?.user) {
      return { 
        error: "You must be logged in to use this feature",
        details: "Authentication required",
        title: "",
        description: "",
        foodType: "",
        quantity: 0,
        quantityUnit: "servings",
        serves: ""
      }
    }

    // Make sure the image is properly formatted for the API call
    let base64Data = "";
    try {
      base64Data = imageBase64.startsWith('data:image') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;
        
      // Basic validation of base64 format
      if (!base64Data.includes('base64') || base64Data.length < 100) {
        throw new Error("Invalid image format");
      }
    } catch (err: any) {
      console.error("Error formatting image data:", err);
      return {
        error: "The image data appears to be corrupt or in an invalid format.",
        details: `Image validation error: ${err.message || "unknown format error"}`,
        title: "",
        description: "",
        foodType: "",
        quantity: 0,
        quantityUnit: "servings",
        serves: ""
      };
    }
    
    try {
      // Call OpenAI to analyze the image
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that analyzes images of food to identify key details for food donation listings. Extract only the requested information in the exact JSON format specified."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image and extract the following information in JSON format:\n\n" +
                      "1. Food name/title\n" +
                      "2. Food description (including visible ingredients if possible)\n" +
                      "3. Food type category (one of: prepared, produce, bakery, canned, dairy, other)\n" +
                      "4. Estimated quantity (number)\n" +
                      "5. Quantity unit (one of: servings, pounds, items, boxes)\n" +
                      "6. Approximate serving size (e.g., '2-4 people', '6-8 people')\n\n" +
                      "Return ONLY a valid JSON object with these fields: title, description, foodType, quantity, quantityUnit, serves."
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Data
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      // Parse the JSON response
      const content = response.choices[0]?.message?.content || "";
      
      try {
        const result: FoodAnalysisResult = JSON.parse(content);
        
        return {
          title: result.title || "",
          description: result.description || "",
          foodType: result.foodType || "other",
          quantity: result.quantity || 1,
          quantityUnit: result.quantityUnit || "servings",
          serves: result.serves || ""
        };
      } catch (parseError: any) {
        console.error("Error parsing AI response:", parseError, "Response content:", content);
        return {
          error: "Failed to parse the AI analysis results.",
          details: `Invalid response format from OpenAI: ${parseError.message}`,
          title: "",
          description: "",
          foodType: "",
          quantity: 0,
          quantityUnit: "servings",
          serves: ""
        };
      }
    } catch (apiError: any) {
      console.error("OpenAI API error:", apiError);
      return {
        error: "An error occurred while analyzing the image.",
        details: `API error: ${apiError.message || "unknown OpenAI service error"}`,
        title: "",
        description: "",
        foodType: "",
        quantity: 0,
        quantityUnit: "servings",
        serves: ""
      };
    }
  } catch (error: any) {
    console.error("Error analyzing food image:", error);
    
    // More user-friendly error message with details
    return {
      error: "We couldn't analyze this image. The AI may not be able to recognize the food clearly. Please use manual entry to provide the details instead.",
      details: `Error: ${error.message || "unknown error"}. This could be due to the image format, size, or network issues.`,
      title: "",
      description: "",
      foodType: "",
      quantity: 0,
      quantityUnit: "servings",
      serves: ""
    };
  }
} 