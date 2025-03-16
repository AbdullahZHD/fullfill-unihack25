import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white/10 dark:bg-black/30 backdrop-blur-xl border-t border-white/10 dark:border-gray-800/30 relative z-10">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="FoodShare Logo" 
                className="h-12 w-auto drop-shadow-md" 
              />
            </div>
            <p className="text-muted-foreground">Connecting surplus food from businesses with food shelters to reduce waste and fight hunger.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">For Businesses</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/business/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                  Register Business
                </Link>
              </li>
              <li>
                <Link href="/business/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Business Login
                </Link>
              </li>
              <li>
                <Link href="/donate" className="text-muted-foreground hover:text-foreground transition-colors">
                  Donate Food
                </Link>
              </li>
              <li>
                <Link href="/my-listings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Manage Listings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">For Shelters</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shelter/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                  Register Shelter
                </Link>
              </li>
              <li>
                <Link href="/shelter/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Shelter Login
                </Link>
              </li>
              <li>
                <Link href="/listings" className="text-muted-foreground hover:text-foreground transition-colors">
                  Find Food
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 dark:border-gray-800/30 mt-8 pt-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

