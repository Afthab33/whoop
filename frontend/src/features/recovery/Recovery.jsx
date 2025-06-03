// src/components/dashboard/recovery/Recovery.jsx
import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import RecoveryStatistics from './components/RecoveryStatistics';
import RecoveryComparisonChart from './charts/RecoveryComparisonChart';
import AiInsightCard from '../../components/cards/AiInsightCard';
import whoopData from '../../data/day_wise_whoop_data.json';

const Recovery = ({ selectedDate = new Date(), setActiveTab }) => { // ADDED: setActiveTab prop
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const [timePeriod, setTimePeriod] = useState('1d');
  
  // Get the selected day's data
  const dayData = useMemo(() => {
    if (!dateStr || !whoopData[dateStr]) return null;
    return whoopData[dateStr];
  }, [dateStr]);

  // Handle time period change
  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
  };

  // Determine which chart to show based on timePeriod
  const renderRecoveryChart = () => {
    return (
      <RecoveryComparisonChart
        selectedDate={selectedDate}
        timePeriod={timePeriod}
        onTimePeriodChange={handleTimePeriodChange}
      />
    );
  };

  return (
    <div className="p-1 max-w-5xl mx-auto" style={{ background: 'transparent' }}>
      {/* AI Insight Card - ULTRA REDUCED MARGIN */}
      <div className="flex justify-center mb-2">
        <div className="w-full max-w-4xl">
          <AiInsightCard 
            type="recovery" 
            setActiveTab={setActiveTab} // ADDED: Pass setActiveTab
            selectedDate={selectedDate} // ADDED: Pass selectedDate
          />
        </div>
      </div>
      
      {/* Header with date display - ULTRA REDUCED MARGIN */}
      <div className="mb-1">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            Recovery
          </h1>
          <div className="flex items-center">
            <p className="text-[var(--text-secondary)] mr-1.5 text-xs">
              Insights for
            </p>
            <span className="bg-[var(--card-bg)] text-white px-2 py-0.5 rounded-full text-xs font-medium">
              {format(selectedDate, 'EEEE, MMMM d')}
            </span>
          </div>
        </div>
      </div>

      {/* Split layout with sidebar and chart - REDUCED SIDEBAR WIDTH */}
      <div className="flex flex-col md:flex-row gap-2 mb-2">
        {/* Sidebar with recovery metrics - REDUCED WIDTH: 25%/20% → 18%/15% */}
        <div className="md:w-[18%] lg:w-[15%]">
          <RecoveryStatistics
            selectedDate={selectedDate} 
            dayData={dayData}
            dateStr={dateStr}
            timePeriod={timePeriod}
            compactLayout={true}
          />
        </div>
         
        {/* Chart area - INCREASED WIDTH: 75%/80% → 82%/85% */}
        <div className="md:w-[82%] lg:w-[85%]">
          {renderRecoveryChart()}
        </div>
      </div>
    </div>
  );
};

export default Recovery;