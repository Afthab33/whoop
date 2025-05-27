import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Calendar, TrendingUp, Dumbbell, Activity, Moon } from 'lucide-react';
import whoopData from '../../../data/day_wise_whoop_data.json';
import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';

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

  // Get workout icon based on activity name
  const getWorkoutIcon = (activityName) => {
    const activity = activityName?.toLowerCase() || '';
    if (activity.includes('weight') || activity.includes('strength')) {
      return <Dumbbell size={12} />;
    }
    return <Activity size={12} />;
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
    const oneDaySize = 1 / 7;

    if (dragType === 'range' || dragType === 'start' || dragType === 'end') {
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

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="section-header text-[var(--text-primary)]">Heart Rate Analysis</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-md">
            Track your heart rate patterns throughout the day with detailed insights and workout data
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <TimePeriodSelector 
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />
        </div>
      </div>

      {/* Main Chart Card with Workout Integration */}
      <div className="whoops-card" style={{
        background: 'var(--card-bg)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-80 text-[var(--text-muted)]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--strain-blue)] mx-auto"></div>
              <div className="space-y-2">
                <div className="body-text text-[var(--text-primary)]">Loading heart rate data...</div>
                <div className="baseline-value">Processing daily patterns and workouts</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Chart Title with Workout Summary */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="metric-title text-[var(--text-primary)] mb-1">Daily Heart Rate</h3>
                <p className="baseline-value">
                  24-hour analysis for {formatDate(selectedDate, 'EEE MMM d')}
                  {workoutData.length > 0 && (
                    <span className="ml-2 text-[#0093E7]">
                      • {workoutData.length} workout{workoutData.length > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-0.5 bg-[var(--strain-blue)]"></div>
                  <span className="baseline-value">Heart Rate (BPM)</span>
                </div>
                {workoutData.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Dumbbell size={12} className="text-[#0093E7]" />
                    <span className="baseline-value">Workouts</span>
                  </div>
                )}
              </div>
            </div>

            <svg width="100%" height="350" viewBox="0 0 1320 350" className="overflow-visible">
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

              {/* Workout labels and markers */}
              {workoutData.map((workout, index) => {
                const centerX = (workout.startX + workout.endX) / 2;
                const avgHR = workout["Average HR (bpm)"] || 100;
                const markerY = 300 - (avgHR / 200) * 240;
                
                return (
                  <g key={`workout-label-${index}`}>
                    {/* Workout marker dot */}
                    <circle
                      cx={centerX}
                      cy={markerY}
                      r="6"
                      fill={workout.color}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredWorkout(index)}
                      onMouseLeave={() => setHoveredWorkout(null)}
                      style={{
                        filter: hoveredWorkout === index ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none'
                      }}
                    />
                    
                    {/* Workout label */}
                    <g 
                      transform={`translate(${centerX}, ${markerY - 20})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredWorkout(index)}
                      onMouseLeave={() => setHoveredWorkout(null)}
                    >
                      <rect
                        x="-35"
                        y="-12"
                        width="70"
                        height="20"
                        rx="10"
                        fill={workout.color}
                        opacity={hoveredWorkout === index ? "0.9" : "0.8"}
                        style={{
                          transition: 'opacity 0.2s ease'
                        }}
                      />
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill="white"
                        className="select-none"
                      >
                        {workout["Activity name"]}
                      </text>
                    </g>

                    {/* Workout details tooltip on hover */}
                    {hoveredWorkout === index && (
                      <g transform={`translate(${centerX}, ${markerY - 60})`}>
                        <rect
                          x="-60"
                          y="-30"
                          width="120"
                          height="50"
                          rx="8"
                          fill="var(--card-bg)"
                          stroke={workout.color}
                          strokeWidth="1"
                          style={{
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                          }}
                        />
                        <text x="0" y="-18" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">
                          {workout["Activity name"]}
                        </text>
                        <text x="0" y="-8" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">
                          {workout["Duration (min)"]}min • Strain {workout["Activity Strain"]}
                        </text>
                        <text x="0" y="2" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">
                          Avg HR: {workout["Average HR (bpm)"]} • Max: {workout["Max HR (bpm)"]}
                        </text>
                        <text x="0" y="12" textAnchor="middle" fontSize="8" fill="var(--text-muted)">
                          {workout["Energy burned (cal)"]} cal burned
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Sleep labels and markers */}
              {sleepData.map((sleep, index) => {
                const centerX = (sleep.startX + sleep.endX) / 2;
                const sleepY = 300 - (55 / 200) * 240; // Position at ~55 BPM level
                
                return (
                  <g key={`sleep-label-${index}`}>
                    {/* Sleep marker dot */}
                    <circle
                      cx={centerX}
                      cy={sleepY}
                      r="5"
                      fill={sleep.color}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredSleep(index)}
                      onMouseLeave={() => setHoveredSleep(null)}
                      style={{
                        filter: hoveredSleep === index ? 'drop-shadow(0 0 8px rgba(123, 161, 187, 0.5))' : 'none'
                      }}
                    />
                    
                    {/* Sleep icon */}
                    <g 
                      transform={`translate(${centerX}, ${sleepY - 18})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredSleep(index)}
                      onMouseLeave={() => setHoveredSleep(null)}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="12"
                        fill={sleep.color}
                        opacity={hoveredSleep === index ? "0.9" : "0.7"}
                        style={{ transition: 'opacity 0.2s ease' }}
                      />
                      <foreignObject x="-6" y="-6" width="12" height="12">
                        <div className="flex items-center justify-center w-full h-full">
                          <Moon size={8} color="white" />
                        </div>
                      </foreignObject>
                    </g>

                    {/* Sleep tooltip on hover */}
                    {hoveredSleep === index && (
                      <g transform={`translate(${centerX}, ${sleepY - 55})`}>
                        <rect
                          x="-50"
                          y="-30"
                          width="100"
                          height="50"
                          rx="6"
                          fill="var(--card-bg)"
                          stroke={sleep.color}
                          strokeWidth="1"
                          style={{
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                          }}
                        />
                        <text x="0" y="-20" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">
                          {sleep.type}
                        </text>
                        {sleep.performance && (
                          <text x="0" y="-10" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">
                            Performance: {sleep.performance}%
                          </text>
                        )}
                        {sleep.duration && (
                          <text x="0" y="0" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">
                            Duration: {Math.round(sleep.duration / 60)}h {sleep.duration % 60}m
                          </text>
                        )}
                        {sleep.efficiency && (
                          <text x="0" y="10" textAnchor="middle" fontSize="8" fill="var(--text-muted)">
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
        )}
      </div>

      {/* Enhanced Timeline Selector Card with Workout Indicators */}
      <div className="whoops-card-secondary" style={{
        background: 'var(--bg-subcard)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Enhanced Timeline Header */}
        <div className="flex justify-between items-center mb-6">
          <button 
            className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 shadow-xl hover:scale-105 group"
            style={{
              background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--bg-subcard) 100%)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onClick={goToPreviousDay}
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Calendar size={18} className="text-[var(--strain-blue)]" />
              <div className="metric-title text-[var(--text-primary)]">Timeline Navigator</div>
            </div>
            <div className="baseline-value">Drag selector or click days to navigate through time</div>
          </div>
          
          <button 
            className="flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 shadow-xl hover:scale-105 group"
            style={{
              background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--bg-subcard) 100%)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onClick={goToNextDay}
          >
            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        
        <div className="relative">
          {/* Enhanced mini chart background */}
          <div className="h-28 rounded-2xl border relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--ring-bg) 100%)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            boxShadow: 'inset 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            
            {/* Enhanced Timeline Navigation Controls */}
            <div className="absolute top-1/2 left-4 z-40 transform -translate-y-1/2">
              <button 
                className={`p-3 rounded-xl transition-all duration-300 shadow-lg group ${
                  dateRangeOffset >= maxOffset 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:scale-110 hover:shadow-xl'
                }`}
                style={{
                  background: 'linear-gradient(135deg, var(--bg-subcard) 0%, var(--card-bg) 100%)',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onClick={navigateTimelineLeft}
                disabled={dateRangeOffset >= maxOffset}
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            </div>
            
            <div className="absolute top-1/2 right-4 z-40 transform -translate-y-1/2">
              <button 
                className={`p-3 rounded-xl transition-all duration-300 shadow-lg group ${
                  dateRangeOffset <= 0 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:scale-110 hover:shadow-xl'
                }`}
                style={{
                  background: 'linear-gradient(135deg, var(--bg-subcard) 0%, var(--card-bg) 100%)',
                  color: 'var(--text-secondary)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onClick={navigateTimelineRight}
                disabled={dateRangeOffset <= 0}
              >
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            
            {/* Enhanced Background SVG with BMP line chart */}
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 100 50" 
              preserveAspectRatio="none"
              className="absolute inset-0 pointer-events-none"
            >
              <defs>
                <linearGradient id="selectedRangeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6A2C" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#FF8C4C" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FF6A2C" stopOpacity="0.1" />
                </linearGradient>
                
                <linearGradient id="backgroundGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--text-muted)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--text-muted)" stopOpacity="0.1" />
                </linearGradient>
                
                <clipPath id="selectedRangeClip">
                  <rect
                    x={rangeStart * 100}
                    y="0"
                    width={(rangeEnd - rangeStart) * 100}
                    height="50"
                  />
                </clipPath>
                
                <filter id="miniGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Background pattern grid */}
              <defs>
                <pattern id="miniGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#miniGrid)" />

              {/* Background area under the line */}
              <path
                d={`${createWeeklyBmpPath(weeklyBmpData, weeklyData)} L 100 50 L 0 50 Z`}
                fill="url(#backgroundGradient)"
              />

              {/* Background BMP line with enhanced styling */}
              <path
                d={createWeeklyBmpPath(weeklyBmpData, weeklyData)}
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                opacity="0.7"
                filter="url(#miniGlow)"
              />

              {/* Selected range area fill with gradient */}
              <path
                d={`${createWeeklyBmpPath(weeklyBmpData, weeklyData)} L ${rangeEnd * 100} 50 L ${rangeStart * 100} 50 Z`}
                fill="url(#selectedRangeGradient)"
                clipPath="url(#selectedRangeClip)"
                opacity="0.6"
              />

              {/* Selected range BMP line with glow */}
              <path
                d={createWeeklyBmpPath(weeklyBmpData, weeklyData)}
                fill="none"
                stroke="#FF6A2C"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                clipPath="url(#selectedRangeClip)"
                filter="url(#miniGlow)"
              />

              {/* Enhanced dimmed areas with subtle gradients */}
              <rect
                x="0"
                y="0"
                width={rangeStart * 100}
                height="50"
                fill="url(#backgroundOverlay)"
                opacity="0.7"
              />
              <rect
                x={rangeEnd * 100}
                y="0"
                width={(1 - rangeEnd) * 100}
                height="50"
                fill="url(#backgroundOverlay)"
                opacity="0.7"
              />
              
              <defs>
                <linearGradient id="backgroundOverlay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.8)" />
                </linearGradient>
              </defs>
            </svg>

            {/* Enhanced Day labels with workout indicators */}
            <div className="flex h-full absolute inset-0 pointer-events-none z-10 px-16">
              {Object.values(weeklyData).map((day, index) => {
                const isSelected = formatDate(selectedDate, 'yyyy-MM-dd') === formatDate(day.date, 'yyyy-MM-dd');
                const dayPosition = index / Math.max(1, Object.values(weeklyData).length - 1);
                const isInRange = dayPosition >= rangeStart && dayPosition <= rangeEnd;
                const dateKey = formatDate(day.date, 'yyyy-MM-dd');
                const hasData = whoopData[dateKey] && Object.keys(whoopData[dateKey]).length > 0;
                const hasWorkouts = day.workouts;
                const isHovered = hoveredDay === index;
                
                return (
                  <div 
                    key={index} 
                    className={`flex-1 flex flex-col justify-end pb-3 text-center transition-all duration-300 ${
                      isSelected 
                        ? 'text-[var(--strain-blue)] font-semibold transform scale-110' 
                        : isInRange 
                          ? 'text-[#FF6A2C] font-medium' 
                          : 'text-[var(--text-muted)] opacity-60'
                    } ${isHovered ? 'transform scale-105' : ''}`}
                  >
                    <div className="text-xs font-bold metric-title tracking-wide">{day.dayName}</div>
                    <div className="text-xs flex items-center justify-center gap-1.5 baseline-value mt-1">
                      {formatDate(day.date, 'MMM d')}
                      <div className="flex items-center gap-1">
                        {hasData && (
                          <div 
                            className={`w-2 h-2 rounded-full shadow-lg ${
                              isInRange ? 'bg-[#FF6A2C]' : 'bg-[var(--strain-blue)]'
                            }`}
                            style={{
                              boxShadow: isInRange 
                                ? '0 0 8px rgba(255, 106, 44, 0.5)' 
                                : '0 0 8px rgba(93, 141, 238, 0.5)'
                            }}
                          ></div>
                        )}
                        {hasWorkouts && (
                          <Dumbbell 
                            size={8} 
                            className={`${
                              isInRange ? 'text-[#FF6A2C]' : isSelected ? 'text-[var(--strain-blue)]' : 'text-[#0093E7]'
                            }`}
                            style={{
                              filter: isInRange || isSelected 
                                ? 'drop-shadow(0 0 4px rgba(0, 147, 231, 0.5))' 
                                : 'none'
                            }}
                          />
                        )}
                        {day.hasSleep && (
                          <Moon 
                            size={8} 
                            className={`${
                              isInRange ? 'text-[#FF6A2C]' : isSelected ? 'text-[var(--strain-blue)]' : 'text-[#7BA1BB]'
                            }`}
                            style={{
                              filter: isInRange || isSelected 
                                ? 'drop-shadow(0 0 4px rgba(123, 161, 187, 0.5))' 
                                : 'none'
                            }}
                          />
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-1">
                        <TrendingUp size={12} className="mx-auto text-[var(--strain-blue)]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Enhanced Draggable range selector */}
            <div
              ref={rangeRef}
              className="absolute inset-0 z-20 mx-16"
            >
              <div
                className="absolute top-0 bottom-0 cursor-grab active:cursor-grabbing z-30 rounded-xl transition-all duration-200"
                style={{ 
                  left: `${rangeStart * 100}%`, 
                  width: `${(rangeEnd - rangeStart) * 100}%`,
                  backgroundColor: 'rgba(255, 106, 44, 0.15)',
                  border: '2px solid #FF6A2C',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(255, 106, 44, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.1)'
                }}
                onMouseDown={(e) => handleRangeMouseDown(e, 'range')}
              >
                {/* Enhanced inner glow effect */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(255, 106, 44, 0.3) 0%, rgba(255, 106, 44, 0.1) 50%, transparent 100%)',
                  }}
                />
                
                {/* Enhanced center handle indicator */}
                <div 
                  className="absolute top-1/2 left-1/2 w-6 h-12 rounded-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-xl transition-all duration-200 group-hover:scale-110"
                  style={{ 
                    background: 'linear-gradient(135deg, #FF6A2C 0%, #FF8C4C 100%)',
                    boxShadow: '0 4px 12px rgba(255, 106, 44, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="flex space-x-0.5">
                    <div className="w-0.5 h-6 bg-white rounded opacity-90"></div>
                    <div className="w-0.5 h-6 bg-white rounded opacity-70"></div>
                    <div className="w-0.5 h-6 bg-white rounded opacity-90"></div>
                  </div>
                </div>
                
                {/* Subtle animation for active state */}
                {isDragging && (
                  <div 
                    className="absolute inset-0 rounded-xl animate-pulse"
                    style={{
                      background: 'rgba(255, 106, 44, 0.2)',
                      animation: 'pulse 1s infinite'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Enhanced Day click areas with hover effects */}
            {!isDragging && (
              <div className="absolute inset-0 flex z-15 px-16">
                {Object.values(weeklyData).map((day, index) => (
                  <div 
                    key={index}
                    className="flex-1 cursor-pointer hover:bg-[var(--strain-blue)]/15 transition-all duration-200 rounded-lg relative group"
                    onClick={() => setSelectedDate(day.date)}
                    onMouseEnter={() => setHoveredDay(index)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {/* Hover indicator */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" style={{
                      background: 'linear-gradient(135deg, rgba(93, 141, 238, 0.1) 0%, rgba(93, 141, 238, 0.05) 100%)',
                      border: '1px solid rgba(93, 141, 238, 0.2)'
                    }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Range indicators */}
          <div className="flex justify-between mt-5 text-xs px-4">
            <div className="text-center">
              <span className="baseline-value font-medium block">Week Start</span>
              <span className="text-[var(--text-secondary)] text-xs">
                {dateRangeInfo.start}
              </span>
            </div>
            <div className="text-center">
              <span className="metric-title text-[#FF6A2C] font-semibold text-base block">
                {formatDate(selectedDate, 'EEE MMM d')}
              </span>
              {workoutData.length > 0 && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Dumbbell size={10} className="text-[#0093E7]" />
                  <span className="baseline-value text-xs">
                    {workoutData.length} workout{workoutData.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {sleepData.length > 0 && sleepData[0].performance && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Moon size={10} className="text-[#7BA1BB]" />
                  <span className="baseline-value text-xs">
                    {sleepData[0].performance}% sleep
                  </span>
                </div>
              )}
              {dateRangeOffset > 0 && (
                <div className="baseline-value mt-1 text-xs">
                  {dateRangeOffset === 1 ? '1 week ago' : `${dateRangeOffset} weeks ago`}
                </div>
              )}
            </div>
            <div className="text-center">
              <span className="baseline-value font-medium block">Week End</span>
              <span className="text-[var(--text-secondary)] text-xs">
                {dateRangeInfo.end}
              </span>
            </div>
          </div>
          
          {/* Enhanced Timeline indicator dots */}
          {maxOffset > 0 && (
            <div className="mt-6 flex justify-center gap-3">
              {Array.from({ length: maxOffset + 1 }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setDateRangeOffset(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    dateRangeOffset === i 
                      ? 'bg-[#FF6A2C] shadow-lg shadow-[#FF6A2C]/40 scale-125 ring-2 ring-[#FF6A2C]/30' 
                      : 'bg-[var(--text-muted)] hover:bg-[var(--text-secondary)] hover:scale-110'
                  }`}
                  style={{
                    boxShadow: dateRangeOffset === i 
                      ? '0 0 12px rgba(255, 106, 44, 0.6)' 
                      : 'none'
                  }}
                ></button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;