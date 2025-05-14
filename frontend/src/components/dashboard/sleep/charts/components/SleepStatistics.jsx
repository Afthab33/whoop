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
import whoopData from '../../../../../data/day_wise_whoop_data.json';

// Sleep Metrics Grid Card Component
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
  const comparisonData = useMemo(() => {
    if (!dateStr || !selectedDate) return { data: null, dateStr: null, rangeStart: null };
    
    // For single day view - get previous day
    if (timePeriod === '1d') {
      const prevDate = subDays(new Date(dateStr), 1);
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
      case '1w': daysToSubtract = 7; break;
      case '2w': daysToSubtract = 14; break;
      case '1m': daysToSubtract = 30; break;
      case '3m': daysToSubtract = 90; break;
      case '6m': daysToSubtract = 180; break;
      default: daysToSubtract = 7; // Default to 1 week
    }
    
    const rangeStartDate = subDays(new Date(dateStr), daysToSubtract);
    const rangeStartStr = format(rangeStartDate, 'yyyy-MM-dd');
    
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
  
  // Format dates for the comparison title
  const formattedDates = useMemo(() => {
    if (!selectedDate) return { current: '', previous: '', range: '' };
    
    const current = format(selectedDate, 'EEE, MMM do');
    
    // For single day view
    if (timePeriod === '1d') {
      const previous = comparisonData.dateStr 
        ? format(new Date(comparisonData.dateStr), 'EEE, MMM do') 
        : '';
      
      return { current, previous, range: '' };
    }
    
    // For range views
    if (comparisonData.rangeStart) {
      const rangeStartFormatted = format(new Date(comparisonData.rangeStart), 'MMM do');
      const rangeEndFormatted = format(selectedDate, 'MMM do');
      
      return { 
        current, 
        previous: '', 
        range: `${rangeStartFormatted} – ${rangeEndFormatted}`
      };
    }
    
    return { current, previous: '', range: '' };
  }, [selectedDate, comparisonData, timePeriod]);

  // Sleep metrics data comparing to previous day or date range
  const sleepMetrics = useMemo(() => {
    if (!dayData) return [];
    
    const sleepData = dayData.sleep_summary || {};
    const physioData = dayData.physiological_summary || {};
    
    // Comparison values
    const compSleepData = comparisonData.data?.sleep_summary || {};
    const compPhysioData = comparisonData.data?.physiological_summary || {};
    
    return [
      {
        icon: <Clock size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Time in Bed",
        value: formatMinutes(sleepData["In bed duration (min)"]) || "0:00",
        comparison: formatMinutes(compSleepData["In bed duration (min)"]) || "0:00",
        valueColor: "text-[var(--text-primary)]",
        trend: sleepData["In bed duration (min)"] > compSleepData["In bed duration (min)"] ? "up" : 
              sleepData["In bed duration (min)"] < compSleepData["In bed duration (min)"] ? "down" : "neutral",
        trendColor: sleepData["In bed duration (min)"] > compSleepData["In bed duration (min)"] ? "text-[var(--recovery-green)]" : "text-[var(--alert-red)]"
      },
      {
        icon: <MoveHorizontal size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Disturbances",
        value: (sleepData["Disturbances"] || 0).toString(),
        comparison: (compSleepData["Disturbances"] || 0).toString(),
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Disturbances"] || 0) > (compSleepData["Disturbances"] || 0) ? "up" : 
              (sleepData["Disturbances"] || 0) < (compSleepData["Disturbances"] || 0) ? "down" : "neutral",
        trendColor: (sleepData["Disturbances"] || 0) > (compSleepData["Disturbances"] || 0) ? "text-[var(--alert-red)]" : "text-[var(--recovery-green)]"
      },
      {
        icon: <FileWarning size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Latency",
        value: formatMinutes(sleepData["Sleep latency (min)"] || 0),
        comparison: formatMinutes(compSleepData["Sleep latency (min)"] || 0),
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Sleep latency (min)"] || 0) > (compSleepData["Sleep latency (min)"] || 0) ? "up" : 
              (sleepData["Sleep latency (min)"] || 0) < (compSleepData["Sleep latency (min)"] || 0) ? "down" : "neutral",
        trendColor: (sleepData["Sleep latency (min)"] || 0) > (compSleepData["Sleep latency (min)"] || 0) ? "text-[var(--alert-red)]" : "text-[var(--recovery-green)]"
      },
      {
        icon: <BadgePercent size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Efficiency",
        value: `${sleepData["Sleep efficiency %"] || 0}%`,
        comparison: `${compSleepData["Sleep efficiency %"] || 0}%`,
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Sleep efficiency %"] || 0) > (compSleepData["Sleep efficiency %"] || 0) ? "up" : 
              (sleepData["Sleep efficiency %"] || 0) < (compSleepData["Sleep efficiency %"] || 0) ? "down" : "neutral",
        trendColor: (sleepData["Sleep efficiency %"] || 0) > (compSleepData["Sleep efficiency %"] || 0) ? "text-[var(--recovery-green)]" : "text-[var(--alert-red)]"
      },
      {
        icon: <Repeat size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Consistency",
        value: `${physioData["Sleep consistency %"] || 0}%`,
        comparison: `${compPhysioData["Sleep consistency %"] || 0}%`,
        valueColor: "text-[var(--text-primary)]",
        trend: (physioData["Sleep consistency %"] || 0) > (compPhysioData["Sleep consistency %"] || 0) ? "up" : 
              (physioData["Sleep consistency %"] || 0) < (compPhysioData["Sleep consistency %"] || 0) ? "down" : "neutral",
        trendColor: (physioData["Sleep consistency %"] || 0) > (compPhysioData["Sleep consistency %"] || 0) ? "text-[var(--recovery-green)]" : "text-[var(--alert-red)]"
      },
      {
        icon: <Wind size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Respiratory Rate",
        value: (sleepData["Respiratory rate (rpm)"] || 0).toFixed(1),
        comparison: (compSleepData["Respiratory rate (rpm)"] || 0).toFixed(1),
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Respiratory rate (rpm)"] || 0) > (compSleepData["Respiratory rate (rpm)"] || 0) ? "up" : 
              (sleepData["Respiratory rate (rpm)"] || 0) < (compSleepData["Respiratory rate (rpm)"] || 0) ? "down" : "neutral",
        trendColor: "text-[var(--text-muted)]" // Neutral color for respiratory rate as neither direction is inherently good/bad
      }
    ];
  }, [dayData, comparisonData.data]);

  return (
    <div className="space-y-2 mt-6">
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