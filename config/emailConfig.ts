/**
 * Email service configuration
 */
export const emailConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  from: process.env.SMTP_FROM || 'noreply@example.com',
  replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || 'noreply@example.com',
  templates: {
    confirmation: {
      subject: "Appointment Confirmation - {{clientName}}",
      text: `
        Thank you for booking with {{shopName}}!
        
        Your appointment details:
        Date: {{date}}
        Time: {{time}}
        Client: {{clientName}}
        Service: {{serviceName}}
        Duration: {{duration}} minutes
        Price: {{price}}
        
        Location: {{shopAddress}}
        
        Need to reschedule or cancel? Please contact us at {{shopPhone}} at least 24 hours before your appointment.
        
        We look forward to seeing you!
        
        Best regards,
        {{shopName}} Team
      `
    },
    reminder: {
      subject: "Reminder: Your Appointment Tomorrow",
      text: `
        Hello {{customerName}},
        
        This is a friendly reminder about your appointment tomorrow at {{shopName}}.
        
        Appointment details:
        Date: {{date}}
        Time: {{time}}
        Barber: {{barberName}}
        
        Location: {{shopAddress}}
        
        If you need to reschedule, please contact us as soon as possible at {{shopPhone}}.
        
        We look forward to seeing you!
        
        Best regards,
        {{shopName}} Team
      `
    },
    barberNotification: {
      subject: "New Appointment Scheduled",
      text: `
        Hello {{barberName}},
        
        A new appointment has been scheduled with you.
        
        Appointment details:
        Date: {{date}}
        Time: {{time}}
        Customer: {{customerName}}
        Service: {{serviceName}}
        Duration: {{duration}} minutes
        
        Customer contact:
        Email: {{customerEmail}}
        Phone: {{customerPhone}}
        
        Best regards,
        {{shopName}} Booking System
      `
    },
    clientNotification: {
      subject: "New Appointment Scheduled",
      text: `
        Hello {{clientName}},
        
        A new appointment has been scheduled with you.
        
        Appointment details:
        Date: {{date}}
        Time: {{time}}
        Customer: {{customerName}}
        Service: {{serviceName}}
        Duration: {{duration}} minutes
        
        Customer contact:
        Email: {{customerEmail}}
        Phone: {{customerPhone}}
        
        Best regards,
        {{shopName}} Booking System
      `
    },
    bookingConfirmation: {
      subject: "Your Appointment Has Been Booked - {{shopName}}",
      text: `
        Hello {{customerName}},
        
        Thank you for booking your appointment with {{shopName}}!
        
        Your appointment has been successfully scheduled:
        Date: {{date}}
        Time: {{time}}
        Barber: {{barberName}}
        Service: {{serviceName}}
        Duration: {{duration}} minutes
        Price: {{price}}
        
        Location: {{shopAddress}}
        
        You will receive a confirmation email soon. If you need to make any changes to your appointment,
        please contact us at {{shopPhone}} or reply to this email.
        
        We look forward to seeing you!
        
        Best regards,
        {{shopName}} Team
      `
    }
  } as const
};

export default emailConfig;
