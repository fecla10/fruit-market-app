import { NextRequest, NextResponse } from 'next/server'
import { usdaService } from '@/services/usda.service'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const testQuery = searchParams.get('query') || 'apple'

    // Test USDA API connection
    const connectionValid = await usdaService.validateConnection()
    
    if (!connectionValid) {
      return NextResponse.json({
        success: false,
        error: 'USDA API connection failed',
        details: 'Please check your API key and network connection'
      }, { status: 500 })
    }

    // Test search functionality
    const searchResults = await usdaService.searchFruits(testQuery, 5)
    
    return NextResponse.json({
      success: true,
      message: 'USDA API connection successful',
      data: {
        connectionValid,
        testQuery,
        resultsCount: searchResults.length,
        sampleResults: searchResults.slice(0, 3)
      }
    })

  } catch (error) {
    console.error('USDA validation error:', error)
    return NextResponse.json({
      success: false,
      error: 'USDA API validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}