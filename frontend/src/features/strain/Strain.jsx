// src/components/dashboard/strain/Strain.jsx
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import DetailedHeartRateChart from './charts/DetailedHeartRateChart';
import AiInsightCard from '../../components/cards/AiInsightCard';
import StrainStatistics from './components/StrainStatistics';
import whoopData from '../../data/day_wise_whoop_data.json';

const Strain = ({ selectedDate = new Date(), setActiveTab }) => { // ADDED: setActiveTab prop
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [hoveredTime, setHoveredTime] = useState(null);
  const [chartType] = useState('detailed');
  const [timePeriod, setTimePeriod] = useState('1d');

  // Get real data from whoopData
  const dateStr = useMemo(() => {
    return selectedDate.toLocaleDateString('en-CA');
  }, [selectedDate]);

  const dayData = useMemo(() => {
    return whoopData[dateStr] || null;
  }, [dateStr]);

  // Check if there are activities for the selected date
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
      {/* AI Insight Card - ULTRA REDUCED MARGIN */}
      <div className="flex justify-center mb-2">
        <div className="w-full max-w-4xl">
          <AiInsightCard 
            type="strain" 
            setActiveTab={setActiveTab} // ADDED: Pass setActiveTab
            selectedDate={selectedDate} // ADDED: Pass selectedDate
          />
        </div>
      </div>

      {/* Header with date display - ULTRA REDUCED MARGIN */}
      <div className="mb-1">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            Strain
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
        {/* Sidebar with strain statistics - REDUCED WIDTH: 20% → 15% */}
        <div className="md:w-[18%] lg:w-[15%]">
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
          
          {/* Show a message when no activities - ULTRA COMPACT */}
          {!hasActivities && (
            <div className="bg-[var(--card-bg)] rounded-xl p-2 text-center">
              <div className="text-[var(--text-secondary)] text-[10px] mb-1">
                No workout data available
              </div>
              <div className="text-[var(--text-muted)] text-[9px]">
                Metrics will appear when activities are recorded
              </div>
            </div>
          )}
        </div>
         
        {/* Chart area - INCREASED WIDTH: 80% → 85% */}
        <div className="md:w-[82%] lg:w-[85%]">
          <DetailedHeartRateChart selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  );
};

export default Strain;