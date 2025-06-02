import React, { useMemo, useState } from 'react';
import SleepChart from './charts/SleepChart';
import whoopData from '../../data/day_wise_whoop_data.json';
import SleepStatistics from './components/SleepStatistics';
import AiInsightCard from '../../components/cards/AiInsightCard';
import { format } from 'date-fns';

const Sleep = ({ selectedDate = new Date() }) => {
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const [activeStage, setActiveStage] = useState(null);
  const [timePeriod, setTimePeriod] = useState('1d');
  
  // Get the selected day's data
  const dayData = useMemo(() => {
    if (!dateStr || !whoopData[dateStr]) return null;
    return whoopData[dateStr];
  }, [dateStr]);

  // Check if there are sleep activities for the selected date
  const hasSleepData = useMemo(() => {
    return dayData && dayData.sleep_summary && Object.keys(dayData.sleep_summary).length > 0;
  }, [dayData]);

  // Add this function to track time period changes from the chart
  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
  };

  // Handle stage changes from either chart
  const handleStageChange = (stage) => {
    setActiveStage(stage);
  };

  return (
    <div className="p-1 max-w-5xl mx-auto"> {/* MATCH RECOVERY: Changed from p-4 max-w-screen-xl → p-1 max-w-5xl */}
      {/* AI Insight Card - MATCH RECOVERY ULTRA REDUCED MARGIN */}
      <div className="flex justify-center mb-2"> {/* MATCH RECOVERY: Changed from mb-8 → mb-2 */}
        <div className="w-full max-w-4xl"> {/* MATCH RECOVERY: Changed from max-w-6xl → max-w-4xl */}
          <AiInsightCard type="sleep" />
        </div>
      </div>
      
      {/* Header with date display - MATCH RECOVERY ULTRA REDUCED MARGIN */}
      <div className="mb-1"> {/* MATCH RECOVERY: Changed from mb-4 → mb-1 */}
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-[var(--text-primary)]"> {/* MATCH RECOVERY: Changed from text-2xl → text-lg */}
            Sleep
          </h1>
          <div className="flex items-center">
            <p className="text-[var(--text-secondary)] mr-1.5 text-xs"> {/* MATCH RECOVERY: Changed from mr-2 → mr-1.5 and added text-xs */}
              Insights for
            </p>
            <span className="bg-[var(--card-bg)] text-white px-2 py-0.5 rounded-full text-xs font-medium"> {/* MATCH RECOVERY: Changed from px-3 py-1 text-sm → px-2 py-0.5 text-xs */}
              {format(selectedDate, 'EEEE, MMMM d')} {/* MATCH RECOVERY: Use same date format */}
            </span>
          </div>
        </div>
      </div>

      {/* Split layout with sidebar and chart - MATCH RECOVERY REDUCED SIDEBAR WIDTH */}
      <div className="flex flex-col md:flex-row gap-2 mb-2"> {/* MATCH RECOVERY: Removed h-[420px] */}
        {/* Sidebar with sleep statistics - MATCH RECOVERY REDUCED WIDTH: 18%/15% */}
        <div className="md:w-[18%] lg:w-[15%]"> {/* MATCH RECOVERY: Changed from md:w-[25%] lg:w-[22%] → md:w-[18%] lg:w-[15%] and removed h-full */}
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
          
          {/* Show a message when no sleep data - MATCH RECOVERY STYLING */}
          {!hasSleepData && (
            <div className="bg-[var(--card-bg)] rounded-xl p-3 text-center h-full flex flex-col justify-center">
              <div className="text-[var(--text-secondary)] text-xs mb-1.5">
                No sleep data available
              </div>
              <div className="text-[var(--text-muted)] text-[10px]">
                Metrics will appear when sleep data is recorded
              </div>
            </div>
          )}
        </div>
         
        {/* Chart area - MATCH RECOVERY INCREASED WIDTH: 82%/85% */}
        <div className="md:w-[82%] lg:w-[85%]"> {/* MATCH RECOVERY: Changed from md:w-[75%] lg:w-[78%] → md:w-[82%] lg:w-[85%] and removed h-full */}
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