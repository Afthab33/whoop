import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import DetailedHeartRateChart from './charts/DetailedHeartRateChart';
import AiInsightCard from '../../components/cards/AiInsightCard';
import StrainStatistics from './components/StrainStatistics';
import whoopData from '../../data/day_wise_whoop_data.json';

const Strain = ({ selectedDate = new Date(), setActiveTab }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [hoveredTime, setHoveredTime] = useState(null);
  const [chartType] = useState('detailed');
  const [timePeriod, setTimePeriod] = useState('1d');

  const dateStr = useMemo(() => {
    return selectedDate.toLocaleDateString('en-CA');
  }, [selectedDate]);

  const dayData = useMemo(() => {
    return whoopData[dateStr] || null;
  }, [dateStr]);

  const hasActivities = useMemo(() => {
    if (!dayData || !dayData.workouts) return false;
    
    const realWorkouts = dayData.workouts.filter(workout => 
      workout["Activity name"] && 
      workout["Activity name"].toLowerCase() !== "idle" &&
      workout["Duration (min)"] && 
      workout["Duration (min)"] > 0
    );
    
    return realWorkouts.length > 0;
  }, [dayData]);

  return (
    <div className="p-1 max-w-5xl mx-auto" style={{ background: 'transparent' }}>
          <div className="flex justify-center mb-1 sm:mb-2">
        <div className="w-full max-w-4xl">
          <AiInsightCard 
            type="strain" 
            setActiveTab={setActiveTab}
            selectedDate={selectedDate}
          />
        </div>
      </div>

      {/* Header with date display - MOBILE RESPONSIVE */}
      <div className="mb-1">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0"> {/* MOBILE: Stacked layout */}
          <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] text-center sm:text-left"> {/* MOBILE: Smaller text, centered */}
            Strain
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
        {/* Sidebar with strain statistics - MOBILE RESPONSIVE */}
        <div className="w-full md:w-[18%] lg:w-[15%] order-2 md:order-1"> {/* MOBILE: Full width, reordered */}
          {/* Only show StrainStatistics if there are activities */}
          {hasActivities && (
            <StrainStatistics
              selectedDate={selectedDate}
              dayData={dayData}
              dateStr={dateStr}
              timePeriod={timePeriod}
              compactLayout={true}
            />
          )}
          
          {/* Show a message when no activities - MOBILE RESPONSIVE */}
          {!hasActivities && (
            <div className="bg-[var(--card-bg)] rounded-xl p-1.5 sm:p-2 text-center"> {/* MOBILE: Smaller padding */}
              <div className="text-[var(--text-secondary)] text-[9px] sm:text-[10px] mb-0.5 sm:mb-1"> {/* MOBILE: Smaller text and margin */}
                No workout data available
              </div>
              <div className="text-[var(--text-muted)] text-[8px] sm:text-[9px]"> {/* MOBILE: Smaller text */}
                Metrics will appear when activities are recorded
              </div>
            </div>
          )}
        </div>
         
        {/* Chart area - MOBILE RESPONSIVE */}
        <div className="w-full md:w-[82%] lg:w-[85%] order-1 md:order-2"> {/* MOBILE: Full width, reordered */}
          <DetailedHeartRateChart selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  );
};

export default Strain;