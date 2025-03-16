export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      food_listings: {
        Row: {
          id: string
          title: string
          description: string
          food_type: string
          quantity: number
          quantity_unit: string
          expiration_date: string
          pickup_by_time: string
          location: string
          business_id: string
          created_at: string
          updated_at: string
          status: "available" | "claimed" | "expired"
          image_url: string | null
          serves: string | null
          business_name: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          food_type: string
          quantity: number
          quantity_unit: string
          expiration_date: string
          pickup_by_time: string
          location: string
          business_id: string
          created_at?: string
          updated_at?: string
          status?: "available" | "claimed" | "expired"
          image_url?: string | null
          serves?: string | null
          business_name?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          food_type?: string
          quantity?: number
          quantity_unit?: string
          expiration_date?: string
          pickup_by_time?: string
          location?: string
          business_id?: string
          created_at?: string
          updated_at?: string
          status?: "available" | "claimed" | "expired"
          image_url?: string | null
          serves?: string | null
          business_name?: string | null
        }
      }
      food_requests: {
        Row: {
          id: string
          listing_id: string
          shelter_id: string
          shelter_name: string | null
          status: "pending" | "accepted" | "rejected"
          message: string
          created_at: string
          updated_at: string
          pickup_time: string | null
          pickup_notes: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          shelter_id: string
          shelter_name?: string | null
          status?: "pending" | "accepted" | "rejected"
          message: string
          created_at?: string
          updated_at?: string
          pickup_time?: string | null
          pickup_notes?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          shelter_id?: string
          shelter_name?: string | null
          status?: "pending" | "accepted" | "rejected"
          message?: string
          created_at?: string
          updated_at?: string
          pickup_time?: string | null
          pickup_notes?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          user_type: "business" | "shelter"
          business_name: string | null
          shelter_name: string | null
          address: string | null
          phone: string | null
          description: string | null
          contact_person: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_type: "business" | "shelter"
          business_name?: string | null
          shelter_name?: string | null
          address?: string | null
          phone?: string | null
          description?: string | null
          contact_person?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_type?: "business" | "shelter"
          business_name?: string | null
          shelter_name?: string | null
          address?: string | null
          phone?: string | null
          description?: string | null
          contact_person?: string | null
          created_at?: string
        }
      }
    }
  }
}

