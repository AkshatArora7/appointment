import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Get a specific appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }
    
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        customer: true,
        clientService: {
          include: {
            service: true
          }
        }
      }
    });
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission
    if (
      session.user.role !== 'admin' && 
      session.user.clientId !== appointment.clientId.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update an appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }
    
    // Get the current appointment to check permissions
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id }
    });
    
    if (!currentAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission
    if (
      session.user.role !== 'admin' && 
      session.user.clientId !== currentAppointment.clientId.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    const { status } = body;
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        clientService: {
          include: {
            service: true
          }
        }
      }
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        clientId: currentAppointment.clientId,
        action: `Updated appointment #${id} status to ${status}`,
        ipAddress: request.headers.get('x-forwarded-for') || null
      }
    });
    
    return NextResponse.json({ appointment: updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Cancel an appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }
    
    // Get the current appointment to check permissions
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id }
    });
    
    if (!currentAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission
    if (
      session.user.role !== 'admin' && 
      session.user.clientId !== currentAppointment.clientId.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // We don't actually delete the appointment, we just update the status to 'cancelled'
    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' }
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        clientId: currentAppointment.clientId,
        action: `Cancelled appointment #${id}`,
        ipAddress: request.headers.get('x-forwarded-for') || null
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
