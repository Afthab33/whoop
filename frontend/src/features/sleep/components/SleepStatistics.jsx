import React, { useMemo, useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Repeat, 
  BadgePercent, 
  Wind,
  Info
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import whoopData from '../../../data/day_wise_whoop_data.json';

// Sleep Metrics Grid Card Component - REMOVED PIE CHART
const SleepMetricsGrid = ({ metrics, compactLayout = false }) => {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-1.5 shadow-[var(--shadow-whoop-card)]">
      {/* Sleep Metrics - Simple Grid Layout */}
      <div className="grid grid-cols-1 gap-1">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center p-1 bg-[var(--bg-subcard)] rounded-lg transition-all duration-200 hover:bg-[#2A3339] border border-transparent hover:border-[#4D94BB]/20"
          >
            <div className="text-[#4D94BB] mb-0.5 p-0.5 rounded-md bg-[#4D94BB]/10">
              {React.cloneElement(metric.icon, { size: 12 })}
            </div>
            <div className="text-center w-full">
              <div className="flex items-center justify-center gap-0.5 mb-0">
                <span className="text-sm font-semibold text-white">
                  {metric.value}
                </span>
                <div className="ml-0">
                  {metric.trend === 'up' && 
                    <ArrowUp 
                      size={8}
                      className="text-[#0093E7]"
                      strokeWidth={2.5}
                    />
                  }
                  {metric.trend === 'down' && 
                    <ArrowDown 
                      size={8}
                      className="text-white"
                      strokeWidth={2.5}
                    />
                  }
                  {metric.trend === 'neutral' && 
                    <div className="w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
                  }
                </div>
              </div>
              <div className="text-white/60 text-[9px] font-medium mb-0">
                vs <span className="text-white/80">{metric.comparison}</span>
              </div>
            </div>
            <div className="text-[9px] text-white/70 font-bold uppercase tracking-wide text-center">
              {metric.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SleepStatistics = ({ selectedDate, dayData, dateStr, compactLayout = false, timePeriod = '1d' }) => {
  // Check if there is sleep data for the current day - ADDED: Match StrainStatistics hasActivities pattern
  const hasSleepData = useMemo(() => {
    const currentData = dayData || whoopData[dateStr] || {};
    const sleepSummary = currentData.sleep_summary || {};
    
    // Check if there's meaningful sleep data
    return Object.keys(sleepSummary).length > 0 && 
           (sleepSummary["Asleep duration (min)"] > 0 || sleepSummary["In bed duration (min)"] > 0);
  }, [dayData, dateStr]);

  // Get comparison data based on timePeriod
  const prevDayData = useMemo(() => {
    if (!dateStr || !selectedDate) return { data: null, dateStr: null, rangeStart: null };
    
    // For single day view - get exactly one day before
    if (timePeriod === '1d') {
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1); // Use exact day calculation to avoid skipping days
      const prevDateStr = format(prevDate, 'yyyy-MM-dd');
      
      return { 
        data: whoopData[prevDateStr] || null,
        dateStr: prevDateStr,
        rangeStart: null
      };
    } 
    
    // For other time periods, calculate the appropriate range
    let daysToSubtract = 0;
    
    switch (timePeriod) {
      case '1w': daysToSubtract = 6; break;  // 7 days including current day, so subtract 6
      case '2w': daysToSubtract = 13; break; // 14 days including current day, so subtract 13
      case '1m': daysToSubtract = 29; break; // 30 days including current day, so subtract 29
      case '3m': daysToSubtract = 89; break; // 90 days including current day, so subtract 89
      case '6m': daysToSubtract = 179; break; // 180 days including current day, so subtract 179
      default: daysToSubtract = 6; // Default to 1 week
    }
    
    const rangeStartDate = new Date(selectedDate);
    rangeStartDate.setDate(rangeStartDate.getDate() - daysToSubtract);
    const rangeStartStr = format(rangeStartDate, 'yyyy-MM-dd');
    
    // We don't have specific day data for ranges, but we store the range start date
    return {
      data: null, // Not applicable for ranges
      dateStr: null, // Not applicable for ranges
      rangeStart: rangeStartStr
    };
    
  }, [dateStr, selectedDate, timePeriod]);
  
  // Format minutes to HH:MM
  const formatMinutes = (minutes) => {
    if (minutes === undefined || minutes === null) return "0:00";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };
  
  // Format dates for the comparison title based on selected time period
  const formattedDates = useMemo(() => {
    if (!selectedDate) return { current: '', previous: '', range: '' };
    
    const current = format(selectedDate, 'EEE, MMM do');
    
    // For single day view
    if (timePeriod === '1d') {
      // Make sure we have a valid previous date
      if (prevDayData.dateStr) {
        const previousDate = new Date(prevDayData.dateStr);
        const previous = format(previousDate, 'EEE, MMM do');
        return { current, previous, range: '' };
      }
      return { current, previous: '', range: '' };
    }
    
    // For range views
    if (prevDayData.rangeStart) {
      const rangeStartDate = new Date(prevDayData.rangeStart);
      const rangeStartFormatted = format(rangeStartDate, 'MMM do');
      const rangeEndFormatted = format(selectedDate, 'MMM do'); 
      
      // For longer periods, include month in the start date if it's different
      if (timePeriod === '2w' || timePeriod === '1m' || timePeriod === '3m' || timePeriod === '6m') {
        const startMonth = rangeStartDate.getMonth();
        const endMonth = selectedDate.getMonth();
        
        if (startMonth !== endMonth) {
          // Different months, include month name in start date
          const rangeStartWithMonth = format(rangeStartDate, 'MMM do');
          return { 
            current, 
            previous: '', 
            range: `${rangeStartWithMonth} – ${rangeEndFormatted}`
          };
        }
      }
      
      return { 
        current, 
        previous: '', 
        range: `${rangeStartFormatted} – ${rangeEndFormatted}`
      };
    }
    
    return { current, previous: '', range: '' };
  }, [selectedDate, prevDayData, timePeriod]);
  
  // Sleep metrics data
  const sleepMetrics = useMemo(() => {
    if (!dayData) {
      return [];
    }
    
    const sleepData = dayData.sleep_summary || {};
    const physioData = dayData.physiological_summary || {};
    
    // Previous day values
    const prevSleepData = prevDayData.data?.sleep_summary || {};
    const prevPhysioData = prevDayData.data?.physiological_summary || {};
    
    return [
      {
        icon: <Clock size={12} className="stroke-current" strokeWidth={1.5} />,
        title: "Time in Bed",
        value: formatMinutes(sleepData["In bed duration (min)"]) || "0:00",
        comparison: formatMinutes(prevSleepData["In bed duration (min)"]) || "0:00",
        trend: sleepData["In bed duration (min)"] > prevSleepData["In bed duration (min)"] ? "up" : 
              sleepData["In bed duration (min)"] < prevSleepData["In bed duration (min)"] ? "down" : "neutral"
      },
      {
        icon: <BadgePercent size={12} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Efficiency",
        value: `${sleepData["Sleep efficiency %"] || 0}%`,
        comparison: `${prevSleepData["Sleep efficiency %"] || 0}%`,
        trend: (sleepData["Sleep efficiency %"] || 0) > (prevSleepData["Sleep efficiency %"] || 0) ? "up" : 
              (sleepData["Sleep efficiency %"] || 0) < (prevSleepData["Sleep efficiency %"] || 0) ? "down" : "neutral"
      },
      {
        icon: <Repeat size={12} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Consistency",
        value: `${physioData["Sleep consistency %"] || 0}%`,
        comparison: `${prevPhysioData["Sleep consistency %"] || 0}%`,
        trend: (physioData["Sleep consistency %"] || 0) > (prevPhysioData["Sleep consistency %"] || 0) ? "up" : 
              (physioData["Sleep consistency %"] || 0) < (prevPhysioData["Sleep consistency %"] || 0) ? "down" : "neutral"
      },
      {
        icon: <Wind size={12} className="stroke-current" strokeWidth={1.5} />,
        title: "Respiratory Rate",
        value: (sleepData["Respiratory rate (rpm)"] || 0).toFixed(1),
        comparison: (prevSleepData["Respiratory rate (rpm)"] || 0).toFixed(1),
        trend: (sleepData["Respiratory rate (rpm)"] || 0) > (prevSleepData["Respiratory rate (rpm)"] || 0) ? "up" : 
              (sleepData["Respiratory rate (rpm)"] || 0) < (prevSleepData["Respiratory rate (rpm)"] || 0) ? "down" : "neutral"
      }
    ];
  }, [dayData, prevDayData.data]);

  // Don't render if there is no sleep data
  if (!hasSleepData) {
    return null;
  }

  return (
    <div className="space-y-1.5 h-full">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-xs font-bold text-white">SLEEP METRICS</h2>
        
        <div className="flex items-center space-x-0.5">
          <Info size={10} className="text-white/60" />
          <span className="text-white/60 text-[9px]">
            {timePeriod === '1d' 
              ? (formattedDates.current && formattedDates.previous 
                ? `${formattedDates.current} vs ${formattedDates.previous}`
                : (formattedDates.current ? formattedDates.current : 'No comparison data'))
              : `${formattedDates.current} vs ${formattedDates.range}`
            }
          </span>
        </div>
      </div>

      {/* Sleep Metrics Grid - NO PIE CHART */}
      <SleepMetricsGrid 
        metrics={sleepMetrics} 
        compactLayout={compactLayout} 
      />
    </div>
  );
};

export default SleepStatistics;