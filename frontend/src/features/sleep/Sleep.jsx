import React, { useMemo, useState } from 'react';
import SleepChart from './charts/SleepChart';
import whoopData from '../../data/day_wise_whoop_data.json';
import SleepStatistics from './components/SleepStatistics';
import AiInsightCard from '../../components/cards/AiInsightCard';
import { format } from 'date-fns';

const Sleep = ({ selectedDate = new Date(), setActiveTab }) => {
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const [activeStage, setActiveStage] = useState(null);
  const [timePeriod, setTimePeriod] = useState('1d');
  
  const dayData = useMemo(() => {
    if (!dateStr || !whoopData[dateStr]) return null;
    return whoopData[dateStr];
  }, [dateStr]);

  const hasSleepData = useMemo(() => {
    return dayData && dayData.sleep_summary && Object.keys(dayData.sleep_summary).length > 0;
  }, [dayData]);

  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
  };

  const handleStageChange = (stage) => {
    setActiveStage(stage);
  };

  return (
    <div className="p-1 max-w-5xl mx-auto">
        <div className="flex justify-center mb-1 sm:mb-2">
        <div className="w-full max-w-4xl">
          <AiInsightCard 
            type="sleep" 
            setActiveTab={setActiveTab}
            selectedDate={selectedDate}
          />
        </div>
      </div>
      
      {/* Header with date display - MOBILE RESPONSIVE */}
      <div className="mb-1">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0"> {/* MOBILE: Stacked layout */}
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] text-center sm:text-left"> {/* MOBILE: Smaller text, centered */}
            Sleep
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
        {/* Sidebar with sleep statistics - MOBILE RESPONSIVE */}
        <div className="w-full md:w-[18%] lg:w-[15%] order-2 md:order-1"> {/* MOBILE: Full width, reordered */}
          {/* Only show SleepStatistics if there is sleep data */}
          {hasSleepData && (
            <SleepStatistics
              selectedDate={selectedDate}
              dayData={dayData}
              dateStr={dateStr}
              timePeriod={timePeriod}
              compactLayout={true}
            />
          )}
          
          {/* Show a message when no sleep data - MOBILE RESPONSIVE */}
          {!hasSleepData && (
            <div className="bg-[var(--card-bg)] rounded-xl p-2 sm:p-3 text-center h-full flex flex-col justify-center"> {/* MOBILE: Smaller padding */}
              <div className="text-[var(--text-secondary)] text-[10px] sm:text-xs mb-1 sm:mb-1.5"> {/* MOBILE: Smaller text and margin */}
                No sleep data available
              </div>
              <div className="text-[var(--text-muted)] text-[8px] sm:text-[10px]"> {/* MOBILE: Smaller text */}
                Metrics will appear when sleep data is recorded
              </div>
            </div>
          )}
        </div>
         
        {/* Chart area - MOBILE RESPONSIVE */}
        <div className="w-full md:w-[82%] lg:w-[85%] order-1 md:order-2"> {/* MOBILE: Full width, reordered */}
          <SleepChart 
            selectedDate={selectedDate}
            activeStageFromParent={activeStage}
            onStageChange={setActiveStage}
            onTimePeriodChange={handleTimePeriodChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Sleep;