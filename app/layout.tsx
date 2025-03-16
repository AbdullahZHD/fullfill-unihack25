import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import { Providers } from "./providers"
import Footer from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "FullFill - Reduce Waste, Feed Communities",
  description: "Connect surplus food with those who need it most",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Add environment variables */}
        <meta name="next-public-supabase-url" content="https://iqpmkmqpwainpqggjsuw.supabase.co" />
        <meta
          name="next-public-supabase-anon-key"
          content="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcG1rbXFwd2FpbnBxZ2dqc3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NjY2MDAsImV4cCI6MjA1NzU0MjYwMH0.hCNLCIwDS0sMVkesB3kKWU6uSaTRdfXOSc4YeFIuYtg"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}



import './globals.css'