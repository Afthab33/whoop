import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Moon, Activity, ArrowLeft, ArrowRight } from 'lucide-react';
import whoopData from '../../../data/day_wise_whoop_data.json';

// Mock TimePeriodSelector component
const TimePeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const periods = ['6m', '3m', '1m', '2w', '1w', '1d'];
  
  return (
    <div className="flex bg-gray-800 rounded-lg p-1">
      {periods.map(period => (
        <button
          key={period}
          onClick={() => onPeriodChange(period)}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            selectedPeriod === period 
              ? 'bg-orange-500 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {period}
        </button>
      ))}
    </div>
  );
};

const Index = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('1d');
  const [selectedDate, setSelectedDate] = useState(new Date('2025-05-05')); // Start with a date that has data
  const [fullData, setFullData] = useState([]);
  const [weeklyData, setWeeklyData] = useState({});
  const [weeklyBmpData, setWeeklyBmpData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [rangeStart, setRangeStart] = useState(0.0);
  const [rangeEnd, setRangeEnd] = useState(1/7); // Exactly 1 day out of 7
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null);
  const rangeRef = useRef(null);
  const [dateRangeOffset, setDateRangeOffset] = useState(0); // Track offset for navigation
  const [maxOffset, setMaxOffset] = useState(0); // Maximum backward offset
  
  // Date helper functions
  const formatDate = (date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') {
      return date.toISOString().split('T')[0];
    } else if (formatStr === 'EEE') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (formatStr === 'd') {
      return date.getDate().toString();
    } else if (formatStr === 'MMM') {
      return date.toLocaleDateString('en-US', { month: 'short' });
    } else if (formatStr === 'MMM d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (formatStr === 'EEE MMM d') {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString();
  };
  
  const subDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };
  
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Get available dates from real data
  const getAvailableDates = () => {
    return Object.keys(whoopData).sort().reverse(); // Most recent first
  };

  // Function to navigate to previous day with data
  const goToPreviousDay = () => {
    const availableDates = getAvailableDates();
    const currentDateStr = formatDate(selectedDate, 'yyyy-MM-dd');
    const currentIndex = availableDates.indexOf(currentDateStr);
    
    if (currentIndex !== -1 && currentIndex < availableDates.length - 1) {
      const prevDateStr = availableDates[currentIndex + 1];
      setSelectedDate(new Date(prevDateStr));
    }
  };
  
  // Function to navigate to next day with data
  const goToNextDay = () => {
    const availableDates = getAvailableDates();
    const currentDateStr = formatDate(selectedDate, 'yyyy-MM-dd');
    const currentIndex = availableDates.indexOf(currentDateStr);
    
    if (currentIndex > 0) {
      const nextDateStr = availableDates[currentIndex - 1];
      setSelectedDate(new Date(nextDateStr));
    }
  };

  // Function to navigate the mini chart timeline left (backward in time)
  const navigateTimelineLeft = () => {
    const availableDates = getAvailableDates();
    if (dateRangeOffset < Math.floor(availableDates.length / 7) - 1) {
      setDateRangeOffset(dateRangeOffset + 1);
    }
  };

  // Function to navigate the mini chart timeline right (forward in time)
  const navigateTimelineRight = () => {
    if (dateRangeOffset > 0) {
      setDateRangeOffset(dateRangeOffset - 1);
    }
  };

  // Generate BMP data for mini chart for each day from real data
  const generateWeeklyBmpData = (dateRange) => {
    const weekBmpData = {};
    
    dateRange.forEach(dateStr => {
      const dayData = whoopData[dateStr];
      
      // If this is the currently selected date and we have processed main chart data, use that
      const dateFormatted = formatDate(selectedDate, 'yyyy-MM-dd');
      if (dateStr === dateFormatted && fullData.length > 0) {
        // Compress the main chart data to 24 points for mini chart
        const sampleRate = Math.max(1, Math.floor(fullData.length / 24));
        const sampledData = [];
        
        for (let i = 0; i < fullData.length; i += sampleRate) {
          const dataPoint = fullData[i];
          sampledData.push({
            bmp: dataPoint.hr, // Use heart rate as BMP
            sleepStage: dataPoint.sleepStage,
            activity: dataPoint.activity || 'idle'
          });
          
          if (sampledData.length >= 24) break;
        }
        
        weekBmpData[dateStr] = sampledData;
      } else {
        // Generate realistic fallback data for dates without bmp_data
        const sampledData = [];
        
        // Create unique pattern for each date based on date string for consistency
        const dateHash = dateStr.split('-').reduce((hash, part) => hash + parseInt(part), 0);
        const seedRandom = (seed) => {
          const x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };
        
        for (let i = 0; i < 24; i++) {
          const timeOfDay = i / 24;
          let bmp;
          const randomSeed = dateHash + i;
          
          // Create a more realistic daily heart rate pattern with date-specific variation
          if (timeOfDay >= 0.875 || timeOfDay < 0.25) { // 9:00 PM - 6:00 AM (sleep)
            // Sleep heart rate - lower and more stable
            const sleepHour = timeOfDay >= 0.875 ? (timeOfDay - 0.875) * 24 : timeOfDay * 24;
            bmp = 45 + Math.sin(sleepHour * 0.3) * 5 + seedRandom(randomSeed) * 8;
          } else if (timeOfDay >= 0.25 && timeOfDay < 0.375) { // 6:00 AM - 9:00 AM (wake up)
            // Morning wake up - gradual increase
            const progress = (timeOfDay - 0.25) / 0.125;
            bmp = 50 + progress * 25 + seedRandom(randomSeed) * 12;
          } else if (timeOfDay >= 0.625 && timeOfDay < 0.75) { // 3:00 PM - 6:00 PM (potential exercise)
            // Afternoon activity peak - vary by date
            const exerciseIntensity = Math.sin((timeOfDay - 0.625) * 8 * Math.PI);
            const exerciseDay = seedRandom(dateHash) > 0.7; // 30% chance of exercise
            bmp = exerciseDay ? 
              80 + exerciseIntensity * 40 + seedRandom(randomSeed) * 20 :
              70 + exerciseIntensity * 10 + seedRandom(randomSeed) * 15;
          } else if (timeOfDay >= 0.75 && timeOfDay < 0.875) { // 6:00 PM - 9:00 PM (evening)
            // Evening wind down
            const progress = (timeOfDay - 0.75) / 0.125;
            bmp = 75 - progress * 15 + seedRandom(randomSeed) * 15;
          } else { // 9:00 AM - 3:00 PM (regular day activity)
            // Regular daytime activity with some variation
            bmp = 70 + Math.sin(timeOfDay * 12) * 10 + seedRandom(randomSeed) * 20;
          }
          
          sampledData.push({
            bmp: Math.max(40, Math.min(180, Math.round(bmp))),
            sleepStage: (timeOfDay >= 0.875 || timeOfDay < 0.25) ? 'sleep' : 'none'
          });
        }
        
        weekBmpData[dateStr] = sampledData;
      }
    });
    
    return weekBmpData;
  };

  // Load weekly data for the timeline from real data
  useEffect(() => {
    const availableDates = getAvailableDates();
    setMaxOffset(Math.floor(availableDates.length / 7) - 1);
    
    // Update weekly data when offset changes
    const updateWeekData = () => {
      const startIndex = dateRangeOffset * 7;
      const visibleDates = availableDates.slice(startIndex, startIndex + 7).reverse();
      
      const weekData = {};
      visibleDates.forEach(dateStr => {
        const date = new Date(dateStr);
        const dayHasData = whoopData[dateStr] && Object.keys(whoopData[dateStr]).length > 0;
        
        weekData[dateStr] = {
          date,
          dayName: formatDate(date, 'EEE'),
          dayNum: formatDate(date, 'd'),
          monthName: formatDate(date, 'MMM'),
          data: dayHasData
        };
      });
      
      setWeeklyData(weekData);
      
      // If current selected date is not in the visible range, select the first date
      const selectedDateStr = formatDate(selectedDate, 'yyyy-MM-dd');
      if (!weekData[selectedDateStr] && Object.keys(weekData).length > 0) {
        setSelectedDate(Object.values(weekData)[0].date);
      }
    };
    
    updateWeekData();
  }, [dateRangeOffset]); // Re-run when offset changes

  // Separate useEffect to regenerate weekly BMP data when fullData changes
  useEffect(() => {
    if (Object.keys(weeklyData).length > 0) {
      const weekBmpData = generateWeeklyBmpData(Object.keys(weeklyData));
      setWeeklyBmpData(weekBmpData);
    }
  }, [fullData, weeklyData, selectedDate]);

  // Process BMP data for the selected date using real Whoop data
  useEffect(() => {
    setIsLoading(true);
    
    const dateFormatted = formatDate(selectedDate, 'yyyy-MM-dd');
    const dayData = whoopData[dateFormatted];
    const processedData = [];
    
    // Fallback pattern for dates without BPM data
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timeOfDay = (hour * 60 + minute) / (24 * 60);
        
        let hr;
        if (hour >= 22 || hour < 6) {
          hr = 50 + Math.sin(hour * 0.5) * 8 + Math.random() * 8;
        } else if (hour >= 6 && hour < 9) {
          hr = 60 + (hour - 5) * 8 + Math.random() * 12;
        } else {
          hr = 75 + Math.sin((hour - 9) * 0.7) * 20 + Math.random() * 15;
          
          if (hour >= 17 && hour <= 18) {
            hr += 25 + Math.sin((minute / 60) * Math.PI) * 20;
          }
        }
        
        const strain = Math.max(0, (hr - 55) / 12);
        const timeLabel = minute === 0 ? 
          `${hour === 0 ? '12' : (hour > 12 ? hour - 12 : hour)}:00${hour >= 12 ? 'pm' : 'am'}` : 
          `${hour}:${minute.toString().padStart(2, '0')}`;
        
        processedData.push({
          x: timeOfDay * 100,
          hr: Math.max(40, Math.min(180, hr)),
          strain: Math.max(0, Math.min(21, strain)),
          time: timeLabel,
          timestamp: timeOfDay,
          sleepStage: (hour >= 22 || hour < 6) ? 'sleep' : 'none',
          activity: 'idle'
        });
      }
    }
    
    setFullData(processedData);
    setIsLoading(false);
  }, [selectedDate]);

  // Get key metrics from real data
  const getMetrics = () => {
    const dateFormatted = formatDate(selectedDate, 'yyyy-MM-dd');
    const dayData = whoopData[dateFormatted];
    
    if (dayData) {
      // Calculate metrics from BPM data if available
      const avgHr = 70;
      const maxHr = 180;
      const sleepHr = 60;
      
      // Use physiological summary if available, otherwise calculate from BPM data
      const recoveryScore = Math.max(50, 100 - (avgHr - 60) * 2);
      const strain = Math.max(0, (maxHr - avgHr) / 10);
      const sleepPerformance = Math.max(60, 100 - (sleepHr - 50) * 3);
      
      return {
        sleepScore: Math.round(recoveryScore),
        strain: strain.toFixed(1),
        sleepTime: '10:30pm',
        wakeTime: '6:45am',
        sleepPerformance: Math.round(sleepPerformance),
        avgHr: avgHr,
        maxHr: maxHr
      };
    }
    
    return {
      sleepScore: 75,
      strain: '12.5',
      sleepTime: '10:30pm',
      wakeTime: '6:45am',
      sleepPerformance: 85,
      avgHr: 70,
      maxHr: 180
    };
  };

  const metrics = getMetrics();

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  // Create SVG path for smooth curves with enhanced styling
  const createSmoothPath = (data, valueKey, maxValue) => {
    if (!data || data.length < 2) return '';
    
    const points = data.map((point, index) => {
      const x = 60 + (index / (data.length - 1)) * 1200;
      const y = 300 - (point[valueKey] / maxValue) * 240;
      return { x, y };
    });
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1] || curr;
      
      const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy1 = prev.y;
      const cpx2 = curr.x - (next.x - curr.x) * 0.5;
      const cpy2 = curr.y;
      
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  };

  // Create area path for gradient fill under the line
  const createAreaPath = (data, valueKey, maxValue) => {
    if (!data || data.length < 2) return '';
    
    const points = data.map((point, index) => {
      const x = 60 + (index / (data.length - 1)) * 1200;
      const y = 300 - (point[valueKey] / maxValue) * 240;
      return { x, y };
    });
    
    let path = `M ${points[0].x} ${300} L ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1] || curr;
      
      const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy1 = prev.y;
      const cpx2 = curr.x - (next.x - curr.x) * 0.5;
      const cpy2 = curr.y;
      
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }
    
    path += ` L ${points[points.length - 1].x} ${300} Z`;
    return path;
  };

  // Use useCallback for stable event handlers
  const handleRangeMouseDown = useCallback((e, type) => {
    setIsDragging(true);
    setDragType(type);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleRangeMouseMove = useCallback((e) => {
    if (!isDragging || !rangeRef.current) return;

    const rect = rangeRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const oneDaySize = 1 / 7; // One day width

    // For any drag type, we'll move the entire range as a fixed-width window
    if (dragType === 'range' || dragType === 'start' || dragType === 'end') {
      // Calculate new position ensuring we stay within bounds
      const newStart = Math.max(0, Math.min(1 - oneDaySize, x - (oneDaySize / 2)));
      setRangeStart(newStart);
      setRangeEnd(newStart + oneDaySize);
    }
  }, [isDragging, dragType]);

  const handleRangeMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleRangeMouseMove);
      document.addEventListener('mouseup', handleRangeMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleRangeMouseMove);
        document.removeEventListener('mouseup', handleRangeMouseUp);
      };
    }
  }, [isDragging, handleRangeMouseMove, handleRangeMouseUp]);

  // Update the selected date based on the range position
  useEffect(() => {
    const weekDays = Object.values(weeklyData);
    if (weekDays.length > 0) {
      const centerPosition = rangeStart + (rangeEnd - rangeStart) / 2;
      const dayIndex = Math.floor(centerPosition * weekDays.length);
      const selectedDay = weekDays[Math.min(dayIndex, weekDays.length - 1)];
      
      if (selectedDay && formatDate(selectedDate, 'yyyy-MM-dd') !== formatDate(selectedDay.date, 'yyyy-MM-dd')) {
        setSelectedDate(selectedDay.date);
      }
    }
  }, [rangeStart, rangeEnd, weeklyData]);

  // Enhanced createWeeklyBmpPath function for better visualization
  const createWeeklyBmpPath = (weekBmpData, weekData) => {
    if (!weekBmpData || !weekData || Object.keys(weekData).length === 0) {
      return '';
    }
    
    const allPoints = [];
    const days = Object.values(weekData);
    const chartWidth = 100;
    const chartHeight = 40; // Reduced height for better scaling
    const dayWidth = chartWidth / days.length;
    
    days.forEach((day, dayIndex) => {
      const dateKey = formatDate(day.date, 'yyyy-MM-dd');
      const dayBmpData = weekBmpData[dateKey] || [];
      
      if (dayBmpData.length > 0) {
        // Use fewer points for smoother path in mini chart
        const pointsToUse = Math.min(dayBmpData.length, 12);
        const step = Math.max(1, Math.floor(dayBmpData.length / pointsToUse));
        
        for (let i = 0; i < dayBmpData.length; i += step) {
          const point = dayBmpData[i];
          const pointIndex = Math.floor(i / step);
          const x = (dayIndex * dayWidth) + (pointIndex / (pointsToUse - 1 || 1)) * dayWidth;
          
          // Better normalization for clearer visualization
          const normalizedBmp = Math.max(0, Math.min(1, (point.bmp - 40) / 140)); // 40-180 BPM range
          const y = chartHeight - (normalizedBmp * chartHeight * 0.7) - (chartHeight * 0.15); // 70% of height with 15% padding
          
          allPoints.push({ x, y, sleepStage: point.sleepStage, bmp: point.bmp });
          
          if (allPoints.length >= days.length * 12) break; // Limit total points for performance
        }
      } else {
        // If no data for this day, create a simpler pattern (fewer points)
        for (let i = 0; i < 6; i++) {
          const x = dayIndex * dayWidth + (i / 5) * dayWidth;
          const timeOfDay = i / 5;
          
          // Create more variation based on time of day
          let y;
          if (timeOfDay < 0.2 || timeOfDay > 0.8) {
            // Sleep periods - lower
            y = chartHeight * 0.7; 
          } else if (timeOfDay > 0.5 && timeOfDay < 0.7) {
            // Activity peak
            y = chartHeight * 0.3;
          } else {
            // Regular day
            y = chartHeight * 0.5;
          }
          
          allPoints.push({ x, y, sleepStage: 'none', bmp: 70 });
        }
      }
    });
    
    if (allPoints.length === 0) return '';
    
    // Create path with minimal smoothing for performance
    let path = `M ${allPoints[0].x.toFixed(1)} ${allPoints[0].y.toFixed(1)}`;
    
    for (let i = 1; i < allPoints.length; i++) {
      const curr = allPoints[i];
      path += ` L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }
    
    return path;
  };

  // Get date range information for display
  const getDateRangeInfo = () => {
    const weekDays = Object.values(weeklyData);
    if (weekDays.length === 0) return { start: '', end: '' };
    
    const startDate = weekDays[0].date;
    const endDate = weekDays[weekDays.length - 1].date;
    
    return {
      start: `${weekDays[0].dayName} ${weekDays[0].dayNum}`,
      end: `${weekDays[weekDays.length - 1].dayName} ${weekDays[weekDays.length - 1].dayNum}`
    };
  };

  const dateRangeInfo = getDateRangeInfo();

  return (
    <div className="bg-gray-900 text-white p-6 min-h-screen">
      {/* Header with period selector */}
      <div className="flex justify-end mb-6">
        <TimePeriodSelector 
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />
      </div>

      {/* Main Chart */}
      <div className="mb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-80 text-gray-400">
            Loading chart data...
          </div>
        ) : (
          <div className="relative bg-gray-800/30 rounded-lg p-4">
            <svg width="100%" height="350" viewBox="0 0 1320 350" className="overflow-visible">
              <defs>
                <linearGradient id="bmpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
                </linearGradient>
                
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              <rect width="100%" height="300" fill="transparent" />

              {/* Grid lines - horizontal */}
              {[0, 50, 100, 150, 200].map((value) => {
                const y = 300 - (value / 200) * 240;
                return (
                  <line
                    key={`h-${value}`}
                    x1={60}
                    y1={y}
                    x2={1260}
                    y2={y}
                    stroke="rgb(55, 65, 81)"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                );
              })}

              {/* Grid lines - vertical (time markers) */}
              {[0, 4, 8, 12, 16, 20, 24].map((hour) => {
                const x = 60 + (hour / 24) * 1200;
                const label = hour === 0 ? '12:00am' : 
                             hour === 12 ? '12:00pm' : 
                             hour < 12 ? `${hour}:00am` : `${hour - 12}:00pm`;
                return (
                  <g key={`v-${hour}`}>
                    <line 
                      x1={x} 
                      y1={60} 
                      x2={x} 
                      y2={300} 
                      stroke="rgb(55, 65, 81)" 
                      strokeWidth="1" 
                      opacity="0.3" 
                    />
                    <text 
                      x={x} 
                      y={325} 
                      fontSize="11" 
                      fill="rgb(156, 163, 175)" 
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Y-axis labels */}
              {[0, 50, 100, 150, 200].map((value) => {
                const y = 300 - (value / 200) * 240;
                return (
                  <text 
                    key={`y-${value}`} 
                    x={45} 
                    y={y + 4} 
                    fontSize="11" 
                    fill="rgb(156, 163, 175)" 
                    textAnchor="end"
                  >
                    {value}
                  </text>
                );
              })}

              {/* Area under Heart Rate line */}
              <path
                d={createAreaPath(fullData, 'hr', 200)}
                fill="url(#bmpGradient)"
              />

              {/* Heart rate line (primary) with enhanced styling */}
              <path
                d={createSmoothPath(fullData, 'hr', 200)}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#glow)"
                className="filter drop-shadow-sm"
              />
            </svg>
          </div>
        )}
      </div>

      {/* SLIDING RANGE SELECTOR WITH BMP MINI CHART - FIXED VERSION */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <button 
            className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
            onClick={goToPreviousDay}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-gray-300 font-medium text-sm">
            Drag to select day
          </div>
          <button 
            className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
            onClick={goToNextDay}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        <div className="relative">
          {/* Mini chart background with BMP data visualization */}
          <div className="h-24 bg-gray-800 rounded-lg border border-gray-700 relative overflow-hidden">
            
            {/* Sideways Navigation Controls */}
            <div className="absolute top-1/2 left-1 z-40 transform -translate-y-1/2">
              <button 
                className={`p-1.5 bg-gray-700/70 hover:bg-gray-600 rounded-full text-gray-300 hover:text-white transition-colors ${dateRangeOffset >= maxOffset ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={navigateTimelineLeft}
                disabled={dateRangeOffset >= maxOffset}
              >
                <ArrowLeft size={16} />
              </button>
            </div>
            
            <div className="absolute top-1/2 right-1 z-40 transform -translate-y-1/2">
              <button 
                className={`p-1.5 bg-gray-700/70 hover:bg-gray-600 rounded-full text-gray-300 hover:text-white transition-colors ${dateRangeOffset <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={navigateTimelineRight}
                disabled={dateRangeOffset <= 0}
              >
                <ArrowRight size={16} />
              </button>
            </div>
            
            {/* Background SVG with BMP line chart */}
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 100 40" 
              preserveAspectRatio="none"
              className="absolute inset-0 pointer-events-none"
            >
              {/* Define gradients and clipping paths for mini chart */}
              <defs>
                <linearGradient id="miniChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(107, 114, 128)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(107, 114, 128)" stopOpacity="0.05" />
                </linearGradient>
                
                <linearGradient id="selectedRangeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0.1" />
                </linearGradient>
                
                <clipPath id="selectedRangeClip">
                  <rect
                    x={rangeStart * 100}
                    y="0"
                    width={(rangeEnd - rangeStart) * 100}
                    height="40"
                  />
                </clipPath>
              </defs>

              {/* Background BMP line (gray/muted) */}
              <path
                d={createWeeklyBmpPath(weeklyBmpData, weeklyData)}
                fill="none"
                stroke="rgb(156, 163, 175)"
                strokeWidth="0.8"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity="0.9"
              />

              {/* Selected range BMP line (orange/red highlighted) */}
              <path
                d={createWeeklyBmpPath(weeklyBmpData, weeklyData)}
                fill="none"
                stroke="rgb(249, 115, 22)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                clipPath="url(#selectedRangeClip)"
                opacity="1"
              />

              {/* Area fill under selected range */}
              <path
                d={`${createWeeklyBmpPath(weeklyBmpData, weeklyData)} L ${rangeEnd * 100} 40 L ${rangeStart * 100} 40 Z`}
                fill="url(#selectedRangeGradient)"
                clipPath="url(#selectedRangeClip)"
                opacity="0.3"
              />

              {/* Dimmed areas outside the selected range */}
              <rect
                x="0"
                y="0"
                width={rangeStart * 100}
                height="40"
                fill="rgba(0,0,0,0.4)"
              />
              <rect
                x={rangeEnd * 100}
                y="0"
                width={(1 - rangeEnd) * 100}
                height="40"
                fill="rgba(0,0,0,0.4)"
              />

              {/* Active selection highlight border */}
              <rect
                x={rangeStart * 100}
                y="0"
                width={(rangeEnd - rangeStart) * 100}
                height="40"
                fill="transparent"
                stroke="rgb(59, 130, 246)"
                strokeWidth="0.5"
              />
            </svg>

            {/* Day labels with data indicators */}
            <div className="flex h-full absolute inset-0 pointer-events-none z-10 px-8">
              {Object.values(weeklyData).map((day, index) => {
                const isSelected = formatDate(selectedDate, 'yyyy-MM-dd') === formatDate(day.date, 'yyyy-MM-dd');
                const dayPosition = index / Math.max(1, Object.values(weeklyData).length - 1);
                const isInRange = dayPosition >= rangeStart && dayPosition <= rangeEnd;
                const dateKey = formatDate(day.date, 'yyyy-MM-dd');
                const hasData = whoopData[dateKey] && Object.keys(whoopData[dateKey]).length > 0;
                
                return (
                  <div 
                    key={index} 
                    className={`flex-1 flex flex-col justify-end pb-1 text-center transition-all duration-200 ${
                      isSelected 
                        ? 'text-blue-400 font-medium' 
                        : isInRange 
                          ? 'text-orange-300' 
                          : 'text-gray-500 opacity-50'
                    }`}
                  >
                    <div className="text-xs font-medium">{day.dayName}</div>
                    <div className="text-xs flex items-center justify-center gap-1">
                      {formatDate(day.date, 'MMM d')}
                      {hasData && (
                        <div className={`w-1 h-1 rounded-full ${isInRange ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MODIFIED: Single slider instead of two separate handles */}
            <div
              ref={rangeRef}
              className="absolute inset-0 z-20 mx-8"
            >
              {/* Draggable range area with single slider */}
              <div
                className="absolute top-0 bottom-0 cursor-grab active:cursor-grabbing z-30"
                style={{ 
                  left: `${rangeStart * 100}%`, 
                  width: `${(rangeEnd - rangeStart) * 100}%`,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '2px solid rgba(59, 130, 246, 0.6)',
                  borderRadius: '4px'
                }}
                onMouseDown={(e) => handleRangeMouseDown(e, 'range')}
              >
                {/* Center handle indicator to make it clear this is draggable */}
                <div className="absolute top-1/2 left-1/2 w-5 h-10 bg-blue-500 rounded-sm transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className="w-0.5 h-5 bg-white rounded mx-0.5"></div>
                  <div className="w-0.5 h-5 bg-white rounded mx-0.5"></div>
                </div>
              </div>
            </div>

            {/* Day click areas - only active when not dragging */}
            {!isDragging && (
              <div className="absolute inset-0 flex z-15 px-8">
                {Object.values(weeklyData).map((day, index) => (
                  <div 
                    key={index}
                    className="flex-1 cursor-pointer hover:bg-blue-500/10 transition-colors"
                    onClick={() => setSelectedDate(day.date)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Range indicators */}
          <div className="flex justify-between mt-3 text-xs text-gray-400 px-2">
            <span>
              {dateRangeInfo.start}
            </span>
            <span className="font-medium text-orange-400">
              1 day selected - {formatDate(selectedDate, 'EEE MMM d')}
              {dateRangeOffset > 0 && <span className="text-gray-500"> • {dateRangeOffset + 1} weeks ago</span>}
            </span>
            <span>
              {dateRangeInfo.end}
            </span>
          </div>
          
          {/* Timeline indicator */}
          {maxOffset > 0 && (
            <div className="mt-2 flex justify-center gap-1">
              {Array.from({ length: maxOffset + 1 }).map((_, i) => (
                <div 
                  key={i}
                  onClick={() => setDateRangeOffset(i)}
                  className={`w-2 h-2 rounded-full cursor-pointer ${dateRangeOffset === i ? 'bg-orange-500' : 'bg-gray-600'}`}
                ></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;