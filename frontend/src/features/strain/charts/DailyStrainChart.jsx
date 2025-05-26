import React, { useState, useMemo, useEffect } from 'react';
import whoopData from '../../../data/day_wise_whoop_data.json';
import workoutsCSVData from '../../../data/raw/workouts.csv';
import { format, parseISO } from 'date-fns';

const DailyStrainChart = ({ 
  activeWorkout, 
  hoveredTime,
  onWorkoutHover,
  viewMode = 'time', // 'time' or 'duration'
  chartMode = 'raw', // 'raw' or 'percentage'
  timePeriod = '1d', // '6m', '3m', '1m', '2w', '1w', '1d'
  selectedDate = new Date() // Default to today's date
}) => {
  // Parse workouts CSV data - do this once
  const workoutsCSV = useMemo(() => {
    // If your CSV is already parsed as an object, you can use it directly
    // Otherwise you'll need to parse it here
    return workoutsCSVData; 
  }, []);
  
  // Chart dimensions and scaling
  const chartWidth = 1200;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  
  // Format the selected date to match the JSON data format (YYYY-MM-DD)
  const formattedDate = useMemo(() => {
    if (selectedDate instanceof Date) {
      return selectedDate.toISOString().split('T')[0];
    }
    return selectedDate;
  }, [selectedDate]);
  
  // Extract and prepare the heart rate data for the selected date
  const heartRateData = useMemo(() => {
    // Get data for the selected date
    const dayData = whoopData[formattedDate];
    
    if (!dayData) return [];
    
    // Create data points from BPM readings
    const dataPoints = [];
    
    // Get workout intervals to mark activity periods
    // First check the dayData.workouts (from JSON), if empty use the CSV data
    let workouts = dayData.workouts || [];
    
    // If no workouts in the JSON for this day, check the CSV data
    if (workouts.length === 0 && workoutsCSV) {
      // Filter workouts from CSV that match the selected date
      workouts = workoutsCSV.filter(workout => {
        const workoutDate = new Date(workout['Workout start time']).toISOString().split('T')[0];
        return workoutDate === formattedDate;
      });
    }
    
    const workoutIntervals = workouts.map(workout => ({
      start: new Date(workout['Workout start time']),
      end: new Date(workout['Workout end time']),
      activity: workout['Activity name'],
      maxHR: workout['Max HR (bpm)'],
      avgHR: workout['Average HR (bpm)']
    }));
    
    // Generate synthetic data points if bpm_data is empty or missing
    if (!dayData.bpm_data || dayData.bpm_data.length === 0) {
      // Generate a full day of data points (24 hours x 60 minutes)
      const totalPoints = 24 * 60;
      
      // Base time from physiological summary or the date itself
      const baseTime = dayData.physiological_summary && 
                       dayData.physiological_summary["Cycle start time"] ? 
                       new Date(dayData.physiological_summary["Cycle start time"]) : 
                       new Date(`${formattedDate} 00:00:00`);
      
      // Get sleep data
      const sleepOnset = dayData.sleep_summary && dayData.sleep_summary["Sleep onset"] ? 
                        new Date(dayData.sleep_summary["Sleep onset"]) : null;
      const wakeOnset = dayData.sleep_summary && dayData.sleep_summary["Wake onset"] ? 
                       new Date(dayData.sleep_summary["Wake onset"]) : null;
      
      // Generate a point for each minute of the day
      for (let i = 0; i < totalPoints; i++) {
        const hour = Math.floor(i / 60) % 24;
        const minute = i % 60;
        
        const pointTime = new Date(baseTime);
        pointTime.setHours(hour, minute, 0);
        
        // Determine if this time is within any workout
        const currentTime = pointTime.toISOString();
        const isInWorkout = workoutIntervals.some(workout => 
          currentTime >= workout.start.toISOString() && 
          currentTime <= workout.end.toISOString()
        );
        
        // Determine if this time is within sleep period
        const isSleeping = sleepOnset && wakeOnset && 
                          pointTime >= sleepOnset && 
                          pointTime <= wakeOnset;
        
        // Determine sleep stage (simplified)
        let sleepStage = "none";
        if (isSleeping) {
          // Simple sleep cycle approximation
          const sleepMinutes = Math.floor((pointTime - sleepOnset) / (1000 * 60));
          const cycleMinute = sleepMinutes % 90; // Approximate 90 min sleep cycle
          
          if (cycleMinute < 30) sleepStage = "light";
          else if (cycleMinute < 60) sleepStage = "deep";
          else sleepStage = "rem";
        }
        
        // Generate realistic BPM data
        let bpm = 70; // Default resting awake rate
        
        if (isSleeping) {
          if (sleepStage === "light") bpm = 65 + Math.random() * 10;
          else if (sleepStage === "deep") bpm = 55 + Math.random() * 5;
          else if (sleepStage === "rem") bpm = 70 + Math.random() * 8;
        } else {
          // Normal daily variation
          bpm = 70 + Math.sin(i / 120) * 10 + Math.random() * 10;
        }
        
        // Higher BPM for workout periods
        if (isInWorkout) {
          const relevantWorkout = workoutIntervals.find(workout => 
            currentTime >= workout.start.toISOString() && 
            currentTime <= workout.end.toISOString()
          );
          
          if (relevantWorkout) {
            const avgHR = relevantWorkout.avgHR || 120;
            const maxHR = relevantWorkout.maxHR || 150;
            
            // Time position within workout (0-1)
            const workoutStart = new Date(relevantWorkout.start).getTime();
            const workoutEnd = new Date(relevantWorkout.end).getTime();
            const position = (pointTime.getTime() - workoutStart) / (workoutEnd - workoutStart);
            
            // Create realistic workout heart rate curve
            // Warm-up > workout level > cool down
            if (position < 0.1) {
              // Warm up
              bpm = 75 + position * 10 * (avgHR - 75);
            } else if (position > 0.9) {
              // Cool down
              bpm = avgHR - (position - 0.9) * 10 * (avgHR - 75);
            } else {
              // Main workout - varies around average with occasional spikes toward max
              bpm = avgHR + (Math.random() > 0.8 ? (maxHR - avgHR) * Math.random() : 0) + 
                   (Math.sin(position * 20) * 10) + (Math.random() - 0.5) * 15;
            }
          }
        }
        
        // Add a data point
        dataPoints.push({
          time: pointTime.toISOString(),
          bpm: Math.round(bpm),
          activity: isInWorkout ? 
            workoutIntervals.find(w => 
              currentTime >= w.start.toISOString() && 
              currentTime <= w.end.toISOString()
            )?.activity || 'workout' : 
            isSleeping ? "sleep" : "idle",
          isWorkout: isInWorkout,
          sleep_stage: isSleeping ? sleepStage : "none",
          workoutId: isInWorkout ? 
            workoutIntervals.find(w => 
              currentTime >= w.start.toISOString() && 
              currentTime <= w.end.toISOString()
            )?.activity || 'workout' : 
            null
        });
      }
    } else {
      // Use the actual BPM data from day_wise_whoop_data.json
      dayData.bpm_data.forEach((bpmEntry, index) => {
        // Skip entries without necessary data
        if (!bpmEntry.datetime && !bpmEntry.bpm) {
          // This is just a placeholder with sleep stage, we'll generate synthetic data
          // for demonstration purposes if no actual BPM data exists
          
          // Generate a datetime based on the cycle start time or the date itself
          const baseTime = dayData.physiological_summary && 
                           dayData.physiological_summary["Cycle start time"] ? 
                           new Date(dayData.physiological_summary["Cycle start time"]) : 
                           new Date(`${formattedDate} 00:00:00`);
          
          const hour = Math.floor(index / 60) % 24;
          const minute = index % 60;
          baseTime.setHours(hour, minute, 0);
          
          // Generate synthetic BPM data based on sleep stage
          let bpm = 60; // Default resting rate
          if (bpmEntry.sleep_stage === "light") bpm = 65 + Math.random() * 10;
          else if (bpmEntry.sleep_stage === "deep") bpm = 55 + Math.random() * 5;
          else if (bpmEntry.sleep_stage === "rem") bpm = 70 + Math.random() * 8;
          else bpm = 70 + Math.random() * 25; // awake/none
          
          // For workout periods, use higher heart rates
          const currentTime = baseTime.toISOString();
          const isInWorkout = workoutIntervals.some(workout => 
            currentTime >= workout.start.toISOString() && 
            currentTime <= workout.end.toISOString()
          );
          
          if (isInWorkout) {
            const relevantWorkout = workoutIntervals.find(workout => 
              currentTime >= workout.start.toISOString() && 
              currentTime <= workout.end.toISOString()
            );
            
            // Generate workout-level BPM (higher variance around avg/max HR)
            if (relevantWorkout) {
              const avgHR = relevantWorkout.avgHR || 120;
              const maxHR = relevantWorkout.maxHR || 150;
              // Random value that trends toward the average but occasionally spikes
              bpm = avgHR + (Math.random() > 0.8 ? (maxHR - avgHR) * Math.random() : 0) + 
                    (Math.random() - 0.5) * 15;
            }
          }
          
          dataPoints.push({
            time: baseTime.toISOString(),
            bpm: Math.round(bpm),
            activity: isInWorkout ? 
              workoutIntervals.find(w => 
                currentTime >= w.start.toISOString() && 
                currentTime <= w.end.toISOString()
              )?.activity || 'workout' : 
              bpmEntry.sleep_stage === "none" ? "idle" : "sleep",
            isWorkout: isInWorkout,
            workoutId: isInWorkout ? 
              workoutIntervals.find(w => 
                currentTime >= w.start.toISOString() && 
                currentTime <= w.end.toISOString()
              )?.activity || 'workout' : 
              null
          });
        } else {
          // Regular case - use the actual data
          let time = bpmEntry.datetime;
          
          // Check if this is a workout activity based on time range
          const currentTime = new Date(time);
          const isInWorkout = workoutIntervals.some(workout => 
            currentTime >= workout.start && 
            currentTime <= workout.end
          );
          
          let activity = bpmEntry.activity || 'idle';
          if (isInWorkout) {
            const workout = workoutIntervals.find(w => 
              currentTime >= w.start && 
              currentTime <= w.end
            );
            if (workout) {
              activity = workout.activity;
            }
          }
          
          dataPoints.push({
            time,
            bpm: bpmEntry.bpm,
            activity,
            isWorkout,
            workoutId: isInWorkout ? activity : null
          });
        }
      });
    }
    
    return dataPoints;
  }, [formattedDate, workoutsCSV]);
  
  // Create workout segments
  const workoutSegments = useMemo(() => {
    if (!heartRateData.length) return [];
    
    const segments = [];
    let currentWorkout = null;
    
    heartRateData.forEach((point, index) => {
      // Check if this is a workout point
      if (point.isWorkout) {
        // If no active workout or different activity, start a new segment
        if (!currentWorkout || currentWorkout.activity !== point.activity) {
          // Close previous segment if exists
          if (currentWorkout) {
            currentWorkout.end = index - 1;
            segments.push(currentWorkout);
          }
          
          // Start new segment
          currentWorkout = {
            activity: point.activity,
            start: index,
            points: [point]
          };
        } else {
          // Add to current workout segment
          currentWorkout.points.push(point);
        }
      } else if (currentWorkout) {
        // End of workout
        currentWorkout.end = index - 1;
        segments.push(currentWorkout);
        currentWorkout = null;
      }
    });
    
    // Add final segment if exists
    if (currentWorkout) {
      currentWorkout.end = heartRateData.length - 1;
      segments.push(currentWorkout);
    }
    
    return segments;
  }, [heartRateData]);
  
  // Find the available dates with BPM data for the date selector
  const availableDates = useMemo(() => {
    return Object.keys(whoopData)
      .filter(date => {
        const data = whoopData[date];
        // Check if there's BPM data available
        return data.bpm_data && data.bpm_data.some(entry => entry.bpm);
      })
      .sort((a, b) => new Date(b) - new Date(a)); // Sort newest first
  }, []);

  // Process BPM data for visualization
  const processedData = useMemo(() => {
    if (!heartRateData || !heartRateData.length) return null;

    // Find min/max values for scaling
    const bpmValues = heartRateData.map(d => d.bpm || 0).filter(bpm => bpm > 0);
    
    if (bpmValues.length === 0) return null;
    
    const maxBPM = Math.max(...bpmValues, 180); // Minimum scale to 180 BPM
    const minBPM = Math.min(...bpmValues, 40);  // Minimum scale to 40 BPM

    // Create chart points
    const points = heartRateData.map((point, index) => {
      const x = (index / (heartRateData.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
      // Only map points that have BPM data
      const y = point.bpm ? 
        chartHeight - padding.bottom - ((point.bpm - minBPM) / (maxBPM - minBPM)) * (chartHeight - padding.top - padding.bottom) : 
        null;
      
      return {
        x,
        y,
        bpm: point.bpm,
        time: point.time,
        activity: point.activity,
        isWorkout: point.isWorkout,
        workoutId: point.workoutId
      };
    });

    // Create SVG path for heart rate line (only for valid BPM points)
    const validPoints = points.filter(p => p.y !== null);
    
    // If no valid points, return null
    if (!validPoints.length) return null;
    
    const pathData = validPoints.map((point, index) => {
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    }).join(' ');

    // Create area path (filled area under curve)
    const areaPath = `${pathData} L ${validPoints[validPoints.length - 1].x} ${chartHeight - padding.bottom} L ${validPoints[0].x} ${chartHeight - padding.bottom} Z`;

    // Generate time labels (hourly)
    const timeLabels = [];
    for (let i = 0; i < 24; i += 4) {
      timeLabels.push(format(new Date().setHours(i, 0, 0, 0), 'h:00a').toLowerCase());
    }

    // Generate BPM labels
    const bpmStep = 20;
    const bpmLabels = [];
    const minLabel = Math.floor(minBPM / bpmStep) * bpmStep;
    const maxLabel = Math.ceil(maxBPM / bpmStep) * bpmStep;
    
    for (let bpm = minLabel; bpm <= maxLabel; bpm += bpmStep) {
      bpmLabels.push(bpm);
    }

    return {
      points: validPoints,
      pathData,
      areaPath,
      maxBPM,
      minBPM,
      yLabels: bpmLabels,
      timeLabels
    };
  }, [heartRateData, chartWidth, chartHeight]);

  // Time period options
  const timePeriodOptions = [
    { value: '6m', label: '6m' },
    { value: '3m', label: '3m' },
    { value: '1m', label: '1m' },
    { value: '2w', label: '2w' },
    { value: '1w', label: '1w' },
    { value: '1d', label: '1d' }
  ];

  if (!processedData) {
    return (
      <div className="whoops-card h-96 flex items-center justify-center">
        <p className="text-[var(--text-muted)]">No heart rate data available for {formattedDate}</p>
      </div>
    );
  }

  // Get max heart rate for display
  const maxHeartRate = Math.max(...heartRateData.map(d => d.bpm || 0));

  return (
    <div className="whoops-card relative">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          {/* Max Heart Rate Display */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">{maxHeartRate}</span>
            <span className="text-sm text-[var(--text-secondary)]">Max BPM</span>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--text-secondary)]">Duration</span>
            <div className="relative w-14 h-7 bg-gray-600 rounded-full cursor-pointer">
              <div 
                className={`absolute top-0.5 w-6 h-6 bg-gray-800 rounded-full transition-transform duration-200 ${
                  viewMode === 'time' ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-white font-medium">Time</span>
          </div>

          {/* Chart Mode Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--text-secondary)]">Raw HR</span>
            <div className="relative w-14 h-7 bg-gray-600 rounded-full cursor-pointer">
              <div 
                className={`absolute top-0.5 w-6 h-6 bg-gray-800 rounded-full transition-transform duration-200 ${
                  chartMode === 'percentage' ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">% of Max</span>
          </div>
        </div>

        {/* Date & Time Period Selector */}
        <div className="flex items-center gap-4">
          {/* Date selector */}
          <select 
            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm"
            value={formattedDate}
            onChange={(e) => {
              // Handle date change - would need to be implemented via props
              console.log("Selected date:", e.target.value);
            }}
          >
            {availableDates.map(date => (
              <option key={date} value={date}>
                {format(parseISO(date), 'MMM d, yyyy')}
              </option>
            ))}
          </select>
          
          {/* Time Period Selector */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            {timePeriodOptions.map((option) => (
              <button
                key={option.value}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timePeriod === option.value
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-80 bg-gray-800/30 rounded-lg overflow-hidden">
        {/* Y-axis grid lines and labels */}
        <div className="absolute inset-0 pointer-events-none">
          {processedData.yLabels.map((value, i) => {
            const y = chartHeight - padding.bottom - ((value - processedData.minBPM) / (processedData.maxBPM - processedData.minBPM)) * (chartHeight - padding.top - padding.bottom);
            return (
              <div key={value}>
                {/* Grid line */}
                <div
                  className="border-b border-gray-600/30 w-full h-0 absolute"
                  style={{ 
                    top: `${(y / chartHeight) * 100}%`,
                    left: `${padding.left}px`,
                    right: `${padding.right}px`
                  }}
                />
                {/* Y-label */}
                <div
                  className="absolute text-xs text-gray-400 font-medium"
                  style={{ 
                    top: `${(y / chartHeight) * 100}%`,
                    left: '8px',
                    transform: 'translateY(-50%)'
                  }}
                >
                  {value}
                </div>
              </div>
            );
          })}
        </div>

        {/* SVG Chart */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          preserveAspectRatio="none"
        >
          <defs>
            {/* Main heart rate gradient */}
            <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5D8DEE" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#5D8DEE" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#5D8DEE" stopOpacity="0.05" />
            </linearGradient>

            {/* Workout highlight gradient */}
            <linearGradient id="workoutGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6A2C" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#FF6A2C" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF6A2C" stopOpacity="0.1" />
            </linearGradient>

            {/* Glow filter for line */}
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Main heart rate area */}
          <path 
            d={processedData.areaPath} 
            fill="url(#hrGradient)" 
            stroke="none"
            opacity={activeWorkout ? 0.3 : 0.8}
            className="transition-opacity duration-300"
          />

          {/* Main heart rate line */}
          <path 
            d={processedData.pathData} 
            fill="none" 
            stroke="#5D8DEE"
            strokeWidth="2.5" 
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#lineGlow)"
            opacity={activeWorkout !== null ? 0.6 : 1}
            className="transition-opacity duration-300"
          />

          {/* Workout segments highlighting */}
          {workoutSegments.map((segment, index) => {
            // Skip segments without valid points
            if (!segment.points.length || !segment.points.some(p => p.bpm)) return null;
            
            // Filter valid points (with BPM data)
            const validPoints = segment.points.filter(p => p.bpm);
            if (!validPoints.length) return null;
            
            // Find corresponding chart points
            const chartPoints = validPoints.map(point => {
              const pointIndex = heartRateData.findIndex(p => p.time === point.time);
              return processedData.points.find(p => p.time === point.time) || null;
            }).filter(p => p !== null);
            
            if (!chartPoints.length) return null;
            
            // Create segment path
            const segmentPath = chartPoints.map((point, i) => 
              `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
            ).join(' ');
            
            // Create area path
            const areaPath = `${segmentPath} L ${chartPoints[chartPoints.length-1].x} ${chartHeight - padding.bottom} L ${chartPoints[0].x} ${chartHeight - padding.bottom} Z`;
            
            return (
              <g key={`workout-${index}`}>
                {/* Workout area */}
                <path
                  d={areaPath}
                  fill="url(#workoutGradient)"
                  opacity={activeWorkout === index ? 0.8 : 0.5}
                  className="transition-opacity duration-300"
                  onMouseEnter={() => onWorkoutHover?.(index)}
                  onMouseLeave={() => onWorkoutHover?.(null)}
                />
                
                {/* Workout line */}
                <path
                  d={segmentPath}
                  fill="none"
                  stroke="#FF6A2C"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter="url(#lineGlow)"
                  opacity={activeWorkout === index ? 1 : 0.8}
                  className="transition-opacity duration-300 cursor-pointer"
                  onMouseEnter={() => onWorkoutHover?.(index)}
                  onMouseLeave={() => onWorkoutHover?.(null)}
                />
                
                {/* Data points */}
                {chartPoints.map((point, pointIndex) => (
                  <circle
                    key={`point-${index}-${pointIndex}`}
                    cx={point.x}
                    cy={point.y}
                    r={activeWorkout === index ? 4 : 2.5}
                    fill="#FF6A2C"
                    stroke="#ffffff"
                    strokeWidth="1"
                    opacity={activeWorkout === index ? 1 : 0.7}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => onWorkoutHover?.(index)}
                    onMouseLeave={() => onWorkoutHover?.(null)}
                  />
                ))}
              </g>
            );
          })}

          {/* Hover line */}
          {hoveredTime && (
            <line 
              x1={hoveredTime.x} 
              y1={padding.top} 
              x2={hoveredTime.x} 
              y2={chartHeight - padding.bottom}
              stroke="white" 
              strokeWidth="1"
              strokeDasharray="4,2"
              opacity="0.8"
            />
          )}
        </svg>

        {/* Time labels */}
        <div className="absolute left-0 right-0 bottom-2">
          <div className="flex justify-between px-16 text-xs text-gray-400 font-medium">
            {processedData.timeLabels.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Workout Info Section - Show when a workout is active/hovered */}
      {activeWorkout !== null && workoutSegments[activeWorkout] ? (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-medium text-white">
                {workoutSegments[activeWorkout].activity || 'Workout'}
              </h4>
              <p className="text-xs text-gray-400">
                {format(new Date(workoutSegments[activeWorkout].points[0]?.time || new Date()), 'h:mm a')} - 
                {format(new Date(workoutSegments[activeWorkout].points[workoutSegments[activeWorkout].points.length-1]?.time || new Date()), 'h:mm a')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-400">Max BPM</p>
                <p className="text-sm font-bold text-white">
                  {Math.max(...workoutSegments[activeWorkout].points.map(p => p.bpm || 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Avg BPM</p>
                <p className="text-sm font-bold text-white">
                  {Math.round(
                    workoutSegments[activeWorkout].points
                      .filter(p => p.bpm)
                      .reduce((sum, p) => sum + p.bpm, 0) / 
                    workoutSegments[activeWorkout].points.filter(p => p.bpm).length
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Duration</p>
                <p className="text-sm font-bold text-white">
                  {workoutSegments[activeWorkout].points.length} min
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Display message when there are no workouts for this day
        workoutSegments.length === 0 && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              No workouts recorded on {format(new Date(formattedDate), 'MMMM d, yyyy')}
            </p>
          </div>
        )
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-700/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#5D8DEE]"></div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">Heart Rate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF6A2C]"></div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">Workout</span>
        </div>
      </div>
    </div>
  );
};

export default DailyStrainChart;