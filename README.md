# Appointment Booking System

A comprehensive appointment booking solution built with Next.js that streamlines scheduling for businesses and service providers.

![Appointment System Banner](public/appointment-banner.png)

## Features

- **User Authentication** - Secure login/signup for both clients and service providers
- **Interactive Calendar** - Visual booking interface with real-time availability updates
- **Automated Notifications** - Email/SMS reminders for upcoming appointments
- **Admin Dashboard** - Comprehensive management of appointments and user accounts
- **Service Management** - Create, edit, and manage different service offerings
- **Staff Scheduling** - Manage staff availability and assignment to services
- **Booking Management** - Create, reschedule, and cancel appointments
- **Payment Integration** - Secure online payments and deposits
- **Analytics** - Reporting on bookings, revenue, and customer activity
- **Responsive Design** - Optimized experience across desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm/yarn/pnpm/bun package manager
- MongoDB database (local or Atlas)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/appointment-booking-system.git
cd appointment-booking-system
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up environment variables:
   
Create a `.env.local` file in the root directory with the following variables:

```
DATABASE_URL=your_mongodb_connection_string
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment

The application can be deployed using [Vercel](https://vercel.com) with minimal configuration:

```bash
npm run build
npm run start
```

For detailed deployment instructions, see our [deployment guide](docs/deployment.md).

## Configuration

### Service Settings

Configure available services, duration, pricing, and staff assignments in the admin dashboard or by modifying the `services.config.js` file.

### Working Hours

Set business hours, blocked dates, and special schedules through the admin interface.

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **Notifications**: SendGrid/Twilio
- **Payment Processing**: Stripe

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Your Name - [@Akshat Arora](https://instagram.com/akshat_arora7) - aatechax@gmail.com.com

Project Link: [https://github.com/akshatarora7/appointment](https://github.com/akshatarora7/appointment)
