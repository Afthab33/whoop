import React, { useMemo } from 'react';
import { 
  Heart, 
  Flame,
  Clock,
  ArrowUp,
  ArrowDown,
  Info,
  Activity,
  Zap,
  TrendingUp
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import whoopData from '../../../data/day_wise_whoop_data.json';

// Strain Metrics Grid Card Component - Reduced box sizes
const StrainMetricsGrid = ({ metrics, compactLayout = false }) => {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-3 shadow-[var(--shadow-whoop-card)]">
      {/* Single column vertical layout with smaller boxes */}
      <div className="grid grid-cols-1 gap-2">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center p-2 bg-[var(--bg-subcard)] rounded-lg transition-all duration-200 hover:bg-[#2A3339] border border-transparent hover:border-[#0093E7]/20"
          >
            <div className="text-[#0093E7] mb-1 p-1 rounded-md bg-[#0093E7]/10">
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
                      className="text-[#0093E7]" 
                      strokeWidth={2.5}
                    />
                  }
                  {metric.trend === 'down' && 
                    <ArrowDown 
                      size={12} 
                      className="text-white" 
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

const StrainStatistics = ({ selectedDate, dayData, dateStr, compactLayout = false, timePeriod = '1d' }) => {
  // Check if there are any activities for the current day
  const hasActivities = useMemo(() => {
    const currentData = dayData || whoopData[dateStr] || {};
    const workouts = currentData.workouts || [];
    
    // Filter out idle activities and check for real workouts
    const realWorkouts = workouts.filter(workout => 
      workout["Activity name"] && 
      workout["Activity name"].toLowerCase() !== "idle" &&
      workout["Duration (min)"] && 
      workout["Duration (min)"] > 0
    );
    
    return realWorkouts.length > 0;
  }, [dayData, dateStr]);

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
  
  // Calculate aggregate workout metrics for current day
  const currentWorkoutMetrics = useMemo(() => {
    const currentData = dayData || whoopData[dateStr] || {};
    const workouts = currentData.workouts || [];
    
    const realWorkouts = workouts.filter(workout => 
      workout["Activity name"] && 
      workout["Activity name"].toLowerCase() !== "idle" &&
      workout["Duration (min)"] && 
      workout["Duration (min)"] > 0
    );
    
    if (realWorkouts.length === 0) {
      return { maxHR: 0, avgHR: 0, calories: 0, duration: 0 };
    }
    
    // Aggregate metrics from all workouts
    const maxHR = Math.max(...realWorkouts.map(w => w["Max HR (bpm)"] || 0));
    const totalDuration = realWorkouts.reduce((sum, w) => sum + (w["Duration (min)"] || 0), 0);
    const totalCalories = realWorkouts.reduce((sum, w) => sum + (w["Energy burned (cal)"] || 0), 0);
    
    // Calculate weighted average HR
    let weightedHRSum = 0;
    let totalWeight = 0;
    
    realWorkouts.forEach(workout => {
      const avgHR = workout["Average HR (bpm)"] || 0;
      const duration = workout["Duration (min)"] || 0;
      weightedHRSum += avgHR * duration;
      totalWeight += duration;
    });
    
    const avgHR = totalWeight > 0 ? Math.round(weightedHRSum / totalWeight) : 0;
    
    return { maxHR, avgHR, calories: totalCalories, duration: totalDuration };
  }, [dayData, dateStr]);

  // Calculate aggregate workout metrics for previous day
  const previousWorkoutMetrics = useMemo(() => {
    const prevData = prevDayData.data || {};
    const workouts = prevData.workouts || [];
    
    const realWorkouts = workouts.filter(workout => 
      workout["Activity name"] && 
      workout["Activity name"].toLowerCase() !== "idle" &&
      workout["Duration (min)"] && 
      workout["Duration (min)"] > 0
    );
    
    if (realWorkouts.length === 0) {
      return { maxHR: 0, avgHR: 0, calories: 0, duration: 0 };
    }
    
    const maxHR = Math.max(...realWorkouts.map(w => w["Max HR (bpm)"] || 0));
    const totalDuration = realWorkouts.reduce((sum, w) => sum + (w["Duration (min)"] || 0), 0);
    const totalCalories = realWorkouts.reduce((sum, w) => sum + (w["Energy burned (cal)"] || 0), 0);
    
    let weightedHRSum = 0;
    let totalWeight = 0;
    
    realWorkouts.forEach(workout => {
      const avgHR = workout["Average HR (bpm)"] || 0;
      const duration = workout["Duration (min)"] || 0;
      weightedHRSum += avgHR * duration;
      totalWeight += duration;
    });
    
    const avgHR = totalWeight > 0 ? Math.round(weightedHRSum / totalWeight) : 0;
    
    return { maxHR, avgHR, calories: totalCalories, duration: totalDuration };
  }, [prevDayData.data]);
  
  // Workout metrics data comparing to previous day
  const workoutMetrics = useMemo(() => {
    const current = currentWorkoutMetrics;
    const previous = previousWorkoutMetrics;
    
    return [
      {
        icon: <Heart size={16} className="stroke-current" strokeWidth={1.5} />,
        title: "Max HR",
        value: `${current.maxHR}`,
        comparison: `${previous.maxHR}`,
        trend: current.maxHR > previous.maxHR ? "up" : 
              current.maxHR < previous.maxHR ? "down" : "neutral"
      },
      {
        icon: <TrendingUp size={16} className="stroke-current" strokeWidth={1.5} />,
        title: "Avg HR",
        value: `${current.avgHR}`,
        comparison: `${previous.avgHR}`,
        trend: current.avgHR > previous.avgHR ? "up" : 
              current.avgHR < previous.avgHR ? "down" : "neutral"
      },
      {
        icon: <Flame size={16} className="stroke-current" strokeWidth={1.5} />,
        title: "Calories",
        value: `${Math.round(current.calories)}`,
        comparison: `${Math.round(previous.calories)}`,
        trend: current.calories > previous.calories ? "up" : 
              current.calories < previous.calories ? "down" : "neutral"
      },
      {
        icon: <Clock size={16} className="stroke-current" strokeWidth={1.5} />,
        title: "Duration",
        value: `${current.duration}m`,
        comparison: `${previous.duration}m`,
        trend: current.duration > previous.duration ? "up" : 
              current.duration < previous.duration ? "down" : "neutral"
      }
    ];
  }, [currentWorkoutMetrics, previousWorkoutMetrics]);

  // Don't render if there are no activities
  if (!hasActivities) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-sm font-bold text-white">WORKOUT METRICS</h2>
        
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

      {/* Workout Metrics Grid */}
      <StrainMetricsGrid metrics={workoutMetrics} compactLayout={compactLayout} />
    </div>
  );
};

export default StrainStatistics;