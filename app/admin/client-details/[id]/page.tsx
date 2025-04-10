"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import Link from 'next/link';
import { FaEdit, FaEnvelope, FaCopy, FaChartLine, FaUserClock } from 'react-icons/fa';
import AdminHeader from '../../components/AdminHeader';
import { Appointment, AuditLog, ClientService } from '@/types/interfaces';

const ClientDetailsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;
  
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (status === 'authenticated' && session?.user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin' && clientId) {
      fetchClientDetails();
    }
  }, [session, clientId]);

  const fetchClientDetails = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/clients/${clientId}/details`);
      setClient(response.data.client);
    } catch (error: any) {
      console.error('Error fetching client details:', error);
      setError(error.response?.data?.error || 'Failed to load client details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyBookingLink = (): void => {
    if (!client?.slug) return;
    
    const link = `${window.location.origin}/book/${client.slug}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <p className="text-red-500">{error || "Failed to load client details"}</p>
          <button
            onClick={fetchClientDetails}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AdminHeader title={`Client: ${client.name}`} showBackButton backUrl="/admin/clients" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* Client Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Profile</h2>
                <Link 
                  href={`/admin/clients/edit/${client.id}`}
                  className="flex items-center gap-1 p-1 text-blue-500 hover:text-blue-700"
                >
                  <FaEdit className="h-4 w-4" />
                  <span className="text-sm">Edit</span>
                </Link>
              </div>
              
              <div className="flex items-center mb-6">
                <div className="h-20 w-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Username: {client.user.username}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400">Email:</label>
                  <div className="flex items-center gap-2">
                    <span>{client.user.email}</span>
                    <a 
                      href={`mailto:${client.user.email}`}
                      className="text-blue-500 hover:text-blue-700"
                      title="Send Email"
                    >
                      <FaEnvelope className="h-4 w-4" />
                    </a>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400">Booking Link:</label>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-500">/book/{client.slug}</span>
                    <button
                      onClick={copyBookingLink}
                      className="text-blue-500 hover:text-blue-700"
                      title="Copy Link"
                    >
                      <FaCopy className="h-4 w-4" />
                    </button>
                    {linkCopied && <span className="text-green-500 text-xs">Copied!</span>}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400">Joined:</label>
                  <span>{format(new Date(client.createdAt), 'MMMM d, yyyy')}</span>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400">Bio:</label>
                  <p className="text-sm">{client.bio || 'No bio provided.'}</p>
                </div>
              </div>
            </div>
            
            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Stats</h2>
                <FaChartLine className="h-5 w-5 text-blue-500" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="text-blue-500 mb-1 text-sm">Total</div>
                    <div className="text-2xl font-bold">{client.stats.totalAppointments}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="text-green-500 mb-1 text-sm">Completed</div>
                    <div className="text-2xl font-bold">{client.stats.completedAppointments}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <div className="text-red-500 mb-1 text-sm">Cancelled</div>
                    <div className="text-2xl font-bold">{client.stats.cancelledAppointments}</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <div className="text-yellow-500 mb-1 text-sm">Revenue</div>
                    <div className="text-2xl font-bold">${client.stats.revenue.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            {/* Services Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Services</h2>
                <Link 
                  href={`/admin/clients/${client.id}/services`}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Manage Services
                </Link>
              </div>
              
              {client.services.length === 0 ? (
                <p className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No services configured yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.services.map((service: ClientService) => (
                    <div 
                      key={service.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{service.service.name}</span>
                        <span className="text-green-600 dark:text-green-400 font-bold">${service.price}</span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        {service.service.duration} minutes
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Recent Appointments Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recent Appointments</h2>
                <Link 
                  href={`/admin/appointments?clientId=${client.id}`}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  View All
                </Link>
              </div>
              
              {client.recentAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <FaUserClock className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No recent appointments found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {client.recentAppointments.map((appointment: Appointment) => (
                    <div 
                      key={appointment.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex flex-wrap justify-between items-center">
                        <div>
                          <div className="font-medium">{appointment.customer?.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(appointment.date), 'MMM d, yyyy')} at {appointment.time}
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Audit Logs Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Activity Log</h2>
                <Link 
                  href={`/admin/audit?clientId=${client.id}`}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  View All
                </Link>
              </div>
              
              <div className="space-y-3">
                {/* We'll show at most 5 recent audit logs */}
                {client.auditLogs && client.auditLogs.length > 0 ? (
                  client.auditLogs.slice(0, 5).map((log: AuditLog) => (
                    <div 
                      key={log.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="text-sm">{log.action}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(log.actionDate), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No activity logs found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Function to determine the CSS class for status badges
const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'no-show':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

export default ClientDetailsPage;