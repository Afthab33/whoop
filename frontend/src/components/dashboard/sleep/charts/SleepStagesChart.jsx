import React, { useState, useEffect, useRef } from 'react';
import { format, subDays, subMonths, subWeeks } from 'date-fns';
import whoopData from '../../../../data/day_wise_whoop_data.json';

const SleepStagesChart = ({ selectedDate, activeStageFromParent, onStageChange }) => {
  const [localActiveStage, setLocalActiveStage] = useState(null);
  const [sleepData, setSleepData] = useState(null);
  const [bpmData, setBpmData] = useState([]);
  const [summary, setSummary] = useState({});
  const [hoveredTime, setHoveredTime] = useState(null);
  const [timePeriod, setTimePeriod] = useState('1d'); // Default to 1 day view
  const [trendData, setTrendData] = useState([]);
  const chartRef = useRef(null);

  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  
  // Updated Sleep stage colors as requested
  const stageColors = {
    awake: '#c8c8c8', // Gray as requested
    light: '#a4a3f1', // Light purple as requested
    deep: '#fa96f9',  // Pink as requested
    rem: '#ac5aed',   // Purple as requested
  };

  // Computed active stage (parent state takes precedence)
  const activeStage = activeStageFromParent !== undefined ? activeStageFromParent : localActiveStage;

  useEffect(() => {
    if (!dateStr || !whoopData[dateStr]) return;
    
    const dayData = whoopData[dateStr];
    
    // Extract sleep data
    if (dayData.sleep_summary) {
      setSummary(dayData.sleep_summary);
      
      // Process BPM data and sleep stages
      const bpmWithStages = dayData.bpm_data || [];
      setBpmData(bpmWithStages);
      
      // Calculate sleep data for the chart
      const sleepOnset = dayData.sleep_summary["Sleep onset"] ? 
        new Date(dayData.sleep_summary["Sleep onset"]) : null;
      const wakeOnset = dayData.sleep_summary["Wake onset"] ? 
        new Date(dayData.sleep_summary["Wake onset"]) : null;
      
      if (sleepOnset && wakeOnset) {
        // Create processed sleep data
        const processedData = {
          sleepOnset,
          wakeOnset,
          awake: dayData.sleep_summary["Awake duration (min)"] || 0,
          light: dayData.sleep_summary["Light sleep duration (min)"] || 0,
          deep: dayData.sleep_summary["Deep (SWS) duration (min)"] || 0,
          rem: dayData.sleep_summary["REM duration (min)"] || 0,
          totalSleep: dayData.sleep_summary["Asleep duration (min)"] || 0,
          totalInBed: dayData.sleep_summary["In bed duration (min)"] || 0,
        };
        
        setSleepData(processedData);
      }
    }
    
    // Load trend data based on selected time period
    loadTrendData(selectedDate, timePeriod);
    
  }, [dateStr, timePeriod]);

  // Function to load trend data for the selected period
  const loadTrendData = (date, period) => {
    const endDate = new Date(date);
    let startDate;
    
    // Calculate start date based on period
    switch (period) {
      case '1d':
        // Just the selected date
        startDate = new Date(date);
        break;
      case '1w':
        startDate = subDays(endDate, 7);
        break;
      case '2w':
        startDate = subDays(endDate, 14);
        break;
      case '1m':
        startDate = subMonths(endDate, 1);
        break;
      case '3m':
        startDate = subMonths(endDate, 3);
        break;
      case '6m':
        startDate = subMonths(endDate, 6);
        break;
      default:
        startDate = new Date(date);
    }
    
    // Format dates for comparison
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get all dates in the selected range that have data
    const relevantDates = Object.keys(whoopData)
      .filter(date => date >= startDateStr && date <= endDateStr)
      .sort();
    
    // Collect sleep data for each date
    const trend = relevantDates.map(date => {
      const data = whoopData[date];
      const sleepSummary = data?.sleep_summary || {};
      
      return {
        date,
        formattedDate: format(new Date(date), 'EEE\nMMM d'),
        shortDate: format(new Date(date), 'MMM d'),
        awake: sleepSummary["Awake duration (min)"] || 0,
        light: sleepSummary["Light sleep duration (min)"] || 0,
        deep: sleepSummary["Deep (SWS) duration (min)"] || 0,
        rem: sleepSummary["REM duration (min)"] || 0,
        totalSleep: sleepSummary["Asleep duration (min)"] || 0
      };
    });
    
    setTrendData(trend);
  };

  // Function to generate chart data points
  const generateChartData = () => {
    if (!sleepData || !bpmData || bpmData.length === 0) return null;
    
    const chartHeight = 200;
    const chartWidth = chartRef.current ? chartRef.current.offsetWidth - 60 : 800;
    
    // Calculate time range
    const sleepOnset = sleepData.sleepOnset;
    const wakeOnset = sleepData.wakeOnset;
    const totalDuration = (wakeOnset - sleepOnset) / (1000 * 60); // in minutes
    
    // Generate time labels for x-axis (hourly)
    const timeLabels = [];
    let currentTime = new Date(sleepOnset);
    while (currentTime <= wakeOnset) {
      timeLabels.push({
        time: new Date(currentTime),
        label: format(currentTime, 'h:mma'),
        x: ((currentTime - sleepOnset) / (wakeOnset - sleepOnset)) * chartWidth
      });
      currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // Add 1 hour
    }

    // Process BPM data for the chart
    const maxBpm = Math.max(...bpmData.map(d => d.bpm || 0).filter(Boolean), 150); // Set minimum max to 150
    
    // Separate BPM paths for each sleep stage
    const stagePaths = {
      awake: { path: '', points: [] },
      light: { path: '', points: [] },
      deep: { path: '', points: [] },
      rem: { path: '', points: [] }
    };
    
    // Overall BPM path and area
    let bpmPath = '';
    let bpmAreaPath = `M0,${chartHeight} `;
    let validBpmData = bpmData.filter((d, i) => d.bpm && i < totalDuration);
    
    // Process BPM data to create separate path segments for connected points
    const bpmSegments = [];
    let currentSegment = { points: [] };

    // Maximum allowed gap between points (in minutes)
    const MAX_GAP_MINUTES = 3;

    // Generate full BPM path first
    if (validBpmData.length > 0) {
      // First point
      const firstPoint = validBpmData[0];
      const firstX = (0 / totalDuration) * chartWidth;
      const firstY = chartHeight - ((firstPoint.bpm / maxBpm) * chartHeight);
      bpmPath += `M${firstX},${firstY}`;
      bpmAreaPath += `L${firstX},${firstY}`;
      
      // Remaining points
      validBpmData.forEach((d, i) => {
        if (i === 0) return; // Skip first point as we already handled it
        
        const x = (i / totalDuration) * chartWidth;
        const y = chartHeight - ((d.bpm / maxBpm) * chartHeight);
        
        // Check for gaps
        const prevIndex = validBpmData[i-1]?.index || (i-1);
        const hasGap = (i - prevIndex) > MAX_GAP_MINUTES;
        
        if (hasGap) {
          bpmPath += ` M${x},${y}`; // Move without drawing
        } else {
          bpmPath += ` L${x},${y}`; // Draw line
        }
        bpmAreaPath += ` L${x},${y}`;
      });
      
      // Complete the area path by bringing it down to the bottom
      const lastX = (validBpmData.length - 1) / totalDuration * chartWidth;
      bpmAreaPath += ` L${lastX},${chartHeight} L0,${chartHeight} Z`;
      
      // Now process segments with same gap logic as above
      currentSegment = { points: [{ 
        x: (0 / totalDuration) * chartWidth,
        y: chartHeight - ((validBpmData[0].bpm / maxBpm) * chartHeight),
        index: 0,
        data: validBpmData[0] 
      }] };
      
      // Continue with your existing segment processing code
      validBpmData.forEach((d, i) => {
        if (i === 0) return; // Skip the first point
        
        const x = (i / totalDuration) * chartWidth;
        const y = chartHeight - ((d.bpm / maxBpm) * chartHeight);
        
        // If this is closely connected to previous, add to current segment
        if (i - validBpmData[currentSegment.points.length - 1].index < MAX_GAP_MINUTES) {
          currentSegment.points.push({ x, y, index: i, data: d });
        } else {
          // Too big gap - start a new segment
          if (currentSegment.points.length > 0) {
            bpmSegments.push(currentSegment);
          }
          currentSegment = { points: [{ x, y, index: i, data: d }] };
        }
      });
      
      // Add the last segment if it has points
      if (currentSegment.points.length > 0) {
        bpmSegments.push(currentSegment);
      }
      
      // Create SVG paths for each segment
      bpmSegments.forEach((segment, segIndex) => {
        // Create path for this segment
        let segmentPath = '';
        let segmentAreaPath = '';
        
        segment.points.forEach((point, i) => {
          if (i === 0) {
            // Start new path
            segmentPath += `M${point.x},${point.y}`;
            segmentAreaPath += `M${point.x},${chartHeight} L${point.x},${point.y}`;
          } else {
            // Continue path
            segmentPath += ` L${point.x},${point.y}`;
            segmentAreaPath += ` L${point.x},${point.y}`;
          }
        });
        
        // Complete area path
        const lastX = segment.points[segment.points.length - 1].x;
        segmentAreaPath += ` L${lastX},${chartHeight} Z`;
        
        // Store paths
        segment.path = segmentPath;
        segment.areaPath = segmentAreaPath;
      });
      
      // Create separated stage paths with proper fill paths
      Object.keys(stagePaths).forEach(stageName => {
        // Group by stages with separate segments for gaps
        const stageSegments = [];
        let currentStageSegment = { points: [] };
        
        validBpmData.forEach((d, i) => {
          if (d.sleep_stage === stageName) {
            const x = (i / totalDuration) * chartWidth;
            const y = chartHeight - ((d.bpm / maxBpm) * chartHeight);
            
            // If this is the first point or closely connected to previous
            if (currentStageSegment.points.length === 0 || 
                i - currentStageSegment.points[currentStageSegment.points.length - 1].index < MAX_GAP_MINUTES) {
              currentStageSegment.points.push({ x, y, index: i });
            } else {
              // Gap detected - start a new segment
              if (currentStageSegment.points.length > 0) {
                stageSegments.push(currentStageSegment);
              }
              currentStageSegment = { points: [{ x, y, index: i }] };
            }
          }
        });
        
        // Add the last segment
        if (currentStageSegment.points.length > 0) {
          stageSegments.push(currentStageSegment);
        }
        
        // Generate paths for each segment
        let combinedPath = '';
        let fillPaths = [];
        
        stageSegments.forEach(segment => {
          // Create line path
          let segmentPath = '';
          // Create area path for this segment
          let fillPath = '';
          let firstX = null;
          let lastX = null;
          
          segment.points.forEach((point, i) => {
            if (i === 0) {
              segmentPath += `M${point.x},${point.y}`;
              fillPath += `M${point.x},${chartHeight} L${point.x},${point.y}`;
              firstX = point.x;
            } else {
              segmentPath += ` L${point.x},${point.y}`;
              fillPath += ` L${point.x},${point.y}`;
              lastX = point.x;
            }
          });
          
          // Complete the fill path
          if (lastX !== null) {
            fillPath += ` L${lastX},${chartHeight} Z`;
            fillPaths.push(fillPath);
          }
          
          combinedPath += segmentPath + ' ';
        });
        
        // Store paths
        stagePaths[stageName].path = combinedPath.trim();
        stagePaths[stageName].fillPaths = fillPaths;
      });
    }
    
    // We still create stage segments for hover information
    let stageSegments = [];
    let previousStage = null;
    let segmentStart = 0;
    
    bpmData.forEach((d, i) => {
      if (i >= totalDuration) return;
      
      const currentStage = d.sleep_stage;
      
      // Start a new segment when stage changes or at the end
      if (previousStage !== currentStage || i === totalDuration - 1 || i === bpmData.length - 1) {
        // Close previous segment
        if (previousStage) {
          stageSegments.push({
            stage: previousStage,
            start: segmentStart,
            end: i,
            startX: (segmentStart / totalDuration) * chartWidth,
            endX: (i / totalDuration) * chartWidth,
            color: stageColors[previousStage] || '#CCCCCC'
          });
        }
        
        // Start new segment
        segmentStart = i;
        previousStage = currentStage;
      }
    });
    
    // Add last segment if needed
    if (previousStage && segmentStart < totalDuration - 1) {
      stageSegments.push({
        stage: previousStage,
        start: segmentStart,
        end: totalDuration - 1,
        startX: (segmentStart / totalDuration) * chartWidth,
        endX: chartWidth,
        color: stageColors[previousStage] || '#CCCCCC'
      });
    }
    
    return {
      chartWidth,
      chartHeight,
      timeLabels,
      maxBpm,
      bpmPath,
      bpmAreaPath,
      bpmSegments, // Make sure this is always included
      stageSegments,
      stagePaths
    };
  };

  // Function to generate trend chart data
  const generateTrendChartData = () => {
    if (!trendData || trendData.length === 0) return null;
    
    const chartHeight = 200;
    const chartWidth = chartRef.current ? chartRef.current.offsetWidth - 60 : 800;
    
    // Calculate the width of each bar
    const barWidth = chartWidth / trendData.length;
    const maxHours = 14; // Maximum hours to display (14 hours)
    const pixelsPerHour = chartHeight / maxHours;
    
    // Generate bars for each date
    const bars = trendData.map((day, index) => {
      const x = index * barWidth;
      
      // Convert minutes to hours for display
      const awakeHours = day.awake / 60;
      const lightHours = day.light / 60;
      const deepHours = day.deep / 60;
      const remHours = day.rem / 60;
      
      // Calculate the height and y-position for each segment
      const totalHeight = (awakeHours + lightHours + deepHours + remHours) * pixelsPerHour;
      const awakeHeight = awakeHours * pixelsPerHour;
      const lightHeight = lightHours * pixelsPerHour;
      const deepHeight = deepHours * pixelsPerHour;
      const remHeight = remHours * pixelsPerHour;
      
      // Calculate y positions from bottom
      const awakeY = chartHeight - awakeHeight;
      const lightY = awakeY - lightHeight;
      const deepY = lightY - deepHeight;
      const remY = deepY - remHeight;
      
      return {
        date: day.date,
        formattedDate: day.formattedDate,
        shortDate: day.shortDate,
        x,
        width: barWidth * 0.8, // 80% of available width to add spacing
        segments: [
          {
            type: 'awake',
            y: awakeY,
            height: awakeHeight,
            color: stageColors.awake,
            minutes: day.awake
          },
          {
            type: 'light',
            y: lightY,
            height: lightHeight,
            color: stageColors.light,
            minutes: day.light
          },
          {
            type: 'deep',
            y: deepY,
            height: deepHeight,
            color: stageColors.deep,
            minutes: day.deep
          },
          {
            type: 'rem',
            y: remY,
            height: remHeight,
            color: stageColors.rem,
            minutes: day.rem
          }
        ],
        totalSleep: day.totalSleep
      };
    });
    
    return {
      chartWidth,
      chartHeight,
      bars
    };
  };

  // Update handleStageClick to notify parent
  const handleStageClick = (stage) => {
    const newStage = activeStage === stage ? null : stage;
    
    // Update local state
    setLocalActiveStage(newStage);
    
    // Notify parent if callback provided
    if (onStageChange) {
      onStageChange(newStage);
    }
  };
  
  const handleChartMouseMove = (e) => {
    if (!chartRef.current || !sleepData) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartData = generateChartData();
    if (!chartData) return;
    
    const timePosition = x / chartData.chartWidth;
    const totalMinutes = (sleepData.wakeOnset - sleepData.sleepOnset) / (1000 * 60);
    const minuteOffset = Math.floor(timePosition * totalMinutes);
    
    const timeAtPosition = new Date(sleepData.sleepOnset.getTime() + minuteOffset * 60 * 1000);
    setHoveredTime({
      time: format(timeAtPosition, 'h:mm a'),
      x,
      stage: bpmData[minuteOffset]?.sleep_stage || null,
      bpm: bpmData[minuteOffset]?.bpm || null
    });
  };

  const handleChartMouseLeave = () => {
    setHoveredTime(null);
  };

  // Calculate the total time for a specific stage
  const calculateStageTime = (stage) => {
    if (!sleepData) return '0:00';
    
    const minutes = stage === 'awake' ? sleepData.awake : 
                   stage === 'light' ? sleepData.light :
                   stage === 'deep' ? sleepData.deep :
                   stage === 'rem' ? sleepData.rem : 0;
                   
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const chartData = timePeriod === '1d' ? generateChartData() : generateTrendChartData();
  
  if ((!sleepData || !chartData) && timePeriod === '1d') {
    return (
      <div className="bg-[var(--card-bg)] rounded-3xl p-6 h-[450px] flex items-center justify-center">
        <p className="text-gray-400">No sleep data available for selected date</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-3xl p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 md:mb-0">Sleep Stages</h3>
        
        {/* Time period selector */}
        <div className="flex bg-[var(--bg-subcard)] rounded-full p-1 overflow-hidden">
          {['1d', '1w', '2w', '1m', '3m', '6m'].map((period) => (
            <button 
              key={period} 
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                timePeriod === period 
                  ? 'bg-[var(--strain-blue)] text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {period === '1d' ? '1d' : 
               period === '1w' ? '1w' : 
               period === '2w' ? '2w' : 
               period === '1m' ? '1m' :
               period === '3m' ? '3m' : '6m'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div 
        className="relative" 
        style={{ height: `${chartData?.chartHeight + 50}px` }}
        ref={chartRef}
        onMouseMove={timePeriod === '1d' ? handleChartMouseMove : undefined}
        onMouseLeave={timePeriod === '1d' ? handleChartMouseLeave : undefined}
      >
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-10 w-10 flex flex-col justify-between">
          {timePeriod === '1d' ? (
            // BPM labels for day view
            <>
              <span className="text-xs text-gray-400">150</span>
              <span className="text-xs text-gray-400">125</span>
              <span className="text-xs text-gray-400">100</span>
              <span className="text-xs text-gray-400">75</span>
              <span className="text-xs text-gray-400">50</span>
              <span className="text-xs text-gray-400">25</span>
              <span className="text-xs text-gray-400">0</span>
            </>
          ) : (
            // Hour labels for trend view
            <>
              <span className="text-xs text-gray-400">14h</span>
              <span className="text-xs text-gray-400">12h</span>
              <span className="text-xs text-gray-400">10h</span>
              <span className="text-xs text-gray-400">8h</span>
              <span className="text-xs text-gray-400">6h</span>
              <span className="text-xs text-gray-400">4h</span>
              <span className="text-xs text-gray-400">2h</span>
              <span className="text-xs text-gray-400">0h</span>
            </>
          )}
        </div>
        
        {/* Chart Area */}
        <div className="absolute left-12 right-0 top-0 bottom-0">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-b border-gray-700 w-full h-0"></div>
            ))}
          </div>
          
          {timePeriod === '1d' ? (
            // Single day view
            <>
              {/* We won't render the sleep stage bands anymore */}
              
              {/* BPM line with stage-specific coloring */}
              <svg className="absolute inset-0" viewBox={`0 0 ${chartData.chartWidth} ${chartData.chartHeight}`}>
                {/* Shadow/fill area definitions with distinct gradients for each stage */}
                <defs>
                  {/* Default gradient when no stage is selected */}
                  <linearGradient id="bpmGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7ca1bb" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#7ca1bb" stopOpacity="0.05" />
                  </linearGradient>
                  
                  {/* Stage-specific gradients */}
                  <linearGradient id="awakeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stageColors.awake} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={stageColors.awake} stopOpacity="0.05" />
                  </linearGradient>
                  
                  <linearGradient id="lightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stageColors.light} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={stageColors.light} stopOpacity="0.05" />
                  </linearGradient>
                  
                  <linearGradient id="deepGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stageColors.deep} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={stageColors.deep} stopOpacity="0.05" />
                  </linearGradient>
                  
                  <linearGradient id="remGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stageColors.rem} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={stageColors.rem} stopOpacity="0.05" />
                  </linearGradient>
                  
                  {/* Add a clip path for each stage section so we can apply the gradient only to specific areas */}
                  {activeStage && (
                    <clipPath id={`${activeStage}Clip`}>
                      <path 
                        d={chartData.stagePaths[activeStage]?.path} 
                        strokeWidth="6"
                      />
                    </clipPath>
                  )}
                </defs>
                
                {/* Default BPM area - shown when no stage is selected or faded when a stage is selected */}
                <path 
                  d={chartData.bpmAreaPath} 
                  fill="url(#bpmGradient)" 
                  stroke="none"
                  opacity={activeStage ? 0.1 : 0.4}
                />
                
                {/* Base BPM line - shown in full but faded when a stage is selected */}
                <path 
                  d={chartData.bpmPath} 
                  fill="none" 
                  stroke={activeStage ? "#444444" : "#7ca1bb"} 
                  strokeWidth="1.5" 
                  strokeLinejoin="miter"
                  strokeLinecap="butt"
                  strokeMiterlimit="1"
                  opacity={activeStage ? 0.2 : 1}
                />
                
                {/* Render each BPM segment separately to avoid connecting lines across gaps */}
                {chartData.bpmSegments && chartData.bpmSegments.length > 0 && chartData.bpmSegments.map((segment, i) => (
                  <React.Fragment key={i}>
                    {/* Area fill for this segment */}
                    <path 
                      d={segment.areaPath} 
                      fill="url(#bpmGradient)" 
                      stroke="none"
                      opacity={activeStage ? 0.1 : 0.4}
                    />
                    
                    {/* Line for this segment */}
                    <path 
                      d={segment.path} 
                      fill="none" 
                      stroke={activeStage ? "#444444" : "#7ca1bb"} 
                      strokeWidth="1.5" 
                      strokeLinejoin="miter"
                      strokeLinecap="butt"
                      strokeMiterlimit="1"
                      opacity={activeStage ? 0.2 : 1}
                    />
                  </React.Fragment>
                ))}
                
                {/* If a stage is selected, highlight that specific part of the BPM */}
                {activeStage && chartData.stagePaths[activeStage] && (
                  <>
                    {/* Filled areas for active stage - rendered FIRST so they're below the line */}
                    {chartData.stagePaths[activeStage].fillPaths && 
                      chartData.stagePaths[activeStage].fillPaths.map((fillPath, i) => (
                        <path
                          key={`fill-${i}`}
                          d={fillPath}
                          fill={stageColors[activeStage]}
                          fillOpacity="0.1"
                          strokeWidth="0"
                        />
                      ))
                    }
                    
                    {/* Highlight specific stage's BPM line */}
                    <path 
                      d={chartData.stagePaths[activeStage].path}
                      fill="none" 
                      stroke={stageColors[activeStage]} 
                      strokeWidth="2.5"
                      strokeLinejoin="miter"
                      strokeLinecap="butt"
                      strokeMiterlimit="1"
                      className="filter drop-shadow-sm"
                    />
                  </>
                )}
              </svg>
              
              {/* Time labels */}
              <div className="absolute left-0 right-0 top-full">
                {chartData.timeLabels.map((label, i) => (
                  <div 
                    key={i}
                    className="absolute -translate-x-1/2 text-xs text-gray-400 mt-2"
                    style={{ left: `${label.x}px` }}
                  >
                    {label.label}
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Trend view (1w, 2w, 1m, 3m, 6m)
            <>
              {/* Bars for each day */}
              {chartData.bars.map((bar, index) => (
                <div 
                  key={index} 
                  className="absolute bottom-0"
                  style={{ left: `${bar.x}px`, width: `${bar.width}px` }}
                >
                  {/* Segments for awake, light, deep, rem */}
                  {bar.segments.map((segment, segIndex) => (
                    <div 
                      key={segIndex}
                      className="absolute left-0 right-0"
                      style={{ 
                        bottom: `${(segment.y / chartData.chartHeight) * 100}%`,
                        height: `${(segment.height / chartData.chartHeight) * 100}%`,
                        backgroundColor: segment.color,
                        transition: 'height 0.3s ease, bottom 0.3s ease'
                      }}
                    />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Hover info - shows exact time and BPM when hovering over the chart */}
      {timePeriod === '1d' && hoveredTime && (
        <div className="absolute pointer-events-none" style={{ left: `${hoveredTime.x}px`, top: 'calc(100% + 10px)', transform: 'translateX(-50%)' }}>
          <div className="bg-[var(--card-bg)] rounded-lg p-3 shadow-lg">
            <div className="text-xs text-gray-400">{hoveredTime.time}</div>
            <div className="text-sm font-semibold text-white">
              {hoveredTime.stage ? `${hoveredTime.stage.charAt(0).toUpperCase() + hoveredTime.stage.slice(1)} - ` : ''}{hoveredTime.bpm} BPM
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SleepStagesChart;
