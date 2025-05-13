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
import whoopData from '../../../../data/day_wise_whoop_data.json';

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

const SleepStatistics = ({ selectedDate, dayData, dateStr, compactLayout = false }) => {
  // Get previous 30 days average data
  const prev30DaysAvg = useMemo(() => {
    if (!dateStr) return null;
    
    const selectedTimestamp = new Date(dateStr).getTime();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    
    const relevantDates = Object.keys(whoopData)
      .filter(date => {
        const dateTimestamp = new Date(date).getTime();
        return dateTimestamp < selectedTimestamp && 
               dateTimestamp >= (selectedTimestamp - thirtyDaysInMs);
      });
    
    if (relevantDates.length === 0) return null;
    
    // Calculate averages
    const sumData = {
      timeInBed: 0,
      disturbances: 0,
      sleepLatency: 0,
      sleepEfficiency: 0,
      sleepConsistency: 0,
      respiratoryRate: 0,
      datesWithData: {
        timeInBed: 0,
        disturbances: 0,
        sleepLatency: 0,
        sleepEfficiency: 0,
        sleepConsistency: 0,
        respiratoryRate: 0
      }
    };
    
    relevantDates.forEach(date => {
      const data = whoopData[date];
      if (data.sleep_summary && data.sleep_summary["In bed duration (min)"]) {
        sumData.timeInBed += data.sleep_summary["In bed duration (min)"];
        sumData.datesWithData.timeInBed++;
      }
      
      if (data.sleep_summary && data.sleep_summary["Disturbances"]) {
        sumData.disturbances += data.sleep_summary["Disturbances"] || 0;
        sumData.datesWithData.disturbances++;
      }
      
      if (data.sleep_summary && data.sleep_summary["Sleep latency (min)"]) {
        sumData.sleepLatency += data.sleep_summary["Sleep latency (min)"];
        sumData.datesWithData.sleepLatency++;
      }
      
      if (data.sleep_summary && data.sleep_summary["Sleep efficiency %"]) {
        sumData.sleepEfficiency += data.sleep_summary["Sleep efficiency %"];
        sumData.datesWithData.sleepEfficiency++;
      }
      
      if (data.physiological_summary && data.physiological_summary["Sleep consistency %"]) {
        sumData.sleepConsistency += data.physiological_summary["Sleep consistency %"];
        sumData.datesWithData.sleepConsistency++;
      }
      
      if (data.sleep_summary && data.sleep_summary["Respiratory rate (rpm)"]) {
        sumData.respiratoryRate += data.sleep_summary["Respiratory rate (rpm)"];
        sumData.datesWithData.respiratoryRate++;
      }
    });
    
    return {
      timeInBed: sumData.datesWithData.timeInBed > 0 ? 
        Math.round(sumData.timeInBed / sumData.datesWithData.timeInBed) : 0,
      disturbances: sumData.datesWithData.disturbances > 0 ? 
        Math.round(sumData.disturbances / sumData.datesWithData.disturbances) : 0,
      sleepLatency: sumData.datesWithData.sleepLatency > 0 ? 
        Math.round(sumData.sleepLatency / sumData.datesWithData.sleepLatency) : 0,
      sleepEfficiency: sumData.datesWithData.sleepEfficiency > 0 ? 
        Math.round(sumData.sleepEfficiency / sumData.datesWithData.sleepEfficiency) : 0,
      sleepConsistency: sumData.datesWithData.sleepConsistency > 0 ? 
        Math.round(sumData.sleepConsistency / sumData.datesWithData.sleepConsistency) : 0,
      respiratoryRate: sumData.datesWithData.respiratoryRate > 0 ? 
        Number((sumData.respiratoryRate / sumData.datesWithData.respiratoryRate).toFixed(1)) : 0
    };
  }, [dateStr]);
  
  // Format minutes to HH:MM
  const formatMinutes = (minutes) => {
    if (minutes === undefined || minutes === null) return "0:00";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };
  
  // Sleep metrics data for the grid using real data
  const sleepMetrics = useMemo(() => {
    if (!dayData || !prev30DaysAvg) {
      return [];
    }
    
    const sleepData = dayData.sleep_summary || {};
    const physioData = dayData.physiological_summary || {};
    
    return [
      {
        icon: <Clock size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Time in Bed",
        value: formatMinutes(sleepData["In bed duration (min)"]) || "0:00",
        comparison: formatMinutes(prev30DaysAvg.timeInBed) || "0:00",
        valueColor: "text-[var(--text-primary)]",
        trend: sleepData["In bed duration (min)"] > prev30DaysAvg.timeInBed ? "up" : 
              sleepData["In bed duration (min)"] < prev30DaysAvg.timeInBed ? "down" : "neutral",
        trendColor: sleepData["In bed duration (min)"] > prev30DaysAvg.timeInBed ? "text-[var(--recovery-green)]" : "text-[var(--alert-red)]"
      },
      {
        icon: <MoveHorizontal size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Disturbances",
        value: (sleepData["Disturbances"] || 0).toString(),
        comparison: prev30DaysAvg.disturbances.toString(),
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Disturbances"] || 0) > prev30DaysAvg.disturbances ? "up" : 
              (sleepData["Disturbances"] || 0) < prev30DaysAvg.disturbances ? "down" : "neutral",
        trendColor: (sleepData["Disturbances"] || 0) > prev30DaysAvg.disturbances ? "text-[var(--alert-red)]" : "text-[var(--recovery-green)]"
      },
      {
        icon: <FileWarning size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Latency",
        value: formatMinutes(sleepData["Sleep latency (min)"] || 0),
        comparison: formatMinutes(prev30DaysAvg.sleepLatency || 0),
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Sleep latency (min)"] || 0) > prev30DaysAvg.sleepLatency ? "up" : 
              (sleepData["Sleep latency (min)"] || 0) < prev30DaysAvg.sleepLatency ? "down" : "neutral",
        trendColor: (sleepData["Sleep latency (min)"] || 0) > prev30DaysAvg.sleepLatency ? "text-[var(--alert-red)]" : "text-[var(--recovery-green)]"
      },
      {
        icon: <BadgePercent size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Efficiency",
        value: `${sleepData["Sleep efficiency %"] || 0}%`,
        comparison: `${prev30DaysAvg.sleepEfficiency || 0}%`,
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Sleep efficiency %"] || 0) > prev30DaysAvg.sleepEfficiency ? "up" : 
              (sleepData["Sleep efficiency %"] || 0) < prev30DaysAvg.sleepEfficiency ? "down" : "neutral",
        trendColor: (sleepData["Sleep efficiency %"] || 0) > prev30DaysAvg.sleepEfficiency ? "text-[var(--recovery-green)]" : "text-[var(--alert-red)]"
      },
      {
        icon: <Repeat size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Sleep Consistency",
        value: `${physioData["Sleep consistency %"] || 0}%`,
        comparison: `${prev30DaysAvg.sleepConsistency || 0}%`,
        valueColor: "text-[var(--text-primary)]",
        trend: (physioData["Sleep consistency %"] || 0) > prev30DaysAvg.sleepConsistency ? "up" : 
              (physioData["Sleep consistency %"] || 0) < prev30DaysAvg.sleepConsistency ? "down" : "neutral",
        trendColor: (physioData["Sleep consistency %"] || 0) > prev30DaysAvg.sleepConsistency ? "text-[var(--recovery-green)]" : "text-[var(--alert-red)]"
      },
      {
        icon: <Wind size={20} className="stroke-current" strokeWidth={1.5} />,
        title: "Respiratory Rate",
        value: (sleepData["Respiratory rate (rpm)"] || 0).toFixed(1),
        comparison: prev30DaysAvg.respiratoryRate.toFixed(1),
        valueColor: "text-[var(--text-primary)]",
        trend: (sleepData["Respiratory rate (rpm)"] || 0) > prev30DaysAvg.respiratoryRate ? "up" : 
              (sleepData["Respiratory rate (rpm)"] || 0) < prev30DaysAvg.respiratoryRate ? "down" : "neutral",
        trendColor: "text-[var(--text-muted)]" // Neutral color for respiratory rate as neither direction is inherently good/bad
      }
    ];
  }, [dayData, prev30DaysAvg]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">SLEEP METRICS</h2>
        
        <div className="flex items-center space-x-1">
          <Info size={12} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)] text-xs">
            VS. PREVIOUS 30 DAYS
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