import { format } from 'date-fns';
import { stageColors } from './constants';
import { 
  addDays, 
  subDays, 
  startOfDay, 
  subWeeks, 
  subMonths, 
  eachDayOfInterval 
} from 'date-fns';

export const generateChartData = (sleepData, bpmData, chartRef) => {
  if (!sleepData || !bpmData || bpmData.length === 0) return null;
  
  const chartHeight = 200;
  const chartWidth = chartRef.current ? chartRef.current.offsetWidth - 60 : 800;
  
  // Calculate time range
  const sleepOnset = sleepData.sleepOnset;
  const wakeOnset = sleepData.wakeOnset;
  const totalDuration = (wakeOnset - sleepOnset) / (1000 * 60);
  
  // Generate time labels for x-axis (hourly)
  const timeLabels = [];
  let currentTime = new Date(sleepOnset);
  while (currentTime <= wakeOnset) {
    timeLabels.push({
      time: new Date(currentTime),
      label: format(currentTime, 'h:mma'),
      x: ((currentTime - sleepOnset) / (wakeOnset - sleepOnset)) * chartWidth
    });
    currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
  }

  // Process BPM data for the chart
  const maxBpm = Math.max(...bpmData.map(d => d.bpm || 0).filter(Boolean), 150);
  
  // Separate BPM paths for each sleep stage
  const stagePaths = {
    awake: { path: '', points: [] },
    light: { path: '', points: [] },
    deep: { path: '', points: [] },
    rem: { path: '', points: [] }
  };
  
  // Overall BPM path and area
  let bpmPath = '';
  let bpmAreaPath = '';
  let validBpmData = bpmData.filter((d, i) => d.bpm && i < totalDuration);
  
  // Process BPM data to create separate path segments for connected points
  const bpmSegments = [];
  let currentSegment = { points: [] };

  // Maximum allowed gap between points (in minutes)
  const MAX_GAP_MINUTES = 3;

  // Generate full BPM path first
  if (validBpmData.length > 0) {
    // First point - start exactly at x=0
    const firstPoint = validBpmData[0];
    const firstX = 0; // Set to exactly 0, not calculated
    const firstY = chartHeight - ((firstPoint.bpm / maxBpm) * chartHeight);
    bpmPath += `M${firstX},${firstY}`;
    bpmAreaPath = `M${firstX},${chartHeight} L${firstX},${firstY}`; // Start area path from bottom left
    
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
    bpmSegments,
    stageSegments,
    stagePaths
  };
};

/**
 * Load trend data for the given time period
 * @param {Object} whoopData - The entire whoopData object
 * @param {Date} selectedDate - The currently selected date
 * @param {string} timePeriod - The selected time period ('1d', '1w', '2w', '1m', '3m', '6m')
 * @returns {Array} - Array of processed daily sleep data for the selected time period
 */
export const loadTrendData = (whoopData, selectedDate, timePeriod) => {
  if (!whoopData || !selectedDate) return [];
  
  const endDate = startOfDay(selectedDate);
  let startDate;
  
  // Determine date range based on time period
  switch (timePeriod) {
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
      // Default to 1 day
      startDate = subDays(endDate, 1);
  }
  
  // Generate dates in the range
  const dates = eachDayOfInterval({
    start: startDate,
    end: endDate
  });
  
  // Process data for each day
  const result = dates.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = whoopData[dateStr];
    
    if (!dayData || !dayData.sleep_summary) {
      return {
        date: dateStr,
        sleepData: null,
        stages: {
          awake: 0,
          light: 0,
          deep: 0,
          rem: 0
        },
        avgBpm: null,
      };
    }
    
    const summary = dayData.sleep_summary;
    
    // Extract stage durations
    const stages = {
      awake: summary["Awake duration (min)"] || 0,
      light: summary["Light sleep duration (min)"] || 0,
      deep: summary["Deep (SWS) duration (min)"] || 0,
      rem: summary["REM duration (min)"] || 0,
    };
    
    // Calculate average BPM if available
    let avgBpm = null;
    if (dayData.bpm_data && dayData.bpm_data.length > 0) {
      const validBpms = dayData.bpm_data
        .filter(item => item.bpm && item.bpm > 0)
        .map(item => item.bpm);
      
      if (validBpms.length > 0) {
        avgBpm = Math.round(
          validBpms.reduce((sum, bpm) => sum + bpm, 0) / validBpms.length
        );
      }
    }
    
    return {
      date: dateStr,
      sleepData: {
        sleepOnset: new Date(summary["Sleep onset"]),
        wakeOnset: new Date(summary["Wake onset"]),
        totalSleep: summary["Asleep duration (min)"] || 0,
        totalInBed: summary["In bed duration (min)"] || 0,
      },
      stages,
      avgBpm,
    };
  });
  return result;
};

/**
 * Generate chart data for trend view (weekly, monthly view)
 * @param {Array} trendData - Array of processed daily sleep data
 * @param {Object} chartRef - Reference to the chart container
 * @returns {Object} - Data needed for rendering the trend chart
 */
