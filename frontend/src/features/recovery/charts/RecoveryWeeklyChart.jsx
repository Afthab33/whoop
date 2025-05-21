import React, { useMemo } from 'react';
import { format, subDays, isSameDay, addDays, getDaysInMonth, startOfMonth, endOfMonth } from 'date-fns';
import whoopData from '../../../data/day_wise_whoop_data.json';
import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';

const RecoveryWeeklyChart = ({ 
  selectedDate = new Date(), 
  timePeriod = '1w',
  onTimePeriodChange = () => {}
}) => {
  // Calculate the date range for the week, two weeks, or month
  const chartData = useMemo(() => {
    if (timePeriod !== '1w' && timePeriod !== '2w' && timePeriod !== '1m') return [];
    
    let dates = [];
    
    if (timePeriod === '1m') {
      // For 1-month view, show the entire current month
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      const daysInMonth = getDaysInMonth(selectedDate);
      
      for (let i = 0; i < daysInMonth; i++) {
        const date = addDays(monthStart, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Generate sensible random data for the month view
        const dayOfWeek = format(date, 'E');
        const baseScore = Math.floor(Math.random() * 50) + 40; // Base 40-90
        
        // Weekly patterns - weekends lower, mid-week higher
        let demoScore;
        if (dayOfWeek === 'Sat' || dayOfWeek === 'Sun') {
          demoScore = Math.max(30, baseScore - 15);
        } else if (dayOfWeek === 'Wed' || dayOfWeek === 'Thu') {
          demoScore = Math.min(95, baseScore + 15);
        } else {
          demoScore = baseScore;
        }
        
        // Add a slight upward trend through the month
        demoScore = Math.min(98, demoScore + (i / daysInMonth) * 10);
        
        dates.push({
          date,
          dateStr,
          dayName: format(date, 'EEE'),
          dayNumber: format(date, 'd'),
          month: format(date, 'MMM'),
          fullDate: format(date, 'MMM d'),
          data: whoopData[dateStr] || null,
          recoveryScore: Math.round(demoScore),
          recoveryColor: getRecoveryColor(Math.round(demoScore)),
          isToday: isSameDay(date, new Date())
        });
      }
    } else {
      // For 1w or 2w view, use existing logic
      const days = timePeriod === '1w' ? 7 : 14;
      
      // Calculate the starting date (counting back from selected date)
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - (days - 1));
      
      // Generate array of dates for the selected period (oldest to newest)
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // For demo purposes - generate sensible demo scores that match the zones
        // This would be replaced with real data in production
        let demoScore = 0;
        
        // 1w view - match the image exactly
        if (timePeriod === '1w') {
          if (format(date, 'EEE') === 'Sat') demoScore = 59;
          else if (format(date, 'EEE') === 'Sun') demoScore = 42;
          else if (format(date, 'EEE') === 'Mon') demoScore = 75;
          else if (format(date, 'EEE') === 'Tue') demoScore = 73;
          else if (format(date, 'EEE') === 'Wed') demoScore = 71;
          else if (format(date, 'EEE') === 'Thu') demoScore = 59;
          else if (format(date, 'EEE') === 'Fri') demoScore = 94;
        } 
        // 2w view - generate varied but realistic data
        else {
          // First generate a base score in the 40-90 range
          const baseScore = Math.floor(Math.random() * 50) + 40;
          
          // Add some daily patterns - weekends slightly lower, midweek higher
          const day = format(date, 'EEE');
          if (day === 'Sat' || day === 'Sun') {
            demoScore = Math.max(30, baseScore - 10);
          } else if (day === 'Wed' || day === 'Thu') {
            demoScore = Math.min(95, baseScore + 10);
          } else {
            demoScore = baseScore;
          }
          
          // Add some week-over-week consistency
          if (i >= 7) {
            // Second week tends to improve slightly over first week
            demoScore = Math.min(98, demoScore + 5);
          }
        }
        
        dates.push({
          date,
          dateStr,
          dayName: format(date, 'EEE'),
          dayNumber: format(date, 'd'),
          month: format(date, 'MMM'),
          fullDate: format(date, 'MMM d'),
          data: whoopData[dateStr] || null,
          recoveryScore: demoScore,
          recoveryColor: getRecoveryColor(demoScore),
          isToday: isSameDay(date, new Date())
        });
      }
    }
    
    return dates;
  }, [selectedDate, timePeriod]);
  
  // Map recovery scores to exact colors from the image
  function getRecoveryColor(score) {
    if (score >= 67) {
      return { 
        color: '#70E000', 
        barColor: '#70E000',
        borderColor: '#70E000',
        className: 'bg-gradient-to-t from-[#60CB00]/80 to-[#70E000]',
        topBorderColor: '#9FFF4C',
        zone: 'green' 
      };
    }
    if (score >= 34) {
      return { 
        color: '#FFE86A', 
        barColor: '#FFE86A',
        borderColor: '#FFD52A',
        className: 'bg-gradient-to-t from-[#FFD52A]/80 to-[#FFE86A]',
        topBorderColor: '#FFF6BD',
        zone: 'yellow' 
      };
    }
    return { 
      color: '#FF6370', 
      barColor: '#FF6370', 
      borderColor: '#FF3E4E',
      className: 'bg-gradient-to-t from-[#FF3E4E]/80 to-[#FF6370]',
      topBorderColor: '#FF8D98',
      zone: 'red' 
    };
  }
  
  // Calculate y-axis labels with exact colors from the image
  const yAxisLabels = [
    { value: 100, label: '100 %', color: '#70E000' },
    { value: 83, label: '83 %', color: '#70E000' },
    { value: 67, label: '67 %', color: '#70E000' },
    { value: 50, label: '50 %', color: '#FFE86A' },
    { value: 33, label: '33 %', color: '#FF6370' },
    { value: 17, label: '17 %', color: '#FF6370' },
    { value: 0, label: '0 %', color: '#FF6370' }
  ];

  // Dynamic title based on time period
  const chartTitle = () => {
    if (timePeriod === '1w') return '1 Week Recovery Score';
    if (timePeriod === '2w') return '2 Week Recovery Score';
    if (timePeriod === '1m') return '1 Month Recovery Score';
    return 'Recovery Score';
  };

  // Determine bar width based on time period
  const getBarWidth = () => {
    if (timePeriod === '1w') return 'w-12';
    if (timePeriod === '2w') return 'w-4 md:w-6';
    if (timePeriod === '1m') return 'w-2 md:w-3';
    return 'w-12';
  };

  // Determine if we should show a day name label for this index
  const shouldShowDayName = (day, index, total) => {
    if (timePeriod === '1w' || timePeriod === '2w') return true;
    
    // For 1m view, only show specific days to avoid overcrowding
    return (
      index === 0 || // First day
      index === total - 1 || // Last day
      day.dayNumber === '1' || // 1st of month
      day.dayNumber === '15' || // Mid-month
      day.isToday || // Today
      (index % 5 === 0) // Every 5th day
    );
  };
  
  // Determine if we should show a date label for this index
  const shouldShowDate = (day, index, total) => {
    if (timePeriod === '1w') return true;
    
    if (timePeriod === '2w') {
      return (
        index === 0 || // First day
        index === 6 || // Last day of first week
        index === 7 || // First day of second week
        index === 13 || // Last day of second week
        day.isToday // Today
      );
    }
    
    // For 1m view, be even more selective
    return (
      index === 0 || // First day of month
      index === total - 1 || // Last day of month
      day.dayNumber === '1' || // 1st of month
      day.dayNumber === '15' || // 15th (mid-month)
      day.isToday // Today
    );
  };

  return (
    <div className="whoops-card p-6 bg-[var(--card-bg)] rounded-xl shadow-lg border border-gray-800/30 h-full">
      {/* Header with title, name and time period selector */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{chartTitle()}</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Aftab Hussain
          </p>
        </div>
        
        {/* TimePeriodSelector */}
        <div className="bg-[var(--bg-subcard)] rounded-full overflow-hidden shadow-inner border border-gray-800/20">
          <TimePeriodSelector 
            selectedPeriod={timePeriod}
            onPeriodChange={onTimePeriodChange}
          />
        </div>
      </div>
      
      {/* Chart container */}
      <div className="relative h-[400px] pb-8">
        {/* Y-axis labels with colored text */}
        <div className="absolute left-0 h-full flex flex-col justify-between text-xs">
          {yAxisLabels.map((item, i) => (
            <span key={i} className="transform -translate-y-1/2" style={{ color: item.color }}>
              {item.label}
            </span>
          ))}
        </div>
        
        {/* Chart background grid with colored zones */}
        <div 
          className="ml-12 h-full relative border-b border-gray-700/20 overflow-x-auto"
          style={{ 
            backgroundImage: `linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: "100% 16.67%", 
            backgroundPosition: "bottom"
          }}
        >
          {/* Green zone indicator */}
          <div 
            className="absolute left-0 right-0 top-0 h-[33.3%] bg-green-900/5 border-b border-green-500/10" 
            aria-label="Green recovery zone"
          />
          
          {/* Yellow zone indicator */}
          <div 
            className="absolute left-0 right-0 top-[33.3%] h-[33.4%] bg-yellow-900/5 border-b border-yellow-500/10" 
            aria-label="Yellow recovery zone"
          />
          
          {/* Red zone indicator */}
          <div 
            className="absolute left-0 right-0 top-[66.7%] h-[33.3%] bg-red-900/5" 
            aria-label="Red recovery zone"
          />
          
          {/* Vertical grid lines - adjusted for data length */}
          <div className="absolute inset-0 grid gap-0" 
               style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}>
            {[...Array(chartData.length - 1)].map((_, i) => (
              <div 
                key={i} 
                className="border-r border-gray-700/10 h-full" 
              />
            ))}
          </div>
          
          {/* Recovery score bars */}
          <div className="absolute inset-0 flex items-end justify-around">
            {chartData.map((day, index) => (
              <div key={index} className="flex flex-col items-center h-full pt-6 px-1">
                {/* Bar with value - REMOVED TOP DASH */}
                <div className="relative flex flex-col items-center w-full h-[calc(100%-40px)]">
                  {/* Bar itself */}
                  <div 
                    className={`${getBarWidth()} absolute bottom-0 ${day.recoveryColor.className} rounded transition-all duration-300 hover:brightness-110`}
                    style={{ 
                      height: `${day.recoveryScore}%`,
                      boxShadow: `0 0 5px ${day.recoveryColor.color}40, inset 0 0 10px rgba(0,0,0,0.1)`,
                    }}
                  />
                </div>
                
                {/* X-axis labels - adapted for each time period */}
                <div className="text-center mt-3">
                  {/* Day name - only show on 1w and 2w, or for important days in 1m */}
                  {shouldShowDayName(day, index, chartData.length) && (
                    <div className={`${timePeriod === '1w' ? 'text-xs' : 'text-2xs'} font-medium text-gray-400`}>
                      {day.dayName}
                    </div>
                  )}
                  
                  {/* Date display logic */}
                  {shouldShowDate(day, index, chartData.length) && (
                    <div className={`${timePeriod === '1w' ? 'text-xs' : 'text-2xs'} mt-1 ${day.isToday ? 'text-blue-400' : 'text-gray-500'}`}>
                      {day.month} {day.dayNumber}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoveryWeeklyChart;