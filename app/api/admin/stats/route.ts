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

    // Get total clients
    const totalClients = await prisma.client.count();
    
    // Get total appointments
    const totalAppointments = await prisma.appointment.count();
    
    // Get unique customers
    const totalCustomers = await prisma.customer.count();
    
    // Calculate total revenue from completed appointments
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        status: 'completed'
      },
      include: {
        clientService: true
      }
    });
    
    const revenue = completedAppointments.reduce((total, app) => {
      return total + (app.clientService ? parseFloat(app.clientService.price.toString()) : 0);
    }, 0);
    
    return NextResponse.json({
      totalClients,
      totalAppointments,
      totalCustomers,
      revenue
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to get admin stats' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