export const generateTrendChartData = (trendData, chartRef) => {
  if (!trendData || trendData.length === 0 || !chartRef.current) {
    return null;
  }
  
  // Calculate available space, accounting for left margin
  const containerWidth = chartRef.current.clientWidth - 20;
  const chartHeight = 300;
  
  // Calculate bar width and spacing to fit nicely
  const totalBars = trendData.length;
  
  // Adaptive sizing based on number of bars
  let barWidth, barSpacing;
  
  if (totalBars <= 7) {
    // For 1w: wider bars with more spacing
    barWidth = Math.min(50, (containerWidth / totalBars) * 0.75);
    barSpacing = Math.max(8, (containerWidth / totalBars) * 0.25);
  } else if (totalBars <= 14) {
    // For 2w: medium bars
    barWidth = Math.min(35, (containerWidth / totalBars) * 0.8);
    barSpacing = Math.max(5, (containerWidth / totalBars) * 0.2);
  } else {
    // For 1m, 3m, 6m: thinner bars, less spacing
    barWidth = Math.min(25, (containerWidth / totalBars) * 0.85);
    barSpacing = Math.max(3, (containerWidth / totalBars) * 0.15);
  }
  
  // Make sure bars don't exceed container width
  const totalWidth = (barWidth + barSpacing) * totalBars;
  if (totalWidth > containerWidth) {
    const scaleFactor = containerWidth / totalWidth;
    barWidth *= scaleFactor;
    barSpacing *= scaleFactor;
  }
  
  // Generate bars for each day
  const bars = trendData.map((day, index) => {
    // Calculate x position with proper spacing between bars
    const x = index * (barWidth + barSpacing);
    
    if (!day.sleepData || !day.stages) {
      return {
        date: day.date,
        x,
        width: barWidth,
        segments: [],
        avgBpm: null,
        isEmpty: true
      };
    }
    
    // Calculate segments for each sleep stage
    // Order for stacking: deep -> rem -> light -> awake (bottom to top)
    const stageOrder = ['deep', 'rem', 'light', 'awake'];
    let currentHeight = 0;
    const segments = [];
    
    stageOrder.forEach(stage => {
      const durationHours = day.stages[stage] / 60; // Convert minutes to hours
      
      // Use the exact height calculation to match the grid that now starts at 2h instead of 0h
      // Adjust the divisor from 14 to 12 (14-2) to account for the new range
      const segmentHeight = (durationHours / 12) * chartHeight;
      
      if (durationHours > 0) {
        segments.push({
          stage,
          y: currentHeight, // Distance from bottom
          height: segmentHeight,
          duration: day.stages[stage], // in minutes
          color: stageColors[stage],
        });
        currentHeight += segmentHeight;
      }
    });
    
    // Calculate day of week and format the date for tooltip
    const dateObj = new Date(day.date);
    const dayOfWeek = format(dateObj, 'EEE');
    const formattedDate = format(dateObj, 'MMM d');
    
    return {
      date: day.date,
      dayOfWeek,
      formattedDate,
      x,
      width: barWidth,
      segments,
      avgBpm: day.avgBpm,
      isEmpty: segments.length === 0
    };
  });
  
  // Generate date labels - smarter label positioning based on time period
  const dateLabels = [];
  let labelCount;
  
  // Adjust label frequency based on bar count
  if (totalBars <= 7) {
    // For 1w: show each day
    labelCount = totalBars;
  } else if (totalBars <= 14) {
    // For 2w: show every other day
    labelCount = Math.ceil(totalBars / 2);
  } else if (totalBars <= 31) {
    // For 1m: show ~weekly
    labelCount = Math.min(6, totalBars);
  } else {
    // For 3m, 6m: show fewer labels
    labelCount = Math.min(8, totalBars);
  }
  
  // Create evenly spaced labels
  if (totalBars === 1) {
    // Edge case: only one bar
    dateLabels.push({
      x: barWidth / 2,
      label: format(new Date(trendData[0].date), getDateFormat(totalBars))
    });
  } else {
    for (let i = 0; i < labelCount; i++) {
      const index = Math.round(i * (totalBars - 1) / (labelCount - 1));
      if (index < totalBars) {
        dateLabels.push({
          x: index * (barWidth + barSpacing) + (barWidth / 2),
          label: format(new Date(trendData[index].date), getDateFormat(totalBars))
        });
      }
    }
  }
  
  return {
    chartWidth: containerWidth,
    chartHeight,
    bars,
    dateLabels,
  };
};

// Helper to determine how many x-axis labels to show based on period length
const timePeriodToLabelCount = (dayCount) => {
  if (dayCount <= 7) return dayCount; // Show all days for 1w
  if (dayCount <= 14) return Math.min(7, dayCount); // Show up to 7 days for 2w
  if (dayCount <= 31) return Math.min(6, dayCount); // Show up to 6 days for 1m
  return Math.min(6, dayCount); // Show up to 6 labels for longer periods
};

// Helper to determine date format based on period length
const getDateFormat = (dayCount) => {
  if (dayCount <= 14) return 'EEE'; // Show day name for shorter periods
  if (dayCount <= 31) return 'MMM d'; // Show month + day for 1m
  return 'MMM'; // Show month for longer periods
};