"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Value, Service, Client } from '@/types/interfaces';
import 'react-calendar/dist/Calendar.css';
import { useTheme } from 'next-themes';
import Calendar from 'react-calendar';
import { FaSun, FaMoon, FaDesktop, FaClock, FaCut, FaCheck } from 'react-icons/fa';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import ClientOnly from '@/components/ClientOnly';

interface AvailabilityResponse {
  client: Client;
  availableSlots: string[];
  services: Service[];
}

interface BookingResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface ErrorResponse {
  error: string;
}

const BookAppointment: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string;
  const { theme, setTheme } = useTheme();
  
  const [date, setDate] = useState<Value>(new Date());
  const [client, setClient] = useState<Client | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      phone: Yup.string().required('Phone number is required'),
    }),
    onSubmit: async (values) => {
      if (!selectedTimeSlot || !date) {
        alert('Please select a time slot');
        return;
      }

      try {
        const response = await fetch('/api/book-appointment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: date instanceof Date ? date.toISOString() : new Date().toISOString(),
            time: selectedTimeSlot,
            name: values.name,
            email: values.email,
            phone: values.phone,
            clientSlug: slug,
            serviceId: selectedService,
          }),
        });

        const data: BookingResponse = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to book appointment');
        }

        if (data.success) {
          setBookingSuccess(true);
          formik.resetForm();
          setSelectedTimeSlot(null);
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to book appointment');
      }
    },
  });

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  useEffect(() => {
    const fetchClientData = async (): Promise<void> => {
      if (!date) return;
      
      setLoading(true);
      try {
        const dateParam = date instanceof Date ? date.toISOString() : new Date().toISOString();
        const response = await fetch(`/api/get-availability?date=${encodeURIComponent(dateParam)}&client=${encodeURIComponent(slug)}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch client data');
        }
        
        const data: AvailabilityResponse = await response.json();
        
        setClient(data.client);
        setAvailableSlots(data.availableSlots || []);
        setServices(data.services || []);
      } catch (error) {
        console.error('Error fetching client data:', error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [date, slug]);

  const handleTimeSlotClick = (slot: string) => {
    setSelectedTimeSlot(slot === selectedTimeSlot ? null : slot);
  };

  const handleServiceSelect = (serviceId: number) => {
    setSelectedService(serviceId === selectedService ? null : serviceId);
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700 transition-all duration-300">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100 dark:border-green-800">
            <FaCheck className="text-green-500 dark:text-green-400 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">Appointment Confirmed!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Thank you for booking with us. We've sent a confirmation email with all the details.
          </p>
          <button
            onClick={() => setBookingSuccess(false)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
            {client ? `Book with ${client.name}` : 'Book Appointment'}
          </h1>
          
          <ClientOnly>
            <button
              onClick={toggleTheme}
              className="p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <FaSun className="h-5 w-5 text-amber-500" />
              ) : theme === 'dark' ? (
                <FaMoon className="h-5 w-5 text-indigo-300" />
              ) : (
                <FaDesktop className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </ClientOnly>
        </div>
        
        {loading ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="bg-gray-200 dark:bg-gray-700 h-24 w-24 rounded-full animate-pulse"></div>
              <div className="w-full">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-48 mb-4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : client && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-24 w-24 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {client.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">{client.name}</h2>
                {client.bio ? (
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{client.bio}</p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">Professional client services</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                <span className="inline-block w-1 h-6 bg-blue-600 dark:bg-blue-500 mr-3 rounded"></span>
                Select Date
              </h2>
              <div className="calendar-container">
                <style jsx global>{`
                  /* Calendar styling improvements */
                  .react-calendar {
                    width: 100%;
                    background: transparent;
                    border: none;
                    font-family: inherit;
                  }
                  
                  /* Base text color */
                  .react-calendar,
                  .react-calendar button,
                  .react-calendar__month-view__days__day {
                    color: #000000;
                  }
                  
                  .dark .react-calendar,
                  .dark .react-calendar button,
                  .dark .react-calendar__month-view__days__day {
                    color: #ffffff;
                  }
                  
                  /* Navigation and header styles */
                  .react-calendar__navigation {
                    margin-bottom: 1rem;
                  }
                  
                  .react-calendar__navigation button {
                    min-width: 44px;
                    background: none;
                    font-size: 1rem;
                    color: #000000;
                    font-weight: 500;
                  }
                  
                  .dark .react-calendar__navigation button {
                    color: #ffffff;
                  }
                  
                  .react-calendar__navigation button:enabled:hover,
                  .react-calendar__navigation button:enabled:focus {
                    background-color: rgba(0, 0, 0, 0.05);
                    border-radius: 8px;
                  }
                  
                  .dark .react-calendar__navigation button:enabled:hover,
                  .dark .react-calendar__navigation button:enabled:focus {
                    background-color: rgba(255, 255, 255, 0.1);
                  }
                  
                  /* Month and week day headers */
                  .react-calendar__month-view__weekdays {
                    font-weight: bold;
                    font-size: 0.875rem;
                    margin-bottom: 0.5rem;
                  }
                  
                  .react-calendar__month-view__weekdays__weekday {
                    padding: 0.5rem;
                    color: #000000;
                  }
                  
                  .dark .react-calendar__month-view__weekdays__weekday {
                    color: #ffffff;
                  }
                  
                  .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none;
                    font-weight: 600;
                  }
                  
                  /* Day tile styling */
                  .react-calendar__tile {
                    height: 44px;
                    padding: 0.75rem 0.5rem;
                    background: none;
                    text-align: center;
                    line-height: 16px;
                    font-size: 1rem;
                    border-radius: 8px;
                    color: #000000;
                    margin: 2px;
                  }
                  
                  .dark .react-calendar__tile {
                    color: #ffffff;
                  }
                  
                  .react-calendar__tile:enabled:hover,
                  .react-calendar__tile:enabled:focus {
                    background-color: rgba(0, 0, 0, 0.05);
                    color: #000000;
                  }
                  
                  .dark .react-calendar__tile:enabled:hover,
                  .dark .react-calendar__tile:enabled:focus {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                  }
                  
                  /* Today's date */
                  .react-calendar__tile--now {
                    background-color: rgba(59, 130, 246, 0.1);
                    font-weight: bold;
                    color: #000000;
                  }
                  
                  .dark .react-calendar__tile--now {
                    background-color: rgba(59, 130, 246, 0.2);
                    color: #ffffff;
                  }
                  
                  /* Selected date */
                  .react-calendar__tile--active,
                  .react-calendar__tile--active:enabled:hover,
                  .react-calendar__tile--active:enabled:focus {
                    background: #3b82f6;
                    color: white !important;
                    font-weight: bold;
                  }
                  
                  /* Disabled dates */
                  .react-calendar__tile:disabled {
                    color: #9ca3af;
                    opacity: 0.6;
                    cursor: not-allowed;
                  }
                  
                  .dark .react-calendar__tile:disabled {
                    color: #6b7280;
                    opacity: 0.5;
                  }
                  
                  /* Month/year selection menu */
                  .react-calendar__year-view .react-calendar__tile,
                  .react-calendar__decade-view .react-calendar__tile,
                  .react-calendar__century-view .react-calendar__tile {
                    padding: 1.5rem 0.5rem;
                    color: #000000;
                  }
                  
                  .dark .react-calendar__year-view .react-calendar__tile,
                  .dark .react-calendar__decade-view .react-calendar__tile,
                  .dark .react-calendar__century-view .react-calendar__tile {
                    color: #ffffff;
                  }
                  
                  /* Has available slots styling */
                  .has-available-slots {
                    position: relative;
                    font-weight: bold;
                    color: #1d4ed8 !important;
                    background-color: rgba(59, 130, 246, 0.15);
                  }
                  
                  .dark .has-available-slots {
                    color: #93c5fd !important;
                    background-color: rgba(59, 130, 246, 0.25);
                  }
                  
                  .has-available-slots::after {
                    content: '';
                    position: absolute;
                    bottom: 5px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 6px;
                    height: 6px;
                    background-color: #1d4ed8;
                    border-radius: 50%;
                  }
                  
                  .dark .has-available-slots::after {
                    background-color: #93c5fd;
                  }

                  /* Shimmer animation */
                  @keyframes shimmer {
                    0% {
                      background-position: -468px 0;
                    }
                    100% {
                      background-position: 468px 0;
                    }
                  }
                  
                  .shimmer {
                    background: linear-gradient(to right, #f6f7f8 8%, #edeef1 18%, #f6f7f8 33%);
                    background-size: 800px 104px;
                    animation: shimmer 1.5s infinite linear;
                  }
                  
                  .dark .shimmer {
                    background: linear-gradient(to right, #374151 8%, #4b5563 18%, #374151 33%);
                    background-size: 800px 104px;
                    animation: shimmer 1.5s infinite linear;
                  }
                `}</style>
                <Calendar
                  onChange={setDate}
                  value={date}
                  minDate={new Date()}
                  tileClassName={({ date: tileDate, view }) => {
                    if (view === 'month' && date instanceof Date && 
                        tileDate.toDateString() === date.toDateString() &&
                        availableSlots.length > 0) {
                      return "has-available-slots";
                    }
                    return null;
                  }}
                  formatDay={(locale, date) => date.getDate().toString()}
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <form onSubmit={formik.handleSubmit}>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                  <span className="inline-block w-1 h-6 bg-blue-600 dark:bg-blue-500 mr-3 rounded"></span>
                  Select Time
                </h2>
                
                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[...Array(8)].map((_, index) => (
                      <div 
                        key={index} 
                        className="h-12 rounded-lg shimmer"
                      ></div>
                    ))}
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`p-3 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          selectedTimeSlot === slot
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105'
                            : 'bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-600/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:shadow-sm'
                        }`}
                        onClick={() => handleTimeSlotClick(slot)}
                      >
                        <FaClock className="mr-2 h-3.5 w-3.5" /> {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-gray-500 dark:text-gray-400">
                      No available slots for this date. Please try another date.
                    </p>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                    <span className="inline-block w-1 h-6 bg-blue-600 dark:bg-blue-500 mr-3 rounded"></span>
                    Select Service
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="rounded-lg overflow-hidden">
                        <div className="p-4 shimmer">
                          <div className="flex items-center">
                            <div className="rounded-full h-10 w-10 mr-3 bg-gray-300 dark:bg-gray-600"></div>
                            <div className="flex-1">
                              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                              <div className="flex justify-between items-center">
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : services.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 border border-gray-100 dark:border-gray-700 transition-all duration-300">
                  <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
                    <span className="inline-block w-1 h-6 bg-blue-600 dark:bg-blue-500 mr-3 rounded"></span>
                    Select Service
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((service) => {
                      const displayPrice = service.price || service.price;
                      
                      return (
                        <button
                          key={service.id}
                          type="button"
                          className={`p-4 rounded-lg text-left transition-all duration-200 ${
                            selectedService === service.id
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105'
                              : 'bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-600/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:shadow-sm'
                          }`}
                          onClick={() => handleServiceSelect(service.id)}
                        >
                          <div className="flex items-center">
                            <div className={`rounded-full p-2.5 mr-3 ${
                              selectedService === service.id 
                                ? 'bg-white/20' 
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              <FaCut className={selectedService === service.id ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-base">{service.name}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-sm opacity-90">{service.duration} min</span>
                                <span className="font-bold">${displayPrice}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300">
                <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
                  <span className="inline-block w-1 h-6 bg-blue-600 dark:bg-blue-500 mr-3 rounded"></span>
                  Your Information
                </h2>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/70 dark:text-white transition-colors"
                      placeholder="John Doe"
                    />
                    {formik.touched.name && formik.errors.name ? (
                      <div className="text-red-500 text-sm mt-1 font-medium">{formik.errors.name}</div>
                    ) : null}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/70 dark:text-white transition-colors"
                      placeholder="john@example.com"
                    />
                    {formik.touched.email && formik.errors.email ? (
                      <div className="text-red-500 text-sm mt-1 font-medium">{formik.errors.email}</div>
                    ) : null}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/70 dark:text-white transition-colors"
                      placeholder="+1 (123) 456-7890"
                    />
                    {formik.touched.phone && formik.errors.phone ? (
                      <div className="text-red-500 text-sm mt-1 font-medium">{formik.errors.phone}</div>
                    ) : null}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!(selectedTimeSlot && selectedService && formik.isValid)}
                    className={`w-full py-4 rounded-lg shadow-md transition-all duration-300 mt-6 font-medium text-base ${
                      !(selectedTimeSlot && selectedService && formik.isValid)
                        ? 'bg-gray-300 cursor-not-allowed dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transform hover:-translate-y-0.5 hover:shadow-lg'
                    }`}
                  >
                    {!(selectedTimeSlot && selectedService && formik.isValid) 
                      ? 'Please complete all fields'
                      : 'Book Appointment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
