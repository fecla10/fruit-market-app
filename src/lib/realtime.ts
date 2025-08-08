// Server-safe no-op realtime helpers for serverless environments
// In Vercel serverless, a persistent Socket.IO server isn't available.
// These helpers allow server routes/cron jobs to "broadcast" without failing.

export function broadcastBulkPriceUpdate(
  updates: Array<{ symbol: string; [key: string]: unknown }>
): void {
  try {
    console.log('[realtime] bulk_price_update', updates?.length ?? 0)
  } catch {
    // no-op
  }
}

export function sendUserAlert(userId: string, notification: unknown): void {
  try {
    console.log('[realtime] alert_triggered', { userId })
  } catch {
    // no-op
  }
}


