import React from 'react';

const TimePeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const periods = ['6m', '3m', '1m', '2w', '1w', '1d'];
  
  return (
    <div className="flex bg-[var(--bg-subcard)]/80 rounded-full p-0.5 overflow-hidden shadow-inner backdrop-blur-sm border border-white/5 w-full sm:w-auto">
      <div className="flex gap-0.5 w-full justify-between sm:justify-start">
        {periods.map((period) => (
          <button 
            key={period} 
            onClick={() => onPeriodChange(period)}
            className={`px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 flex-1 sm:flex-initial ${ 
              selectedPeriod === period 
                ? 'bg-[var(--strain-blue)] text-white shadow-sm ring-1 ring-[var(--strain-blue)]/30 transform scale-105' 
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="relative">
              {period}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimePeriodSelector;