// src/components/dashboard/recovery/Recovery.jsx
import React, { useMemo, useState } from 'react';
import { ChevronRight, Info } from 'lucide-react';
import RecoveryRing from './components/RecoveryRing';
import HrvTrendChart from './charts/HrvTrendChart';
import RestingHeartRateChart from './charts/RestingHeartRateChart';
import RespiratoryRateChart from './charts/RespiratoryRateChart';
import RecoveryTrendChart from './charts/RecoveryTrendChart';
import AiInsightCard from '../../components/cards/AiInsightCard';
import whoopData from '../../data/day_wise_whoop_data.json';

// Component for comparison bars (as seen in the image)
const ComparisonBars = ({ title, currentValue, baselineValue, unit = "", height = 150 }) => {
  // Calculate percentage for visual height - don't exceed 100%
  const currentHeight = Math.min((currentValue / Math.max(currentValue, baselineValue)) * 100, 100);
  const baselineHeight = Math.min((baselineValue / Math.max(currentValue, baselineValue)) * 100, 100);
  
  // Determine color based on comparison
  const barColor = currentValue >= baselineValue ? 'bg-[#3FB65E]' : 'bg-[#6EA3C3]';
  const baselineBarColor = 'bg-gray-300';
  
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">{title}</h3>
      <div className="w-full flex justify-center items-end h-[150px] gap-12 mb-3">
        {/* Current value bar */}
        <div className="flex flex-col items-center">
          <div 
            className={`w-14 ${barColor} rounded-t-sm`} 
            style={{ height: `${currentHeight}%` }}
          ></div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[var(--text-primary)]">{currentValue}</span>
            <span className="text-sm text-[var(--text-secondary)]">{unit}</span>
          </div>
        </div>
        
        {/* Baseline value bar */}
        <div className="flex flex-col items-center">
          <div 
            className={`w-14 ${baselineBarColor} rounded-t-sm`} 
            style={{ height: `${baselineHeight}%` }}
          ></div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[var(--text-muted)]">{baselineValue}</span>
            <span className="text-sm text-[var(--text-secondary)]">{unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Recovery = ({ selectedDate = new Date() }) => {
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const [timePeriod, setTimePeriod] = useState('1d');
  
  // Get the selected day's data
  const dayData = useMemo(() => {
    if (!dateStr || !whoopData[dateStr]) return null;
    return whoopData[dateStr];
  }, [dateStr]);

  // Use default data if no day data is available
  const recoveryData = dayData?.recovery || {
    score: 67,
    hrv: 66,
    baselineHrv: 70,
    restingHr: 53,
    baselineRestingHr: 60,
    sleepPerformance: 36,
    baselineSleepPerformance: 80
  };

  // Formatted date for display
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Add this function to track time period changes from the chart
  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      {/* Header with date display */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Recovery</h1>
          <div className="flex items-center">
            <p className="text-[var(--text-secondary)] mr-2">Insights for</p>
            <span className="bg-[var(--card-bg)] text-white px-3 py-1 rounded-full text-sm font-medium">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-6xl">
          <AiInsightCard type="recovery" />
        </div>
      </div>

      {/* Recovery Ring and Metrics Section */}
      <div className="mb-6">
        <div className="whoops-card p-6">
          <div className="mb-4">
            <div className="flex items-center">
              <svg className="mr-4 text-[var(--text-secondary)]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 6v6l4 2" />
              </svg>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Day Recovery</h2>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[var(--text-secondary)]">Fri, May 2nd vs Thu, May 1st</p>
              <div className="flex bg-[var(--bg-subcard)] rounded-full overflow-hidden">
                {['6m', '3m', '1m', '2w', '1w', '1d'].map((period) => (
                  <button 
                    key={period}
                    className={`px-3 py-1 text-sm ${timePeriod === period ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-secondary)]'}`}
                    onClick={() => handleTimePeriodChange(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Comparison bars section as in the image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <ComparisonBars 
              title="Heart Rate Variability" 
              currentValue={recoveryData.hrv} 
              baselineValue={recoveryData.baselineHrv}
            />
            
            <ComparisonBars 
              title="Resting Heart Rate" 
              currentValue={recoveryData.restingHr} 
              baselineValue={recoveryData.baselineRestingHr}
            />
            
            <ComparisonBars 
              title="Sleep Performance" 
              currentValue={recoveryData.sleepPerformance} 
              baselineValue={recoveryData.baselineSleepPerformance}
              unit="%"
            />
          </div>
        </div>
      </div>

      {/* Metrics Charts - 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="whoops-card p-6">
          <HrvTrendChart />
        </div>
        
        <div className="whoops-card p-6">
          <RestingHeartRateChart />
        </div>
        
        <div className="whoops-card p-6">
          <RespiratoryRateChart />
        </div>
        
        <div className="whoops-card p-6">
          <RecoveryTrendChart />
        </div>
      </div>

      {/* Additional recovery statistics if needed */}
      <div className="mb-6">
        <div className="whoops-card p-6">
          <div className="flex items-center mb-4">
            <svg className="mr-4 text-[var(--text-secondary)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19c0-4.971-4.029-9-9-9 4.971 0 9-4.029 9-9 0 4.971 4.029 9 9 9-4.971 0-9 4.029-9 9z" />
            </svg>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Recovery Score Breakdown</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center justify-center">
              <RecoveryRing value={recoveryData.score} size={140} />
              <p className="text-center text-[var(--text-secondary)] mt-2">Overall Recovery</p>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-[var(--text-primary)] mb-4">
                Your body is moderately recovered. Your HRV is slightly below your baseline which indicates you may still be processing yesterday's strain. Consider moderate intensity activities today.
              </p>
              
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Last Updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <button className="text-[var(--primary-light)] flex items-center">
                  Learn More <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recovery;