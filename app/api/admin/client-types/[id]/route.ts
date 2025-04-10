import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Get a specific client type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid client type ID' },
        { status: 400 }
      );
    }
    
    const clientType = await prisma.clientType.findUnique({
      where: { id },
      include: {
        clients: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
    
    if (!clientType) {
      return NextResponse.json(
        { error: 'Client type not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ clientType });
  } catch (error) {
    console.error('Error fetching client type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client type' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update a client type
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid client type ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Check if another client type with this name already exists
    const existingType = await prisma.clientType.findFirst({
      where: { 
        name,
        id: { not: id } 
      }
    });
    
    if (existingType) {
      return NextResponse.json(
        { error: 'Another client type with this name already exists' },
        { status: 409 }
      );
    }
    
    // Update the client type
    const clientType = await prisma.clientType.update({
      where: { id },
      data: { name, description }
    });
    
    return NextResponse.json({ clientType });
  } catch (error) {
    console.error('Error updating client type:', error);
    return NextResponse.json(
      { error: 'Failed to update client type' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a client type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid client type ID' },
        { status: 400 }
      );
    }
    
    // Check if this client type is in use
    const clientCount = await prisma.client.count({
      where: { clientTypeId: id }
    });
    
    if (clientCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client type that is in use' },
        { status: 400 }
      );
    }
    
    // Delete the client type
    await prisma.clientType.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client type:', error);
    return NextResponse.json(
      { error: 'Failed to delete client type' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
