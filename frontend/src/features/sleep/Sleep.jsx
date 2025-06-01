import React, { useMemo, useState } from 'react';
import SleepChart from './charts/SleepChart';
import SleepStageSummary from './components/SleepStageSummary';
import whoopData from '../../data/day_wise_whoop_data.json';
import SleepStatistics from './components/SleepStatistics';
import AiInsightCard from '../../components/cards/AiInsightCard';

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

  // Handle stage changes from either chart
  const handleStageChange = (stage) => {
    setActiveStage(stage);
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">

      {/* AI Insight Card - New Addition */}
      <div className="flex justify-center mb-8">
        <div className="w-full max-w-6xl">
          <AiInsightCard type="sleep" />
        </div>
      </div>

      {/* Header with date display */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sleep</h1>
          <div className="flex items-center">
            <p className="text-[var(--text-secondary)] mr-2">Insights for</p>
            <span className="bg-[var(--card-bg)] text-white px-3 py-1 rounded-full text-sm font-medium">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Top section: Sleep Chart and Summary */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Left: Large Sleep Chart */}
        <div className="w-full lg:w-3/4">
          <SleepChart 
            selectedDate={selectedDate}
            activeStageFromParent={activeStage}
            onStageChange={setActiveStage}
            onTimePeriodChange={handleTimePeriodChange}
          />
        </div>
        
        {/* Right: Sleep Stage Summary */}
        <div className="w-full lg:w-1/4">
          <SleepStageSummary 
            selectedDate={selectedDate}
            activeStage={activeStage}
            setActiveStage={setActiveStage}
          />
        </div>
      </div>
      
      {/* Bottom: Sleep Statistics */}
      <div className="mb-6">
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