import React from 'react';
import { 
  Heart, 
  Activity, 
  Moon,
  ArrowUp,
  ArrowDown,
  Info,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const RecoveryStatistics = ({ 
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

  // Use these metrics or get them from dayData if available
  const metrics = [
    {
      icon: <Heart size={20} className="stroke-current" strokeWidth={1.5} />,
      title: "HEART RATE VARIABILITY",
      value: "66",
      trend: "up",
      comparison: "55",
      valueColor: "text-[var(--text-primary)]"
    },
    {
      icon: <Activity size={20} className="stroke-current" strokeWidth={1.5} />,
      title: "RESTING HEART RATE",
      value: "63",
      trend: "down",
      comparison: "65",
      valueColor: "text-[var(--text-primary)]"
    },
    {
      icon: <Moon size={20} className="stroke-current" strokeWidth={1.5} />,
      title: "SLEEP PERFORMANCE",
      value: "93%",
      trend: "up",
      comparison: "90%",
      valueColor: "text-[var(--text-primary)]"
    }
  ];

  return (
    <div className="whoops-card bg-[var(--card-bg)] rounded-xl p-4 shadow-lg border border-gray-800/30 h-full">
      {/* Date comparison header */}
      <div className="flex items-center mb-4 border-b border-gray-800/20 pb-3">
        <Calendar size={16} className="text-[var(--text-secondary)] mr-2" />
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          {formattedDate} <span className="text-[var(--text-muted)]">vs</span> {formattedPrevDate}
        </h3>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">RECOVERY METRICS</h2>
        
        <div className="flex items-center space-x-1">
          <Info size={12} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)] text-xs">
            Daily comparison
          </span>
        </div>
      </div>
      
      <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-whoop-card)]">
        <div className="grid grid-cols-1 gap-3">
          {metrics.map((metric, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center p-3 bg-[var(--bg-subcard)] rounded-lg transition-all duration-200 hover:bg-[#2A3339]"
            >
              <div className="text-[var(--strain-blue)] mb-1">
                {metric.icon}
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <span className={`text-lg font-semibold ${metric.valueColor}`}>
                    {metric.value}
                  </span>
                  {metric.trend === 'up' && 
                    <ArrowUp 
                      size={12} 
                      className="text-[var(--recovery-green)]"
                      strokeWidth={2.5}
                    />
                  }
                  {metric.trend === 'down' && 
                    <ArrowDown 
                      size={12} 
                      className="text-[var(--alert-red)]"
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
    </div>
  );
};

export default RecoveryStatistics;