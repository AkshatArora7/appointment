import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Availability, TimeSlot } from '@/types/interfaces';
import ShimmerEffect from '@/components/ShimmerEffect';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

interface SetAvailabilityPanelProps {
  selectedDate: Date;
  clientId: string;
  existingAvailability: Availability[];
  refreshAvailability: () => Promise<void>;
}

const SetAvailabilityPanel: React.FC<SetAvailabilityPanelProps> = ({ 
  selectedDate, 
  clientId, 
  existingAvailability,
  refreshAvailability 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Generate time slots from 9:00 AM to 5:00 PM in 30-minute increments
  useEffect(() => {
    setIsLoading(true);
    const slots: TimeSlot[] = [];
    const hours = Array.from({ length: 9 }, (_, i) => i + 9); // 9 AM to 5 PM
    
    hours.forEach(hour => {
      const formattedHour = hour <= 12 ? hour : hour - 12;
      const period = hour < 12 ? 'AM' : 'PM';
      
      // Add hour slot (XX:00)
      slots.push({
        time: `${formattedHour.toString().padStart(2, '0')}:00 ${period}`,
        available: true
      });
      
      // Add half-hour slot (XX:30)
      if (hour < 17) { // Don't add 5:30 PM
        slots.push({
          time: `${formattedHour.toString().padStart(2, '0')}:30 ${period}`,
          available: true
        });
      }
    });
    
    // Update slots based on existing availability
    if (existingAvailability.length > 0) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const availabilityForDate = existingAvailability.filter(
        avail => format(new Date(avail.date), 'yyyy-MM-dd') === formattedDate
      );
      
      if (availabilityForDate.length > 0) {
        // Parse the available times to mark which slots are available
        const availableTimes = new Set(availabilityForDate.map(a => a.time));
        
        // Update slot availability
        slots.forEach((slot, index) => {
          // Convert time format if needed (from 12-hour to 24-hour or vice versa)
          const slotTime = convertTo24Hour(slot.time);
          slot.available = availableTimes.has(slotTime);
        });
      }
    }
    
    setTimeSlots(slots);
    setIsLoading(false);
  }, [selectedDate, existingAvailability]);

  // Convert 12-hour format (09:00 AM) to 24-hour format (09:00)
  const convertTo24Hour = (time12h: string): string => {
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (period === 'PM' && hours !== '12') {
      hours = String(Number(hours) + 12);
    } else if (period === 'AM' && hours === '12') {
      hours = '00';
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  // Convert 24-hour format (09:00) to 12-hour format (09:00 AM)
  const convertTo12Hour = (time24h: string): string => {
    const [hours, minutes] = time24h.split(':');
    const hour = Number(hours);
    
    if (hour === 0) {
      return `12:${minutes} AM`;
    } else if (hour < 12) {
      return `${hour}:${minutes} AM`;
    } else if (hour === 12) {
      return `12:${minutes} PM`;
    } else {
      return `${hour - 12}:${minutes} PM`;
    }
  };

  const toggleSlotAvailability = (index: number) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index] = {
      ...updatedSlots[index],
      available: !updatedSlots[index].available
    };
    setTimeSlots(updatedSlots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      // Group consecutive available slots for efficiency
      const availableRanges: { start: string, end: string }[] = [];
      let currentRange: { start: string, end: string } | null = null;

      timeSlots.forEach((slot, index) => {
        if (slot.available) {
          const time24h = convertTo24Hour(slot.time);
          
          if (!currentRange) {
            // Start a new range
            currentRange = { start: time24h, end: time24h };
          } else {
            // Extend the current range
            currentRange.end = time24h;
          }
        } else if (currentRange) {
          // End of a range
          availableRanges.push(currentRange);
          currentRange = null;
        }
      });

      // Add the last range if it exists
      if (currentRange) {
        availableRanges.push(currentRange);
      }

      // Clear existing availability first
      await fetch(`/api/client-availability?clientId=${clientId}&date=${selectedDate.toISOString()}`, {
        method: 'DELETE',
      });

      // Save each availability range
      for (const range of availableRanges) {
        const response = await fetch('/api/client-availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            date: selectedDate.toISOString(),
            startTime: range.start,
            endTime: calculateEndTime(range.end), // Add 30 minutes to the end time
            isAvailable: true,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to save availability');
        }
      }

      // Log the saved time slots in 12-hour format for debugging
      console.log('Saved availability time slots:', 
        availableRanges.map(range => ({
          start: convertTo12Hour(range.start),
          end: convertTo12Hour(calculateEndTime(range.end))
        }))
      );

      await refreshAvailability();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate end time for a slot (adds 30 minutes)
  const calculateEndTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    let newHours = hours;
    let newMinutes = minutes + 30;
    
    if (newMinutes >= 60) {
      newHours++;
      newMinutes -= 60;
    }
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-gray-800 dark:text-gray-200">
      <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
        Set Availability for {format(selectedDate, 'MMM d, yyyy')}
      </h2>
      
      {isLoading ? (
        <div className="space-y-2">
          <ShimmerEffect height="40px" />
          <ShimmerEffect height="40px" />
          <ShimmerEffect height="40px" />
          <ShimmerEffect height="40px" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Select available 30-minute time slots:
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleSlotAvailability(index)}
                  className={`
                    p-2 rounded-md text-sm flex items-center justify-between transition-colors
                    ${slot.available 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'}
                  `}
                >
                  <span>{slot.time}</span>
                  {slot.available ? 
                    <FaCheckCircle className="text-green-500 ml-1" /> : 
                    <FaTimesCircle className="text-gray-400 ml-1" />
                  }
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="text-red-500 text-sm mb-4">{errorMessage}</div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </div>
              ) : (
                'Save Availability'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SetAvailabilityPanel;
