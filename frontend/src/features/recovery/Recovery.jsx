import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import RecoveryStatistics from './components/RecoveryStatistics';
import RecoveryComparisonChart from './charts/RecoveryComparisonChart';
import AiInsightCard from '../../components/cards/AiInsightCard';
import whoopData from '../../data/day_wise_whoop_data.json';

const Recovery = ({ selectedDate = new Date(), setActiveTab }) => {
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const [timePeriod, setTimePeriod] = useState('1d');
  
  const dayData = useMemo(() => {
    if (!dateStr || !whoopData[dateStr]) return null;
    return whoopData[dateStr];
  }, [dateStr]);

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
          <div className="flex justify-center mb-1 sm:mb-2">
        <div className="w-full max-w-4xl">
          <AiInsightCard 
            type="recovery" 
            setActiveTab={setActiveTab}
            selectedDate={selectedDate}
          />
        </div>
      </div>
      
      {/* Header with date display - MOBILE RESPONSIVE */}
      <div className="mb-1">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0"> {/* MOBILE: Stacked layout */}
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] text-center sm:text-left"> {/* MOBILE: Smaller text, centered */}
            Recovery
          </h1>
          <div className="flex items-center justify-center sm:justify-end"> {/* MOBILE: Centered */}
            <p className="text-[var(--text-secondary)] mr-1 sm:mr-1.5 text-xs">
              Insights for
            </p>
            <span className="bg-[var(--card-bg)] text-white px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium"> {/* MOBILE: Smaller padding */}
              {format(selectedDate, window.innerWidth < 640 ? 'MMM d' : 'EEEE, MMMM d')} {/* MOBILE: Abbreviated date */}
            </span>
          </div>
        </div>
      </div>

      {/* Split layout with sidebar and chart - MOBILE RESPONSIVE */}
      <div className="flex flex-col md:flex-row gap-1 sm:gap-2 mb-1 sm:mb-2"> {/* MOBILE: Smaller gaps and margins */}
        {/* Sidebar with recovery metrics - MOBILE RESPONSIVE */}
        <div className="w-full md:w-[18%] lg:w-[15%] order-2 md:order-1"> {/* MOBILE: Full width, reordered */}
          <RecoveryStatistics
            selectedDate={selectedDate} 
            dayData={dayData}
            dateStr={dateStr}
            timePeriod={timePeriod}
            compactLayout={true}
          />
        </div>
         
        {/* Chart area - MOBILE RESPONSIVE */}
        <div className="w-full md:w-[82%] lg:w-[85%] order-1 md:order-2"> {/* MOBILE: Full width, reordered */}
          {renderRecoveryChart()}
        </div>
      </div>
    </div>
  );
};

export default Recovery;