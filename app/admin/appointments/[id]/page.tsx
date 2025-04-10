"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { FaArrowLeft, FaEdit, FaTimes, FaCheck, FaCalendarAlt, FaClock, FaUser, FaBuilding, FaTag } from 'react-icons/fa';
import AdminHeader from '../../components/AdminHeader';
import { Appointment } from '@/types/interfaces';

const AppointmentDetailPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    } else {
      fetchAppointment();
    }
  }, [session, router, appointmentId]);

  const fetchAppointment = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ appointment: Appointment }>(`/api/admin/appointments/${appointmentId}`);
      setAppointment(response.data.appointment);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      setError('Failed to load appointment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (newStatus: string): Promise<void> => {
    try {
      await axios.patch(`/api/admin/appointments/${appointmentId}`, { status: newStatus });
      fetchAppointment();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status. Please try again.');
    }
  };

  const formatDateTime = (date: string | Date, time: string): string => {
    try {
      if (!date || !time) {
        return 'Not specified';
      }
      
      // Convert date to string if it's a Date object
      const dateStr = typeof date === 'object' ? date.toISOString().split('T')[0] : date.toString();
      
      // Ensure date is in YYYY-MM-DD format
      const formattedDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      
      // Ensure time has seconds if not provided
      let formattedTime = time;
      if (time.split(':').length === 2) {
        formattedTime = `${time}:00`;
      }
      
      // Create the date object
      const dateObj = new Date(`${formattedDate}T${formattedTime}`);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return `${dateStr} ${time}`;
      }
      
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeStyle: 'short'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date/time:', error);
      return `${date} ${time}`;
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'completed':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default: // pending
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <AdminHeader title="Appointment Details" showBackButton />
          <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
            
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 mt-1"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <AdminHeader title="Appointment Details" showBackButton />
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <div className="p-4 mb-6 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg">
              <p>{error || 'Appointment not found'}</p>
            </div>
            <Link 
              href="/admin/appointments" 
              className="flex items-center justify-center w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200"
            >
              <FaArrowLeft className="mr-2" /> Back to Appointments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <AdminHeader title="Appointment Details" showBackButton />
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Appointment #{appointment.id}
                </h1>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                  <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDateTime(appointment.date, appointment.time)}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {appointment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateAppointmentStatus('confirmed')}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <FaCheck className="mr-2" /> Confirm
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus('cancelled')}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <FaTimes className="mr-2" /> Cancel
                    </button>
                  </>
                )}
                
                {appointment.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => updateAppointmentStatus('completed')}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <FaCheck className="mr-2" /> Mark Completed
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus('cancelled')}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <FaTimes className="mr-2" /> Cancel
                    </button>
                  </>
                )}
                
                <Link
                  href={`/admin/appointments/edit/${appointment.id}`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                >
                  <FaEdit className="mr-2" /> Edit
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appointment Details</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FaCalendarAlt className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {typeof appointment.date === 'object' 
                          ? new Date(appointment.date).toLocaleDateString() 
                          : new Date(appointment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaClock className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {appointment.time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaTag className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Service</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {appointment.clientService?.service.name || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">People</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FaBuilding className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Client</p>
                      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {appointment.client?.name || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaUser className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                      <div>
                        <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                          {appointment.customer?.name || 'Not specified'}
                        </p>
                        {appointment.customer?.email && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {appointment.customer.email}
                          </p>
                        )}
                        {appointment.customer?.phone && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {appointment.customer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/admin/appointments" 
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <FaArrowLeft className="mr-2" /> Back to Appointments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailPage;
