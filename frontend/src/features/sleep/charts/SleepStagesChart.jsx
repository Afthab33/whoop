import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';
import ChartTooltip from '../../../components/charts/ChartTooltip';
import DailyBpmChart from './DailyBpmChart';
import SleepBarChart from './SleepBarChart';
import SleepStatistics from '../components/SleepStatistics';
import { generateChartData, generateTrendChartData, loadTrendData } from '../../../utils/sleepChartUtils';
import whoopData from '../../../data/day_wise_whoop_data.json';

const SleepStagesChart = ({ selectedDate, activeStageFromParent, onStageChange, onTimePeriodChange }) => {
  const [localActiveStage, setLocalActiveStage] = useState(null);
  const [sleepData, setSleepData] = useState(null);
  const [bpmData, setBpmData] = useState([]);
  const [summary, setSummary] = useState({});
  const [hoveredTime, setHoveredTime] = useState(null);
  const [timePeriod, setTimePeriod] = useState('1d');
  const [trendData, setTrendData] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);
  const chartRef = useRef(null);

  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  
  // Computed active stage (parent state takes precedence)
  const activeStage = activeStageFromParent !== undefined ? activeStageFromParent : localActiveStage;

  // Define stage colors
  const stageColors = {
    awake: '#f87171',
    light: '#fbbf24',
    deep: '#34d399',
    rem: '#60a5fa',
  };

  useEffect(() => {
    if (!dateStr || !whoopData[dateStr]) return;
    
    const dayData = whoopData[dateStr];
    
    // Extract sleep data for daily view
    if (dayData.sleep_summary && timePeriod === '1d') {
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
    
    // Always load trend data regardless of selected time period
    const newTrendData = loadTrendData(whoopData, selectedDate, timePeriod);
    setTrendData(newTrendData);
    
  }, [dateStr, timePeriod, selectedDate]);

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
    if (!chartRef.current || !sleepData || !bpmData || bpmData.length === 0) { 
      console.log("Early return condition met:", { 
        chartRefExists: !!chartRef.current, 
        sleepDataExists: !!sleepData, 
        bpmDataLength: bpmData.length 
      });
      return; 
    }
    
    const chartArea = e.currentTarget;
    const rect = chartArea.getBoundingClientRect();
    
    // Calculate x position within the chart area
    const x = e.clientX - rect.left;
    
    // Ensure x is within chart bounds
    if (x < 0 || x > rect.width) {
      return;
    }
    
    // Calculate time position as a percentage of chart width
    const timePosition = x / rect.width;
    
    // Get total duration in minutes
    const totalDuration = (sleepData.wakeOnset - sleepData.sleepOnset) / (1000 * 60);
    
    // Calculate which minute this corresponds to
    const minuteFromStart = Math.floor(timePosition * totalDuration);
    
    // Calculate the actual time at this position
    const timeAtPosition = new Date(sleepData.sleepOnset.getTime() + minuteFromStart * 60 * 1000);
    
    // Use direct index lookup first - this is more efficient for minute-by-minute data
    let dataPointByIndex = null;
    if (minuteFromStart >= 0 && minuteFromStart < bpmData.length) {
      dataPointByIndex = bpmData[minuteFromStart];
    }
    
    // If direct lookup fails, find the closest data point by timestamp
    if (!dataPointByIndex || !dataPointByIndex.bpm) {
      let closestPoint = null;
      let minTimeDiff = Infinity;
      
      for (let i = 0; i < bpmData.length; i++) {
        const dataPoint = bpmData[i];
        // Skip points without timestamp or BPM
        if (!dataPoint.timestamp || !dataPoint.bpm) continue;
        
        const dataTime = new Date(dataPoint.timestamp);
        const timeDiff = Math.abs(dataTime - timeAtPosition);
        
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestPoint = dataPoint;
        }
      }
      
      if (closestPoint) {
        dataPointByIndex = closestPoint;
      }
    }
    
    // Only update if we found a valid data point with BPM
    if (dataPointByIndex && dataPointByIndex.bpm) {
      console.log("Setting hover time with:", {
        time: format(timeAtPosition, 'h:mm a'),
        x,
        stage: dataPointByIndex.sleep_stage,
        bpm: dataPointByIndex.bpm
      });
      
      setHoveredTime({
        time: format(timeAtPosition, 'h:mm a'),
        x: x,
        stage: dataPointByIndex.sleep_stage || null,
        bpm: dataPointByIndex.bpm || null
      });
    } else {
      console.log("No valid data point found at position:", minuteFromStart);
    }
  };

  const handleChartMouseLeave = () => {
    setHoveredTime(null);
  };

  // Calculate the total time for a specific stage
  const calculateStageTime = (stage) => {
    if (!sleepData) { return '0:00'; }
    
    const minutes = stage === 'awake' ? sleepData.awake : 
                   stage === 'light' ? sleepData.light :
                   stage === 'deep' ? sleepData.deep :
                   stage === 'rem' ? sleepData.rem : 0;
                   
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const chartData = timePeriod === '1d' 
    ? generateChartData(sleepData, bpmData, chartRef)
    : generateTrendChartData(trendData, chartRef);
  
  const isLoading = trendData.length > 0 && !chartData;

  useEffect(() => {
    if (onTimePeriodChange) {
      onTimePeriodChange(timePeriod);
    }
  }, [timePeriod, onTimePeriodChange]);

  if ((!sleepData || !chartData) && timePeriod === '1d') {
    return (
      <div className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-lg min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="w-10 h-10 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
          <p className="text-gray-400">No sleep data available for this date</p>
        </div>
      </div>
    );
  }

  // Add this before the return statement in SleepStagesChart
  console.log("Chart data:", {
    timePeriod,
    chartDataExists: !!chartData,
    chartWidth: chartData?.chartWidth,
    chartHeight: chartData?.chartHeight,
    barsCount: chartData?.bars?.length,
    trendDataLength: trendData?.length
  });

  // Add these handlers for trend chart interactions
  const handleTrendDayHover = (dateStr) => {
    setHoveredDay(dateStr);
  };

  const handleTrendDayClick = (dateStr) => {
    // Implement date selection logic if needed
    console.log("Selected date from trend chart:", dateStr);
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 md:mb-0">Sleep Stages</h3>
        
        <TimePeriodSelector 
          selectedPeriod={timePeriod} 
          onPeriodChange={setTimePeriod} 
        />
      </div>

      <div 
        className="relative rounded-xl overflow-hidden bg-[var(--bg-subcard)]/30 p-4 pb-8 chart-container transition-all duration-300 ease-in-out" 
        style={{ 
          height: `${chartData?.chartHeight + 60}px`, // Increased from 50px to 60px for more bottom space
        }}
        ref={chartRef}
      >
        <div className="absolute left-0 top-0 bottom-10 w-10 flex flex-col justify-between">
          {timePeriod === '1d' ? (
            // Daily BPM labels
            <>
              <span className="text-xs text-gray-400 text-right pr-1">150</span>
              <span className="text-xs text-gray-400 text-right pr-1">125</span>
              <span className="text-xs text-gray-400 text-right pr-1">100</span>
              <span className="text-xs text-gray-400 text-right pr-1">75</span>
              <span className="text-xs text-gray-400 text-right pr-1">50</span>
              <span className="text-xs text-gray-400 text-right pr-1">25</span>
              <span className="text-xs text-gray-400 text-right pr-1">0</span>
            </>
          ) : (
            // Sleep duration labels for trend view
            <>
              <span className="text-xs text-gray-400 text-right pr-1">14h</span>
              <span className="text-xs text-gray-400 text-right pr-1">12h</span>
              <span className="text-xs text-gray-400 text-right pr-1">10h</span>
              <span className="text-xs text-gray-400 text-right pr-1">8h</span>
              <span className="text-xs text-gray-400 text-right pr-1">6h</span>
              <span className="text-xs text-gray-400 text-right pr-1">4h</span>
              <span className="text-xs text-gray-400 text-right pr-1">2h</span>
            </>
          )}
        </div>
        
        <div 
          className="absolute left-12 right-0 top-0 bottom-0"
          onMouseMove={timePeriod === '1d' ? handleChartMouseMove : undefined}
          onMouseLeave={timePeriod === '1d' ? handleChartMouseLeave : undefined}
        >
          {timePeriod === '1d' ? (
            <DailyBpmChart chartData={chartData} activeStage={activeStage} hoveredTime={hoveredTime} />
          ) : (
            <SleepBarChart 
              chartData={chartData} 
              onBarHover={handleTrendDayHover}
              onBarClick={handleTrendDayClick}
              hiddenStages={[]} // Empty array
            />
          )}
          
          {timePeriod === '1d' && hoveredTime && (
            <ChartTooltip hoveredTime={hoveredTime} />
          )}
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-300">Loading data...</p>
          </div>
        </div>
      )}

      {/* Remove the duplicate SleepStatistics component */}
    </div>
  );
};

export default SleepStagesChart;
