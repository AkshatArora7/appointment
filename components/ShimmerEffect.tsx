import React from 'react';

interface ShimmerEffectProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  borderRadius?: string;
}

const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  className = '',
  height = '1rem',
  width = '100%',
  borderRadius = '0.25rem',
}) => {
  return (
    <div 
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
      style={{ 
        height, 
        width, 
        borderRadius 
      }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-gray-300/70 dark:via-gray-600/70 to-transparent"></div>
      </div>
    </div>
  );
};

export default ShimmerEffect;
