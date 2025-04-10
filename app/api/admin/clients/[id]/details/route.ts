import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Safely resolve params if it's a promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const clientId = parseInt(resolvedParams.id);
    
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }
    
    // Get the client's basic information
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    // Get client's services
    const services = await prisma.clientService.findMany({
      where: { 
        clientId,
        active: true
      },
      include: {
        service: true
      }
    });
    
    // Get recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      where: { clientId },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 5
    });
    
    // Get appointment statistics
    const totalAppointments = await prisma.appointment.count({
      where: { clientId }
    });
    
    const completedAppointments = await prisma.appointment.count({
      where: { 
        clientId,
        status: 'completed'
      }
    });
    
    const cancelledAppointments = await prisma.appointment.count({
      where: { 
        clientId,
        status: 'cancelled'
      }
    });
    
    // Calculate revenue from completed appointments
    const revenue = await prisma.appointment.findMany({
      where: { 
        clientId,
        status: 'completed'
      },
      include: {
        clientService: true
      }
    }).then(appointments => 
      appointments.reduce((total, app) => 
        total + (app.clientService ? parseFloat(app.clientService.price.toString()) : 0)
      , 0)
    );
    
    // Get recent audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { clientId },
      orderBy: { actionDate: 'desc' },
      take: 5
    });
    
    return NextResponse.json({
      client: {
        ...client,
        services,
        recentAppointments,
        auditLogs,
        stats: {
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          revenue
        }
      }
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client details' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
