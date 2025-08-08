"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { AlertsManager } from '@/components/user/alerts-manager'

export default function AlertsPage() {
  return (
    <DashboardShell
      title="Price Alerts"
      description="Set up automated alerts to stay informed about important market movements and price changes."
    >
      <AlertsManager />
    </DashboardShell>
  )
}