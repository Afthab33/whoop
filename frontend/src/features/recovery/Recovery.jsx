// src/components/dashboard/recovery/Recovery.jsx
import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import RecoveryStatistics from './components/RecoveryStatistics';
import RecoveryComparisonChart from './charts/RecoveryComparisonChart';
import AiInsightCard from '../../components/cards/AiInsightCard';
import whoopData from '../../data/day_wise_whoop_data.json';

const Recovery = ({ selectedDate = new Date() }) => {
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const [timePeriod, setTimePeriod] = useState('1d'); // Changed back to 1d to show comparison chart by default
  
  // Get the selected day's data
  const dayData = useMemo(() => {
    if (!dateStr || !whoopData[dateStr]) return null;
    return whoopData[dateStr];
  }, [dateStr]);

  // Handle time period change
  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
  };

  // FIXED: Determine which chart to show based on timePeriod
  const renderRecoveryChart = () => {
    // Show comparison chart for single day view (1d)
    if (timePeriod === '1d') {
      return (
        <RecoveryComparisonChart
          selectedDate={selectedDate}
          timePeriod={timePeriod}
          onTimePeriodChange={handleTimePeriodChange}
        />
      );
    }
    
    // Show the enhanced RecoveryComparisonChart for all multi-period views
    // This will automatically switch to trend view based on timePeriod
    return (
      <RecoveryComparisonChart
        selectedDate={selectedDate}
        timePeriod={timePeriod}
        onTimePeriodChange={handleTimePeriodChange}
      />
    );
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      {/* AI Insight Card */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-6xl">
          <AiInsightCard type="recovery" />
        </div>
      </div>
      
      {/* Header with date display */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Recovery</h1>
          <div className="flex items-center">
            <p className="text-[var(--text-secondary)] mr-2">Insights for</p>
            <span className="bg-[var(--card-bg)] text-white px-3 py-1 rounded-full text-sm font-medium">
              {format(selectedDate, 'EEEE, MMMM d')}
            </span>
          </div>
        </div>
      </div>

      {/* Split layout with sidebar and chart */}
      <div className="flex flex-col md:flex-row gap-5 mb-6">
        {/* Sidebar with recovery metrics - 20% width */}
        <div className="md:w-[25%] lg:w-[20%]">
          <RecoveryStatistics
            selectedDate={selectedDate} 
            dayData={dayData}
            dateStr={dateStr}
            timePeriod={timePeriod}
            compactLayout={true}
          />
        </div>
         
        {/* Chart area - 80% width */}
        <div className="md:w-[75%] lg:w-[80%]">
          {renderRecoveryChart()}
        </div>
      </div>
      
      {/* Optional: Legacy charts for reference (commented out)
      <div className="mb-6">
        <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-gray-800/30 h-[400px]">
          <RecoveryChart selectedDate={selectedDate} />
        </div>
      </div> */}
      
      {/* Rest of recovery components... */}
    </div>
  );
};

export default Recovery;