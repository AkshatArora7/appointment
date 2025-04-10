import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Update a barber service (price or active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const barberId = parseInt(params.id);
    const barberServiceId = parseInt(params.serviceId);
    
    if (isNaN(barberId) || isNaN(barberServiceId)) {
      return NextResponse.json(
        { error: 'Invalid IDs' },
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
    
    // Get the barber service first to check ownership
    const existingBarberService = await prisma.barberService.findUnique({
      where: { id: barberServiceId }
    });
    
    if (!existingBarberService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    if (existingBarberService.barberId !== barberId) {
      return NextResponse.json(
        { error: 'This service does not belong to this barber' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const updateData: Record<string, any> = {};
    
    // Only allow updating price or active status
    if (body.price !== undefined) {
      updateData.price = parseFloat(body.price).toString();
    }
    
    if (body.active !== undefined) {
      updateData.active = body.active;
    }
    
    // Update the barber service
    const barberService = await prisma.barberService.update({
      where: { id: barberServiceId },
      data: updateData,
      include: {
        service: true
      }
    });
    
    return NextResponse.json({ barberService });
  } catch (error) {
    console.error('Error updating barber service:', error);
    return NextResponse.json(
      { error: 'Failed to update barber service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a barber service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const barberId = parseInt(params.id);
    const barberServiceId = parseInt(params.serviceId);
    
    if (isNaN(barberId) || isNaN(barberServiceId)) {
      return NextResponse.json(
        { error: 'Invalid IDs' },
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
    
    // Get the barber service first to check ownership
    const existingBarberService = await prisma.barberService.findUnique({
      where: { id: barberServiceId }
    });
    
    if (!existingBarberService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    if (existingBarberService.barberId !== barberId) {
      return NextResponse.json(
        { error: 'This service does not belong to this barber' },
        { status: 403 }
      );
    }
    
    // Delete the barber service
    await prisma.barberService.delete({
      where: { id: barberServiceId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting barber service:', error);
    return NextResponse.json(
      { error: 'Failed to delete barber service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
