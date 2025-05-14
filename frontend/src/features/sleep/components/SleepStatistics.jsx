import React, { useMemo } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Repeat, 
  MoveHorizontal, 
  FileWarning, 
  BadgePercent, 
  Wind,
  Info
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import whoopData from '../../../data/day_wise_whoop_data.json';

// Sleep Metrics Grid Card Component - Now in one horizontal row
const SleepMetricsGrid = ({ metrics, compactLayout = false }) => {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-3 shadow-[var(--shadow-whoop-card)]">
      <div className={`grid ${compactLayout ? 'grid-cols-6' : 'grid-cols-2'} gap-2`}>
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center p-2 bg-[var(--bg-subcard)] rounded-lg transition-all duration-200 hover:bg-[#2A3339]"
          >
            <div className="text-[var(--strain-blue)] mb-1">
              {metric.icon}
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <span className={`text-lg font-semibold ${metric.valueColor || 'text-[var(--text-primary)]'}`}>
                  {metric.value}
                </span>
                {metric.trend === 'up' && 
                  <ArrowUp 
                    size={12} 
                    className={metric.trendColor || "text-[var(--recovery-green)]"} 
                    strokeWidth={2.5}
                  />
                }
                {metric.trend === 'down' && 
                  <ArrowDown 
                    size={12} 
                    className={metric.trendColor || "text-[var(--alert-red)]"} 
                    strokeWidth={2.5}
                  />
                }
                {metric.trend === 'neutral' && 
                  <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full ml-1"></span>
                }
              </div>
              <div className="text-[var(--text-subvalue)] text-xs">
                vs {metric.comparison}
              </div>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-1 font-medium uppercase tracking-tight">
              {metric.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SleepStatistics = ({ selectedDate, dayData, dateStr, compactLayout = false, timePeriod = '1d' }) => {
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
  
  // Sleep metrics data comparing to previous day instead of 30-day average
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
        icon: <Clock size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Time in Bed",
        value: formatMinutes(sleepData["In bed duration (min)"]) || "0:00",
        comparison: formatMinutes(prevSleepData["In bed duration (min)"]) || "0:00",
        valueColor: "text-[var(--text-primary)]",
        trend: sleepData["In bed duration (min)"] > prevSleepData["In bed duration (min)"] ? "up" : 
              sleepData["In bed duration (min)"] < prevSleepData["In bed duration (min)"] ? "down" : "neutral",
        trendColor: sleepData["In bed duration (min)"] > prevSleepData["In bed duration (min)"] ? "text-[var(--recovery-green)]" : "text-[var(--alert-red)]"
      },
      {
        icon: <MoveHorizontal size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Disturbances",
        value: (sleepData["Disturbances"] || 0).toString(),
        comparison: (prevSleepData["Disturbances"] || 0).toString(),
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Disturbances"] || 0) > (prevSleepData["Disturbances"] || 0) ? "up" : 
              (sleepData["Disturbances"] || 0) < (prevSleepData["Disturbances"] || 0) ? "down" : "neutral",
        trendColor: (sleepData["Disturbances"] || 0) > (prevSleepData["Disturbances"] || 0) ? "text-[var(--alert-red)]" : "text-[var(--recovery-green)]"
      },
      {
        icon: <FileWarning size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Latency",
        value: formatMinutes(sleepData["Sleep latency (min)"] || 0),
        comparison: formatMinutes(prevSleepData["Sleep latency (min)"] || 0),
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Sleep latency (min)"] || 0) > (prevSleepData["Sleep latency (min)"] || 0) ? "up" : 
              (sleepData["Sleep latency (min)"] || 0) < (prevSleepData["Sleep latency (min)"] || 0) ? "down" : "neutral",
        trendColor: (sleepData["Sleep latency (min)"] || 0) > (prevSleepData["Sleep latency (min)"] || 0) ? "text-[var(--alert-red)]" : "text-[var(--recovery-green)]"
      },
      {
        icon: <BadgePercent size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Efficiency",
        value: `${sleepData["Sleep efficiency %"] || 0}%`,
        comparison: `${prevSleepData["Sleep efficiency %"] || 0}%`,
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Sleep efficiency %"] || 0) > (prevSleepData["Sleep efficiency %"] || 0) ? "up" : 
              (sleepData["Sleep efficiency %"] || 0) < (prevSleepData["Sleep efficiency %"] || 0) ? "down" : "neutral",
        trendColor: (sleepData["Sleep efficiency %"] || 0) > (prevSleepData["Sleep efficiency %"] || 0) ? "text-[var(--recovery-green)]" : "text-[var(--alert-red)]"
      },
      {
        icon: <Repeat size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Consistency",
        value: `${physioData["Sleep consistency %"] || 0}%`,
        comparison: `${prevPhysioData["Sleep consistency %"] || 0}%`,
        valueColor: "text-[var(--text-primary)]",
        trend: (physioData["Sleep consistency %"] || 0) > (prevPhysioData["Sleep consistency %"] || 0) ? "up" : 
              (physioData["Sleep consistency %"] || 0) < (prevPhysioData["Sleep consistency %"] || 0) ? "down" : "neutral",
        trendColor: (physioData["Sleep consistency %"] || 0) > (prevPhysioData["Sleep consistency %"] || 0) ? "text-[var(--recovery-green)]" : "text-[var(--alert-red)]"
      },
      {
        icon: <Wind size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Respiratory Rate",
        value: (sleepData["Respiratory rate (rpm)"] || 0).toFixed(1),
        comparison: (prevSleepData["Respiratory rate (rpm)"] || 0).toFixed(1),
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Respiratory rate (rpm)"] || 0) > (prevSleepData["Respiratory rate (rpm)"] || 0) ? "up" : 
              (sleepData["Respiratory rate (rpm)"] || 0) < (prevSleepData["Respiratory rate (rpm)"] || 0) ? "down" : "neutral",
        trendColor: "text-[var(--text-muted)]" // Neutral color for respiratory rate as neither direction is inherently good/bad
      }
    ];
  }, [dayData, prevDayData.data]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">SLEEP METRICS</h2>
        
        <div className="flex items-center space-x-1">
          <Info size={12} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)] text-xs">
            {timePeriod === '1d' 
              ? (formattedDates.current && formattedDates.previous 
                ? `${formattedDates.current} vs ${formattedDates.previous}`
                : (formattedDates.current ? formattedDates.current : 'No comparison data'))
              : `${formattedDates.current} vs ${formattedDates.range}`
            }
          </span>
        </div>
      </div>

      {/* Sleep Metrics Grid */}
      {sleepMetrics.length > 0 ? (
        <SleepMetricsGrid metrics={sleepMetrics} compactLayout={compactLayout} />
      ) : (
        <div className="bg-[var(--card-bg)] rounded-xl p-4 flex items-center justify-center h-24">
          <p className="text-[var(--text-muted)]">No sleep metrics available</p>
        </div>
      )}
    </div>
  );
};

export default SleepStatistics;