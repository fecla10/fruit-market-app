import { NextRequest, NextResponse } from 'next/server'
import { usdaService } from '@/services/usda.service'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { fruitNames } = await request.json()
    
    if (!fruitNames || !Array.isArray(fruitNames)) {
      return NextResponse.json(
        { error: 'Invalid fruit names provided' }, 
        { status: 400 }
      )
    }

    // Sync fruit data from USDA
    const usdaFruits = await usdaService.batchUpdateFruits(fruitNames)
    const syncedFruits = []

    for (const usdaFruit of usdaFruits) {
      try {
        // Check if fruit already exists
        let fruit = await prisma.fruit.findUnique({
          where: { name: usdaFruit.name }
        })

        if (!fruit) {
          // Create new fruit
          fruit = await prisma.fruit.create({
            data: {
              name: usdaFruit.name,
              category: usdaFruit.category,
              unit: usdaFruit.unit,
              description: `Sourced from USDA database`,
              metadata: {
                usdaId: usdaFruit.id,
                source: usdaFruit.source,
              }
            }
          })
        }

        // Generate and store price data
        const priceData = await usdaService.getFruitPrices([usdaFruit.id])
        
        if (priceData.length > 0) {
          const price = priceData[0]
          await prisma.price.create({
            data: {
              fruitId: fruit.id,
              open: price.open,
              high: price.high,
              low: price.low,
              close: price.close,
              volume: price.volume,
              date: price.date,
              source: price.source,
              region: price.region,
            }
          })
        }

        syncedFruits.push(fruit)
      } catch (error) {
        console.error(`Error syncing fruit ${usdaFruit.name}:`, error)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedFruits.length} fruits from USDA`,
      data: {
        syncedCount: syncedFruits.length,
        totalRequested: fruitNames.length,
        fruits: syncedFruits.map(f => ({ id: f.id, name: f.name }))
      }
    })

  } catch (error) {
    console.error('USDA sync error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync USDA data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Get sync status
    const lastSync = await prisma.fruit.findFirst({
      where: {
        metadata: {
          path: ['source'],
          equals: 'USDA'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const totalFruits = await prisma.fruit.count({
      where: {
        metadata: {
          path: ['source'],
          equals: 'USDA'
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        lastSync: lastSync?.createdAt,
        totalUsdaFruits: totalFruits,
        apiConnected: await usdaService.validateConnection()
      }
    })

  } catch (error) {
    console.error('USDA sync status error:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' }, 
      { status: 500 }
    )
  }
}