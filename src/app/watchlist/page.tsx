"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { WatchlistPanel } from '@/components/user/watchlist-panel'

export default function WatchlistPage() {
  return (
    <DashboardShell
      title="Watchlist"
      description="Track your favorite fruits and monitor their price movements in real-time."
    >
      <WatchlistPanel />
    </DashboardShell>
  )
}