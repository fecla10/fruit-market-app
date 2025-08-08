import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const q = searchParams.get('q')
    const category = searchParams.get('category')
    const region = searchParams.get('region')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    // Search query
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (category) {
      where.category = { contains: category, mode: 'insensitive' }
    }

    // Price range filter (using latest price)
    if (minPrice || maxPrice) {
      where.prices = {
        some: {
          ...(minPrice && { close: { gte: parseFloat(minPrice) } }),
          ...(maxPrice && { close: { lte: parseFloat(maxPrice) } }),
          date: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }
    }

    // Fetch fruits with latest prices
    const fruits = await prisma.fruit.findMany({
      where,
      include: {
        prices: {
          orderBy: { date: 'desc' },
          take: 1, // Get latest price only
        },
      },
      skip: offset,
      take: limit,
      orderBy: sortBy === 'price' 
        ? { prices: { _count: 'desc' } } // Sort by having prices
        : { [sortBy]: sortOrder as 'asc' | 'desc' }
    })

    // Transform results
    const results = fruits.map(fruit => {
      const latestPrice = fruit.prices[0]
      
      return {
        id: fruit.id,
        name: fruit.name,
        category: fruit.category,
        variety: fruit.variety,
        unit: fruit.unit,
        description: fruit.description,
        imageUrl: fruit.imageUrl,
        currentPrice: latestPrice?.close,
        change: latestPrice ? latestPrice.close - latestPrice.open : null,
        volume: latestPrice?.volume,
        region: latestPrice?.region,
        lastUpdate: latestPrice?.date,
        symbol: fruit.name.substring(0, 4).toUpperCase(),
      }
    })

    // Get total count for pagination
    const total = await prisma.fruit.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        results,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search fruits',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Save search query for analytics
    const session = await auth()
    const { query, filters, userId } = await request.json()

    // You could save search queries for analytics
    // This is optional but useful for understanding user behavior
    
    const searchLog = {
      userId: session?.user?.id || userId || null,
      query,
      filters: JSON.stringify(filters),
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    }

    // In a real app, you might want to save this to a separate table
    // await prisma.searchLog.create({ data: searchLog })

    console.log('Search performed:', searchLog)

    return NextResponse.json({
      success: true,
      message: 'Search logged successfully'
    })

  } catch (error) {
    console.error('Search logging error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to log search'
      }, 
      { status: 500 }
    )
  }
}