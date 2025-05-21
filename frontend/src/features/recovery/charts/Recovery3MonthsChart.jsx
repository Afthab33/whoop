import React, { useMemo } from 'react';
import { format, subMonths, addDays, isSameDay, startOfDay } from 'date-fns';
import whoopData from '../../../data/day_wise_whoop_data.json';
import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';

const Recovery3MonthsChart = ({ 
  selectedDate = new Date(), 
  timePeriod = '3m',
  onTimePeriodChange = () => {}
}) => {
  // Determine number of months based on timePeriod
  const monthsToShow = timePeriod === '6m' ? 6 : 3;
  
  // Generate appropriate data based on timePeriod
  const chartData = useMemo(() => {
    const endDate = startOfDay(selectedDate);
    const startDate = subMonths(endDate, monthsToShow);
    const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dates = [];
    
    // Generate array of dates
    for (let i = 0; i <= days; i++) {
      const date = addDays(startDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Generate realistic recovery scores with weekly patterns
      const dayOfWeek = format(date, 'E');
      let baseScore = Math.floor(Math.random() * 50) + 30;
      
      if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') {
        baseScore = Math.max(20, baseScore - 15);
      } else if (dayOfWeek === 'Wed' || dayOfWeek === 'Thu') {
        baseScore = Math.min(95, baseScore + 15);
      }
      
      if (i % 23 === 0) baseScore = Math.max(10, baseScore - 40);
      if (i % 17 === 0) baseScore = Math.min(98, baseScore + 30);
      
      const timeProgress = i / days;
      baseScore = Math.min(98, Math.max(10, baseScore + (timeProgress * 10) - 5));
      
      const recoveryScore = Math.round(baseScore);
      
      dates.push({
        date,
        dateStr,
        dayName: format(date, 'EEE'),
        dayNumber: format(date, 'd'),
        month: format(date, 'MMM'),
        fullDate: format(date, 'MMM d'),
        isSunday: format(date, 'EEEE') === 'Sunday',
        isFirstOfMonth: format(date, 'd') === '1',
        recoveryScore,
        recoveryColor: getRecoveryColor(recoveryScore),
        isToday: isSameDay(date, new Date())
      });
    }
    
    return dates;
  }, [selectedDate, monthsToShow]);

  function getRecoveryColor(score) {
    if (score >= 67) return '#70E000';
    if (score >= 34) return '#FFE86A';
    return '#FF6370';
  }
  
  const yAxisLabels = [
    { value: 100, label: '100 %', color: '#70E000' },
    { value: 83, label: '83 %', color: '#70E000' },
    { value: 67, label: '67 %', color: '#70E000' },
    { value: 50, label: '50 %', color: '#FFE86A' },
    { value: 33, label: '33 %', color: '#FF6370' },
    { value: 17, label: '17 %', color: '#FF6370' },
    { value: 0, label: '0 %', color: '#FF6370' }
  ];

  // For 6m view, we need to be more selective with Sunday labels
  // to prevent overcrowding
  const sundayLabels = useMemo(() => {
    const allSundays = chartData.filter(day => day.isSunday);
    
    if (timePeriod === '6m') {
      // For 6m view, show only first Sunday of each month or special dates
      return allSundays.filter((sunday, index) => 
        sunday.isFirstOfMonth || // First day of month  
        index === 0 || // First Sunday
        index === allSundays.length - 1 || // Last Sunday
        index % 4 === 0 // Every 4th Sunday
      ).map(day => ({
        date: day.date,
        position: chartData.indexOf(day) / (chartData.length - 1)
      }));
    } else {
      // For 3m view, show all Sundays
      return allSundays.map(day => ({
        date: day.date,
        position: chartData.indexOf(day) / (chartData.length - 1)
      }));
    }
  }, [chartData, timePeriod]);

  return (
    <div className="whoops-card p-6 bg-[var(--card-bg)] rounded-xl shadow-lg border border-gray-800/30 h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {timePeriod === '6m' ? '6 Months' : '3 Months'} Recovery Score
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Aftab Hussain
          </p>
        </div>
        
        <div className="bg-[var(--bg-subcard)] rounded-full overflow-hidden shadow-inner border border-gray-800/20">
          <TimePeriodSelector 
            selectedPeriod={timePeriod}
            onPeriodChange={onTimePeriodChange}
          />
        </div>
      </div>
      
      {/* Chart container */}
      <div className="relative h-[400px] pb-10">
        {/* Y-axis labels */}
        <div className="absolute left-0 h-full flex flex-col justify-between text-xs">
          {yAxisLabels.map((item, i) => (
            <span key={i} className="transform -translate-y-1/2" style={{ color: item.color }}>
              {item.label}
            </span>
          ))}
        </div>
        
        {/* Chart grid and content */}
        <div 
          className="ml-12 h-full relative border-b border-gray-700/20 overflow-hidden"
          style={{ 
            backgroundImage: `linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: "100% 16.67%", 
            backgroundPosition: "bottom"
          }}
        >
          {/* Zone indicators */}
          <div className="absolute left-0 right-0 top-0 h-[33.3%] bg-green-900/5 border-b border-green-500/10" />
          <div className="absolute left-0 right-0 top-[33.3%] h-[33.4%] bg-yellow-900/5 border-b border-yellow-500/10" />
          <div className="absolute left-0 right-0 top-[66.7%] h-[33.3%] bg-red-900/5" />
          
          {/* Horizontal grid lines */}
          {yAxisLabels.map((label, i) => (
            <div 
              key={i}
              className="absolute left-0 right-0 border-b border-gray-700/10"
              style={{ bottom: `${(label.value / 100) * 100}%` }}
            />
          ))}
          
          {/* Vertical grid lines - more for 6m */}
          <div className={`absolute inset-0 grid grid-cols-${timePeriod === '6m' ? '24' : '12'} gap-0`}>
            {[...Array(timePeriod === '6m' ? 24 : 12)].map((_, i) => (
              <div key={i} className="border-r border-gray-700/10 h-full" />
            ))}
          </div>
          
          {/* SVG Chart */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Connection lines */}
            <polyline 
              points={chartData.map((day, index) => {
                const x = (index / (chartData.length - 1)) * 100;
                const y = 100 - day.recoveryScore;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              strokeWidth={timePeriod === '6m' ? '0.4' : '0.5'}
              stroke="#999"
              strokeOpacity="0.3"
              vectorEffect="non-scaling-stroke"
            />
            
            {/* Data points - thinner circles for 6m */}
            {chartData.map((day, index) => {
              // For 6m view, only render every other data point to improve performance
              if (timePeriod === '6m' && index % 2 !== 0 && !day.isSunday && !day.isFirstOfMonth) {
                return null;
              }
              
              const x = (index / (chartData.length - 1)) * 100;
              const y = 100 - day.recoveryScore;
              return (
                <circle 
                  key={index} 
                  cx={x} 
                  cy={y} 
                  r={timePeriod === '6m' ? '0.8' : '1'}
                  stroke={day.recoveryColor}
                  strokeWidth={timePeriod === '6m' ? '0.4' : '0.5'}
                  fill="transparent"
                  className="transition-all duration-200"
                />
              );
            })}
          </svg>
          
          {/* X-axis labels */}
          <div className="absolute left-0 right-0 bottom-[-32px] flex justify-between text-2xs text-gray-400">
            {sundayLabels.map((sunday, i) => (
              <div 
                key={i}
                className="text-center"
                style={{
                  position: 'absolute',
                  left: `${sunday.position * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div>Sun</div>
                <div className="text-gray-500 mt-0.5">
                  {format(sunday.date, 'MMM d')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recovery3MonthsChart;