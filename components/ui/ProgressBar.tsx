import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: 'blue' | 'green' | 'yellow' | 'red';
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, color = 'blue', className = '' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div
        className={`h-2.5 rounded-full ${colorClasses[color]}`}
        style={{ width: `${safeValue}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;