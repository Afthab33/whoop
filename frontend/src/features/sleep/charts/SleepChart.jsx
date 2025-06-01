import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';
import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';
import ChartTooltip from '../../../components/charts/ChartTooltip';
import { generateChartData, generateTrendChartData, loadTrendData } from '../../../utils/sleepChartUtils';
import { stageColors } from '../../../utils/constants';
import whoopData from '../../../data/day_wise_whoop_data.json';

const SleepChart = ({ selectedDate, activeStageFromParent, onStageChange, onTimePeriodChange }) => {
  // Main component state
  const [localActiveStage, setLocalActiveStage] = useState(null);
  const [sleepData, setSleepData] = useState(null);
  const [bpmData, setBpmData] = useState([]);
  const [summary, setSummary] = useState({});
  const [hoveredTime, setHoveredTime] = useState(null);
  const [timePeriod, setTimePeriod] = useState('1d');
  const [trendData, setTrendData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const chartRef = useRef(null);
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  
  // Computed active stage (parent state takes precedence)
  const activeStage = activeStageFromParent !== undefined ? activeStageFromParent : localActiveStage;

  // Enhanced data loading effect
  useEffect(() => {
    setIsLoading(true);
    
    if (!dateStr || !whoopData[dateStr]) {
      setIsLoading(false);
      return;
    }
    
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
          efficiency: dayData.sleep_summary["Sleep efficiency %"] || 0,
        };
        
        setSleepData(processedData);
      }
    }
    
    setIsLoading(false);
  }, [dateStr, timePeriod, selectedDate]);

  // Enhanced trend data generation with improved date formatting
  const generateEnhancedTrendData = (selectedDate, duration) => {
    const endDate = new Date(selectedDate);
    let startDate;

    switch (duration) {
      case '1w':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        break;
      case '2w':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 13);
        break;
      case '1m':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 29);
        break;
      case '3m':
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6m':
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      default:
        return [];
    }

    const data = [];
    const currentDate = new Date(startDate);
    let sundayCount = 0;

    while (currentDate <= endDate) {
      const dateStr = currentDate.toLocaleDateString('en-CA');
      const dayData = whoopData[dateStr];
      
      let sleepMetrics = {
        totalSleep: 0,
        awake: 0,
        light: 0,
        deep: 0,
        rem: 0,
        efficiency: 0
      };
      
      if (dayData && dayData.sleep_summary) {
        const summary = dayData.sleep_summary;
        sleepMetrics = {
          totalSleep: summary["Asleep duration (min)"] || 0,
          awake: summary["Awake duration (min)"] || 0,
          light: summary["Light sleep duration (min)"] || 0,
          deep: summary["Deep (SWS) duration (min)"] || 0,
          rem: summary["REM duration (min)"] || 0,
          efficiency: summary["Sleep efficiency %"] || 0
        };
      }

      // Enhanced date formatting exactly like DetailedHeartRateChart
      const formatDate = (date, formatStr) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        if (formatStr === '2w-format' || formatStr === '1w-format') {
          return `${days[date.getDay()]}\n${months[date.getMonth()]} ${date.getDate()}`;
        } else if (formatStr === '1m-format') {
          return `${days[date.getDay()]}\n${months[date.getMonth()]} ${date.getDate()}`;
        } else if (formatStr === '3m-format' || formatStr === '6m-format') {
          return `${days[date.getDay()]}\n${months[date.getMonth()]} ${date.getDate()}`;
        }
        return date.toLocaleDateString();
      };

      const dataPoint = {
        name: formatDate(currentDate, `${duration}-format`),
        date: dateStr,
        fullDate: new Date(currentDate),
        totalSleep: Math.round(sleepMetrics.totalSleep / 60 * 10) / 10, // Convert to hours with 1 decimal
        ...sleepMetrics,
        sleepLevel: sleepMetrics.totalSleep > 420 ? 'Excellent' : 
                   sleepMetrics.totalSleep > 360 ? 'Good' : 
                   sleepMetrics.totalSleep > 300 ? 'Fair' : 'Poor'
      };

      // Add Sunday index for 6m view
      if (duration === '6m' && currentDate.getDay() === 0) {
        dataPoint.sundayIndex = sundayCount;
        sundayCount++;
      }

      data.push(dataPoint);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  };

  // Update trend data when period changes
  useEffect(() => {
    if (timePeriod !== '1d') {
      setIsLoading(true);
      const enhancedTrendData = generateEnhancedTrendData(selectedDate, timePeriod);
      setTrendData(enhancedTrendData);
      setIsLoading(false);
    }
  }, [selectedDate, timePeriod]);

  // Notify parent of time period changes
  useEffect(() => {
    if (onTimePeriodChange) {
      onTimePeriodChange(timePeriod);
    }
  }, [timePeriod, onTimePeriodChange]);

  // Stage handling
  const handleStageClick = (stage) => {
    const newStage = activeStage === stage ? null : stage;
    setLocalActiveStage(newStage);
    if (onStageChange) {
      onStageChange(newStage);
    }
  };

  // Helper function to format time
  const formatTime = (minutes) => {
    if (!minutes) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  // Enhanced Custom Tooltip for trend charts
  const CustomSleepTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 text-white p-4 rounded-lg shadow-xl z-50">
          <div className="font-medium text-sm pb-1.5 border-b border-gray-700 mb-2">
            {format(new Date(data.fullDate), 'EEEE, MMM d')}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Sleep:</span>
              <span className="font-medium text-blue-300">{formatTime(data.totalSleep * 60)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: stageColors.deep }}></div>
                <span>Deep: <span className="font-medium text-teal-300">{formatTime(data.deep)}</span></span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: stageColors.rem }}></div>
                <span>REM: <span className="font-medium text-purple-300">{formatTime(data.rem)}</span></span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: stageColors.light }}></div>
                <span>Light: <span className="font-medium text-yellow-300">{formatTime(data.light)}</span></span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: stageColors.awake }}></div>
                <span>Awake: <span className="font-medium text-red-300">{formatTime(data.awake)}</span></span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-700">
              <span className="text-gray-400">Efficiency:</span>
              <span className="font-medium">{data.efficiency}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Quality:</span>
              <span className="font-medium">{data.sleepLevel}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Enhanced X-Axis Tick Component exactly like DetailedHeartRateChart
  const CustomXAxisTick = ({ x, y, payload }) => {
    if (['3m', '6m'].includes(timePeriod)) {
      if (!payload.value || !payload.value.includes('Sun')) {
        return null;
      }
      
      if (timePeriod === '6m') {
        const dataPoint = payload.payload;
        if (dataPoint && dataPoint.sundayIndex !== undefined) {
          if (dataPoint.sundayIndex % 2 !== 0) {
            return null;
          }
        }
      }
      
      const [daySun, monthDay] = payload.value.split('\n');
      
      return (
        <g transform={`translate(${x},${y})`}>
          <text 
            x={0} 
            y={0} 
            dy={10} // ✅ Reduced spacing
            textAnchor="middle" 
            fill="#ffffff" 
            fontSize="10" 
            fontWeight="500"
          >
            {daySun}
          </text>
          <text 
            x={0} 
            y={0} 
            dy={22} // ✅ Reduced spacing
            textAnchor="middle" 
            fill="#9ca3af" 
            fontSize="9"
          >
            {monthDay}
          </text>
        </g>
      );
    }
    
    if ((timePeriod === '2w' || timePeriod === '1w' || timePeriod === '1m') && 
        payload.value && payload.value.includes('\n')) {
      
      if (timePeriod === '1m') {
        const dataIndex = payload.index;
        if (dataIndex !== undefined && dataIndex % 2 !== 0) {
          return null;
        }
      }
      
      const [dayName, monthDate] = payload.value.split('\n');
      return (
        <g transform={`translate(${x},${y})`}>
          <text 
            x={0} 
            y={0} 
            dy={10} // ✅ Reduced spacing
            textAnchor="middle" 
            fill="#ffffff" 
            fontSize="10" 
            fontWeight="500"
          >
            {dayName}
          </text>
          <text 
            x={0} 
            y={0} 
            dy={22} // ✅ Reduced spacing
            textAnchor="middle" 
            fill="#9ca3af" 
            fontSize="9"
          >
            {monthDate}
          </text>
        </g>
      );
    }
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={14} // ✅ Optimized spacing
          textAnchor="middle" 
          fill="#ffffff" 
          fontSize="11" 
          fontWeight="500"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  // Daily chart mouse interactions
  const handleChartMouseMove = (e) => {
    if (!chartRef.current || !sleepData || !bpmData || bpmData.length === 0) { 
      return; 
    }
    
    const chartArea = e.currentTarget;
    const rect = chartArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    if (x < 0 || x > rect.width) return;
    
    const timePosition = x / rect.width;
    const totalDuration = (sleepData.wakeOnset - sleepData.sleepOnset) / (1000 * 60);
    const minuteFromStart = Math.floor(timePosition * totalDuration);
    const timeAtPosition = new Date(sleepData.sleepOnset.getTime() + minuteFromStart * 60 * 1000);
    
    let dataPointByIndex = null;
    if (minuteFromStart >= 0 && minuteFromStart < bpmData.length) {
      dataPointByIndex = bpmData[minuteFromStart];
    }
    
    if (!dataPointByIndex || !dataPointByIndex.bpm) {
      let closestPoint = null;
      let minTimeDiff = Infinity;
      
      for (let i = 0; i < bpmData.length; i++) {
        const dataPoint = bpmData[i];
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
    
    if (dataPointByIndex && dataPointByIndex.bpm) {
      setHoveredTime({
        time: format(timeAtPosition, 'h:mm a'),
        x: x,
        stage: dataPointByIndex.sleep_stage || null,
        bpm: dataPointByIndex.bpm || null
      });
    }
  };

  const handleChartMouseLeave = () => {
    setHoveredTime(null);
  };

  // Generate chart data
  const chartData = timePeriod === '1d' 
    ? generateChartData(sleepData, bpmData, chartRef)
    : null;

  // Prepare stage buttons data for daily view
  const stageButtons = timePeriod === '1d' && sleepData ? [
    { id: 'awake', label: 'Awake', color: stageColors.awake, minutes: sleepData.awake },
    { id: 'light', label: 'Light', color: stageColors.light, minutes: sleepData.light },
    { id: 'deep', label: 'Deep', color: stageColors.deep, minutes: sleepData.deep },
    { id: 'rem', label: 'REM', color: stageColors.rem, minutes: sleepData.rem }
  ] : [];

  // ✅ ADD: Sleep Stage Legend Component
  const SleepStageLegend = () => (
    <div className="flex items-center justify-center gap-6 mt-4 p-3 bg-black/20 rounded-xl">
      {[
        { id: 'deep', label: 'Deep', color: stageColors.deep },
        { id: 'rem', label: 'REM', color: stageColors.rem },
        { id: 'light', label: 'Light', color: stageColors.light },
        { id: 'awake', label: 'Awake', color: stageColors.awake }
      ].map((stage) => (
        <div key={stage.id} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm text-gray-300 font-medium">
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  );

  // Render Enhanced Sleep Trend Chart using Recharts - UPDATED WITH STACKED BARS
  const renderSleepTrendChart = () => {
    if (!trendData || trendData.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 text-gray-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <p>No sleep data available for this period</p>
          </div>
        </div>
      );
    }

    // ✅ NEW: Enhanced data processing for stacked bars
    const processedTrendData = trendData.map(item => ({
      ...item,
      // Convert minutes to hours for better visualization
      deepHours: Math.round((item.deep / 60) * 10) / 10,
      remHours: Math.round((item.rem / 60) * 10) / 10,
      lightHours: Math.round((item.light / 60) * 10) / 10,
      awakeHours: Math.round((item.awake / 60) * 10) / 10,
      totalSleepHours: Math.round((item.totalSleep / 60) * 10) / 10
    }));

    // ✅ NEW: Custom Y-Axis tick formatter for time format
    const formatYAxisTime = (value) => {
      const hours = Math.floor(value);
      return `${hours}:00`;
    };

    // ✅ NEW: Y-axis ticks for time intervals
    const yAxisTicks = [0, 2, 4, 6, 8, 10, 12, 14];

    return (
      // ✅ IMPROVED: Better container with proper height management
      <div className="w-full" style={{ height: '420px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={processedTrendData} 
            margin={{ 
              top: 30,        // ✅ Increased top margin to push chart down
              right: 20,      
              left: 45,       // ✅ Increased for better Y-axis spacing
              bottom: (timePeriod === '2w' || timePeriod === '1w' || timePeriod === '1m') ? 60 : 45
            }}
            barCategoryGap="10%" // ✅ Reduced gap for better space utilization
            maxBarSize={60}      // ✅ Added to prevent bars from getting too wide
          >
            {/* Enhanced Gradient Definitions for Sleep Stages */}
            <defs>
              <linearGradient id="deepGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stageColors.deep} stopOpacity={0.9}/>
                <stop offset="100%" stopColor={stageColors.deep} stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="remGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stageColors.rem} stopOpacity={0.9}/>
                <stop offset="100%" stopColor={stageColors.rem} stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="lightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stageColors.light} stopOpacity={0.9}/>
                <stop offset="100%" stopColor={stageColors.light} stopOpacity={0.7}/>
              </linearGradient>
              <linearGradient id="awakeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stageColors.awake} stopOpacity={0.9}/>
                <stop offset="100%" stopColor={stageColors.awake} stopOpacity={0.7}/>
              </linearGradient>
            </defs>
            
            {/* FIXED CartesianGrid */}
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255, 255, 255, 0.1)" 
              horizontal={true}
              vertical={false}
            />
            
            {/* X-Axis Configuration */}
            <XAxis 
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={<CustomXAxisTick />}
              height={(timePeriod === '2w' || timePeriod === '1w' || timePeriod === '1m') ? 60 : 45}
              interval={0}
              padding={{ left: 10, right: 10 }}
            />
            
            {/* ✅ UPDATED: Y-Axis Configuration for time format */}
            <YAxis 
              domain={[0, 14]}
              ticks={yAxisTicks}
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 11, 
                fill: '#9ca3af', 
                fontWeight: 500 
              }}
              tickFormatter={formatYAxisTime}
              width={40} // ✅ Slightly increased for time format
              orientation="left"
            />
            
            {/* ✅ UPDATED: Enhanced Tooltip for stacked data */}
            <RechartsTooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-900 border border-gray-700 text-white p-4 rounded-lg shadow-xl z-50">
                      <div className="font-medium text-sm pb-1.5 border-b border-gray-700 mb-2">
                        {format(new Date(data.fullDate), 'EEEE, MMM d')}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Total Sleep:</span>
                          <span className="font-medium text-blue-300">{formatTime(data.totalSleep)}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: stageColors.deep }}></div>
                            <span>Deep: <span className="font-medium text-teal-300">{formatTime(data.deep)}</span></span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: stageColors.rem }}></div>
                            <span>REM: <span className="font-medium text-purple-300">{formatTime(data.rem)}</span></span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: stageColors.light }}></div>
                            <span>Light: <span className="font-medium text-yellow-300">{formatTime(data.light)}</span></span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: stageColors.awake }}></div>
                            <span>Awake: <span className="font-medium text-red-300">{formatTime(data.awake)}</span></span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-700">
                          <span className="text-gray-400">Efficiency:</span>
                          <span className="font-medium">{data.efficiency}%</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Quality:</span>
                          <span className="font-medium">{data.sleepLevel}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ 
                fill: 'rgba(255, 255, 255, 0.05)',
                stroke: 'rgba(255, 255, 255, 0.2)',
                strokeWidth: 1
              }}
            />
            
            {/* ✅ NEW: Stacked Bar Components for Sleep Stages */}
            <Bar 
              dataKey="deepHours"
              stackId="sleep"
              fill="url(#deepGradient)"
              radius={[0, 0, 0, 0]}
              name="Deep Sleep"
            />
            
            <Bar 
              dataKey="remHours"
              stackId="sleep"
              fill="url(#remGradient)"
              radius={[0, 0, 0, 0]}
              name="REM Sleep"
            />
            
            <Bar 
              dataKey="lightHours"
              stackId="sleep"
              fill="url(#lightGradient)"
              radius={[0, 0, 0, 0]}
              name="Light Sleep"
            />
            
            <Bar 
              dataKey="awakeHours"
              stackId="sleep"
              fill="url(#awakeGradient)"
              radius={[4, 4, 0, 0]} // ✅ Only top bars get rounded corners
              name="Awake"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render Daily BPM Chart
  const renderDailyBpmChart = () => {
    if (!chartData || !chartData.chartWidth || !chartData.chartHeight) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>Loading chart data...</p>
        </div>
      );
    }

    return (
      <>
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {[150, 125, 100, 75, 50, 25].map((value, i) => (
            <div
              key={i}
              className="border-b border-gray-700/30 w-full h-0 absolute"
              style={{ 
                top: `${(i * 100) / 6}%`,
                left: 0,
                right: 0
              }}
            />
          ))}
        </div>

        <svg className="absolute inset-0" viewBox={`0 0 ${chartData.chartWidth} ${chartData.chartHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="bpmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7ca1bb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#7ca1bb" stopOpacity="0.05" />
            </linearGradient>
            
            {Object.entries(stageColors).map(([stage, color]) => (
              <linearGradient key={stage} id={`${stage}Gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.05" />
              </linearGradient>
            ))}
            
            {activeStage && chartData.stagePaths && chartData.stagePaths[activeStage] && (
              <clipPath id={`${activeStage}Clip`}>
                <path 
                  d={chartData.stagePaths[activeStage]?.path} 
                  strokeWidth="6"
                />
              </clipPath>
            )}
          </defs>
          
          {/* BPM Area */}
          {chartData.bpmAreaPath && (
            <path 
              d={chartData.bpmAreaPath} 
              fill="url(#bpmGradient)" 
              stroke="none"
              opacity={activeStage ? 0.2 : 0.4}
            />
          )}
          
          {/* Main BPM Line */}
          {chartData.bpmPath && (
            <path 
              d={chartData.bpmPath} 
              fill="none" 
              stroke={activeStage ? "#6e7a85" : "#7ca1bb"}
              strokeWidth="2.5" 
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeMiterlimit="1"
              opacity={activeStage ? 0.4 : 1}
              className="filter drop-shadow-sm transition-opacity duration-300"
            />
          )}
          
          {/* BPM Segments */}
          {chartData.bpmSegments && chartData.bpmSegments.map((segment, i) => (
            <React.Fragment key={i}>
              {segment.areaPath && (
                <path 
                  d={segment.areaPath} 
                  fill="url(#bpmGradient)" 
                  stroke="none"
                  opacity={activeStage ? 0.2 : 0.4}
                />
              )}
              
              {segment.path && (
                <path 
                  d={segment.path} 
                  fill="none" 
                  stroke={activeStage ? "#6e7a85" : "#7ca1bb"}
                  strokeWidth="2" 
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeMiterlimit="1"
                  opacity={activeStage ? 0.4 : 1}
                />
              )}
            </React.Fragment>
          ))}
          
          {/* Active Sleep Stage Visualization */}
          {activeStage && chartData.stagePaths && chartData.stagePaths[activeStage] && (
            <>
              {chartData.stagePaths[activeStage].fillPaths && 
                chartData.stagePaths[activeStage].fillPaths.map((fillPath, i) => (
                  <path
                    key={`fill-${i}`}
                    d={fillPath}
                    fill={stageColors[activeStage]}
                    fillOpacity="0.15"
                    strokeWidth="0"
                  />
                ))
              }
              
              <path 
                d={chartData.stagePaths[activeStage].path}
                fill="none" 
                stroke={stageColors[activeStage]} 
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeMiterlimit="1"
                className="filter drop-shadow-md"
              />
            </>
          )}
          
          {/* Hover line */}
          {hoveredTime && (
            <line 
              x1={hoveredTime.x} 
              y1="0" 
              x2={hoveredTime.x} 
              y2={chartData.chartHeight}
              stroke="white" 
              strokeWidth="1"
              strokeDasharray="3,2"
              opacity="0.6"
            />
          )}
        </svg>
        
        {/* Time labels */}
        <div className="absolute left-0 right-0 top-full mt-1">
          {chartData.timeLabels && chartData.timeLabels.map((label, i) => (
            <div 
              key={i}
              className="absolute -translate-x-1/2 text-xs font-medium text-gray-400"
              style={{ left: `${label.x}px` }}
            >
              {label.label}
            </div>
          ))}
        </div>
      </>
    );
  };

  // Get chart title based on period
  const getChartTitle = () => {
    switch (timePeriod) {
      case '1d': return 'Sleep Stages';
      case '1w': return 'Weekly Sleep Overview';
      case '2w': return '2-Week Sleep Analysis';
      case '1m': return 'Monthly Sleep Trends';
      case '3m': return '3-Month Sleep Progress';
      case '6m': return '6-Month Sleep History';
      default: return 'Sleep Analysis';
    }
  };

  // Loading and error states
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-3xl p-6 shadow-lg min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
          <p className="text-gray-400">Loading sleep data...</p>
        </div>
      </div>
    );
  }

  if ((!sleepData || !chartData) && timePeriod === '1d') {
    return (
      <div className="bg-gray-800 rounded-3xl p-6 shadow-lg min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="w-10 h-10 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
          <p className="text-gray-400">No sleep data available for this date</p>
        </div>
      </div>
    );
  }

  return (
    <div className="whoops-card min-h-[500px]"> {/* ✅ CHANGED: Use whoops-card class instead of inline styles */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">{getChartTitle()}</h3>
          <p className="text-gray-400 text-sm">
            {timePeriod === '1d' 
              ? 'Heart rate monitoring during sleep with stage breakdown'
              : 'Track your sleep patterns and quality over time'
            }
          </p>
        </div>
        
        <TimePeriodSelector 
          selectedPeriod={timePeriod} 
          onPeriodChange={setTimePeriod} 
        />
      </div>

      {timePeriod === '1d' ? (
        <>
          {/* Daily Chart Container */}
          <div 
            className="relative rounded-xl overflow-hidden bg-black/20 p-4 pb-8 transition-all duration-300 ease-in-out" 
            style={{ 
              height: chartData ? `${chartData.chartHeight + 60}px` : '400px'
            }}
            ref={chartRef}
          >
            <div className="absolute left-0 top-0 bottom-10 w-10 flex flex-col justify-between">
              {[150, 125, 100, 75, 50, 25, 0].map((value) => (
                <span key={value} className="text-xs text-gray-400 text-right pr-1">{value}</span>
              ))}
            </div>
            
            <div 
              className="absolute left-12 right-0 top-0 bottom-0"
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
              {renderDailyBpmChart()}
              
              {hoveredTime && (
                <ChartTooltip hoveredTime={hoveredTime} />
              )}
            </div>
          </div>

          {/* Sleep Stage Indicators - Only for Daily View */}
          {stageButtons.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6 p-4 bg-black/20 rounded-xl">
              {stageButtons.map((stage) => {
                const isActive = activeStage === stage.id;
                const time = formatTime(stage.minutes);
                
                return (
                  <button
                    key={stage.id}
                    onClick={() => handleStageClick(stage.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/15 ring-2 ring-white/30 transform scale-105 shadow-lg' 
                        : 'bg-white/5 hover:bg-white/10 hover:scale-102'
                    }`}
                    style={{
                      boxShadow: isActive ? `0 4px 16px ${stage.color}40` : 'none'
                    }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <div className="text-left">
                      <div className="text-xs text-gray-300 capitalize font-medium">
                        {stage.label}
                      </div>
                      <div className="text-sm font-bold text-white">
                        {time}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ✅ IMPROVED: Trend Chart Container with legend */
        <div className="flex-1 min-h-0 pt-4">
          <div className="h-full pt-2">
            {renderSleepTrendChart()}
            {/* ✅ UPDATED: Use WHOOP card styling for legend */}
            <div className="flex items-center justify-center gap-6 mt-4 p-3 rounded-xl" 
                 style={{ backgroundColor: 'var(--bg-subcard)' }}> {/* ✅ Use CSS variable */}
              {[
                { id: 'deep', label: 'Deep', color: stageColors.deep },
                { id: 'rem', label: 'REM', color: stageColors.rem },
                { id: 'light', label: 'Light', color: stageColors.light },
                { id: 'awake', label: 'Awake', color: stageColors.awake }
              ].map((stage) => (
                <div key={stage.id} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SleepChart;