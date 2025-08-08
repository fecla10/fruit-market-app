"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PortfolioTracker } from '@/components/user/portfolio-tracker'

export default function PortfolioPage() {
  return (
    <DashboardShell
      title="Portfolio"
      description="Track your hypothetical fruit investments and analyze your trading performance over time."
    >
      <PortfolioTracker />
    </DashboardShell>
  )
}