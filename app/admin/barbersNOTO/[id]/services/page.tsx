"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import AdminHeader from '../../../components/AdminHeader';
import { FaSave, FaToggleOn, FaToggleOff, FaPlus, FaDollarSign, FaClock } from 'react-icons/fa';

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration: number;
}

interface BarberService {
  id: number;
  serviceId: number;
  price: string;
  active: boolean;
  service: Service;
}

const ManageBarberServices: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const barberId = params?.id as string;
  
  const [barber, setBarber] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [barberServices, setBarberServices] = useState<BarberService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for new service prices
  const [servicePrices, setServicePrices] = useState<{[key: number]: string}>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/unauthorized');
    } else {
      fetchData();
    }
  }, [session, barberId, router]);

  const fetchData = async () => {
    if (!barberId) return;
    
    setLoading(true);
    try {
      // Get barber info
      const barberResponse = await axios.get(`/api/admin/barbers/${barberId}`);
      setBarber(barberResponse.data.barber);
      
      // Get all services
      const servicesResponse = await axios.get('/api/admin/services');
      setServices(servicesResponse.data.services || []);
      
      // Get barber's existing services
      const barberServicesResponse = await axios.get(`/api/admin/barbers/${barberId}/services`);
      setBarberServices(barberServicesResponse.data.services || []);
      
      // Initialize service prices from existing barber services
      const initialPrices: {[key: number]: string} = {};
      barberServicesResponse.data.services.forEach((service: BarberService) => {
        initialPrices[service.serviceId] = service.price;
      });
      setServicePrices(initialPrices);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (serviceId: number, price: string) => {
    setServicePrices({
      ...servicePrices,
      [serviceId]: price
    });
  };

  const toggleServiceActive = async (barberServiceId: number, currentlyActive: boolean) => {
    try {
      await axios.patch(`/api/admin/barbers/${barberId}/services/${barberServiceId}`, {
        active: !currentlyActive
      });
      
      // Update local state
      setBarberServices(prev => 
        prev.map(service => 
          service.id === barberServiceId 
            ? {...service, active: !currentlyActive} 
            : service
        )
      );
      
      setSuccess(`Service ${currentlyActive ? 'disabled' : 'enabled'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('Error toggling service:', error);
      setError(error.response?.data?.error || 'Failed to update service');
    }
  };

  const addService = async (serviceId: number) => {
    if (!servicePrices[serviceId]) {
      setError('Please enter a price for this service');
      return;
    }
    
    setSaving(true);
    try {
      const response = await axios.post(`/api/admin/barbers/${barberId}/services`, {
        serviceId,
        price: servicePrices[serviceId]
      });
      
      // Add the new service to the list
      setBarberServices([...barberServices, response.data.barberService]);
      
      setSuccess('Service added successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('Error adding service:', error);
      setError(error.response?.data?.error || 'Failed to add service');
    } finally {
      setSaving(false);
    }
  };

  const updateServicePrice = async (barberServiceId: number, serviceId: number) => {
    if (!servicePrices[serviceId]) {
      setError('Please enter a valid price');
      return;
    }
    
    setSaving(true);
    try {
      await axios.patch(`/api/admin/barbers/${barberId}/services/${barberServiceId}`, {
        price: servicePrices[serviceId]
      });
      
      // Update local state
      setBarberServices(prev => 
        prev.map(service => 
          service.id === barberServiceId 
            ? {...service, price: servicePrices[serviceId]} 
            : service
        )
      );
      
      setSuccess('Price updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('Error updating service price:', error);
      setError(error.response?.data?.error || 'Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  // Get the IDs of services that the barber already has configured
  const existingServiceIds = barberServices.map(bs => bs.serviceId);
  
  // Filter out services that haven't been added yet
  const availableServices = services.filter(service => 
    !existingServiceIds.includes(service.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <AdminHeader 
            title="Manage Barber Services" 
            showBackButton 
            backUrl={`/admin/barber-details/${barberId}`} 
          />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <AdminHeader 
          title={`Manage Services for ${barber?.name || 'Barber'}`}
          showBackButton
          backUrl={`/admin/barber-details/${barberId}`}
        />
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
            {success}
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Current Services</h2>
          
          {barberServices.length === 0 ? (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400">
              No services configured yet. Add services below.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price ($)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {barberServices.map((barberService) => (
                    <tr key={barberService.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {barberService.service.name}
                        </div>
                        {barberService.service.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {barberService.service.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <FaClock className="mr-1 h-3 w-3" />
                          {barberService.service.duration} min
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaDollarSign className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={servicePrices[barberService.serviceId] || ''}
                              onChange={(e) => handlePriceChange(barberService.serviceId, e.target.value)}
                              className="block w-20 pl-7 pr-2 py-1 sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                          <button
                            onClick={() => updateServicePrice(barberService.id, barberService.serviceId)}
                            className="ml-2 p-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                          >
                            <FaSave className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          barberService.active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {barberService.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => toggleServiceActive(barberService.id, barberService.active)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          {barberService.active ? (
                            <FaToggleOn className="h-5 w-5" />
                          ) : (
                            <FaToggleOff className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {availableServices.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Add Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableServices.map((service) => (
                <div 
                  key={service.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <FaClock className="mr-1 h-3 w-3" /> {service.duration} min
                      </p>
                      {service.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaDollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Price"
                          value={servicePrices[service.id] || ''}
                          onChange={(e) => handlePriceChange(service.id, e.target.value)}
                          className="block w-24 pl-7 pr-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      
                      <button
                        onClick={() => addService(service.id)}
                        disabled={saving || !servicePrices[service.id]}
                        className={`p-1 rounded-md ${
                          saving || !servicePrices[service.id]
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                            : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                        }`}
                      >
                        <FaPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBarberServices;
