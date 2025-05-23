// src/components/dashboard/strain/Strain.jsx
import React, { useState } from 'react';
import { ChevronRight, Info } from 'lucide-react';
import StrainTrendChart from './charts/StrainTrendChart';
import CaloriesChart from './charts/CaloriesChart';
import AverageHrChart from './charts/AverageHrChart';
import DailyStrainChart from './charts/DailyStrainChart';
import StrainRing from './components/StrainRing';
import AiInsightCard from '../../components/cards/AiInsightCard';

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

// Component for activity stats like in the first image
const ActivityStatCard = () => {
  return (
    <div className="whoops-card p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Weightlifting Statistics</h2>
        <div className="text-[var(--text-secondary)]">
          <span className="text-[var(--strain-blue)]">Thu, Apr 17th</span> vs 1 Week Past
        </div>
      </div>
    </div>
  );
};

const Strain = ({ selectedDate }) => {
  // Example strain data - In a real application, this would come from your API or state
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [hoveredTime, setHoveredTime] = useState(null);

  // Sample strain data for the chart
  const sampleStrainData = [
    { time: '7:00 PM', strain: 110, activity: 'rest' },
    { time: '7:01 PM', strain: 150, activity: 'rest' },
    { time: '7:02 PM', strain: 155, activity: 'workout', isWorkout: true },
    { time: '7:03 PM', strain: 145, activity: 'workout', isWorkout: true },
    { time: '7:04 PM', strain: 138, activity: 'workout', isWorkout: true },
    { time: '7:05 PM', strain: 150, activity: 'workout', isWorkout: true },
    { time: '7:06 PM', strain: 160, activity: 'workout', isWorkout: true },
    { time: '7:07 PM', strain: 120, activity: 'rest' },
    { time: '7:08 PM', strain: 115, activity: 'rest' },
    { time: '7:09 PM', strain: 150, activity: 'workout', isWorkout: true },
    { time: '7:10 PM', strain: 140, activity: 'workout', isWorkout: true },
    { time: '7:11 PM', strain: 125, activity: 'rest' },
    { time: '7:12 PM', strain: 120, activity: 'rest' },
  ];

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      {/* AI Insight Card */}
      <div className="flex justify-center mb-8">
        <div className="w-full max-w-6xl">
          <AiInsightCard type="strain" />
        </div>
      </div>

      {/* Strain Chart */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Daily Strain</h2>
        <DailyStrainChart 
          strainData={sampleStrainData}
          activeWorkout={activeWorkout}
          hoveredTime={hoveredTime}
          onWorkoutHover={setActiveWorkout}
          viewMode="time"
          chartMode="raw"
          timePeriod="1d"
        />
      </div>

      {/* Additional strain metrics can be added below */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          icon={<Info size={24} />}
          title="Day Strain"
          value="15.2"
          baseline="21.0"
          trend="up"
          color="text-[var(--strain-blue)]"
        />
        <MetricCard 
          icon={<Info size={24} />}
          title="Average HR"
          value="122"
          baseline="bpm"
          trend="none"
          color="text-[var(--alert-red)]"
        />
        <MetricCard 
          icon={<Info size={24} />}
          title="Calories"
          value="2,854"
          baseline="kcal"
          trend="down"
          color="text-[var(--steps-orange)]"
        />
      </div>
    </div>
  );
};

export default Strain;