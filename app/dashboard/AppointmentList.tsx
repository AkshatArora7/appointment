import React from 'react';
import { Appointment } from '@/types/interfaces';
import { format } from 'date-fns';
import ShimmerEffect from '@/components/ShimmerEffect';

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
  onStatusChange: (appointmentId: number, status: string) => Promise<void>;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, isLoading, onStatusChange }) => {
  const renderShimmerRows = () => {
    return Array(5).fill(0).map((_, index) => (
      <div key={`shimmer-${index}`} className="border-b border-gray-200 dark:border-gray-700 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="space-y-2 w-full md:w-1/2">
            <ShimmerEffect width="60%" height="1.5rem" />
            <ShimmerEffect width="40%" height="1rem" />
          </div>
          <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end space-y-2 w-full md:w-1/2">
            <ShimmerEffect width="30%" height="1.25rem" />
            <div className="flex space-x-2 w-full justify-start md:justify-end">
              <ShimmerEffect width="80px" height="2rem" borderRadius="0.5rem" />
              <ShimmerEffect width="80px" height="2rem" borderRadius="0.5rem" />
            </div>
          </div>
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return <div className="space-y-4">{renderShimmerRows()}</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No appointments found for this date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="border-b border-gray-200 dark:border-gray-700 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{appointment.clientService?.service.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(appointment.date), 'MMM d, yyyy')} at {appointment.time} - {appointment.customer?.name}
              </p>
            </div>
            <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${appointment.status === 'completed' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'}
                ${appointment.status === 'cancelled' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}
                ${appointment.status === 'pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'}
                ${appointment.status === 'confirmed' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'}
              `}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
              
              <div className="flex space-x-2 mt-2">
                {appointment.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => onStatusChange(appointment.id, 'confirmed')}
                      className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => onStatusChange(appointment.id, 'cancelled')}
                      className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {appointment.status === 'confirmed' && (
                  <>
                    <button 
                      onClick={() => onStatusChange(appointment.id, 'completed')}
                      className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded-md transition"
                    >
                      Complete
                    </button>
                    <button 
                      onClick={() => onStatusChange(appointment.id, 'cancelled')}
                      className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppointmentList;
