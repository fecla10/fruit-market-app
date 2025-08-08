"use client"

import { Suspense } from 'react'
import { RefreshCw, Download, Settings, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { MarketOverview } from '@/components/dashboard/market-overview'
import { PriceTicker } from '@/components/dashboard/price-ticker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading components
function MarketOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-[100px] mb-2" />
              <Skeleton className="h-3 w-[160px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-[120px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                  <div className="space-y-1 text-right">
                    <Skeleton className="h-4 w-[60px]" />
                    <Skeleton className="h-3 w-[40px]" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function PriceTickerSkeleton() {
  return <Skeleton className="h-24 w-full" />
}

export default function DashboardPage() {
  const handleRefresh = () => {
    // Implement refresh logic
    window.location.reload()
  }

  const handleExport = () => {
    // Implement export logic
    console.log('Exporting data...')
  }

  const handleSettings = () => {
    // Navigate to settings
    window.location.href = '/settings'
  }

  return (
    <DashboardShell
      title="Market Dashboard"
      description="Real-time fruit market overview and key metrics."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Price Ticker */}
        <Suspense fallback={<PriceTickerSkeleton />}>
          <PriceTicker />
        </Suspense>

        {/* Market Overview */}
        <Suspense fallback={<MarketOverviewSkeleton />}>
          <MarketOverview />
        </Suspense>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-green-600" />
                View Charts
              </CardTitle>
              <CardDescription>
                Analyze price trends and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Interactive charts with technical indicators and drawing tools.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                🔍 Search Markets
              </CardTitle>
              <CardDescription>
                Find specific fruits and markets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Search through thousands of fruit varieties and market data.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                📊 Analytics
              </CardTitle>
              <CardDescription>
                Deep market insights and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced analytics, seasonal trends, and predictive models.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Market Status */}
        <Card>
          <CardHeader>
            <CardTitle>Market Status</CardTitle>
            <CardDescription>
              Current market conditions and system status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">USDA API Status</span>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Data Freshness</span>
                  <span className="text-sm text-muted-foreground">2 min ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Markets</span>
                  <span className="text-sm font-medium">147</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Today's Volume</span>
                  <span className="text-sm font-medium">1.2M lbs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Price Updates</span>
                  <span className="text-sm font-medium">2,345</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Market Hours</span>
                  <span className="text-sm text-green-600">Open</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}