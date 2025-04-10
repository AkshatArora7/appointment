import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { startOfDay, endOfDay, addDays } from 'date-fns';

const prisma = new PrismaClient();

// Define the type for the count query result
type CountResult = {
  count: number | bigint;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const barberId = searchParams.get('barberId') || session.user.barberId;
    
    if (!barberId) {
      return NextResponse.json(
        { error: 'Barber ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has permission
    if (
      session.user.role !== 'admin' && 
      session.user.barberId !== barberId.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    // Today's appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        barberId: parseInt(barberId.toString()),
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today)
        }
      }
    });
    
    // Upcoming appointments (excluding today)
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        barberId: parseInt(barberId.toString()),
        date: {
          gte: startOfDay(tomorrow)
        },
        status: 'scheduled'
      }
    });
    
    // Total unique customers
    const totalCustomers = await prisma.$queryRaw<CountResult[]>`
      SELECT COUNT(DISTINCT "customerId") as count 
      FROM "Appointment" 
      WHERE "barberId" = ${parseInt(barberId.toString())}
    `;
    
    // Total revenue
    const revenue = await prisma.appointment.findMany({
      where: {
        barberId: parseInt(barberId.toString()),
        status: 'completed'
      },
      include: {
        barberService: true
      }
    }).then(appointments => 
      appointments.reduce((total, app) => 
        total + (app.barberService ? parseFloat(app.barberService.price.toString()) : 0)
      , 0)
    );
    
    return NextResponse.json({
      todayAppointments,
      upcomingAppointments,
      totalCustomers: Number(totalCustomers[0].count),
      revenue
    });
  } catch (error) {
    console.error('Error fetching barber stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch barber stats' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
