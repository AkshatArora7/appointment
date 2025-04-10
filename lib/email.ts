import nodemailer from 'nodemailer';
import ical from 'ical-generator';
import { format } from 'date-fns';
import { emailConfig } from '../config/emailConfig';
import { appInfo } from '@/appInfo';

type EmailTemplateVariables = Record<string, string | number>;

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.port === 465,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass,
  },
});

/**
 * Replace template variables in a string
 */
const replaceTemplateVariables = (template: string, variables: EmailTemplateVariables): string => {
  let result = template;
  
  // Add app info to variables
  const allVariables = {
    shopName: appInfo.name,
    shopAddress: appInfo.address,
    shopPhone: appInfo.phone,
    shopEmail: appInfo.email,
    ...variables
  };
  
  // Replace all variables in the template
  Object.entries(allVariables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  
  return result;
};

interface SendEmailOptions {
  to: string;
  templateName: keyof typeof emailConfig.templates;
  variables: EmailTemplateVariables;
  cc?: string;
  attachments?: any[];
}

/**
 * Send an email using a predefined template
 */
export async function sendEmail({ to, templateName, variables, cc, attachments }: SendEmailOptions): Promise<void> {
  try {
    const template = emailConfig.templates[templateName];
    
    if (!template) {
      throw new Error(`Email template "${templateName}" not found`);
    }
    
    const subject = replaceTemplateVariables(template.subject, variables);
    const text = replaceTemplateVariables(template.text, variables);
    
    const mailOptions = {
      from: `"${appInfo.name}" <${emailConfig.from}>`,
      to,
      cc,
      subject,
      text,
      replyTo: emailConfig.replyTo,
      attachments
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} using template ${templateName}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Generate iCal file for calendar integration
export const generateCalendarEvent = (appointment: any) => {
  const cal = ical({ name: 'Barber Shop Appointment' });
  
  const startTime = new Date(`${appointment.date.toISOString().split('T')[0]}T${appointment.time.split(' - ')[0]}`);
  // Assuming each appointment is 30 minutes long, but ideally use the actual service duration
  const endTime = new Date(startTime.getTime() + 30 * 60000);
  
  cal.createEvent({
    start: startTime,
    end: endTime,
    summary: `Appointment with ${appointment.barber.name}`,
    description: `Service: ${appointment.barberService?.service.name || 'Haircut'}\nPrice: $${appointment.barberService?.price || ''}`,
    location: 'Barber Shop',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/appointments/${appointment.id}`,
  });
  
  return cal.toString();
};

export async function sendAppointmentConfirmation(
  customerEmail: string,
  appointmentDetails: {
    date: string;
    time: string;
    clientName: string;
    serviceName: string;
    duration: number;
    price: string | number;
    customerName: string;
  }
): Promise<void> {
  return sendEmail({
    to: customerEmail,
    templateName: 'confirmation',
    variables: appointmentDetails
  });
}

export async function sendClientNotification(
  clientEmail: string,
  appointmentDetails: {
    date: string;
    time: string;
    clientName: string;
    serviceName: string;
    duration: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }
): Promise<void> {
  return sendEmail({
    to: clientEmail,
    templateName: 'clientNotification',
    variables: appointmentDetails
  });
}

export async function sendBarberNotification(
  barberEmail: string,
  appointmentDetails: {
    date: string;
    time: string;
    barberName: string;
    serviceName: string;
    duration: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }
): Promise<void> {
  return sendEmail({
    to: barberEmail,
    templateName: 'barberNotification',
    variables: appointmentDetails
  });
}

export async function sendAppointmentReminder(
  customerEmail: string,
  appointmentDetails: {
    date: string;
    time: string;
    barberName: string;
    customerName: string;
  }
): Promise<void> {
  return sendEmail({
    to: customerEmail,
    templateName: 'reminder',
    variables: appointmentDetails
  });
}
