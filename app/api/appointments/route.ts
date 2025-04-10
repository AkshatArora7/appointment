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
    const dateParam = searchParams.get('date');
    const clientIdParam = searchParams.get('clientId') || session.user.clientId;
    const statusParam = searchParams.get('status');
    
    if (!clientIdParam) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has permission
    if (
      session.user.role !== 'admin' && 
      session.user.clientId !== clientIdParam.toString()
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const clientId = parseInt(clientIdParam.toString());
    
    // Build where clause for filtering
    const whereClause: any = { clientId };
    
    if (dateParam) {
      const selectedDate = new Date(dateParam);
      
      // Reset time component for date comparison
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }
    
    if (statusParam && statusParam !== 'all') {
      whereClause.status = statusParam;
    }
    
    // Get all appointments matching the criteria
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        customer: true,
        clientService: {
          include: {
            service: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });
    
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
