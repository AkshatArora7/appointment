import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Get services for a specific barber
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const barberId = parseInt(params.id);
    
    if (isNaN(barberId)) {
      return NextResponse.json(
        { error: 'Invalid barber ID' },
        { status: 400 }
      );
    }
    
    // If not admin, check if user is the barber
    if (
      session.user.role !== 'admin' && 
      session.user.barberId !== barberId.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get all services for the barber
    const services = await prisma.barberService.findMany({
      where: {
        barberId
      },
      include: {
        service: true
      },
      orderBy: {
        service: {
          name: 'asc'
        }
      }
    });
    
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching barber services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch barber services' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Add a service to a barber
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const barberId = parseInt(params.id);
    
    if (isNaN(barberId)) {
      return NextResponse.json(
        { error: 'Invalid barber ID' },
        { status: 400 }
      );
    }
    
    // If not admin, check if user is the barber
    if (
      session.user.role !== 'admin' && 
      session.user.barberId !== barberId.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    const { serviceId, price } = body;
    
    if (!serviceId || !price) {
      return NextResponse.json(
        { error: 'Service ID and price are required' },
        { status: 400 }
      );
    }
    
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: parseInt(serviceId) }
    });
    
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Check if barber already has this service
    const existingBarberService = await prisma.barberService.findFirst({
      where: {
        barberId,
        serviceId: parseInt(serviceId)
      }
    });
    
    if (existingBarberService) {
      return NextResponse.json(
        { error: 'This service is already added for this barber' },
        { status: 409 }
      );
    }
    
    // Add the service to the barber
    const barberService = await prisma.barberService.create({
      data: {
        barberId,
        serviceId: parseInt(serviceId),
        price: parseFloat(price).toString(),
        active: true
      },
      include: {
        service: true
      }
    });
    
    return NextResponse.json({ barberService }, { status: 201 });
  } catch (error) {
    console.error('Error adding service to barber:', error);
    return NextResponse.json(
      { error: 'Failed to add service to barber' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
