"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import AdminHeader from '../components/AdminHeader';
import { ClientType } from '@/types/interfaces';

const ClientTypesPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentTypeId, setCurrentTypeId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
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
      fetchClientTypes();
    }
  }, [session, router]);

  const fetchClientTypes = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/client-types');
      setClientTypes(response.data.clientTypes || []);
    } catch (error: any) {
      console.error('Error fetching client types:', error);
      setError(error.response?.data?.error || 'Failed to fetch client types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    
    try {
      if (formMode === 'create') {
        await axios.post('/api/admin/client-types', formData);
      } else {
        await axios.patch(`/api/admin/client-types/${currentTypeId}`, formData);
      }
      
      // Reset form and fetch updated list
      setFormData({ name: '', description: '' });
      setShowForm(false);
      fetchClientTypes();
    } catch (error: any) {
      console.error('Error saving client type:', error);
      setError(error.response?.data?.error || 'Failed to save client type');
    }
  };

  const handleEdit = (clientType: ClientType): void => {
    setFormData({
      name: clientType.name,
      description: clientType.description || ''
    });
    setCurrentTypeId(clientType.id);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this client type?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/client-types/${id}`);
      fetchClientTypes();
    } catch (error: any) {
      console.error('Error deleting client type:', error);
      setError(error.response?.data?.error || 'Failed to delete client type');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <AdminHeader title="Client Types" showBackButton backUrl="/admin/dashboard" />
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg shadow-sm flex items-center">
            <span className="font-medium">{error}</span>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Manage Client Types</h2>
            
            {!showForm && (
              <button
                onClick={() => {
                  setFormData({ name: '', description: '' });
                  setFormMode('create');
                  setShowForm(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center space-x-2 transition-colors duration-200 whitespace-nowrap"
                disabled={loading}
              >
                <FaPlus className="h-3.5 w-3.5" />
                <span>Add New Type</span>
              </button>
            )}
          </div>
          
          {showForm && (
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6 border border-gray-200 dark:border-gray-600 shadow-sm">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                {formMode === 'create' ? 'Add New Client Type' : 'Edit Client Type'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                    Name*
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors duration-200 font-medium"
                  >
                    {formMode === 'create' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {loading && clientTypes.length === 0 ? (
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <div className="bg-gray-50 dark:bg-gray-700 py-3.5 px-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <div className="grid grid-cols-3 gap-8 w-full">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex p-4 bg-white dark:bg-gray-800">
                    <div className="w-full grid grid-cols-3 gap-8">
                      <div className="flex flex-col space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6 animate-pulse"></div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <div className="h-8 w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded animate-pulse"></div>
                        <div className="h-8 w-16 bg-red-100 dark:bg-red-900/30 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : clientTypes.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
              <p className="mb-2 font-medium">No client types found.</p>
              <p>Create your first client type by clicking the "Add New Type" button.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    Array(3).fill(0).map((_, index) => (
                      <tr key={`skeleton-${index}`} className="animate-pulse">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-3">
                            <div className="h-8 w-16 bg-indigo-100 dark:bg-indigo-900/30 rounded"></div>
                            <div className="h-8 w-16 bg-red-100 dark:bg-red-900/30 rounded"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    clientTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{type.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {type.description || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => handleEdit(type)}
                              className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-md transition-colors"
                              disabled={loading}
                            >
                              <FaEdit className="mr-1.5 h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(type.id)}
                              className="inline-flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 rounded-md transition-colors"
                              disabled={loading}
                            >
                              <FaTrash className="mr-1.5 h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientTypesPage;
