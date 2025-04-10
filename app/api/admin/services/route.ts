import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'barber')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get all services
    const services = await prisma.service.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Add a new service (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, description, duration, price } = body;
    
    // Validate required fields
    if (!name || !duration) {
      return NextResponse.json(
        { error: 'Name and duration are required' },
        { status: 400 }
      );
    }
    
    // Create the service
    const service = await prisma.service.create({
      data: {
        name,
        description,
        duration: parseInt(duration),
        price: price || "0.00"  // Use the provided price or default
      }
    });
    
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
