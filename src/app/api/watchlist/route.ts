import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const watchlistItems = await prisma.watchlist.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        fruit: {
          include: {
            prices: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    const formattedItems = watchlistItems.map(item => {
      const latestPrice = item.fruit.prices[0]
      
      return {
        id: item.id,
        fruitId: item.fruit.id,
        symbol: item.fruit.name.substring(0, 4).toUpperCase(),
        name: item.fruit.name,
        category: item.fruit.category,
        currentPrice: latestPrice?.close,
        change: latestPrice ? latestPrice.close - latestPrice.open : null,
        volume: latestPrice?.volume,
        lastUpdate: latestPrice?.date,
        addedDate: item.createdAt,
        order: item.order
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedItems
    })

  } catch (error) {
    console.error('Watchlist GET error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch watchlist',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { fruitId, order } = await request.json()

    if (!fruitId) {
      return NextResponse.json(
        { error: 'Fruit ID is required' },
        { status: 400 }
      )
    }

    // Check if fruit exists
    const fruit = await prisma.fruit.findUnique({
      where: { id: fruitId }
    })

    if (!fruit) {
      return NextResponse.json(
        { error: 'Fruit not found' },
        { status: 404 }
      )
    }

    // Check if already in watchlist
    const existingItem = await prisma.watchlist.findUnique({
      where: {
        userId_fruitId: {
          userId: session.user.id,
          fruitId: fruitId
        }
      }
    })

    if (existingItem) {
      return NextResponse.json(
        { error: 'Fruit already in watchlist' },
        { status: 409 }
      )
    }

    // Get the next order number
    const lastItem = await prisma.watchlist.findFirst({
      where: { userId: session.user.id },
      orderBy: { order: 'desc' }
    })

    const nextOrder = order !== undefined ? order : (lastItem?.order || 0) + 1

    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        fruitId,
        order: nextOrder
      },
      include: {
        fruit: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: watchlistItem.id,
        fruitId: watchlistItem.fruit.id,
        symbol: watchlistItem.fruit.name.substring(0, 4).toUpperCase(),
        name: watchlistItem.fruit.name,
        category: watchlistItem.fruit.category,
        addedDate: watchlistItem.createdAt,
        order: watchlistItem.order
      }
    })

  } catch (error) {
    console.error('Watchlist POST error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add to watchlist',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    // Update order for multiple items
    const updatePromises = items.map((item: { id: string; order: number }) =>
      prisma.watchlist.update({
        where: {
          id: item.id,
          userId: session.user.id // Ensure user can only update their own items
        },
        data: { order: item.order }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: 'Watchlist order updated'
    })

  } catch (error) {
    console.error('Watchlist PUT error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update watchlist order',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { searchParams } = request.nextUrl
    const itemId = searchParams.get('id')
    const fruitId = searchParams.get('fruitId')

    if (!itemId && !fruitId) {
      return NextResponse.json(
        { error: 'Item ID or Fruit ID is required' },
        { status: 400 }
      )
    }

    let whereClause: any = {
      userId: session.user.id
    }

    if (itemId) {
      whereClause.id = itemId
    } else if (fruitId) {
      whereClause.fruitId = fruitId
    }

    const deletedItem = await prisma.watchlist.delete({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      message: 'Item removed from watchlist',
      data: { id: deletedItem.id }
    })

  } catch (error) {
    console.error('Watchlist DELETE error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to remove from watchlist',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}