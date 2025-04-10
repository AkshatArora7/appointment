import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

interface AuditLogWhereClause {
  clientId?: number;
  OR?: Array<{
    action?: {
      contains: string;
      mode: 'insensitive';
    };
    details?: {
      contains: string;
      mode: 'insensitive';
    };
  }>;
}

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const clientIdParam = searchParams.get('clientId');
    const searchQuery = searchParams.get('search');
    
    // Build where clause for filtering
    const whereClause: AuditLogWhereClause = {};
    
    if (clientIdParam && clientIdParam !== 'all') {
      whereClause.clientId = parseInt(clientIdParam);
    }
    
    if (searchQuery) {
      whereClause.OR = [
        {
          action: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        },
        {
          details: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        }
      ];
    }
    
    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: {
        actionDate: 'desc'
      },
      include: {
        client: {
          select: {
            name: true
          }
        }
      },
      take: 1000 // Limit results
    });
    
    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
