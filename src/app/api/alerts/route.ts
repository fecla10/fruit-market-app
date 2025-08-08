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

    const { searchParams } = request.nextUrl
    const active = searchParams.get('active')
    const triggered = searchParams.get('triggered')

    let where: any = {
      userId: session.user.id
    }

    if (active === 'true') {
      where.active = true
    } else if (active === 'false') {
      where.active = false
    }

    if (triggered === 'true') {
      where.triggered = true
    } else if (triggered === 'false') {
      where.triggered = false
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: alerts
    })

  } catch (error) {
    console.error('Alerts GET error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch alerts',
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

    const { fruitId, type, threshold, condition, active = true } = await request.json()

    if (!fruitId || !type || threshold === undefined || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields: fruitId, type, threshold, condition' },
        { status: 400 }
      )
    }

    // Validate alert type
    const validTypes = ['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE', 'VOLUME_SPIKE']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      )
    }

    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id,
        fruitId,
        type,
        threshold: parseFloat(threshold),
        condition,
        active
      }
    })

    return NextResponse.json({
      success: true,
      data: alert
    })

  } catch (error) {
    console.error('Alert POST error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create alert',
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

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    // Ensure user can only update their own alerts
    const existingAlert = await prisma.alert.findUnique({
      where: { id, userId: session.user.id }
    })

    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedAlert
    })

  } catch (error) {
    console.error('Alert PUT error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update alert',
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    // Ensure user can only delete their own alerts
    const deletedAlert = await prisma.alert.delete({
      where: {
        id,
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
      data: { id: deletedAlert.id }
    })

  } catch (error) {
    console.error('Alert DELETE error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}