"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { FaPlus, FaEdit, FaTrash, FaEye, FaCopy } from 'react-icons/fa';
import AdminHeader from '../components/AdminHeader';
import { Client } from '@/types/interfaces';

interface ClientResponse {
  clients: Client[];
}

const ManageClients: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    } else {
      fetchClients();
    }
  }, [session, router]);

  const fetchClients = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<ClientResponse>('/api/admin/clients');
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/clients/${clientId}`);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client. Please try again.');
    }
  };

  const copyBookingLink = (slug: string): void => {
    const link = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(slug);
    setTimeout(() => setLinkCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AdminHeader title="Manage Clients" showBackButton />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Clients</h2>
          <Link 
            href="/admin/clients/new" 
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FaPlus className="h-3.5 w-3.5" /> Add New Client
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg shadow-sm flex items-center">
            <span className="font-medium">{error}</span>
          </div>
        )}
        
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((i) => (
              <div 
                key={`shimmer-${i}`} 
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="w-full md:w-1/2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-4"></div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                      <div className="h-4 w-8 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                    <div className="h-8 w-24 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                    <div className="h-8 w-20 bg-yellow-100 dark:bg-yellow-900/30 rounded"></div>
                    <div className="h-8 w-20 bg-red-100 dark:bg-red-900/30 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-5">No clients found.</p>
            <Link 
              href="/admin/clients/new" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
            >
              <FaPlus className="h-3.5 w-3.5" /> Create Your First Client
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {clients.map((client) => (
              <div 
                key={client.id} 
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{client.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{client.user?.email}</p>
                    {client.bio && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{client.bio}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Booking Link:</span>
                      <button
                        onClick={() => copyBookingLink(client.slug)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center transition-colors"
                      >
                        <FaCopy className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Copy</span>
                      </button>
                      {linkCopied === client.slug && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                    <Link 
                      href={`/admin/client-details/${client.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                    >
                      <FaEye className="h-3 w-3 mr-1.5" />
                      View Details
                    </Link>
                    <Link 
                      href={`/admin/clients/${client.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 rounded-md transition-colors"
                    >
                      <FaEdit className="h-3 w-3 mr-1.5" />
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDeleteClient(client.id)}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-md transition-colors"
                    >
                      <FaTrash className="h-3 w-3 mr-1.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageClients;
