import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const clientSlug = searchParams.get('client');
    
    if (!date || !clientSlug) {
      return NextResponse.json(
        { error: 'Date and client are required' },
        { status: 400 }
      );
    }
    
    // Find the client
    const client = await prisma.client.findUnique({
      where: { slug: clientSlug }
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    const selectedDate = new Date(date);
    // Reset time component to ensure date comparison works
    selectedDate.setHours(0, 0, 0, 0);
    
    // Get the next day for date range
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Find all availability slots for the given date and client
    const availabilitySlots = await prisma.availability.findMany({
      where: {
        clientId: client.id,
        date: {
          gte: selectedDate,
          lt: nextDay
        }
      },
      orderBy: {
        time: 'asc'
      }
    });
    
    // Find existing appointments for the given date and client
    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: client.id,
        date: {
          gte: selectedDate,
          lt: nextDay
        },
        status: { not: 'cancelled' }
      }
    });
    
    // Filter out time slots that already have appointments
    const availableSlots = availabilitySlots.filter(
      slot => !appointments.some(apt => apt.time === slot.time)
    ).map(slot => slot.time);
    
    // Get client services
    const services = await prisma.clientService.findMany({
      where: {
        clientId: client.id,
        active: true
      },
      include: {
        service: true
      }
    });
    
    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        bio: client.bio,
        slug: client.slug
      },
      availableSlots,
      services
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
