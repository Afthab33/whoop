import React from 'react';
import { 
  Heart, 
  Zap, 
  Flame,
  Dumbbell,
  ArrowUp,
  ArrowDown,
  Info,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const StrainStatistics = ({ 
  selectedDate, 
  dayData,
  dateStr, 
  timePeriod = '1d',
  compactLayout = false 
}) => {
  // Format dates for clear comparison
  const formattedDate = selectedDate ? format(selectedDate, 'EEE, MMM do') : '';
  const prevDay = new Date(selectedDate);
  prevDay.setDate(prevDay.getDate() - 1);
  const formattedPrevDate = format(prevDay, 'EEE, MMM do');
  
  // Get date range for comparison period
  const getDateRangeText = () => {
    if (timePeriod === '1d') {
      return `${formattedDate} vs ${formattedPrevDate}`;
    } 
    
    // For longer time periods, show a date range
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - 7); // Example: 7 days before
    return `${format(startDate, 'MMM do')} — ${format(selectedDate, 'MMM do')}`;
  };

  // Use these metrics or get them from dayData if available
  const metrics = [
    {
      icon: <Heart size={20} className="stroke-current" strokeWidth={1.5} />,
      title: "MAX HR",
      value: "165",
      comparison: "161",
      trend: "up",
      valueColor: "text-blue-400"
    },
    {
      icon: <Heart size={20} className="stroke-current" strokeWidth={1.5} />,
      title: "AVERAGE HR",
      value: "79",
      comparison: "77",
      trend: "up",
      valueColor: "text-blue-400"
    },
    {
      icon: <Flame size={20} className="stroke-current" strokeWidth={1.5} />,
      title: "CALORIES",
      value: "2,114",
      comparison: "1,957",
      trend: "up",
      valueColor: "text-blue-400"
    },
    {
      icon: <Dumbbell size={20} className="stroke-current" strokeWidth={1.5} />,
      title: "ACTIVITIES",
      value: "1",
      comparison: "1.0",
      trend: "neutral",
      valueColor: "text-blue-400"
    }
  ];

  return (
    <div className="whoops-card bg-[var(--card-bg)] rounded-xl p-4 shadow-lg border border-gray-800/30 h-full">
      {/* Date comparison header */}
      <div className="flex items-center mb-4 border-b border-gray-800/20 pb-3">
        <Calendar size={16} className="text-[var(--text-secondary)] mr-2" />
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          Day Statistics
        </h3>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-bold text-blue-400">
          {getDateRangeText()}
        </h2>
        
        <div className="flex items-center space-x-1">
          <Info size={12} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)] text-xs">
            Daily comparison
          </span>
        </div>
      </div>
      
      <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-whoop-card)]">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center p-3 bg-[var(--bg-subcard)] rounded-lg transition-all duration-200 hover:bg-[#2A3339]"
            >
              <div className="text-gray-400 mb-2">
                {metric.icon}
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-1 flex items-center justify-center">
                  <span className={metric.valueColor}>
                    {metric.value}
                  </span>
                  {metric.trend === 'up' && 
                    <ArrowUp 
                      size={12} 
                      className="text-gray-400 ml-1"
                      strokeWidth={2.5}
                    />
                  }
                  {metric.trend === 'down' && 
                    <ArrowDown 
                      size={12} 
                      className="text-gray-400 ml-1"
                      strokeWidth={2.5}
                    />
                  }
                  {metric.trend === 'neutral' && 
                    <div className="w-2 h-2 bg-gray-400 rounded-full ml-1"></div>
                  }
                </div>
                <div className="text-gray-400 text-sm">
                  {metric.comparison}
                </div>
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-2 font-medium">
                {metric.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StrainStatistics;