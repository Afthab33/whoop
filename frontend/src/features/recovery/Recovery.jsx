// src/components/dashboard/recovery/Recovery.jsx
import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import RecoveryStatistics from './components/RecoveryStatistics';
import RecoveryComparisonChart from './charts/RecoveryComparisonChart';
import RecoveryWeeklyChart from './charts/RecoveryWeeklyChart';
import Recovery3MonthsChart from './charts/Recovery3MonthsChart';
import RecoveryChart from './charts/RecoveryChart';
import AiInsightCard from '../../components/cards/AiInsightCard';
import whoopData from '../../data/day_wise_whoop_data.json';

const Recovery = ({ selectedDate = new Date() }) => {
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const [timePeriod, setTimePeriod] = useState('1w'); // Changed from 1d to 1w as default
  
  // Get the selected day's data
  const dayData = useMemo(() => {
    if (!dateStr || !whoopData[dateStr]) return null;
    return whoopData[dateStr];
  }, [dateStr]);

  // Metrics for the comparison chart
  const comparisonMetrics = useMemo(() => {
    return {
      hrv: { 
        current: dayData?.recovery?.hrv || 66, 
        baseline: dayData?.recovery?.baselineHrv || 55 
      },
      restingHr: { 
        current: dayData?.recovery?.restingHr || 63, 
        baseline: dayData?.recovery?.baselineRestingHr || 58 
      },
      sleepPerformance: { 
        current: dayData?.recovery?.sleepPerformance || 93, 
        baseline: dayData?.recovery?.baselineSleepPerformance || 90 
      }
    };
  }, [dayData]);

  // Handle time period change
  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
  };

  // Determine which chart to show based on timePeriod
  const renderRecoveryChart = () => {
    // Show 3-month line chart for 3m and 6m views
    if (['3m', '6m'].includes(timePeriod)) {
      return (
        <Recovery3MonthsChart
          selectedDate={selectedDate}
          timePeriod={timePeriod}
          onTimePeriodChange={handleTimePeriodChange}
        />
      );
    }
    
    // Show weekly bar chart for 1w, 2w, and 1m views
    if (['1w', '2w', '1m'].includes(timePeriod)) {
      return (
        <RecoveryWeeklyChart
          selectedDate={selectedDate}
          timePeriod={timePeriod}
          onTimePeriodChange={handleTimePeriodChange}
        />
      );
    }
    
    // Show comparison chart for single day view
    return (
      <div className="p-6">
        <RecoveryComparisonChart
          selectedDate={selectedDate}
          metrics={comparisonMetrics}
          timePeriod={timePeriod}
          onTimePeriodChange={handleTimePeriodChange}
        />
      </div>
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
        <div className="md:w-[75%] lg:w-[80%] bg-[var(--card-bg)] rounded-xl shadow-lg border border-gray-800/30 overflow-hidden">
          {renderRecoveryChart()}
        </div>
      </div>
      
      {/* Unified Recovery Chart Card
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