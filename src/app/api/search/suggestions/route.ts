import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const q = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          fruits: [],
          categories: [],
          regions: []
        }
      })
    }

    // Search for fruits
    const fruits = await prisma.fruit.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { variety: { contains: q, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        category: true,
        variety: true,
        prices: {
          select: {
            close: true,
            date: true,
          },
          orderBy: { date: 'desc' },
          take: 1,
        }
      },
      take: limit,
      orderBy: { name: 'asc' }
    })

    // Get unique categories that match
    const categories = await prisma.fruit.findMany({
      where: {
        category: { contains: q, mode: 'insensitive' }
      },
      select: { category: true },
      distinct: ['category'],
      take: 5,
      orderBy: { category: 'asc' }
    })

    // Get unique regions that match (from price data)
    const regions = await prisma.price.findMany({
      where: {
        region: { contains: q, mode: 'insensitive' }
      },
      select: { region: true },
      distinct: ['region'],
      take: 5,
      orderBy: { region: 'asc' }
    })

    // Format fruit suggestions
    const fruitSuggestions = fruits.map(fruit => ({
      id: fruit.id,
      name: fruit.name,
      category: fruit.category,
      variety: fruit.variety,
      currentPrice: fruit.prices[0]?.close,
      type: 'fruit' as const
    }))

    // Format category suggestions
    const categorySuggestions = categories.map(cat => ({
      name: cat.category,
      type: 'category' as const
    }))

    // Format region suggestions
    const regionSuggestions = regions
      .filter(r => r.region) // Filter out null regions
      .map(reg => ({
        name: reg.region!,
        type: 'region' as const
      }))

    return NextResponse.json({
      success: true,
      data: {
        fruits: fruitSuggestions,
        categories: categorySuggestions,
        regions: regionSuggestions,
        total: fruitSuggestions.length + categorySuggestions.length + regionSuggestions.length
      }
    })

  } catch (error) {
    console.error('Search suggestions API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get search suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}