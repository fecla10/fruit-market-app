"use client"

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

import { Header } from './header'
import { Sidebar } from './sidebar'
import { Footer } from './footer'

interface RootLayoutProps {
  children: React.ReactNode
}

// Pages that should show the full layout (sidebar + header)
const dashboardPages = [
  '/dashboard',
  '/markets',
  '/charts',
  '/search',
  '/watchlist',
  '/alerts',
  '/portfolio',
  '/analytics',
  '/compare',
  '/trends',
  '/settings',
  '/profile',
  '/help'
]

// Pages that should only show header + footer
const publicPages = [
  '/',
  '/about',
  '/pricing',
  '/blog',
  '/contact'
]

// Pages that should show minimal layout
const authPages = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password'
]

export function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Determine layout type based on current path
  const isDashboardPage = dashboardPages.some(page => pathname.startsWith(page))
  const isPublicPage = publicPages.includes(pathname)
  const isAuthPage = authPages.some(page => pathname.startsWith(page))

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Auth pages - minimal layout
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-background">
        <main>{children}</main>
      </div>
    )
  }

  // Dashboard pages - full layout with sidebar
  if (isDashboardPage) {
    return (
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="hidden md:block">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={toggleSidebar}
          />
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <Header onMobileMenuToggle={toggleSidebar} />

          {/* Page Content */}
          <main 
            className={cn(
              "flex-1 transition-all duration-300",
              sidebarCollapsed ? "md:ml-0" : "md:ml-0"
            )}
          >
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          </main>

          {/* Footer */}
          <Footer minimal />
        </div>
      </div>
    )
  }

  // Public pages - header + footer only
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}