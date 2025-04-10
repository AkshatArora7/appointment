import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const clientIdParam = searchParams.get('clientId');
    const statusParam = searchParams.get('status');
    
    // Build the where clause
    let whereClause: any = {};
    
    if (dateParam) {
      const date = new Date(dateParam);
      
      // Set hours, minutes, seconds, and milliseconds to 0 for date comparison
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay
      };
    }
    
    if (clientIdParam && clientIdParam !== 'all') {
      whereClause.clientId = parseInt(clientIdParam);
    }
    
    if (statusParam && statusParam !== 'all') {
      whereClause.status = statusParam;
    }
    
    // Get appointments that match the filters
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            name: true,
            slug: true
          }
        },
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
    console.error('Error getting admin appointments:', error);
    return NextResponse.json(
      { error: 'Failed to get appointments' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
