import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

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
        { error: 'Invalid availability ID' },
        { status: 400 }
      );
    }
    
    const availability = await prisma.availability.findUnique({
      where: { id }
    });
    
    if (!availability) {
      return NextResponse.json(
        { error: 'Availability not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission
    if (
      session.user.role !== 'admin' && 
      session.user.clientId !== availability.clientId.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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
        { error: 'Invalid availability ID' },
        { status: 400 }
      );
    }
    
    // Get the availability to check permissions
    const availability = await prisma.availability.findUnique({
      where: { id }
    });
    
    if (!availability) {
      return NextResponse.json(
        { error: 'Availability not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission
    if (
      session.user.role !== 'admin' && 
      session.user.clientId !== availability.clientId.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Delete the availability slot
    await prisma.availability.delete({
      where: { id }
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        clientId: availability.clientId,
        action: `Removed availability for ${new Date(availability.date).toDateString()} at ${availability.time}`,
        ipAddress: request.headers.get('x-forwarded-for') || null
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting availability:', error);
    return NextResponse.json(
      { error: 'Failed to delete availability' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
