"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import axios, { AxiosError } from 'axios';
import { Value, Service, AppointmentFormValues, Client, ApiResponse } from '@/types/interfaces';
import AppointmentCalendar from './AppointmentCalendar';
import TimePicker from './TimePicker';
import AppointmentForm from './AppointmentForm';
import { FaSun, FaMoon, FaDesktop, FaCheck } from 'react-icons/fa';
import ClientOnly from '@/components/ClientOnly';
import Link from 'next/link';

interface AvailabilityResponse {
  availableSlots: string[];
  services: Service[];
}

interface BookingResponse {
  success: boolean;
}

const BookAppointmentPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [date, setDate] = useState<Value>(new Date());
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const toggleTheme = (): void => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  // Fetch all clients when page loads
  useEffect(() => {
    const fetchClients = async (): Promise<void> => {
      try {
        const response = await fetch('/api/clients');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Failed to fetch clients`);
        }
        
        const data = await response.json();
        setClients(data.clients || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching clients:', error instanceof Error ? error.message : String(error));
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Fetch available slots when client or date changes
  useEffect(() => {
    if (!selectedClient || !date) {
      return;
    }

    const fetchAvailability = async (): Promise<void> => {
      setLoading(true);
      try {
        const dateParam = date instanceof Date ? date.toISOString() : new Date().toISOString();
        const response = await fetch(`/api/get-availability?date=${encodeURIComponent(dateParam)}&client=${encodeURIComponent(selectedClient)}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Failed to fetch availability`);
        }
        
        const data: AvailabilityResponse = await response.json();
        
        setAvailableSlots(data.availableSlots || []);
        setServices(data.services || []);
        setSelectedTime(null);
      } catch (error) {
        console.error('Error fetching availability:', error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedClient, date]);

  const handleClientSelect = (clientSlug: string): void => {
    setSelectedClient(clientSlug);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string): void => {
    setSelectedTime(time === selectedTime ? null : time);
  };

  const handleServiceSelect = (serviceId: number): void => {
    setSelectedService(serviceId === selectedService ? null : serviceId);
  };

  const handleSubmit = async (values: AppointmentFormValues): Promise<void> => {
    if (!date || !selectedTime || !selectedClient || !selectedService) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date instanceof Date ? date.toISOString() : new Date().toISOString(),
          time: selectedTime,
          name: values.name,
          email: values.email,
          phone: values.phone,
          clientSlug: selectedClient,
          serviceId: selectedService
        }),
      });

      const data: BookingResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to book appointment`);
      }

      if (data.success) {
        setBookingSuccess(true);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-green-500 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Appointment Confirmed!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Thank you for booking with us. We've sent a confirmation email with all details.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setBookingSuccess(false);
                setSelectedTime(null);
                setSelectedService(null);
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Book Another Appointment
            </button>
            <Link href="/" className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Book an Appointment</h1>
          
          <ClientOnly>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <FaSun className="h-5 w-5" />
              ) : theme === 'dark' ? (
                <FaMoon className="h-5 w-5" />
              ) : (
                <FaDesktop className="h-5 w-5" />
              )}
            </button>
          </ClientOnly>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Select a Client</h2>
          {loading && clients.length === 0 ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div 
                  key={client.id}
                  onClick={() => handleClientSelect(client.slug)}
                  className={`
                    p-4 rounded-lg cursor-pointer transition border-2
                    ${selectedClient === client.slug
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{client.name}</h3>
                      {client.bio && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {client.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedClient && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Select Date</h2>
                <AppointmentCalendar date={date} setDate={setDate} />
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Select Time</h2>
                {loading ? (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <TimePicker 
                    availableTimes={availableSlots} 
                    selectedTime={selectedTime} 
                    onTimeSelect={handleTimeSelect} 
                  />
                )}
              </div>

              {selectedTime && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <AppointmentForm 
                    onSubmit={handleSubmit}
                    isSubmitting={submitting}
                    selectedDate={date instanceof Date ? date : null}
                    selectedTime={selectedTime}
                    selectedService={selectedService}
                    services={services}
                    onServiceSelect={handleServiceSelect}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentPage;
