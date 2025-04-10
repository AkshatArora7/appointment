"use client";

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Value } from '@/types/interfaces';
import 'react-calendar/dist/Calendar.css';

const SetAvailability: React.FC = () => {
  const [date, setDate] = useState<Value>(new Date());
  const [time, setTime] = useState<string>('');
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [availabilities, setAvailabilities] = useState<Array<{time: string}>>([]);

  useEffect(() => {
    if (date instanceof Date) {
      setFormattedDate(date.toDateString());
      fetchExistingAvailabilities(date);
    }
  }, [date]);

  const fetchExistingAvailabilities = async (selectedDate: Date) => {
    try {
      const dateParam = selectedDate.toISOString();
      const response = await fetch(`/api/get-availability?date=${encodeURIComponent(dateParam)}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch availabilities`);
      }
      
      const data = await response.json();
      // The API returns available slots that haven't been booked
      setAvailabilities(data.availableSlots.map((time: string) => ({ time })) || []);
    } catch (error) {
      console.error('Error fetching availabilities:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) {
      setError('Please select a time.');
      return;
    }

    setLoading(true);
    setSuccess('');
    setError('');
    
    try {
      const response = await fetch('/api/set-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date instanceof Date ? date.toISOString() : new Date().toISOString(),
          time
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: Failed to set availability`);
      }
      
      setSuccess('Availability set successfully!');
      setTime('');
      
      // Refresh the list of availabilities
      if (date instanceof Date) {
        fetchExistingAvailabilities(date);
      }
    } catch (error) {
      console.error('Error setting availability:', error);
      setError(error instanceof Error ? error.message : 'Failed to set availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-green-500 text-white p-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">Set Availability</h1>
      <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg text-black w-full max-w-md">
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="calendar-container bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6">
          <Calendar 
            onChange={setDate} 
            value={date} 
            className="w-full rounded-md" 
            minDate={new Date()}
            formatDay={(locale, date) => date.getDate().toString()}
          />
        </div>
        
        <p className="text-center mb-4 font-medium">Selected Date: {formattedDate}</p>
        
        {availabilities.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Current Available Times:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {availabilities.map((slot, index) => (
                <div 
                  key={index}
                  className="p-2 border rounded-md bg-gray-100 text-center"
                >
                  {slot.time}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Add New Time Slot:</label>
            <input 
              type="time" 
              value={time} 
              onChange={(e) => setTime(e.target.value)} 
              required 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-lg shadow transition duration-300 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
                Processing...
              </span>
            ) : 'Set Availability'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetAvailability;
