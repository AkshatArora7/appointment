import { PrismaClient, Availability } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

interface AvailabilityRequest {
  date: string;
  time: string;
  clientId?: number;
}

interface AvailabilityResponse {
  success: boolean;
  message: string;
  availability: Availability;
}

export async function POST(request: NextRequest): Promise<NextResponse<AvailabilityResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as AvailabilityRequest;
    const { date, time, clientId } = body;
    
    if (!date || !time) {
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 }
      );
    }

    // Type guard to ensure clientId is properly handled
    let clientIdToUse: number;

    if (clientId !== undefined) {
      clientIdToUse = clientId;
    } else {
      if (session.user.role !== 'client' || !session.user.clientId) {
        return NextResponse.json(
          { error: 'Client ID is required' },
          { status: 400 }
        );
      }
      const parsedClientId = parseInt(session.user.clientId);
      if (isNaN(parsedClientId)) {
        return NextResponse.json(
          { error: 'Invalid client ID' },
          { status: 400 }
        );
      }
      clientIdToUse = parsedClientId;
    }
    
    // Check if user has permission to set availability for this client
    if (
      session.user.role !== 'admin' && 
      session.user.clientId !== clientIdToUse.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check for duplicate availability
    const parsedDate = new Date(date);
    
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        date: {
          equals: parsedDate
        },
        time: time,
        clientId: clientIdToUse
      }
    });
    
    if (existingAvailability) {
      return NextResponse.json(
        { error: 'This time slot is already marked as available' },
        { status: 409 }
      );
    }
    
    const availability = await prisma.availability.create({
      data: { 
        date: parsedDate, 
        time,
        clientId: clientIdToUse
      },
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        clientId: clientIdToUse,
        action: `Added availability for ${parsedDate.toDateString()} at ${time}`,
        ipAddress: request.headers.get('x-forwarded-for') || null
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Availability set successfully',
      availability 
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error setting availability:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to set availability' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
