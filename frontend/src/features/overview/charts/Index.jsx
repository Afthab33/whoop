import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Calendar, TrendingUp, Dumbbell, Activity, Moon } from 'lucide-react';
import whoopData from '../../../data/day_wise_whoop_data.json';
import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';
import LineChart from './LineChart'; // Add this import

const Index = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('1d');
  const [selectedDate, setSelectedDate] = useState(new Date('2025-05-05'));
  const [fullData, setFullData] = useState([]);
  const [workoutData, setWorkoutData] = useState([]);
  const [weeklyData, setWeeklyData] = useState({});
  const [weeklyBmpData, setWeeklyBmpData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [rangeStart, setRangeStart] = useState(0.0);
  const [rangeEnd, setRangeEnd] = useState(1/7);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null);
  const rangeRef = useRef(null);
  const [dateRangeOffset, setDateRangeOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredWorkout, setHoveredWorkout] = useState(null);
  const [sleepData, setSleepData] = useState([]);
  const [hoveredSleep, setHoveredSleep] = useState(null);
  const [showLineChart, setShowLineChart] = useState(false);
  
  // NEW: Add cursor indicator state
  const [cursorPosition, setCursorPosition] = useState(null);
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);
  const chartRef = useRef(null);

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

  // Parse time from workout data to get hour and minute
  const parseWorkoutTime = (timeStr) => {
    if (!timeStr) return null;
    const date = new Date(timeStr);
    return {
      hour: date.getHours(),
      minute: date.getMinutes(),
      timeOfDay: (date.getHours() * 60 + date.getMinutes()) / (24 * 60)
    };
  };

  // Parse time from sleep data to get hour and minute
  const parseSleepTime = (timeStr) => {
    if (!timeStr) return null;
    const date = new Date(timeStr);
    return {
      hour: date.getHours(),
      minute: date.getMinutes(),
      timeOfDay: (date.getHours() * 60 + date.getMinutes()) / (24 * 60)
    };
  };

  // Get workout icon based on activity name - Updated for better icons
  const getWorkoutIcon = (activityName) => {
    const activity = activityName?.toLowerCase() || '';
    
    if (activity.includes('weight') || activity.includes('strength') || activity.includes('lifting')) {
      return <Dumbbell size={14} strokeWidth={2.5} />;
    } else if (activity.includes('run') || activity.includes('jog')) {
      return <Activity size={14} strokeWidth={2.5} />;
    } else if (activity.includes('bike') || activity.includes('cycling')) {
      return <Activity size={14} strokeWidth={2.5} />;
    } else if (activity.includes('swim')) {
      return <Activity size={14} strokeWidth={2.5} />;
    } else if (activity.includes('walk')) {
      return <Activity size={14} strokeWidth={2.5} />;
    } else {
      return <Activity size={14} strokeWidth={2.5} />;
    }
  };

  // Get workout color based on activity type
  const getWorkoutColor = (activityName) => {
    return '#0093E7'; // Always use strain color for workouts
  };
  
  // Get available dates from real data
  const getAvailableDates = () => {
    return Object.keys(whoopData).sort().reverse();
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

  // Enhanced BMP data generation with workout awareness
  const generateWeeklyBmpData = (dateRange) => {
    const weekBmpData = {};
    
    dateRange.forEach(dateStr => {
      const dayData = whoopData[dateStr];
      const workouts = dayData?.workouts || [];
      
      const dateFormatted = formatDate(selectedDate, 'yyyy-MM-dd');
      if (dateStr === dateFormatted && fullData.length > 0) {
        const sampleRate = Math.max(1, Math.floor(fullData.length / 48));
        const sampledData = [];
        
        for (let i = 0; i < fullData.length; i += sampleRate) {
          const dataPoint = fullData[i];
          sampledData.push({
            bmp: dataPoint.hr,
            sleepStage: dataPoint.sleepStage,
            activity: dataPoint.activity || 'idle',
            timestamp: dataPoint.timestamp,
            workout: dataPoint.workout || null
          });
          
          if (sampledData.length >= 48) break;
        }
        
        weekBmpData[dateStr] = sampledData;
      } else {
        const sampledData = [];
        const dateHash = dateStr.split('-').reduce((hash, part) => hash + parseInt(part), 0);
        const seedRandom = (seed) => {
          const x = Math.sin(seed) * 10000;
          return x - Math.floor(x);
        };
        
        // Generate 48 data points for smoother curves
        for (let i = 0; i < 48; i++) {
          const timeOfDay = i / 48;
          let bmp;
          let currentWorkout = null;
          const randomSeed = dateHash + i;
          
          // Check if this time falls within any workout
          for (const workout of workouts) {
            const startTime = parseWorkoutTime(workout["Workout start time"]);
            const endTime = parseWorkoutTime(workout["Workout end time"]);
            
            if (startTime && endTime && timeOfDay >= startTime.timeOfDay && timeOfDay <= endTime.timeOfDay) {
              currentWorkout = workout;
              break;
            }
          }
          
          // Enhanced sleep pattern (10PM - 7AM)
          if (timeOfDay >= 0.916 || timeOfDay < 0.291) {
            const sleepHour = timeOfDay >= 0.916 ? (timeOfDay - 0.916) * 24 : timeOfDay * 24;
            const deepSleepFactor = Math.sin(sleepHour * 0.4) * 0.7 + 0.3;
            bmp = 42 + Math.sin(sleepHour * 0.3) * 8 * deepSleepFactor + seedRandom(randomSeed) * 6;
          }
          // Morning rise (7AM - 9AM)
          else if (timeOfDay >= 0.291 && timeOfDay < 0.375) {
            const progress = (timeOfDay - 0.291) / 0.084;
            bmp = 50 + progress * 30 + Math.sin(progress * Math.PI) * 10 + seedRandom(randomSeed) * 12;
          }
          // Workout periods - use actual workout data if available
          else if (currentWorkout) {
            const workoutProgress = (timeOfDay - parseWorkoutTime(currentWorkout["Workout start time"]).timeOfDay) / 
                                  ((parseWorkoutTime(currentWorkout["Workout end time"]).timeOfDay - parseWorkoutTime(currentWorkout["Workout start time"]).timeOfDay) || 0.01);
            const avgHR = currentWorkout["Average HR (bmp)"] || 110;
            const maxHR = currentWorkout["Max HR (bmp)"] || 140;
            const baseHR = avgHR + (maxHR - avgHR) * Math.sin(workoutProgress * Math.PI) * 0.7;
            bmp = baseHR + seedRandom(randomSeed) * 15;
          }
          // Evening wind down (8PM - 10PM)
          else if (timeOfDay >= 0.833 && timeOfDay < 0.916) {
            const progress = (timeOfDay - 0.833) / 0.083;
            const windDown = Math.cos(progress * Math.PI * 0.5);
            bmp = 85 - progress * 25 * windDown + seedRandom(randomSeed) * 12;
          }
          // Day time variation
          else {
            const dayVariation = Math.sin((timeOfDay - 0.375) * 4 * Math.PI) * 15;
            const stressSpikes = seedRandom(randomSeed + 100) > 0.85 ? 20 : 0;
            bmp = 75 + dayVariation + stressSpikes + seedRandom(randomSeed) * 18;
          }
          
          sampledData.push({
            bmp: Math.max(40, Math.min(180, Math.round(bmp))),
            sleepStage: (timeOfDay >= 0.916 || timeOfDay < 0.291) ? 'sleep' : 'none',
            timestamp: timeOfDay,
            activity: currentWorkout ? 'workout' : 'idle',
            workout: currentWorkout
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
    
    const updateWeekData = () => {
      const startIndex = dateRangeOffset * 7;
      const visibleDates = availableDates.slice(startIndex, startIndex + 7).reverse();
      
      const weekData = {};
      visibleDates.forEach(dateStr => {
        const date = new Date(dateStr);
        const dayHasData = whoopData[dateStr] && Object.keys(whoopData[dateStr]).length > 0;
        const hasWorkouts = whoopData[dateStr]?.workouts?.length > 0;
        
        weekData[dateStr] = {
          date,
          dayName: formatDate(date, 'EEE'),
          dayNum: formatDate(date, 'd'),
          monthName: formatDate(date, 'MMM'),
          data: dayHasData,
          workouts: hasWorkouts,
          hasSleep: whoopData[dateStr]?.sleep_summary ? true : false
        };
      });
      
      setWeeklyData(weekData);
      
      const selectedDateStr = formatDate(selectedDate, 'yyyy-MM-dd');
      if (!weekData[selectedDateStr] && Object.keys(weekData).length > 0) {
        setSelectedDate(Object.values(weekData)[0].date);
      }
    };
    
    updateWeekData();
  }, [dateRangeOffset]);

  // Separate useEffect to regenerate weekly BMP data when fullData changes
  useEffect(() => {
    if (Object.keys(weeklyData).length > 0) {
      const weekBmpData = generateWeeklyBmpData(Object.keys(weeklyData));
      setWeeklyBmpData(weekBmpData);
    }
  }, [fullData, weeklyData, selectedDate]);

  // Process BMP data for the selected date using real Whoop data with workout integration
  useEffect(() => {
    setIsLoading(true);
    
    const dateFormatted = formatDate(selectedDate, 'yyyy-MM-dd');
    const dayData = whoopData[dateFormatted];
    const workouts = dayData?.workouts || [];
    const processedData = [];
    const processedWorkouts = [];
    
    // Process workouts for display
    workouts.forEach(workout => {
      const startTime = parseWorkoutTime(workout["Workout start time"]);
      const endTime = parseWorkoutTime(workout["Workout end time"]);
      
      if (startTime && endTime) {
        processedWorkouts.push({
          ...workout,
          startTimeOfDay: startTime.timeOfDay,
          endTimeOfDay: endTime.timeOfDay,
          startX: 60 + startTime.timeOfDay * 1200,
          endX: 60 + endTime.timeOfDay * 1200,
          color: getWorkoutColor(workout["Activity name"]),
          icon: getWorkoutIcon(workout["Activity name"])
        });
      }
    });
    
    setWorkoutData(processedWorkouts);
    
    // Process sleep periods for display
    const sleepPeriods = [];

// Process sleep periods using actual sleep data
const sleepSummary = dayData?.sleep_summary;

if (sleepSummary) {
  const sleepOnset = parseSleepTime(sleepSummary["Sleep onset"]);
  const wakeOnset = parseSleepTime(sleepSummary["Wake onset"]);
  
  if (sleepOnset && wakeOnset) {
    // Handle sleep periods that span across midnight
    if (sleepOnset.timeOfDay > wakeOnset.timeOfDay) {
      // Sleep spans midnight - create two periods
      sleepPeriods.push({
        startTimeOfDay: sleepOnset.timeOfDay,
        endTimeOfDay: 1.0, // End at midnight
        startX: 60 + sleepOnset.timeOfDay * 1200,
        endX: 60 + 1.0 * 1200,
        type: 'Night Sleep',
        color: '#7BA1BB',
        performance: sleepSummary["Sleep performance %"],
        efficiency: sleepSummary["Sleep efficiency %"],
        duration: sleepSummary["Asleep duration (min)"],
        respiratory: sleepSummary["Respiratory rate (rpm)"]
      });
      
      sleepPeriods.push({
        startTimeOfDay: 0.0, // Start at midnight
        endTimeOfDay: wakeOnset.timeOfDay,
        startX: 60 + 0.0 * 1200,
        endX: 60 + wakeOnset.timeOfDay * 1200,
        type: 'Night Sleep',
        color: '#7BA1BB',
        performance: sleepSummary["Sleep performance %"],
        efficiency: sleepSummary["Sleep efficiency %"],
        duration: sleepSummary["Asleep duration (min)"],
        respiratory: sleepSummary["Respiratory rate (rpm)"]
      });
    } else {
      // Sleep doesn't span midnight - single period
      sleepPeriods.push({
        startTimeOfDay: sleepOnset.timeOfDay,
        endTimeOfDay: wakeOnset.timeOfDay,
        startX: 60 + sleepOnset.timeOfDay * 1200,
        endX: 60 + wakeOnset.timeOfDay * 1200,
        type: sleepSummary.Nap ? 'Nap' : 'Night Sleep',
        color: '#7BA1BB',
        performance: sleepSummary["Sleep performance %"],
        efficiency: sleepSummary["Sleep efficiency %"],
        duration: sleepSummary["Asleep duration (min)"],
        respiratory: sleepSummary["Respiratory rate (rpm)"]
      });
    }
  }
} else {
  // Fallback to default sleep periods if no data
  sleepPeriods.push({
    startTimeOfDay: 22/24,
    endTimeOfDay: 1.0,
    startX: 60 + (22/24) * 1200,
    endX: 60 + 1.0 * 1200,
    type: 'Estimated Sleep',
    color: '#7BA1BB'
  });
  
  sleepPeriods.push({
    startTimeOfDay: 0.0,
    endTimeOfDay: 7/24,
    startX: 60 + 0.0 * 1200,
    endX: 60 + (7/24) * 1200,
    type: 'Estimated Sleep',
    color: '#7BA1BB'
  });
}

setSleepData(sleepPeriods);
    
    // Generate heart rate data with workout integration
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timeOfDay = (hour * 60 + minute) / (24 * 60);
        let hr;
        let currentWorkout = null;
        
        // Check if this time falls within any workout
        for (const workout of processedWorkouts) {
          if (timeOfDay >= workout.startTimeOfDay && timeOfDay <= workout.endTimeOfDay) {
            currentWorkout = workout;
            break;
          }
        }
        
        let isInSleepPeriod = false;
        for (const sleepPeriod of sleepPeriods) {
          if (timeOfDay >= sleepPeriod.startTimeOfDay && timeOfDay <= sleepPeriod.endTimeOfDay) {
            isInSleepPeriod = true;
            break;
          }
        }

        if (isInSleepPeriod) {
          hr = 50 + Math.sin(hour * 0.5) * 8 + Math.random() * 8;
        } else if (hour >= 6 && hour < 9) {
          hr = 60 + (hour - 5) * 8 + Math.random() * 12;
        } else if (currentWorkout) {
          // Use actual workout heart rate data
          const workoutProgress = (timeOfDay - currentWorkout.startTimeOfDay) / 
                                (currentWorkout.endTimeOfDay - currentWorkout.startTimeOfDay);
          const avgHR = currentWorkout["Average HR (bpm)"] || 110;
          const maxHR = currentWorkout["Max HR (bpm)"] || 140;
          const baseHR = avgHR + (maxHR - avgHR) * Math.sin(workoutProgress * Math.PI) * 0.8;
          hr = baseHR + Math.random() * 15;
        } else {
          hr = 75 + Math.sin((hour - 9) * 0.7) * 20 + Math.random() * 15;
          
          if (hour >= 17 && hour <= 18 && !currentWorkout) {
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
          sleepStage: isInSleepPeriod ? 'sleep' : 'none',
          activity: currentWorkout ? 'workout' : 'idle',
          workout: currentWorkout
        });
      }
    }
    
    setFullData(processedData);
    setIsLoading(false);
  }, [selectedDate]);

  // Add this function to handle period changes and determine when to show LineChart
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    
    // Show LineChart for weekly and monthly periods
    const weeklyMonthlyPeriods = ['1w', '2w', '1m', '3m', '6m'];
    setShowLineChart(weeklyMonthlyPeriods.includes(period));
    
    // Handle the rest of your existing period change logic here
    // ... existing handlePeriodChange code ...
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
    const weekDays = Object.values(weeklyData);
    const oneDaySize = weekDays.length > 0 ? 1 / weekDays.length : 1/7;

    if (dragType === 'range' || dragType === 'start' || dragType === 'end') {
      // Snap to day boundaries for better UX
      const dayIndex = Math.round(x * weekDays.length);
      const snappedX = dayIndex / weekDays.length;
      
      const newStart = Math.max(0, Math.min(1 - oneDaySize, snappedX));
      setRangeStart(newStart);
      setRangeEnd(newStart + oneDaySize);
    }
  }, [isDragging, dragType, weeklyData]);

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

  // ADD NEW useEffect: Update range position when selectedDate changes
  useEffect(() => {
    const weekDays = Object.values(weeklyData);
    if (weekDays.length > 0) {
      const selectedDateStr = formatDate(selectedDate, 'yyyy-MM-dd');
      const selectedIndex = weekDays.findIndex(day => 
        formatDate(day.date, 'yyyy-MM-dd') === selectedDateStr
      );
      
      if (selectedIndex !== -1) {
        const oneDaySize = 1 / weekDays.length;
        const newRangeStart = (selectedIndex / weekDays.length);
        const newRangeEnd = newRangeStart + oneDaySize;
        
        // Only update if the range has actually changed to avoid infinite loops
        if (Math.abs(rangeStart - newRangeStart) > 0.001) {
          setRangeStart(newRangeStart);
          setRangeEnd(newRangeStart + oneDaySize);
        }
      }
    }
  }, [selectedDate, weeklyData]); // Remove rangeStart from dependencies to avoid infinite loop

  // Enhanced createWeeklyBmpPath function with workout indicators
  const createWeeklyBmpPath = (weekBmpData, weekData) => {
    if (!weekBmpData || !weekData || Object.keys(weekData).length === 0) {
      return '';
    }
    
    const allPoints = [];
    const days = Object.values(weekData);
    const chartWidth = 100;
    const chartHeight = 50;
    const dayWidth = chartWidth / days.length;
    
    days.forEach((day, dayIndex) => {
      const dateKey = formatDate(day.date, 'yyyy-MM-dd');
      const dayBmpData = weekBmpData[dateKey] || [];
      
      if (dayBmpData.length > 0) {
        const pointsToUse = Math.min(dayBmpData.length, 24);
        const step = Math.max(1, Math.floor(dayBmpData.length / pointsToUse));
        
        for (let i = 0; i < dayBmpData.length; i += step) {
          const point = dayBmpData[i];
          const pointIndex = Math.floor(i / step);
          const x = (dayIndex * dayWidth) + (pointIndex / (pointsToUse - 1 || 1)) * dayWidth;
          
          const normalizedBmp = Math.max(0, Math.min(1, (point.bmp - 40) / 140));
          const y = chartHeight - (normalizedBmp * chartHeight * 0.8) - (chartHeight * 0.1);
          
          allPoints.push({ 
            x, 
            y, 
            sleepStage: point.sleepStage, 
            bmp: point.bmp,
            activity: point.activity,
            timestamp: point.timestamp,
            workout: point.workout
          });
          
          if (allPoints.length >= days.length * 24) break;
        }
      } else {
        // Generate fallback data points
        for (let i = 0; i < 12; i++) {
          const x = dayIndex * dayWidth + (i / 11) * dayWidth;
          const timeOfDay = i / 11;
          
          let y;
          if (timeOfDay < 0.25 || timeOfDay > 0.8) {
            y = chartHeight * 0.75; // Sleep periods
          } else if (timeOfDay > 0.6 && timeOfDay < 0.75) {
            y = chartHeight * 0.2; // Exercise periods
          } else {
            y = chartHeight * 0.5; // Regular activity
          }
          
          allPoints.push({ 
            x, 
            y, 
            sleepStage: (timeOfDay < 0.25 || timeOfDay > 0.8) ? 'sleep' : 'none', 
            bmp: 70,
            activity: 'idle',
            timestamp: timeOfDay,
            workout: null
          });
        }
      }
    });
    
    if (allPoints.length === 0) return '';
    
    // Create smooth curved path using Catmull-Rom splines
    let path = `M ${allPoints[0].x.toFixed(2)} ${allPoints[0].y.toFixed(2)}`;
    
    for (let i = 1; i < allPoints.length; i++) {
      const prev = allPoints[i - 1] || allPoints[i];
      const curr = allPoints[i];
      const next = allPoints[i + 1] || allPoints[i];
      const next2 = allPoints[i + 2] || next;
      
      // Calculate control points for smooth curves
      const tension = 0.3;
      const cp1x = prev.x + (curr.x - prev.x) * tension;
      const cp1y = prev.y + (curr.y - prev.y) * tension;
      const cp2x = curr.x - (next.x - prev.x) * tension;
      const cp2y = curr.y - (next.y - prev.y) * tension;
      
      if (i === 1) {
        path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
      } else {
        path += ` S ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
      }
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

  // Add this function to generate data for the LineChart based on the selected period
  const getLineChartData = () => {
    // Generate sample data based on the selected period
    const generateSampleData = (days) => {
      const data = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const pointsToShow = Math.min(days, 30); // Show max 30 data points for performance
      const stepSize = Math.max(1, Math.floor(days / pointsToShow));
      
      for (let i = 0; i < days; i += stepSize) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Generate realistic strain and recovery values
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Higher strain on weekdays, lower on weekends
        const baseStrain = isWeekend ? 6 + Math.random() * 8 : 8 + Math.random() * 10;
        const strain = Math.round((baseStrain + Math.sin(i * 0.3) * 3) * 10) / 10;
        
        // Recovery inversely related to strain with some randomness
        const baseRecovery = Math.max(20, Math.min(100, 80 - (strain - 8) * 5 + Math.random() * 30));
        const recovery = Math.round(baseRecovery);
        
        data.push({
          day: dayNames[date.getDay()],
          date: `${monthNames[date.getMonth()]} ${date.getDate()}`,
          dateShort: dayNames[date.getDay()],
          strain: Math.max(0, Math.min(21, strain)),
          recovery: Math.max(0, Math.min(100, recovery))
        });
      }
      
      return data.slice(0, pointsToShow); // Ensure we don't exceed the max points
    };

    switch (selectedPeriod) {
      case '1w':
        return generateSampleData(7);
      case '2w':
        return generateSampleData(14);
      case '1m':
        return generateSampleData(30);
      case '3m':
        return generateSampleData(90);
      case '6m':
        return generateSampleData(180);
      default:
        return [];
    }
  };

  // NEW: Handle mouse move over chart
  const handleChartMouseMove = (e) => {
    if (!chartRef.current || !fullData.length) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgMouseX = (mouseX / rect.width) * 1320; // Scale to SVG viewBox
    
    // Check if mouse is within chart area (60 to 1260 on x-axis)
    if (svgMouseX >= 60 && svgMouseX <= 1260) {
      const relativeX = (svgMouseX - 60) / 1200; // 0 to 1
      const dataIndex = Math.round(relativeX * (fullData.length - 1));
      const dataPoint = fullData[dataIndex];
      
      if (dataPoint) {
        setCursorPosition(svgMouseX);
        setHoveredDataPoint(dataPoint);
      }
    } else {
      setCursorPosition(null);
      setHoveredDataPoint(null);
    }
  };

  // NEW: Handle mouse leave chart
  const handleChartMouseLeave = () => {
    setCursorPosition(null);
    setHoveredDataPoint(null);
  };

  // NEW: Format time for display
  const formatTimeForDisplay = (timestamp) => {
    if (!timestamp) return '';
    
    const totalMinutes = Math.round(timestamp * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    return `${hour12}:${minutes.toString().padStart(2, '0')}${ampm}`;
  };

  return (
    <div className="space-y-2">
      {/* Header Section - Moved TimePeriodSelector to right */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          {/* Empty left side or add other elements here if needed */}
        </div>
        {/* <div className="flex items-center space-x-4">
          <TimePeriodSelector 
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </div> */}
      </div>

      {/* Conditional Display - Only show LineChart for weekly/monthly periods */}
      {showLineChart ? (
        <div className="space-y-2">
          <LineChart selectedPeriod={selectedPeriod} />
        </div>
      ) : (
        <>
          {/* Main Chart Card - MATCH Recovery card dimensions exactly */}
          <div className="whoops-card min-h-[380px]" style={{
            background: 'var(--card-bg)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-72 text-[var(--text-secondary)]">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--strain-blue)] mx-auto"></div>
                  <div className="space-y-2">
                    <div className="text-base font-medium text-[var(--text-primary)] mb-2">Loading heart rate data...</div>
                    <div className="text-xs mb-2 max-w-md mx-auto">Processing daily patterns and workouts</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Chart Title with Workout Summary - MATCH Recovery header structure */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1 text-sm text-[var(--text-muted)] mt-1">
                      <span>
                        24-hour analysis for {formatDate(selectedDate, 'EEE MMM d')}
                        {workoutData.length > 0 && (
                          <span className="ml-2 text-[#0093E7]">
                            • {workoutData.length} workout{workoutData.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-0.5 bg-[var(--strain-blue)]"></div>
                      <span className="text-xs text-[var(--text-muted)]">Heart Rate (BPM)</span>
                    </div>
                    {workoutData.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Dumbbell size={12} className="text-[#0093E7]" />
                        <span className="text-xs text-[var(--text-muted)]">Workouts</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart content area */}
                <div className="flex-1 min-h-0 pt-1">
                  <div className="w-full" style={{ height: '340px' }}>
                    <svg 
                      ref={chartRef}
                      width="100%" 
                      height="100%" 
                      viewBox="0 0 1320 350" 
                      className="overflow-visible"
                      onMouseMove={handleChartMouseMove}
                      onMouseLeave={handleChartMouseLeave}
                    >
                      <defs>
                        <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--strain-blue)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--strain-blue)" stopOpacity="0.05" />
                        </linearGradient>
                        
                        <filter id="hrGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>

                        {/* Workout gradient definitions */}
                        {workoutData.map((workout, index) => (
                          <linearGradient key={`workout-gradient-${index}`} id={`workoutGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={workout.color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={workout.color} stopOpacity="0.1" />
                          </linearGradient>
                        ))}

                        {/* Sleep gradient definitions */}
                        <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7BA1BB" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#7BA1BB" stopOpacity="0.08" />
                        </linearGradient>
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
                            stroke="rgba(255, 255, 255, 0.08)"
                            strokeWidth="1"
                          />
                        );
                      })}

                      {/* Grid lines - vertical (time markers) */}
                      {[0, 4, 8, 12, 16, 20, 24].map((hour) => {
                        const x = 60 + (hour / 24) * 1200;
                        const label = hour === 0 ? '12AM' : 
                                     hour === 12 ? '12PM' : 
                                     hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
                        return (
                          <g key={`v-${hour}`}>
                            <line 
                              x1={x} 
                              y1={60} 
                              x2={x} 
                              y2={300} 
                              stroke="rgba(255, 255, 255, 0.08)" 
                              strokeWidth="1"
                            />
                            <text 
                              x={x} 
                              y={325} 
                              className="metric-label"
                              fontSize="11" 
                              fill="var(--text-muted)" 
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
                            className="metric-label"
                            fontSize="11" 
                            fill="var(--text-muted)" 
                            textAnchor="end"
                          >
                            {value}
                          </text>
                        );
                      })}

                      {/* Sleep background zones */}
                      {sleepData.map((sleep, index) => (
                        <g key={`sleep-zone-${index}`}>
                          <rect
                            x={sleep.startX}
                            y={60}
                            width={sleep.endX - sleep.startX}
                            height={240}
                            fill="url(#sleepGradient)"
                            opacity="0.6"
                          />
                          <rect
                            x={sleep.startX}
                            y={300}
                            width={sleep.endX - sleep.startX}
                            height={4}
                            fill={sleep.color}
                            opacity="0.8"
                          />
                        </g>
                      ))}

                      {/* Workout background zones */}
                      {workoutData.map((workout, index) => (
                        <g key={`workout-zone-${index}`}>
                          <rect
                            x={workout.startX}
                            y={60}
                            width={workout.endX - workout.startX}
                            height={240}
                            fill={`url(#workoutGradient${index})`}
                            opacity="0.4"
                          />
                          <rect
                            x={workout.startX}
                            y={60}
                            width={workout.endX - workout.startX}
                            height={4}
                            fill={workout.color}
                            opacity="0.8"
                          />
                        </g>
                      ))}

                      {/* Area under Heart Rate line */}
                      <path
                        d={createAreaPath(fullData, 'hr', 200)}
                        fill="url(#hrGradient)"
                      />

                      {/* Heart rate line */}
                      <path
                        d={createSmoothPath(fullData, 'hr', 200)}
                        fill="none"
                        stroke="var(--strain-blue)"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        filter="url(#hrGlow)"
                      />

                      {/* NEW: Cursor indicator */}
                      {cursorPosition && hoveredDataPoint && (
                        <g>
                          {/* Vertical cursor line */}
                          <line
                            x1={cursorPosition}
                            y1={60}
                            x2={cursorPosition}
                            y2={300}
                            stroke="rgba(255, 255, 255, 0.8)"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            opacity="0.9"
                          />
                          
                          {/* Cursor dot on line */}
                          <circle
                            cx={cursorPosition}
                            cy={300 - (hoveredDataPoint.hr / 200) * 240}
                            r="6"
                            fill="var(--strain-blue)"
                            stroke="white"
                            strokeWidth="3"
                            style={{
                              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))'
                            }}
                          />
                          
                          {/* Tooltip */}
                          <g transform={`translate(${cursorPosition}, ${300 - (hoveredDataPoint.hr / 200) * 240 - 60})`}>
                            <rect
                              x="-35"
                              y="-25"
                              width="70"
                              height="40"
                              rx="8"
                              fill="rgba(20, 20, 20, 0.95)"
                              stroke="var(--strain-blue)"
                              strokeWidth="2"
                              style={{
                                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                              }}
                            />
                            <text
                              x="0"
                              y="-8"
                              textAnchor="middle"
                              fontSize="12"
                              fontWeight="bold"
                              fill="white"
                            >
                              {Math.round(hoveredDataPoint.hr)} BPM
                            </text>
                            <text
                              x="0"
                              y="6"
                              textAnchor="middle"
                              fontSize="10"
                              fill="#E0E0E0"
                            >
                              {formatTimeForDisplay(hoveredDataPoint.timestamp)}
                            </text>
                          </g>
                        </g>
                      )}

                      {/* Workout labels and markers */}
                      {workoutData.map((workout, index) => {
                        const centerX = (workout.startX + workout.endX) / 2;
                        const topY = 30;
                        
                        return (
                          <g key={`workout-label-${index}`}>
                            {/* Enhanced workout marker with better styling */}
                            <circle
                              cx={centerX}
                              cy={topY}
                              r="12"
                              fill={workout.color}
                              stroke="white"
                              strokeWidth="3"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredWorkout(index)}
                              onMouseLeave={() => setHoveredWorkout(null)}
                              style={{
                                filter: hoveredWorkout === index 
                                  ? 'drop-shadow(0 0 12px rgba(255,255,255,0.8))' 
                                  : 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))'
                              }}
                            />
                            
                            {/* Enhanced workout icon with better background */}
                            <g 
                              transform={`translate(${centerX}, ${topY})`}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredWorkout(index)}
                              onMouseLeave={() => setHoveredWorkout(null)}
                            >
                              {/* Icon background circle for better contrast */}
                              <circle
                                cx="0"
                                cy="0"
                                r="10"
                                fill="rgba(0,0,0,0.2)"
                                stroke="none"
                              />
                              <foreignObject x="-8" y="-8" width="16" height="16">
                                <div className="flex items-center justify-center w-full h-full">
                                  <div style={{ 
                                    color: 'white', 
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                                  }}>
                                    {React.cloneElement(workout.icon, { 
                                      size: 14, 
                                      strokeWidth: 2.5,
                                      color: 'white'
                                    })}
                                  </div>
                                </div>
                              </foreignObject>
                            </g>
                            
                            {/* Enhanced workout label with better styling */}
                            <g 
                              transform={`translate(${centerX}, ${topY - 35})`}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredWorkout(index)}
                              onMouseLeave={() => setHoveredWorkout(null)}
                            >
                              <rect
                                x="-35"
                                y="-10"
                                width="70"
                                height="18"
                                rx="9"
                                fill={workout.color}
                                opacity={hoveredWorkout === index ? "1" : "0.9"}
                                style={{
                                  transition: 'all 0.2s ease',
                                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                }}
                              />
                              <text
                                x="0"
                                y="2"
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight="700"
                                fill="white"
                                className="select-none"
                                style={{
                                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                }}
                              >
                                {workout["Activity name"]}
                              </text>
                            </g>

                            {/* Enhanced vertical connector line */}
                            <line
                              x1={centerX}
                              y1={topY + 12}
                              x2={centerX}
                              y2={60}
                              stroke={workout.color}
                              strokeWidth="3"
                              strokeDasharray="4,4"
                              opacity="0.7"
                              style={{
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                              }}
                            />

                            {/* Enhanced workout details tooltip */}
                            {hoveredWorkout === index && (
                              <g transform={`translate(${centerX}, ${topY - 90})`}>
                                <rect
                                  x="-65"
                                  y="-35"
                                  width="130"
                                  height="60"
                                  rx="12"
                                  fill="rgba(20, 20, 20, 0.95)"
                                  stroke={workout.color}
                                  strokeWidth="2"
                                  style={{
                                    filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.4))'
                                  }}
                                />
                                <text x="0" y="-22" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">
                                  {workout["Activity name"]}
                                </text>
                                <text x="0" y="-10" textAnchor="middle" fontSize="9" fill="#E0E0E0">
                                  {workout["Duration (min)"]}min • Strain {workout["Activity Strain"]}
                                </text>
                                <text x="0" y="2" textAnchor="middle" fontSize="9" fill="#E0E0E0">
                                  Avg HR: {workout["Average HR (bpm)"]} • Max: {workout["Max HR (bpm)"]}
                                </text>
                                <text x="0" y="14" textAnchor="middle" fontSize="8" fill="#B0B0B0">
                                  {workout["Energy burned (cal)"]} cal burned
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* Sleep labels and markers - Enhanced styling */}
                      {sleepData.map((sleep, index) => {
                        const centerX = (sleep.startX + sleep.endX) / 2;
                        const topY = 30; // Consistent positioning
                        
                        return (
                          <g key={`sleep-label-${index}`}>
                            {/* Enhanced sleep marker */}
                            <circle
                              cx={centerX}
                              cy={topY}
                              r="11"
                              fill={sleep.color}
                              stroke="white"
                              strokeWidth="3"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredSleep(index)}
                              onMouseLeave={() => setHoveredSleep(null)}
                              style={{
                                filter: hoveredSleep === index 
                                  ? 'drop-shadow(0 0 12px rgba(123, 161, 187, 0.8))' 
                                  : 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))'
                              }}
                            />
                            
                            {/* Enhanced sleep icon */}
                            <g 
                              transform={`translate(${centerX}, ${topY})`}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredSleep(index)}
                              onMouseLeave={() => setHoveredSleep(null)}
                            >
                              {/* Icon background for better contrast */}
                              <circle
                                cx="0"
                                cy="0"
                                r="9"
                                fill="rgba(0,0,0,0.2)"
                                stroke="none"
                              />
                              <foreignObject x="-7" y="-7" width="14" height="14">
                                <div className="flex items-center justify-center w-full h-full">
                                  <Moon 
                                    size={14} 
                                    color="white" 
                                    strokeWidth={2.5}
                                    style={{
                                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                                    }}
                                  />
                                </div>
                              </foreignObject>
                            </g>

                            {/* Enhanced vertical connector line */}
                            <line
                              x1={centerX}
                              y1={topY + 11}
                              x2={centerX}
                              y2={60}
                              stroke={sleep.color}
                              strokeWidth="3"
                              strokeDasharray="4,4"
                              opacity="0.6"
                              style={{
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                              }}
                            />

                            {/* Enhanced sleep tooltip */}
                            {hoveredSleep === index && (
                              <g transform={`translate(${centerX}, ${topY - 80})`}>
                                <rect
                                  x="-55"
                                  y="-35"
                                  width="110"
                                  height="60"
                                  rx="10"
                                  fill="rgba(20, 20, 20, 0.95)"
                                  stroke={sleep.color}
                                  strokeWidth="2"
                                  style={{
                                    filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.4))'
                                  }}
                                />
                                <text x="0" y="-22" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">
                                  {sleep.type}
                                </text>
                                {sleep.performance && (
                                  <text x="0" y="-10" textAnchor="middle" fontSize="9" fill="#E0E0E0">
                                    Performance: {sleep.performance}%
                                  </text>
                                )}
                                {sleep.duration && (
                                  <text x="0" y="2" textAnchor="middle" fontSize="9" fill="#E0E0E0">
                                    Duration: {Math.round(sleep.duration / 60)}h {sleep.duration % 60}m
                                  </text>
                                )}
                                {sleep.efficiency && (
                                  <text x="0" y="14" textAnchor="middle" fontSize="8" fill="#B0B0B0">
                                    Efficiency: {sleep.efficiency}%
                                  </text>
                                )}
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Selector Card - MATCH Recovery spacing */}
          <div className="whoops-card" style={{ // MATCH: Same card styling as Recovery
            background: 'var(--card-bg)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {/* Compact Header with Date Info - MATCH Recovery header structure */}
            <div className="flex justify-between items-center mb-2"> {/* REDUCED: mb-4 → mb-2 to match Recovery */}
              <button 
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onClick={goToPreviousDay}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center space-x-4"> {/* REDUCED: space-x-6 → space-x-4 */}
                
                {/* Selected Date and Activities - Compact layout */}
                <div className="flex items-center space-x-3"> {/* REDUCED: space-x-4 → space-x-3 */}
                  <div className="text-center">
                    <div className="text-base font-bold text-[var(--text-primary)]"> {/* REDUCED: text-lg → text-base */}
                      {formatDate(selectedDate, 'EEE MMM d')}
                    </div>
                    {dateRangeOffset > 0 && (
                      <div className="text-xs text-[var(--text-muted)]">
                        {dateRangeOffset === 1 ? '1 week ago' : `${dateRangeOffset} weeks ago`}
                      </div>
                    )}
                  </div>
                  
                  {/* Activity Summary - Compact */}
                  <div className="flex items-center gap-2"> {/* REDUCED: gap-3 → gap-2 */}
                    {workoutData.length > 0 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ // REDUCED: gap-1.5 → gap-1, px-2 → px-1.5, py-1 → py-0.5
                        background: 'rgba(0, 147, 231, 0.1)',
                        border: '1px solid rgba(0, 147, 231, 0.2)'
                      }}>
                        <Dumbbell size={10} className="text-[#0093E7]" /> {/* REDUCED: size={12} → size={10} */}
                        <span className="text-[#0093E7] font-medium text-xs">
                          {workoutData.length}
                        </span>
                      </div>
                    )}
                    
                    {sleepData.length > 0 && sleepData[0].performance && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ // REDUCED: gap-1.5 → gap-1, px-2 → px-1.5, py-1 → py-0.5
                        background: 'rgba(123,161,187,0.1)',
                        border: '1px solid rgba(123,161,187,0.2)'
                      }}>
                        <Moon size={10} className="text-[#7BA1BB]" /> {/* REDUCED: size={12} → size={10} */}
                        <span className="text-[#7BA1BB] font-medium text-xs">
                          {sleepData[0].performance}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onClick={goToNextDay}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            
            {/* Ultra Compact Chart Container - MATCH Recovery timeline height */}
            <div className="relative">
              <div className="h-10 rounded-lg border relative overflow-hidden mb-2" style={{ // REDUCED: h-12 → h-10, mb-3 → mb-2
                background: 'var(--card-bg)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>
                
                {/* Minimal Chart SVG - ADJUSTED viewBox for new height */}
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox="0 0 100 32" // REDUCED: 40 → 32
                  preserveAspectRatio="none"
                  className="absolute inset-0"
                >
                  <defs>
                    <linearGradient id="compactChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--strain-blue)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--strain-blue)" stopOpacity="0.1" />
                    </linearGradient>
                    
                    <linearGradient id="compactSelectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="white" stopOpacity="0.15" />
                    </linearGradient>
                    
                    <clipPath id="compactSelectedClip">
                      <rect
                        x={rangeStart * 100}
                        y="0"
                        width={(rangeEnd - rangeStart) * 100}
                        height="32" // REDUCED: 40 → 32
                      />
                    </clipPath>
                  </defs>

                  {/* Background Area */}
                  <path
                    d={`${createWeeklyBmpPath(weeklyBmpData, weeklyData)} L 100 32 L 0 32 Z`} // UPDATED: 40 → 32
                    fill="url(#compactChartGradient)"
                    opacity="0.3"
                  />

                  {/* Background Line */}
                  <path
                    d={createWeeklyBmpPath(weeklyBmpData, weeklyData)}
                    fill="none"
                    stroke="var(--strain-blue)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity="0.5"
                  />

                  {/* Selected Range Area */}
                  <path
                    d={`${createWeeklyBmpPath(weeklyBmpData, weeklyData)} L ${rangeEnd * 100} 32 L ${rangeStart * 100} 32 Z`} // UPDATED: 40 → 32
                    fill="url(#compactSelectedGradient)"
                    clipPath="url(#compactSelectedClip)"
                  />

                  {/* Selected Range Line */}
                  <path
                    d={createWeeklyBmpPath(weeklyBmpData, weeklyData)}
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    clipPath="url(#compactSelectedClip)"
                  />
                </svg>

                {/* Ultra Minimal Range Selector - ADJUSTED for new height */}
                <div
                  ref={rangeRef}
                  className="absolute inset-0 z-20 px-6" // REDUCED: px-8 → px-6
                >
                  <div
                    className="absolute top-0.5 bottom-0.5 cursor-grab active:cursor-grabbing rounded transition-all duration-200 group"
                    style={{ 
                      left: `${rangeStart * 100}%`, 
                      width: `${(rangeEnd - rangeStart) * 100}%`,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      border: '1.5px solid white',
                      boxShadow: '0 2px 8px rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseDown={(e) => handleRangeMouseDown(e, 'range')}
                  >
                    {/* Enhanced center handle indicator - SMALLER */}
                    <div 
                      className="absolute top-1/2 left-1/2 w-5 h-8 rounded-md transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110" // REDUCED: w-6 h-12 → w-5 h-8, rounded-lg → rounded-md, shadow-xl → shadow-lg
                      style={{ 
                        background: 'linear-gradient(135deg, white 0%, #f0f0f0 100%)',
                        boxShadow: '0 3px 8px rgba(255, 255, 255, 0.4), inset 0 1px 4px rgba(0, 0, 0, 0.1)' // REDUCED shadows
                      }}
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-gray-600 rounded opacity-90"></div> {/* REDUCED: h-6 → h-4 */}
                        <div className="w-0.5 h-4 bg-gray-600 rounded opacity-70"></div> {/* REDUCED: h-6 → h-4 */}
                        <div className="w-0.5 h-4 bg-gray-600 rounded opacity-90"></div> {/* REDUCED: h-6 → h-4 */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Click Areas - ADJUSTED for new padding and improved click handling */}
                <div className="absolute inset-0 flex z-10 px-6"> {/* REDUCED: px-8 → px-6 */}
                  {Object.values(weeklyData).map((day, index) => (
                    <div 
                      key={index}
                      className="flex-1 cursor-pointer hover:bg-white/5 transition-all duration-200"
                      onClick={() => {
                        setSelectedDate(day.date);
                        // Immediately update range position for visual feedback
                        const weekDays = Object.values(weeklyData);
                        const oneDaySize = 1 / weekDays.length;
                        const newRangeStart = index / weekDays.length;
                        setRangeStart(newRangeStart);
                        setRangeEnd(newRangeStart + oneDaySize);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Compact Date Grid - REDUCED padding and improved click handling */}
              <div className="grid grid-cols-7 gap-1">
                {Object.values(weeklyData).map((day, index) => {
                  const isSelected = formatDate(selectedDate, 'yyyy-MM-dd') === formatDate(day.date, 'yyyy-MM-dd');
                  const hasWorkouts = day.workouts;
                  const hasSleep = day.hasSleep;
                  
                  return (
                    <div 
                      key={index}
                      className={`text-center p-1.5 rounded cursor-pointer transition-all duration-200 ${  // REDUCED: p-2 → p-1.5
                        isSelected 
                          ? 'bg-white/20 border border-white/40' 
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                      onClick={() => {
                        setSelectedDate(day.date);
                        // Immediately update range position for visual feedback
                        const weekDays = Object.values(weeklyData);
                        const oneDaySize = 1 / weekDays.length;
                        const newRangeStart = index / weekDays.length;
                        setRangeStart(newRangeStart);
                        setRangeEnd(newRangeStart + oneDaySize);
                      }}
                      style={{
                        background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        borderColor: isSelected ? 'rgba(255, 255, 255, 0.3)' : 'transparent'
                      }}
                    >
                      <div className={`text-xs font-medium ${
                        isSelected ? 'text-white' : 'text-[var(--text-secondary)]'
                      }`}>
                        {day.dayName}
                      </div>
                      <div className={`text-sm font-bold mt-0.5 ${ // REDUCED: text-base → text-sm
                        isSelected ? 'text-white' : 'text-[var(--text-primary)]'
                      }`}>
                        {day.dayNum}
                      </div>
                      
                      {/* Mini Activity Indicators - SMALLER */}
                      <div className="flex justify-center items-center gap-1 mt-0.5"> {/* REDUCED: mt-1 → mt-0.5 */}
                        {hasWorkouts && (
                          <div className={`w-1 h-1 rounded-full transition-all duration-200 ${ // REDUCED: w-1.5 h-1.5 → w-1 h-1
                            isSelected ? 'bg-[#0093E7] scale-110' : 'bg-[#0093E7]/60'
                          }`} />
                        )}
                        {hasSleep && (
                          <div className={`w-1 h-1 rounded-full transition-all duration-200 ${ // REDUCED: w-1.5 h-1.5 → w-1 h-1
                            isSelected ? 'bg-[#7BA1BB] scale-110' : 'bg-[#7BA1BB]/60'
                          }`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;