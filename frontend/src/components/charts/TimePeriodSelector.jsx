import React from 'react';

const TimePeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const periods = ['1d', '1w', '2w', '1m', '3m', '6m'];
  
  return (
    <div className="flex bg-[var(--bg-subcard)] rounded-full p-1.5 overflow-hidden shadow-inner">
      {periods.map((period) => (
        <button 
          key={period} 
          onClick={() => onPeriodChange(period)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            selectedPeriod === period 
              ? 'bg-[var(--strain-blue)] text-white shadow-sm' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
          }`}
        >
          {period}
        </button>
      ))}
    </div>
  );
};

export default TimePeriodSelector;