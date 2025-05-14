import React from 'react';
import { format } from 'date-fns';

const SleepTrendChart = ({ chartData }) => {
  if (!chartData) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-400">No trend data available</p>
      </div>
    );
  }

  // This component now only renders grid lines and date labels
  // All bar chart functionality has been removed
  
  return (
    <>
      {/* Add horizontal grid lines with explicit positioning */}
      <div className="absolute inset-0 pointer-events-none">
        {[14, 12, 10, 8, 6, 4, 2, 0].map((value, i) => (
          <div
            key={i}
            className={`border-b w-full h-0 absolute ${
              value === 0 ? 'border-gray-500/70' : 'border-gray-700/30'
            }`}
            style={{ 
              top: value === 0 ? '100%' : `${(i * 100) / 8}%`, 
              left: 0,
              right: 0,
              borderBottomWidth: value === 0 ? '1.5px' : '1px'
            }}
          />
        ))}
      </div>
      
      {/* Date labels at the bottom */}
      <div className="absolute left-0 right-0 top-full">
        {chartData.dateLabels && chartData.dateLabels.map((label, i) => (
          <div 
            key={i}
            className="absolute -translate-x-1/2 text-xs font-medium text-gray-400"
            style={{ left: `${label.x}px`, top: '12px' }}
          >
            {label.label}
          </div>
        ))}
      </div>
    </>
  );
};

export default SleepTrendChart;