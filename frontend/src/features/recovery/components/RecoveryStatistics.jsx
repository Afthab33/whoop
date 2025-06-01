import React, { useMemo } from 'react';
import { 
  Heart, 
  Activity, 
  Moon,
  ArrowUp,
  ArrowDown,
  Info,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import whoopData from '../../../data/day_wise_whoop_data.json';

// Recovery level color mapping (matching chart colors)
const RECOVERY_COLORS = {
  high: '#16EC06',     // High Recovery 67-100%
  medium: '#FFDE00',   // Medium Recovery 34-66%
  low: '#FF0026'       // Low Recovery 0-33%
};

// Get recovery color based on percentage
const getRecoveryColor = (recoveryPercent) => {
  if (recoveryPercent >= 67) return RECOVERY_COLORS.high;
  if (recoveryPercent >= 34) return RECOVERY_COLORS.medium;
  return RECOVERY_COLORS.low;
};

// Recovery Metrics Grid Card Component - Matching StrainStatistics style
const RecoveryMetricsGrid = ({ metrics, compactLayout = false }) => {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-3 shadow-[var(--shadow-whoop-card)]">
      {/* Single column vertical layout with smaller boxes */}
      <div className="grid grid-cols-1 gap-2">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center p-2 bg-[var(--bg-subcard)] rounded-lg transition-all duration-200 hover:bg-[#2A3339] border border-transparent hover:border-[#4D94BB]/20"
          >
            <div className="text-[#4D94BB] mb-1 p-1 rounded-md bg-[#4D94BB]/10">
              {React.cloneElement(metric.icon, { size: 16 })}
            </div>
            <div className="text-center w-full">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-lg font-semibold text-white">
                  {metric.value}
                </span>
                <div className="ml-1">
                  {metric.trend === 'up' && 
                    <ArrowUp 
                      size={12} 
                      className="text-[#16EC06]" 
                      strokeWidth={2.5}
                    />
                  }
                  {metric.trend === 'down' && 
                    <ArrowDown 
                      size={12} 
                      className="text-[#FF0026]" 
                      strokeWidth={2.5}
                    />
                  }
                  {metric.trend === 'neutral' && 
                    <div className="w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
                  }
                </div>
              </div>
              <div className="text-white/60 text-xs font-medium mb-1">
                vs <span className="text-white/80">{metric.comparison}</span>
              </div>
            </div>
            <div className="text-xs text-white/70 font-bold uppercase tracking-wide text-center">
              {metric.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecoveryStatistics = ({ 
  selectedDate, 
  dayData, 
  dateStr, 
  timePeriod = '1d',
  compactLayout = false 
}) => {
  // Get comparison data based on timePeriod
  const prevDayData = useMemo(() => {
    if (!dateStr || !selectedDate) return { data: null, dateStr: null, rangeStart: null };
    
    // For single day view - get exactly one day before
    if (timePeriod === '1d') {
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
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
      case '1w': daysToSubtract = 6; break;
      case '2w': daysToSubtract = 13; break;
      case '1m': daysToSubtract = 29; break;
      case '3m': daysToSubtract = 89; break;
      case '6m': daysToSubtract = 179; break;
      default: daysToSubtract = 6;
    }
    
    const rangeStartDate = new Date(selectedDate);
    rangeStartDate.setDate(rangeStartDate.getDate() - daysToSubtract);
    const rangeStartStr = format(rangeStartDate, 'yyyy-MM-dd');
    
    return {
      data: null,
      dateStr: null,
      rangeStart: rangeStartStr
    };
    
  }, [dateStr, selectedDate, timePeriod]);

  // Format dates for the comparison title
  const formattedDates = useMemo(() => {
    if (!selectedDate) return { current: '', previous: '', range: '' };
    
    const current = format(selectedDate, 'EEE, MMM do');
    
    // For single day view
    if (timePeriod === '1d') {
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
      
      if (timePeriod === '2w' || timePeriod === '1m' || timePeriod === '3m' || timePeriod === '6m') {
        const startMonth = rangeStartDate.getMonth();
        const endMonth = selectedDate.getMonth();
        
        if (startMonth !== endMonth) {
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

  // Calculate current day recovery metrics
  const currentRecoveryMetrics = useMemo(() => {
    const currentData = dayData || whoopData[dateStr] || {};
    const physSummary = currentData.physiological_summary || {};
    
    return {
      recovery: physSummary["Recovery score %"] || 75,
      hrv: physSummary["Heart rate variability (ms)"] || 66,
      restingHr: physSummary["Resting heart rate (bpm)"] || 63,
      sleepPerformance: physSummary["Sleep performance %"] || 93
    };
  }, [dayData, dateStr]);

  // Calculate previous day recovery metrics
  const previousRecoveryMetrics = useMemo(() => {
    const prevData = prevDayData.data || {};
    const physSummary = prevData.physiological_summary || {};
    
    return {
      recovery: physSummary["Recovery score %"] || 70,
      hrv: physSummary["Heart rate variability (ms)"] || 55,
      restingHr: physSummary["Resting heart rate (bpm)"] || 65,
      sleepPerformance: physSummary["Sleep performance %"] || 90
    };
  }, [prevDayData.data]);

  // Recovery metrics data comparing to previous day
  const recoveryMetrics = useMemo(() => {
    const current = currentRecoveryMetrics;
    const previous = previousRecoveryMetrics;
    
    return [
      {
        icon: <TrendingUp size={16} className="stroke-current" strokeWidth={1.5} />,
        title: "Recovery",
        value: `${Math.round(current.recovery)}%`,
        comparison: `${Math.round(previous.recovery)}%`,
        trend: current.recovery > previous.recovery ? "up" : 
              current.recovery < previous.recovery ? "down" : "neutral",
        recoveryLevel: getRecoveryColor(current.recovery)
      },
      {
        icon: <Heart size={16} className="stroke-current" strokeWidth={1.5} />,
        title: "HRV",
        value: `${Math.round(current.hrv)}`,
        comparison: `${Math.round(previous.hrv)}`,
        trend: current.hrv > previous.hrv ? "up" : 
              current.hrv < previous.hrv ? "down" : "neutral"
      },
      {
        icon: <Activity size={16} className="stroke-current" strokeWidth={1.5} />,
        title: "Resting HR",
        value: `${Math.round(current.restingHr)}`,
        comparison: `${Math.round(previous.restingHr)}`,
        trend: current.restingHr < previous.restingHr ? "up" : 
              current.restingHr > previous.restingHr ? "down" : "neutral" // Lower resting HR is better
      },
      {
        icon: <Moon size={16} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep",
        value: `${Math.round(current.sleepPerformance)}%`,
        comparison: `${Math.round(previous.sleepPerformance)}%`,
        trend: current.sleepPerformance > previous.sleepPerformance ? "up" : 
              current.sleepPerformance < previous.sleepPerformance ? "down" : "neutral"
      }
    ];
  }, [currentRecoveryMetrics, previousRecoveryMetrics]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-sm font-bold text-white">RECOVERY METRICS</h2>
        
        <div className="flex items-center space-x-1">
          <Info size={12} className="text-white/60" />
          <span className="text-white/60 text-xs">
            {timePeriod === '1d' 
              ? (formattedDates.current && formattedDates.previous 
                ? `${formattedDates.current} vs ${formattedDates.previous}`
                : (formattedDates.current ? formattedDates.current : 'No comparison data'))
              : `${formattedDates.current} vs ${formattedDates.range}`
            }
          </span>
        </div>
      </div>

      {/* Recovery Metrics Grid */}
      <RecoveryMetricsGrid metrics={recoveryMetrics} compactLayout={compactLayout} />
    </div>
  );
};

export default RecoveryStatistics;