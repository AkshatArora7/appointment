"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Value, ClientStats, Appointment, Availability } from '@/types/interfaces';
import { format, isToday } from 'date-fns';
import ClientHeader from './ClientHeader';
import DashboardStats from './DashboardStats';
import AppointmentList from './AppointmentList';
import SetAvailabilityPanel from './SetAvailabilityPanel';
import ShimmerEffect from '@/components/ShimmerEffect';

type AppointmentsResponse = { appointments: Appointment[] };
type AvailabilityResponse = { availability: Availability[] };

const ClientDashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [date, setDate] = useState<Value>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [activeTab, setActiveTab] = useState<string>('appointments');
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<ClientStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    totalCustomers: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== 'client' && session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [session, router]);

  useEffect(() => {
    if (session?.user?.clientId && date) {
      fetchAppointments();
      fetchAvailability();
      fetchStats();
    }
  }, [session, date]);

  const fetchAppointments = async (): Promise<void> => {
    if (!session?.user?.clientId || !date) return;
    
    setLoading(true);
    try {
      const formattedDate = date instanceof Date ? date.toISOString() : new Date().toISOString();
      const response = await fetch(`/api/appointments?clientId=${encodeURIComponent(session.user.clientId)}&date=${encodeURIComponent(formattedDate)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: Failed to fetch appointments`);
      }
      
      const data: AppointmentsResponse = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (): Promise<void> => {
    if (!session?.user?.clientId || !date) return;
    
    try {
      const formattedDate = date instanceof Date ? date.toISOString() : new Date().toISOString();
      const response = await fetch(`/api/client-availability?clientId=${encodeURIComponent(session.user.clientId)}&date=${encodeURIComponent(formattedDate)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: Failed to fetch availability`);
      }
      
      const data: AvailabilityResponse = await response.json();
      setAvailability(data.availability || []);
    } catch (error) {
      console.error('Error fetching availability:', error instanceof Error ? error.message : String(error));
    }
  };

  const fetchStats = async (): Promise<void> => {
    if (!session?.user?.clientId) return;
    
    try {
      const response = await fetch(`/api/client-stats?clientId=${encodeURIComponent(session.user.clientId)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: Failed to fetch stats`);
      }
      
      const stats: ClientStats = await response.json();
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleStatusChange = async (appointmentId: number, status: string): Promise<void> => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: Failed to update appointment status`);
      }
      
      // Log the action
      await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: session?.user?.clientId,
          action: `Changed appointment #${appointmentId} status to ${status}`,
        }),
      });
      
      // Refresh appointments
      fetchAppointments();
      fetchStats();
    } catch (error) {
      console.error('Error updating appointment status:', error instanceof Error ? error.message : String(error));
    }
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }): string | null => {
    if (view !== 'month') return null;
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    const hasAppointments = appointments.some(
      appointment => format(new Date(appointment.date), 'yyyy-MM-dd') === formattedDate
    );
    
    return hasAppointments ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full font-bold' : null;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <ClientHeader />
        
        <DashboardStats stats={stats} isLoading={loading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-200">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Select Date</h2>
              <div className="calendar-container bg-white dark:bg-gray-800 p-0 shadow-none">
                {loading ? (
                  <div className="space-y-2">
                    <ShimmerEffect height="300px" borderRadius="0.5rem" />
                  </div>
                ) : (
                  <Calendar 
                    onChange={setDate} 
                    value={date} 
                    className="border-0 w-full text-gray-800 dark:text-gray-200" 
                    tileClassName={({ date: tileDate }) => {
                      // Check if there are appointments on this date
                      const formattedDate = format(tileDate, 'yyyy-MM-dd');
                      const hasAppointments = appointments.some(
                        appointment => format(new Date(appointment.date), 'yyyy-MM-dd') === formattedDate
                      );
                      
                      return hasAppointments ? 'highlight bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full' : null;
                    }}
                    formatDay={(locale, date) => date.getDate().toString()}
                  />
                )}
              </div>
            </div>
            
            {/* Only show set availability panel if date is selected */}
            {date && session?.user?.clientId && (
              <SetAvailabilityPanel 
                selectedDate={date instanceof Date ? date : new Date()}
                clientId={session.user.clientId}
                existingAvailability={availability}
                refreshAvailability={fetchAvailability}
              />
            )}
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {date instanceof Date ? (
                    isToday(date) ? 
                      "Today's Appointments" : 
                      `Appointments for ${format(date, 'MMM d, yyyy')}`
                  ) : "Appointments"}
                </h2>
              </div>
              
              <AppointmentList 
                appointments={appointments} 
                isLoading={loading}
                onStatusChange={handleStatusChange} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
