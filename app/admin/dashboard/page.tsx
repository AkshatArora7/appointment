"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUsersCog, FaCalendarCheck, FaHistory, FaPlus, FaTags } from 'react-icons/fa';
import AdminHeader from '../components/AdminHeader';

interface AdminStats {
  totalClients: number;
  totalAppointments: number;
  totalCustomers: number;
  revenue: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  loading: boolean;
  color: string;
}

const AdminDashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalClients: 0,
    totalAppointments: 0,
    totalCustomers: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    } else {
      fetchAdminStats();
    }
  }, [session, router]);

  const fetchAdminStats = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch admin stats`);
      }
      
      const data: AdminStats = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const adminMenuItems = [
    {
      title: 'Manage Clients',
      icon: <FaUsersCog className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />,
      description: 'Create, edit, and manage client profiles',
      link: '/admin/clients',
      color: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20 hover:shadow-md dark:hover:from-blue-900/50'
    },
    {
      title: 'View Appointments',
      icon: <FaCalendarCheck className="h-8 w-8 text-emerald-600 group-hover:text-emerald-700 transition-colors" />,
      description: 'Review all scheduled appointments',
      link: '/admin/appointments',
      color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-900/20 hover:shadow-md dark:hover:from-emerald-900/50'
    },
    {
      title: 'Activity Log',
      icon: <FaHistory className="h-8 w-8 text-violet-600 group-hover:text-violet-700 transition-colors" />,
      description: 'View system audit logs and activity',
      link: '/admin/audit',
      color: 'bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/40 dark:to-violet-900/20 hover:shadow-md dark:hover:from-violet-900/50'
    },
    {
      title: 'Manage Client Types',
      icon: <FaTags className="h-8 w-8 text-indigo-600 group-hover:text-indigo-700 transition-colors" />,
      description: 'Create and manage client type categories',
      link: '/admin/client-types',
      color: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-900/20 hover:shadow-md dark:hover:from-indigo-900/50'
    },
    {
      title: 'Add New Client',
      icon: <FaPlus className="h-8 w-8 text-amber-600 group-hover:text-amber-700 transition-colors" />,
      description: 'Create a new client profile',
      link: '/admin/clients/new',
      color: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/20 hover:shadow-md dark:hover:from-amber-900/50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AdminHeader title="Admin Dashboard" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard 
            title="Total Clients" 
            value={stats.totalClients} 
            loading={loading} 
            color="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/10"
          />
          <StatCard 
            title="Total Appointments" 
            value={stats.totalAppointments} 
            loading={loading} 
            color="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/10"
          />
          <StatCard 
            title="Total Customers" 
            value={stats.totalCustomers} 
            loading={loading} 
            color="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/10"
          />
          <StatCard 
            title="Total Revenue" 
            value={`$${stats.revenue.toFixed(2)}`} 
            loading={loading} 
            color="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/10"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {adminMenuItems.map((item, index) => (
            <Link key={index} href={item.link} className="block group transition transform hover:-translate-y-1 duration-200">
              <div className={`p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 h-full ${item.color}`}>
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 mb-4 rounded-full bg-white/70 dark:bg-gray-800/60 shadow-sm flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple stat card component with proper TypeScript types
const StatCard: React.FC<StatCardProps> = ({ title, value, loading, color }) => (
  <div className={`${color} p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md`}>
    <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-600 dark:text-gray-300 mb-1">{title}</h3>
    <div className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
      {loading ? (
        <div className="h-8 w-24 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
      ) : (
        value
      )}
    </div>
  </div>
);

export default AdminDashboard;
