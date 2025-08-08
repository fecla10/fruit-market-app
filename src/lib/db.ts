// Database utilities
// This file provides database connection and utilities for the application

import { prisma } from './prisma'

export { prisma as db }
export { prisma }

// Helper functions for database operations
export async function cleanupOldData() {
  try {
    // Example cleanup - adjust based on your schema
    // Delete records older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    console.log('Cleaning up old data...')
    // Add your cleanup logic here based on your Prisma schema
    
    return { success: true, message: 'Old data cleaned up successfully' }
  } catch (error) {
    console.error('Error cleaning up old data:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function processAlerts() {
  try {
    console.log('Processing alerts...')
    // Add your alert processing logic here
    
    return { success: true, message: 'Alerts processed successfully' }
  } catch (error) {
    console.error('Error processing alerts:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function updatePrices() {
  try {
    console.log('Updating prices...')
    // Add your price update logic here
    
    return { success: true, message: 'Prices updated successfully' }
  } catch (error) {
    console.error('Error updating prices:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
