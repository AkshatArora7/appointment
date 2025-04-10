import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

// Get all clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const clients = await prisma.client.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            createdAt: true,
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

// Create a new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    const { username, password, email, name, bio, slug, clientTypeId } = body;
    
    // Validate required fields
    if (!username || !password || !email || !name || !slug || !clientTypeId) {
      return NextResponse.json(
        { error: 'All required fields must be provided (including clientTypeId)' },
        { status: 400 }
      );
    }
    
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }
    
    // Check if slug is unique
    const existingClient = await prisma.client.findUnique({
      where: { slug }
    });
    
    if (existingClient) {
      return NextResponse.json(
        { error: 'This slug is already in use' },
        { status: 409 }
      );
    }
    
    // Create the user and client in a transaction
    const hashedPassword = await hashPassword(password);
    
    const result = await prisma.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: 'client'
        }
      });
      
      // Create client
      const client = await prisma.client.create({
        data: {
          name,
          bio,
          slug,
          userId: user.id,
          clientTypeId: parseInt(clientTypeId)
        }
      });
      
      return { user, client };
    });
    
    // Create audit log for this action
    await prisma.auditLog.create({
      data: {
        clientId: result.client.id,
        action: `Admin created client account for ${name}`,
        details: `Created by admin ${session.user.name}`,
        ipAddress: request.headers.get('x-forwarded-for') || null
      }
    });
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email
      },
      client: result.client
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
