import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Get all client types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const clientTypes = await prisma.clientType.findMany({
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({ clientTypes });
  } catch (error) {
    console.error('Error fetching client types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client types' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Create a new client type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Check if client type with this name already exists
    const existingType = await prisma.clientType.findFirst({
      where: { name }
    });
    
    if (existingType) {
      return NextResponse.json(
        { error: 'A client type with this name already exists' },
        { status: 409 }
      );
    }
    
    // Create the client type
    const clientType = await prisma.clientType.create({
      data: { name, description }
    });
    
    return NextResponse.json({ clientType }, { status: 201 });
  } catch (error) {
    console.error('Error creating client type:', error);
    return NextResponse.json(
      { error: 'Failed to create client type' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
