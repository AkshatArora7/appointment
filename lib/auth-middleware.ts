import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../app/api/auth/[...nextauth]/route';
import { Session } from 'next-auth';

type CallbackFunction = (session: Session) => Promise<NextResponse> | NextResponse;

// Middleware to ensure user is authenticated
export async function requireAuth(request: NextRequest, callback: CallbackFunction): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return callback(session);
}

// Middleware to ensure user is an admin
export async function requireAdmin(request: NextRequest, callback: CallbackFunction): Promise<NextResponse> {
  return requireAuth(request, (session) => {
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return callback(session);
  });
}

// Middleware to ensure user is a barber
export async function requireBarber(request: NextRequest, callback: CallbackFunction): Promise<NextResponse> {
  return requireAuth(request, (session) => {
    if (session.user.role !== 'barber' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Barber access required' }, { status: 403 });
    }
    
    return callback(session);
  });
}

// Middleware to ensure user is a client
export async function requireClient(request: NextRequest, callback: CallbackFunction): Promise<NextResponse> {
  return requireAuth(request, (session) => {
    if (session.user.role !== 'client' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Client access required' }, { status: 403 });
    }
    
    return callback(session);
  });
}
