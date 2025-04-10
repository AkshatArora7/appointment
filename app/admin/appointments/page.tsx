"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { FaEye, FaEdit, FaTimes, FaCheck, FaCalendarPlus } from 'react-icons/fa';
import AdminHeader from '../components/AdminHeader';
import { Appointment } from '@/types/interfaces';

interface AppointmentResponse {
  appointments: Appointment[];
}

const ManageAppointments: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    } else {
      fetchAppointments();
    }
  }, [session, router, statusFilter]);

  const fetchAppointments = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<AppointmentResponse>(`/api/admin/appointments${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id: number, newStatus: string): Promise<void> => {
    try {
      await axios.patch(`/api/admin/appointments/${id}`, { status: newStatus });
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status. Please try again.');
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

  const formatDateTime = (date: string, time: string): string => {
    try {
      // Ensure date is in YYYY-MM-DD format
      const formattedDate = date.includes('T') ? date.split('T')[0] : date;
      
      // Ensure time has seconds if not provided
      let formattedTime = time;
      if (time.split(':').length === 2) {
        formattedTime = `${time}:00`;
      }
      
      // Create the date object
      const dateObj = new Date(`${formattedDate}T${formattedTime}`);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date or time format:', { date, time });
        return `${date} ${time}`;
      }
      
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date/time:', error);
      // Fallback to returning the raw date and time
      return `${date} ${time}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AdminHeader title="Manage Appointments" showBackButton />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Appointments</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <label htmlFor="statusFilter" className="mr-2 text-sm text-gray-600 dark:text-gray-300">
                Status:
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <Link 
              href="/admin/appointments/new" 
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <FaCalendarPlus className="h-3.5 w-3.5" /> New Appointment
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg shadow-sm flex items-center">
            <span className="font-medium">{error}</span>
          </div>
        )}
        
        {loading ? (
          // Shimmer loading for appointments table
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['Client', 'Customer', 'Service', 'Date & Time', 'Status', 'Actions'].map((header, i) => (
                      <th key={i} className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-1"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-40"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-36"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                          <div className="h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded"></div>
                          <div className="h-8 w-8 bg-red-100 dark:bg-red-900/30 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-5">No appointments found.</p>
            <Link 
              href="/admin/appointments/new" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
            >
              <FaCalendarPlus className="h-3.5 w-3.5" /> Create New Appointment
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{appointment.client?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{appointment.customer?.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{appointment.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{appointment.clientService?.service.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDateTime(appointment.date.toString(), appointment.time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            href={`/admin/appointments/${appointment.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                            title="View details"
                          >
                            <FaEye className="h-3.5 w-3.5" />
                          </Link>
                          
                          {appointment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                className="inline-flex items-center justify-center w-8 h-8 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 rounded-md transition-colors"
                                title="Confirm appointment"
                              >
                                <FaCheck className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                className="inline-flex items-center justify-center w-8 h-8 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-md transition-colors"
                                title="Cancel appointment"
                              >
                                <FaTimes className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          
                          {appointment.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                className="inline-flex items-center justify-center w-8 h-8 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 rounded-md transition-colors"
                                title="Mark as completed"
                              >
                                <FaCheck className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                className="inline-flex items-center justify-center w-8 h-8 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-md transition-colors"
                                title="Cancel appointment"
                              >
                                <FaTimes className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          
                          <Link 
                            href={`/admin/appointments/edit/${appointment.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 rounded-md transition-colors"
                            title="Edit appointment"
                          >
                            <FaEdit className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAppointments;
