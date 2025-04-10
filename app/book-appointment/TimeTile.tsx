import React from 'react';
import { FaClock } from 'react-icons/fa';

interface TimeTileProps {
  time: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const TimeTile: React.FC<TimeTileProps> = ({ time, selected, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-3 rounded-lg flex items-center justify-center transition-all
        ${selected 
          ? 'bg-blue-500 text-white shadow-md' 
          : disabled 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}
      `}
      aria-pressed={selected}
    >
      <FaClock className="mr-2 h-4 w-4" />
      <span>{time}</span>
    </button>
  );
};

export default TimeTile;
