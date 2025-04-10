import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { sendAppointmentConfirmation, sendBarberNotification } from '@/lib/email';
import { format, addMinutes, parseISO, isValid } from 'date-fns';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, time, name, email, phone, barberSlug, serviceId } = body;
    
    // Validate all required fields
    if (!date || !time || !name || !email || !phone || !barberSlug) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Check if service ID is provided and valid
    let barberServiceId = null;
    let serviceName = 'Regular cut';
    let serviceDuration = 30;
    let servicePrice = '0.00';
    
    if (serviceId) {
      // Find the barber first
      const barber = await prisma.barber.findUnique({
        where: { slug: barberSlug }
      });
      
      if (!barber) {
        return NextResponse.json(
          { error: 'Barber not found' },
          { status: 404 }
        );
      }
      
      // Find the barber service
      const barberService = await prisma.barberService.findFirst({
        where: {
          barberId: barber.id,
          serviceId: parseInt(serviceId.toString()),
          active: true
        },
        include: {
          service: true
        }
      });
      
      if (!barberService) {
        return NextResponse.json(
          { error: 'Service not available for this barber' },
          { status: 400 }
        );
      }
      
      barberServiceId = barberService.id;
      serviceName = barberService.service.name;
      serviceDuration = barberService.service.duration;
      servicePrice = barberService.price.toString();
    }
    
    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        email,
        phone
      }
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          email,
          phone
        }
      });
    }
    
    // Find barber
    const barber = await prisma.barber.findUnique({
      where: { slug: barberSlug },
      include: {
        user: true
      }
    });
    
    if (!barber) {
      return NextResponse.json(
        { error: 'Barber not found' },
        { status: 404 }
      );
    }

    // Calculate service end time based on duration
    const dateTimeString = `${date}T${time}`;
    const startDateTime = parseISO(dateTimeString);
    
    // Validate that the date is valid before proceeding
    if (!isValid(startDateTime)) {
      return NextResponse.json(
        { error: 'Invalid date or time format' },
        { status: 400 }
      );
    }
    
    const endDateTime = addMinutes(startDateTime, serviceDuration);
    
    // Check availability for all time slots needed for this service
    const availabilityForDuration = await prisma.availability.findMany({
      where: {
        barberId: barber.id,
        date: {
          equals: new Date(date)
        },
        // Get all time slots that fall within the service duration
        time: {
          gte: time,
          lt: format(endDateTime, 'HH:mm')
        }
      }
    });
    
    // Check if we have enough consecutive time slots for the service duration
    const requiredTimeSlots = Math.ceil(serviceDuration / 30); // Assuming 30-min slots
    if (availabilityForDuration.length < requiredTimeSlots) {
      return NextResponse.json(
        { error: 'The selected time slot doesn\'t have enough availability for this service' },
        { status: 400 }
      );
    }
    
    // Check if any time slot within the service duration is already booked
    const overlappingAppointment = await prisma.appointment.findFirst({
      where: {
        barberId: barber.id,
        date: {
          equals: new Date(date)
        },
        status: { not: 'cancelled' },
        OR: [
          // Appointment starts during our service time
          {
            time: {
              gte: time,
              lt: format(endDateTime, 'HH:mm')
            }
          },
          // Our service starts during another appointment time
          {
            AND: [
              { time: { lt: time } },
              {
                time: {
                  gte: format(
                    addMinutes(
                      parseISO(`${date}T${time}`), 
                      -serviceDuration
                    ),
                    'HH:mm'
                  )
                }
              }
            ]
          }
        ]
      },
      include: {
        barberService: {
          include: {
            service: true
          }
        }
      }
    });
    
    if (overlappingAppointment) {
      return NextResponse.json(
        { error: 'This time slot conflicts with an existing appointment' },
        { status: 409 }
      );
    }
    
    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        time: time,
        status: 'scheduled',
        customerId: customer.id,
        barberId: barber.id,
        barberServiceId: barberServiceId
      }
    });
    
    // Format date for email
    const formattedDate = format(new Date(date), 'MMMM d, yyyy');
    
    // Send confirmation email to customer
    await sendAppointmentConfirmation(email, {
      date: formattedDate,
      time: time,
      barberName: barber.name,
      serviceName,
      duration: serviceDuration,
      price: servicePrice,
      customerName: name
    });
    
    // Send notification email to barber
    await sendBarberNotification(barber.user.email, {
      date: formattedDate,
      time: time,
      barberName: barber.name,
      serviceName,
      duration: serviceDuration,
      customerName: name,
      customerEmail: email,
      customerPhone: phone
    });
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        barberId: barber.id,
        action: `New appointment booked`,
        details: `Customer: ${name}, Date: ${formattedDate}, Time: ${time}`,
        ipAddress: request.headers.get('x-forwarded-for') || null
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status
      }
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { error: 'Failed to book appointment' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
