// src/components/dashboard/strain/Strain.jsx
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import DetailedHeartRateChart from './charts/DetailedHeartRateChart';
import AiInsightCard from '../../components/cards/AiInsightCard';
import StrainStatistics from './components/StrainStatistics';
import whoopData from '../../data/day_wise_whoop_data.json';

const MetricCard = ({ icon, title, value, baseline, trend, color }) => {
  const getTrendIcon = () => {
    if (trend === 'up') {
      return <svg className="text-[var(--recovery-green)]" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>;
    } else if (trend === 'down') {
      return <svg className="text-[var(--alert-red)]" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 12L12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>;
    } else if (trend === 'none') {
      return <svg className="text-[var(--text-muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="4" fill="currentColor"/>
      </svg>;
    }
    return null;
  };

  return (
    <div className="whoops-card flex flex-col px-6 py-5">
      <div className="flex items-center mb-2">
        <div className="mr-3 text-[var(--text-secondary)]">{icon}</div>
        <h3 className="uppercase text-xl font-medium text-[var(--text-secondary)]">{title}</h3>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="flex items-center">
          <span className={`text-6xl font-bold ${color}`}>{value}</span>
          <span className="ml-2">{getTrendIcon()}</span>
        </div>
        <span className="text-2xl text-[var(--text-muted)]">{baseline}</span>
      </div>
    </div>
  );
};

const Strain = ({ selectedDate = new Date() }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [hoveredTime, setHoveredTime] = useState(null);
  const [chartType] = useState('detailed');
  const [timePeriod, setTimePeriod] = useState('1d'); // Changed to '1d' to show workout metrics

  // Get real data from whoopData
  const dateStr = useMemo(() => {
    return selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
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
    <div className="p-4 max-w-screen-xl mx-auto">
      {/* AI Insight Card */}
      <div className="flex justify-center mb-8">
        <div className="w-full max-w-6xl">
          <AiInsightCard type="strain" />
        </div>
      </div>

      {/* Header with date display */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Strain</h1>
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
        {/* Sidebar with strain statistics - 20% width */}
        <div className="md:w-[25%] lg:w-[20%]">
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
          
          {/* Show a message when no activities */}
          {!hasActivities && (
            <div className="bg-[var(--card-bg)] rounded-xl p-4 text-center">
              <div className="text-[var(--text-secondary)] text-sm mb-2">
                No workout data available
              </div>
              <div className="text-[var(--text-muted)] text-xs">
                Metrics will appear when activities are recorded
              </div>
            </div>
          )}
        </div>
         
        {/* Chart area - 80% width */}
        <div className="md:w-[75%] lg:w-[80%]">
          <DetailedHeartRateChart selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  );
};

export default Strain;