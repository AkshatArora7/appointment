"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminHeader from '../../components/AdminHeader';
import { FaSave, FaTimes } from 'react-icons/fa';
import { ClientType } from '@/types/interfaces';

const NewClientPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(true);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    bio: '',
    slug: '',
    clientTypeId: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchClientTypes();
  }, []);

  const fetchClientTypes = async () => {
    setLoadingTypes(true);
    try {
      const response = await fetch('/api/admin/client-types');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch client types`);
      }
      
      const data = await response.json();
      setClientTypes(data.clientTypes || []);
    } catch (error) {
      console.error('Error fetching client types:', error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate slug from name if slug field is empty
    if (name === 'name' && !formData.slug) {
      const generatedSlug = value.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientTypeId) {
      setError('Please select a client type');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          clientTypeId: parseInt(formData.clientTypeId)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: Failed to create client`);
      }
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        email: '',
        name: '',
        bio: '',
        slug: '',
        clientTypeId: ''
      });
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/admin/clients');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating client:', error);
      setError(error instanceof Error ? error.message : 'Failed to create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <AdminHeader title="Create New Client" showBackButton backUrl="/admin/clients" />
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-gray-800 dark:text-gray-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
              Client created successfully! Redirecting...
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username*
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="client123"
                  disabled={loading || success}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password*
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="••••••••"
                  disabled={loading || success}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email*
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="client@example.com"
                  disabled={loading || success}
                />
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name*
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="John Doe"
                  disabled={loading || success}
                />
              </div>
              
              <div>
                <label htmlFor="clientTypeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Type*
                </label>
                <select
                  id="clientTypeId"
                  name="clientTypeId"
                  required
                  value={formData.clientTypeId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  disabled={loading || success || loadingTypes}
                >
                  <option value="">Select a client type</option>
                  {clientTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {loadingTypes && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading client types...</p>
                )}
                {!loadingTypes && clientTypes.length === 0 && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                    No client types found. <a href="/admin/client-types" className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Create one first</a>.
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Slug*
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="john-doe"
                  disabled={loading || success}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be used in the booking URL: /book/{formData.slug || 'your-slug'}
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Professional services specializing in..."
                  disabled={loading || success}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.push('/admin/clients')}
                className="px-4 py-2 flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                disabled={loading || success}
              >
                <FaTimes className="h-4 w-4" /> Cancel
              </button>
              
              <button
                type="submit"
                className={`px-4 py-2 flex items-center gap-2 rounded-md ${
                  loading || success
                    ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
                }`}
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaSave className="h-4 w-4" /> Create Client
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewClientPage;
