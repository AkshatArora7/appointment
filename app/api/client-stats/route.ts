import { PrismaClient, Appointment, ClientService } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import { ClientStats } from '@/types/interfaces';

const prisma = new PrismaClient();

// Define the type for the count query result
type CountResult = {
  count: number | bigint;
};

interface ClientStatsResponse extends ClientStats {}

export async function GET(request: NextRequest): Promise<NextResponse<ClientStatsResponse | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId') || session.user.clientId;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has permission
    if (
      session.user.role !== 'admin' && 
      session.user.clientId !== clientId.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const clientIdNum = parseInt(clientId.toString());
    
    // Today's appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        clientId: clientIdNum,
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today)
        }
      }
    });
    
    // Upcoming appointments (excluding today)
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        clientId: clientIdNum,
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
      WHERE "clientId" = ${clientIdNum}
    `;
    
    // Total revenue
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        clientId: clientIdNum,
        status: 'completed'
      },
      include: {
        clientService: true
      }
    });
    
    const revenue = completedAppointments.reduce((total, app) => {
      if (!app.clientService) return total;
      const price = parseFloat(app.clientService.price);
      return isNaN(price) ? total : total + price;
    }, 0);
    
    return NextResponse.json({
      todayAppointments,
      upcomingAppointments,
      totalCustomers: Number(totalCustomers[0].count),
      revenue
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client stats' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
