import React from 'react';
import TimeTile from './TimeTile';
import { TimeSlot } from '@/types/interfaces';

interface TimePickerProps {
  availableTimes: string[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ availableTimes, selectedTime, onTimeSelect }) => {
  if (availableTimes.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg text-center">
        No available time slots for this date. Please select a different date.
      </div>
    );
  }

  // Sort times chronologically
  const sortedTimes = [...availableTimes].sort((a, b) => {
    return a.localeCompare(b);
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {sortedTimes.map((time) => (
        <TimeTile
          key={time}
          time={time}
          selected={selectedTime === time}
          onClick={() => onTimeSelect(time)}
        />
      ))}
    </div>
  );
};

export default TimePicker;
