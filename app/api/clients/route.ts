import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get all active clients with their services
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        bio: true,
        slug: true,
        clientServices: {
          where: {
            active: true
          },
          select: {
            id: true,
            price: true,
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                description: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
