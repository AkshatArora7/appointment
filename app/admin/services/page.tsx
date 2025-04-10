"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import AdminHeader from '../components/AdminHeader';
import { Service } from '@/types/interfaces';

interface ServiceFormData {
  name: string;
  description: string;
  duration: string;
  price: string;
}

interface ApiErrorResponse {
  error: string;
}

interface ApiSuccessResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const ServicesManagementPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentServiceId, setCurrentServiceId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: ''
  });
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    } else {
      fetchServices();
    }
  }, [session, router]);

  const fetchServices = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/services');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: Failed to fetch services`);
      }
      
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    
    try {
      // Validate price format
      const priceRegex = /^\d+(\.\d{1,2})?$/;
      if (!priceRegex.test(formData.price)) {
        setError('Price must be a valid number (e.g., 10.99)');
        return;
      }

      const url = formMode === 'create' 
        ? '/api/admin/services' 
        : `/api/admin/services/${currentServiceId}`;
      
      const method = formMode === 'create' ? 'POST' : 'PATCH';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: Failed to save service`);
      }
      
      // Reset form and fetch updated list
      setFormData({ name: '', description: '', duration: '', price: '' });
      setShowForm(false);
      fetchServices();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save service');
    }
  };

  const handleEdit = (service: Service): void => {
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration.toString(),
      price: service.price
    });
    setCurrentServiceId(service.id);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: Failed to delete service`);
      }
      
      fetchServices();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete service');
    }
  };

  if (loading && services.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <AdminHeader title="Services Management" showBackButton backUrl="/admin/dashboard" />
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <AdminHeader title="Services Management" showBackButton backUrl="/admin/dashboard" />
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Manage Services</h2>
            
            {!showForm && (
              <button
                onClick={() => {
                  setFormData({ name: '', description: '', duration: '', price: '' });
                  setFormMode('create');
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <FaPlus className="mr-2" /> Add New Service
              </button>
            )}
          </div>
          
          {showForm && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-6">
              <h3 className="text-lg font-medium mb-4">
                {formMode === 'create' ? 'Add New Service' : 'Edit Service'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Name*
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium mb-1">
                      Duration (minutes)*
                    </label>
                    <input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium mb-1">
                      Price*
                    </label>
                    <input
                      id="price"
                      type="text"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {formMode === 'create' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {services.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No services found. Create your first service.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {service.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{service.duration} min</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">${service.price}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <FaEdit className="inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash className="inline mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesManagementPage;
