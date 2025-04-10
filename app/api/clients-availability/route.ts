import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const barberIdParam = searchParams.get('barberId') || session.user.barberId;
    const dateParam = searchParams.get('date');
    
    if (!barberIdParam) {
      return NextResponse.json(
        { error: 'Barber ID is required' },
        { status: 400 }
      );
    }
    
    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }
    
    // Check if user has permission
    if (
      session.user.role !== 'admin' && 
      session.user.barberId !== barberIdParam.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const barberId = parseInt(barberIdParam.toString());
    const selectedDate = new Date(dateParam);
    
    // Reset time component for date comparison
    selectedDate.setHours(0, 0, 0, 0);
    
    // Get the next day for date range
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Get barber's availability for that date
    const availability = await prisma.availability.findMany({
      where: {
        barberId,
        date: {
          gte: selectedDate,
          lt: nextDay
        }
      },
      orderBy: {
        time: 'asc'
      }
    });
    
    // Get appointments for that date
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        date: {
          gte: selectedDate,
          lt: nextDay
        },
        status: { not: 'cancelled' }
      },
      select: {
        time: true
      }
    });
    
    // Get taken time slots
    const takenSlots = appointments.map(appt => appt.time);
    
    // Filter out time slots that already have appointments
    const availableSlots = availability.filter(slot => 
      !takenSlots.includes(slot.time)
    );
    
    return NextResponse.json({
      availability: availableSlots,
      bookedSlots: takenSlots
    });
  } catch (error) {
    console.error('Error fetching barber availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
