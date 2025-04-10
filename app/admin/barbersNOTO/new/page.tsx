"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AdminHeader from '../../components/AdminHeader';
import { FaSave, FaTimes } from 'react-icons/fa';

const NewBarberPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    bio: '',
    slug: ''
  });

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/admin/barbers', formData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        email: '',
        name: '',
        bio: '',
        slug: ''
      });
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/admin/barbers');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating barber:', error);
      setError(error.response?.data?.error || 'Failed to create barber. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <AdminHeader title="Create New Barber" showBackButton backUrl="/admin/barbers" />
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
              Barber created successfully! Redirecting...
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username*
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="barber123"
                  disabled={loading || success}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password*
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="••••••••"
                  disabled={loading || success}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email*
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="barber@example.com"
                  disabled={loading || success}
                />
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Display Name*
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="John Doe"
                  disabled={loading || success}
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Experienced barber specializing in classic cuts and beard trims..."
                  disabled={loading || success}
                />
              </div>
              
              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-1">
                  URL Slug*
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="john-doe"
                  disabled={loading || success}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be used in the booking URL: /book/{formData.slug || 'your-slug'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.push('/admin/barbers')}
                className="px-4 py-2 flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                disabled={loading || success}
              >
                <FaTimes className="h-4 w-4" /> Cancel
              </button>
              
              <button
                type="submit"
                className={`px-4 py-2 flex items-center gap-2 rounded-md ${
                  loading || success
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
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
                    <FaSave className="h-4 w-4" /> Create Barber
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

export default NewBarberPage;
