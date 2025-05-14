import React, { useMemo, useState } from 'react';
import SleepStagesChart from './charts/SleepStagesChart';
import SleepStageSummary from './charts/SleepStageSummary';
import whoopData from '../../../data/day_wise_whoop_data.json';
import SleepStatistics from './charts/SleepStatistics';

const Sleep = ({ selectedDate = new Date() }) => {
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const [activeStage, setActiveStage] = useState(null);
  const [timePeriod, setTimePeriod] = useState('1d');
  
  // Get the selected day's data
  const dayData = useMemo(() => {
    if (!dateStr || !whoopData[dateStr]) return null;
    return whoopData[dateStr];
  }, [dateStr]);

  // Formatted date for display
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Add this function to track time period changes from the chart
  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
  };

  return (
    <div className="p-3">
      {/* Header with date display */}
      <div className="mb-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Sleep</h1>
          <div className="flex items-center">
            <p className="text-gray-400 mr-2 text-sm">Insights for</p>
            <span className="bg-[var(--card-bg)] text-white px-3 py-1 rounded-full text-sm font-medium">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Top section: Sleep Chart and Summary */}
      <div className="flex flex-col lg:flex-row gap-3 mb-3">
        {/* Left: Large Sleep Chart */}
        <div className="w-full lg:w-[80%]">
          <SleepStagesChart 
            selectedDate={selectedDate}
            activeStageFromParent={activeStage}
            onStageChange={setActiveStage}
            onTimePeriodChange={handleTimePeriodChange}
          />
        </div>
        
        {/* Right: Sleep Stage Summary */}
        <div className="w-full lg:w-[20%]">
          <SleepStageSummary 
            selectedDate={selectedDate}
            activeStage={activeStage}
            setActiveStage={setActiveStage}
          />
        </div>
      </div>
      
      {/* Bottom: Sleep Statistics */}
      <div className="w-full">
        {/* We'll customize SleepStatistics directly in the component */}
        <SleepStatistics 
          selectedDate={selectedDate} 
          dayData={dayData} 
          dateStr={dateStr} 
          compactLayout={true} 
          timePeriod={timePeriod}
        />
      </div>
    </div>
  );
};

export default Sleep;