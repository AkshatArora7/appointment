import React from 'react';
import Calendar from 'react-calendar';
import { Value } from '@/types/interfaces';

const AppointmentCalendar: React.FC<{ date: Value, setDate: React.Dispatch<React.SetStateAction<Value>> }> = ({ date, setDate }) => {
  // Handler function to convert Calendar's value to our expected type
  const handleDateChange = (value: any) => {
    // If it's a Date object, pass it directly
    if (value instanceof Date) {
      setDate(value);
    } 
    // If it's an array (date range), take the first date
    else if (Array.isArray(value)) {
      setDate(value[0]);
    }
  };

  return (
    <div className="w-full mb-8 flex justify-center">
      <div className="w-full max-w-xs calendar-container bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <Calendar 
          onChange={handleDateChange} 
          value={date} 
          className="w-full rounded-lg border-none"
          formatDay={(locale, date) => date.getDate().toString()}
          prevLabel="←"
          nextLabel="→"
          prev2Label={null}
          next2Label={null}
        />
      </div>
    </div>
  );
};

export default AppointmentCalendar;

// Ensure no additional <html> or <body> elements are rendered
<style jsx global>{`
  body {
    overflow-y: auto;
  }
`}</style>
