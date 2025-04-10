import { PrismaClient, Service } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

interface ServiceResponse {
  service: Service;
}

interface UpdateServiceBody {
  name: string;
  description?: string;
  duration: string | number;
  price?: string;
}

interface SuccessResponse {
  success: boolean;
}

// Get a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ServiceResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'client')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }
    
    const service = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update a service
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
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, description, duration, price } = body;
    
    if (!name || !duration) {
      return NextResponse.json(
        { error: 'Name and duration are required' },
        { status: 400 }
      );
    }
    
    // Update the service
    const service = await prisma.service.update({
      where: { id },
      data: { 
        name, 
        description,
        duration: parseInt(duration),
        price: price || "0.00"
      }
    });
    
    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SuccessResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid service ID' },
        { status: 400 }
      );
    }
    
    // Check if service is in use
    const clientServices = await prisma.clientService.count({
      where: { serviceId: id }
    });
    
    if (clientServices > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a service that is currently in use by clients' },
        { status: 400 }
      );
    }
    
    // Delete the service
    await prisma.service.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
