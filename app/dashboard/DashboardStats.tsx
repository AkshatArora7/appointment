import React from 'react';
import { ClientStats } from '@/types/interfaces';
import { FaCalendarAlt, FaUsers, FaDollarSign, FaClock } from 'react-icons/fa';
import ShimmerEffect from '@/components/ShimmerEffect';

interface DashboardStatsProps {
  stats: ClientStats;
  isLoading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading }) => {
  const statItems = [
    {
      name: "Today's Appointments",
      value: stats.todayAppointments,
      icon: <FaCalendarAlt className="h-6 w-6 text-blue-500" />,
    },
    {
      name: "Upcoming Appointments",
      value: stats.upcomingAppointments,
      icon: <FaClock className="h-6 w-6 text-green-500" />,
    },
    {
      name: "Total Customers",
      value: stats.totalCustomers,
      icon: <FaUsers className="h-6 w-6 text-purple-500" />,
    },
    {
      name: "Total Revenue",
      value: `$${stats.revenue.toFixed(2)}`,
      icon: <FaDollarSign className="h-6 w-6 text-yellow-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">{item.icon}</div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.name}</h3>
              {isLoading ? (
                <ShimmerEffect className="mt-1" width="80px" height="1.75rem" />
              ) : (
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.value}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
