import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if user exists (for debugging purposes only - remove in production)
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        // Do NOT include password here
      }
    });

    if (!user) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({ exists: true, user }, { status: 200 });
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json({ error: 'Failed to check user' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
