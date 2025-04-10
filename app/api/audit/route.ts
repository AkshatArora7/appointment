import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { clientId, action, details } = body;
    
    if (!clientId || !action) {
      return NextResponse.json(
        { error: 'Client ID and action are required' },
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
    
    // Create the audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        clientId: parseInt(clientId.toString()),
        action,
        details: details || null,
        ipAddress: request.headers.get('x-forwarded-for') || null
      }
    });
    
    return NextResponse.json({ success: true, auditLog });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<{auditLogs?: any[], error?: string}>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const barberId = searchParams.get('barberId');

    if (!barberId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Check if user has permission to access this barber's logs
    if (
      session.user.role !== 'admin' && 
      session.user.clientId !== barberId
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        clientId: parseInt(barberId)
      },
      orderBy: {
        actionDate: 'desc'
      },
      take: 100
    });
    
    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
