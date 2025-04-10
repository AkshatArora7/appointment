import { PrismaClient, Service } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seeding...')

  // Clean up existing data
  await prisma.appointment.deleteMany({})
  await prisma.availability.deleteMany({})
  await prisma.auditLog.deleteMany({})
  await prisma.clientService.deleteMany({})
  await prisma.customer.deleteMany({})
  await prisma.client.deleteMany({})
  await prisma.service.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.clientType.deleteMany({})

  console.log('Database cleared. Creating new seed data...')

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    }
  })
  console.log(`Created admin user: ${admin.username}`)

  // Create client types
  const clientTypes = await prisma.clientType.createMany({
    data: [
      { name: 'Salon', description: 'Hair salon services' },
      { name: 'Barber Shop', description: 'Traditional barbering services' },
      { name: 'Spa', description: 'Wellness and relaxation services' },
      { name: 'Nail Salon', description: 'Nail care services' }
    ]
  })
  console.log(`Created ${clientTypes.count} client types`)

  // Get the created client types for reference
  const salonType = await prisma.clientType.findFirst({ where: { name: 'Salon' } })
  const barberType = await prisma.clientType.findFirst({ where: { name: 'Barber Shop' } })
  const spaType = await prisma.clientType.findFirst({ where: { name: 'Spa' } })

  if (!salonType || !barberType || !spaType) {
    throw new Error('Failed to create client types')
  }

  // Create client users
  const clients = []
  const clientUsers = [
    { username: 'salon1', name: 'City Salon', slug: 'city-salon', typeId: salonType.id },
    { username: 'barber1', name: 'Classic Cuts', slug: 'classic-cuts', typeId: barberType.id },
    { username: 'spa1', name: 'Tranquil Spa', slug: 'tranquil-spa', typeId: spaType.id }
  ]

  for (const clientData of clientUsers) {
    const password = await hashPassword('password123')
    const user = await prisma.user.create({
      data: {
        username: clientData.username,
        email: `${clientData.username}@example.com`,
        password: password,
        role: 'client'
      }
    })

    const client = await prisma.client.create({
      data: {
        name: clientData.name,
        bio: `Professional ${clientData.name} providing quality services`,
        slug: clientData.slug,
        clientTypeId: clientData.typeId,
        userId: user.id
      }
    })

    clients.push(client)
    console.log(`Created client: ${client.name}`)
  }

  // Create services
  const services = await prisma.service.createMany({
    data: [
      { name: 'Haircut', description: 'Basic haircut service', duration: 30, price: '30.00' },
      { name: 'Hair Coloring', description: 'Full hair coloring service', duration: 90, price: '85.00' },
      { name: 'Beard Trim', description: 'Beard grooming and shaping', duration: 15, price: '15.00' },
      { name: 'Shave', description: 'Traditional straight razor shave', duration: 30, price: '25.00' },
      { name: 'Massage', description: 'Relaxing full body massage', duration: 60, price: '70.00' },
      { name: 'Facial', description: 'Refreshing facial treatment', duration: 45, price: '50.00' }
    ]
  })
  console.log(`Created ${services.count} services`)

  // Retrieve all services
  const allServices = await prisma.service.findMany()
  
  // Associate services with clients based on their type
  for (const client of clients) {
    let clientServices: Service[] = []
    
    if (client.clientTypeId === salonType.id) {
      // Salon offers haircuts and coloring
      clientServices = allServices.filter(s => 
        ['Haircut', 'Hair Coloring'].includes(s.name)
      )
    } else if (client.clientTypeId === barberType.id) {
      // Barber shop offers haircuts, beard trims and shaves
      clientServices = allServices.filter(s => 
        ['Haircut', 'Beard Trim', 'Shave'].includes(s.name)
      )
    } else if (client.clientTypeId === spaType.id) {
      // Spa offers massages and facials
      clientServices = allServices.filter(s => 
        ['Massage', 'Facial'].includes(s.name)
      )
    }
    
    // Create client service associations
    for (const service of clientServices) {
      await prisma.clientService.create({
        data: {
          clientId: client.id,
          serviceId: service.id,
          price: service.price,
          active: true
        }
      })
    }
    
    console.log(`Associated ${clientServices.length} services with ${client.name}`)
  }

  // Create sample customers
  const customers = await prisma.customer.createMany({
    data: [
      { name: 'John Doe', email: 'john@example.com', phone: '555-123-4567' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '555-987-6543' },
      { name: 'Mike Johnson', email: 'mike@example.com', phone: '555-456-7890' }
    ]
  })
  console.log(`Created ${customers.count} customers`)

  // Create sample availability for the first client over the next 7 days
  const firstClient = clients[0]
  const today = new Date()
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    // Skip Sundays (day 0)
    if (date.getDay() === 0) continue
    
    // Create availability from 9 AM to 5 PM with 30-minute slots
    for (let hour = 9; hour < 17; hour++) {
      for (let minute of [0, 30]) {
        const timeStr = `${hour}:${minute === 0 ? '00' : minute}`
        const formattedTime = `${hour > 12 ? hour - 12 : hour}:${minute === 0 ? '00' : minute} ${hour >= 12 ? 'PM' : 'AM'}`
        
        await prisma.availability.create({
          data: {
            clientId: firstClient.id,
            date: date,
            time: formattedTime
          }
        })
      }
    }
  }
  
  console.log(`Created availability for ${firstClient.name} for the next 7 days`)

  // Create a sample appointment
  const customer = await prisma.customer.findFirst()
  const clientService = await prisma.clientService.findFirst({
    where: { clientId: firstClient.id }
  })
  
  if (customer && clientService) {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    await prisma.appointment.create({
      data: {
        clientId: firstClient.id,
        customerId: customer.id,
        clientServiceId: clientService.id,
        date: tomorrow,
        time: '10:00 AM',
        status: 'scheduled'
      }
    })
    
    console.log('Created sample appointment for tomorrow')
  }

  // Create an audit log entry
  await prisma.auditLog.create({
    data: {
      clientId: firstClient.id,
      action: 'System initialization',
      details: 'Initial system setup completed',
      actionDate: new Date(),
      ipAddress: '127.0.0.1'
    }
  })

  console.log('Seeding completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
