import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';
import whoopData from '../../../data/day_wise_whoop_data.json';

const RecoveryComparisonChart = ({ 
  selectedDate = new Date(), 
  timePeriod = '1d',
  onTimePeriodChange = () => {}
}) => {
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const [hoveredMetric, setHoveredMetric] = useState(null);
  
  // Fetch and process metrics data based on the selected date and time period
  const { metrics, comparisonDateInfo } = useMemo(() => {
    // Default metrics
    let metrics = {
      hrv: { current: 66, baseline: 55 },
      restingHr: { current: 63, baseline: 58 },
      sleepPerformance: { current: 93, baseline: 90 }
    };
    
    let comparisonDate = null;
    let comparisonDateStr = null;
    
    if (dateStr && whoopData[dateStr]) {
      const currentData = whoopData[dateStr];
      
      // Get comparison data based on time period
      if (timePeriod === '1d') {
        // Previous day comparison
        const prevDay = new Date(selectedDate);
        prevDay.setDate(prevDay.getDate() - 1);
        comparisonDateStr = prevDay.toISOString().split('T')[0];
        comparisonDate = prevDay;
      } else {
        // For other periods, calculate based on range
        let daysToSubtract = 0;
        switch(timePeriod) {
          case '1w': daysToSubtract = 7; break;
          case '2w': daysToSubtract = 14; break;
          case '1m': daysToSubtract = 30; break;
          case '3m': daysToSubtract = 90; break;
          case '6m': daysToSubtract = 180; break;
          default: daysToSubtract = 7;
        }
        
        const rangeStartDate = new Date(selectedDate);
        rangeStartDate.setDate(rangeStartDate.getDate() - daysToSubtract);
        comparisonDateStr = rangeStartDate.toISOString().split('T')[0];
        comparisonDate = rangeStartDate;
      }
      
      const comparisonData = whoopData[comparisonDateStr];
      
      // Get current values from physiological_summary
      if (currentData?.physiological_summary) {
        metrics = {
          hrv: {
            current: currentData.physiological_summary["Heart rate variability (ms)"] || 66,
            baseline: (comparisonData?.physiological_summary && comparisonData.physiological_summary["Heart rate variability (ms)"]) || 55
          },
          restingHr: {
            current: currentData.physiological_summary["Resting heart rate (bpm)"] || 63,
            baseline: (comparisonData?.physiological_summary && comparisonData.physiological_summary["Resting heart rate (bpm)"]) || 58
          },
          sleepPerformance: {
            current: currentData.physiological_summary["Sleep performance %"] || 93,
            baseline: (comparisonData?.physiological_summary && comparisonData.physiological_summary["Sleep performance %"]) || 90
          }
        };
      }
    }
    
    return { 
      metrics,
      comparisonDateInfo: {
        date: comparisonDate,
        dateStr: comparisonDateStr
      }
    };
  }, [dateStr, selectedDate, timePeriod]);
  
  // Format dates for display
  const formattedDates = useMemo(() => {
    if (!selectedDate) return { current: '', comparison: '' };
    
    const current = format(selectedDate, 'EEE, MMM do');
    
    if (timePeriod === '1d' && comparisonDateInfo.date) {
      return {
        current,
        comparison: format(comparisonDateInfo.date, 'EEE, MMM do')
      };
    }
    
    // For other time periods, show range
    if (comparisonDateInfo.date) {
      return {
        current,
        comparison: `${format(comparisonDateInfo.date, 'MMM do')} – ${format(selectedDate, 'MMM do')}`
      };
    }
    
    return { current, comparison: '' };
  }, [selectedDate, timePeriod, comparisonDateInfo]);
  
  // Calculate max value for proper scaling
  const maxValue = useMemo(() => {
    return Math.max(
      metrics.hrv.current || 0, 
      metrics.hrv.baseline || 0,
      metrics.restingHr.current || 0, 
      metrics.restingHr.baseline || 0,
      metrics.sleepPerformance.current || 0, 
      metrics.sleepPerformance.baseline || 0
    );
  }, [metrics]);

  // Enhanced color palette
  const chartColors = {
    current: '#4D94BB', // Richer blue for current data
    currentGradient: 'linear-gradient(180deg, #5BA4C9 0%, #3C7FA0 100%)',
    baseline: '#9CA3AF', // Balanced gray for baseline
    baselineGradient: 'linear-gradient(180deg, #ACAFB5 0%, #8D9096 100%)',
    highlight: 'rgba(255, 255, 255, 0.1)',
    gridLines: 'rgba(255, 255, 255, 0.06)',
  };
  
  // Get percentage difference between current and baseline
  const getPercentChange = (current, baseline) => {
    if (!baseline) return 0;
    return ((current - baseline) / baseline * 100).toFixed(1);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-0 flex-grow">
        {/* Streamlined header with time period selector */}
        <div className="flex justify-between items-center mb-25">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Day Recovery</h2>
            <p className="text-[var(--text-secondary)] mt-1 flex items-center text-sm">
              <span style={{ color: chartColors.current, fontWeight: 500 }}>{formattedDates.current}</span>
              <span className="text-[var(--text-secondary)] mx-1.5"> vs </span>
              <span style={{ color: chartColors.baseline, fontWeight: 500 }}>{formattedDates.comparison || 'baseline'}</span>
            </p>
          </div>
          
          <div className="bg-[var(--bg-subcard)] rounded-full overflow-hidden shadow-inner border border-gray-800/20">
            <TimePeriodSelector 
              selectedPeriod={timePeriod} 
              onPeriodChange={onTimePeriodChange}
            />
          </div>
        </div>
        
        {/* Optimized chart container - made wider for the new layout */}
        <div 
          className="relative h-[280px] px-2"
          style={{
            backgroundImage: `linear-gradient(0deg, ${chartColors.gridLines} 1px, transparent 1px)`,
            backgroundSize: "100% 20%",
            backgroundPosition: "bottom"
          }}
        >
          {/* Comparison bars with improved styling */}
          <div className="absolute inset-0 flex items-end justify-between px-12">
            {/* HRV */}
            <div 
              className="flex flex-col items-center w-1/3"
              onMouseEnter={() => setHoveredMetric('hrv')}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <div className="flex items-end h-[280px] gap-4 md:gap-6 mb-2 relative">
                {/* Current value bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out transform hover:scale-105 hover:brightness-110"
                    style={{ 
                      height: `${(metrics.hrv.current / maxValue) * 280}px`,
                      background: chartColors.currentGradient,
                      boxShadow: hoveredMetric === 'hrv' ? 
                        `0 0 15px rgba(92, 142, 169, 0.4), inset 0 0 0 1px rgba(255,255,255,0.2)` : 
                        `0 3px 8px rgba(92, 142, 169, 0.2), inset 0 0 0 1px rgba(255,255,255,0.1)`
                    }}
                  >
                    <div className="text-center -mt-8 font-bold text-[var(--text-primary)]">
                      {metrics.hrv.current}
                    </div>
                  </div>
                </div>
                
                {/* Improved separation line - make it more visible and properly centered */}
                <div className="h-full w-px bg-gray-600/30 mx-2"></div>
                
                {/* Baseline value bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out"
                    style={{ 
                      height: `${(metrics.hrv.baseline / maxValue) * 280}px`,
                      background: chartColors.baselineGradient,
                      opacity: hoveredMetric === 'hrv' ? 0.7 : 0.5,
                      boxShadow: hoveredMetric === 'hrv' ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' : 'none'
                    }}
                  >
                    <div className="text-center -mt-8 font-bold text-[var(--text-secondary)]">
                      {metrics.hrv.baseline}
                    </div>
                  </div>
                </div>
                
                {/* Percentage difference indicator */}
                {hoveredMetric === 'hrv' && (
                  <div 
                    className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2 border border-gray-700/30 z-10"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                  >
                    <span className={metrics.hrv.current > metrics.hrv.baseline ? 'text-green-400' : 'text-red-400'}>
                      {metrics.hrv.current > metrics.hrv.baseline ? '↑' : '↓'} 
                      {Math.abs(getPercentChange(metrics.hrv.current, metrics.hrv.baseline))}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Resting HR */}
            <div 
              className="flex flex-col items-center w-1/3"
              onMouseEnter={() => setHoveredMetric('restingHr')}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <div className="flex items-end h-[280px] gap-4 md:gap-6 mb-2 relative">
                {/* Current value bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out transform hover:scale-105 hover:brightness-110"
                    style={{ 
                      height: `${(metrics.restingHr.current / maxValue) * 280}px`,
                      background: chartColors.currentGradient,
                      boxShadow: hoveredMetric === 'restingHr' ? 
                        `0 0 15px rgba(92, 142, 169, 0.4), inset 0 0 0 1px rgba(255,255,255,0.2)` : 
                        `0 3px 8px rgba(92, 142, 169, 0.2), inset 0 0 0 1px rgba(255,255,255,0.1)`
                    }}
                  >
                    <div className="text-center -mt-8 font-bold text-[var(--text-primary)]">
                      {metrics.restingHr.current}
                    </div>
                  </div>
                </div>
                
                {/* Improved separation line - make it more visible and properly centered */}
                <div className="h-full w-px bg-gray-600/30 mx-2"></div>
                
                {/* Baseline value bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out"
                    style={{ 
                      height: `${(metrics.restingHr.baseline / maxValue) * 280}px`,
                      background: chartColors.baselineGradient,
                      opacity: hoveredMetric === 'restingHr' ? 0.7 : 0.5,
                      boxShadow: hoveredMetric === 'restingHr' ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' : 'none'
                    }}
                  >
                    <div className="text-center -mt-8 font-bold text-[var(--text-secondary)]">
                      {metrics.restingHr.baseline}
                    </div>
                  </div>
                </div>
                
                {/* Percentage difference indicator */}
                {hoveredMetric === 'restingHr' && (
                  <div 
                    className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2 border border-gray-700/30 z-10"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                  >
                    <span className={metrics.restingHr.current < metrics.restingHr.baseline ? 'text-green-400' : 'text-red-400'}>
                      {metrics.restingHr.current < metrics.restingHr.baseline ? '↓' : '↑'} 
                      {Math.abs(getPercentChange(metrics.restingHr.current, metrics.restingHr.baseline))}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sleep Performance */}
            <div 
              className="flex flex-col items-center w-1/3"
              onMouseEnter={() => setHoveredMetric('sleepPerformance')}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <div className="flex items-end h-[280px] gap-4 md:gap-6 mb-2 relative">
                {/* Current value bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out transform hover:scale-105 hover:brightness-110"
                    style={{ 
                      height: `${(metrics.sleepPerformance.current / maxValue) * 280}px`,
                      background: chartColors.currentGradient,
                      boxShadow: hoveredMetric === 'sleepPerformance' ? 
                        `0 0 15px rgba(92, 142, 169, 0.4), inset 0 0 0 1px rgba(255,255,255,0.2)` : 
                        `0 3px 8px rgba(92, 142, 169, 0.2), inset 0 0 0 1px rgba(255,255,255,0.1)`
                    }}
                  >
                    <div className="text-center -mt-8 font-bold text-[var(--text-primary)]">
                      {metrics.sleepPerformance.current}%
                    </div>
                  </div>
                </div>
                
                {/* Improved separation line - make it more visible and properly centered */}
                <div className="h-full w-px bg-gray-600/30 mx-2"></div>
                
                {/* Baseline value bar */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out"
                    style={{ 
                      height: `${(metrics.sleepPerformance.baseline / maxValue) * 280}px`,
                      background: chartColors.baselineGradient,
                      opacity: hoveredMetric === 'sleepPerformance' ? 0.7 : 0.5,
                      boxShadow: hoveredMetric === 'sleepPerformance' ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' : 'none'
                    }}
                  >
                    <div className="text-center -mt-8 font-bold text-[var(--text-secondary)]">
                      {metrics.sleepPerformance.baseline}%
                    </div>
                  </div>
                </div>
                
                {/* Percentage difference indicator */}
                {hoveredMetric === 'sleepPerformance' && (
                  <div 
                    className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2 border border-gray-700/30 z-10"
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                  >
                    <span className={metrics.sleepPerformance.current > metrics.sleepPerformance.baseline ? 'text-green-400' : 'text-red-400'}>
                      {metrics.sleepPerformance.current > metrics.sleepPerformance.baseline ? '↑' : '↓'} 
                      {Math.abs(getPercentChange(metrics.sleepPerformance.current, metrics.sleepPerformance.baseline))}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>  
        </div>
      </div>
      
      {/* Labels section moved OUTSIDE the p-6 area */}
      <div className="grid grid-cols-3 gap-8 mt-2 px-12 py-4 border-t border-gray-800/10">
        <div className="text-center text-[var(--text-primary)] font-medium">
          Heart Rate Variability
        </div>
        <div className="text-center text-[var(--text-primary)] font-medium">
          Resting Heart Rate
        </div>
        <div className="text-center text-[var(--text-primary)] font-medium">
          Sleep Performance
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default RecoveryComparisonChart;