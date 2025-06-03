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

  // Fix the syntax error first
  const generateEnhancedTrendData = (selectedDate, duration) => {
    const endDate = new Date(selectedDate);
    let startDate;

    switch (duration) {
      case '1w':
        startDate = new Date(endDate); // FIXED: Added missing line
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
    let globalSundayIndex = 0;

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

      // Enhanced date formatting exactly like RecoveryComparisonChart
      const formatDate = (date, formatStr) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        if (['2w', '1w', '1m'].includes(formatStr)) {
          return `${days[date.getDay()]}\n${months[date.getMonth()]} ${date.getDate()}`;
        } else if (['3m', '6m'].includes(formatStr)) {
          return `${days[date.getDay()]}\n${months[date.getMonth()]} ${date.getDate()}`;
        }
        return date.toLocaleDateString();
      };

      const dataPoint = {
        name: formatDate(currentDate, duration),
        date: dateStr,
        fullDate: new Date(currentDate),
        totalSleep: Math.round(sleepMetrics.totalSleep / 60 * 10) / 10, // Convert to hours with 1 decimal
        // Convert minutes to hours for better visualization
        deepHours: Math.round((sleepMetrics.deep / 60) * 10) / 10,
        remHours: Math.round((sleepMetrics.rem / 60) * 10) / 10,
        lightHours: Math.round((sleepMetrics.light / 60) * 10) / 10,
        awakeHours: Math.round((sleepMetrics.awake / 60) * 10) / 10,
        ...sleepMetrics,
        sleepLevel: sleepMetrics.totalSleep > 420 ? 'Excellent' : 
                   sleepMetrics.totalSleep > 360 ? 'Good' : 
                   sleepMetrics.totalSleep > 300 ? 'Fair' : 'Poor'
      };

      // Add Sunday indexing for 6m view exactly like RecoveryComparisonChart
      if (duration === '6m' && currentDate.getDay() === 0) {
        dataPoint.sundayIndex = globalSundayIndex;
        dataPoint.isSunday = true;
        globalSundayIndex++;
      } else if (duration === '3m' && currentDate.getDay() === 0) {
        dataPoint.isSunday = true;
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

  // Enhanced X-Axis Tick Component exactly like RecoveryComparisonChart
  const CustomSleepXAxisTick = ({ x, y, payload }) => {
    // For 3m and 6m periods - only show Sundays
    if (['3m', '6m'].includes(timePeriod)) {
      if (!payload.value || !payload.value.includes('Sun')) {
        return null;
      }
      
      // For 6m: Show every other Sunday
      if (timePeriod === '6m') {
        const dataPoint = payload.payload;
        if (dataPoint && dataPoint.sundayIndex !== undefined) {
          // Show only even-indexed Sundays (0, 2, 4, 6, etc.)
          if (dataPoint.sundayIndex % 2 !== 0) {
            return null;
          }
        }
      }
      
      const [daySun, monthDay] = payload.value.split('\n');
      
      return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={12} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="500">
            {daySun}
          </text>
          <text x={0} y={0} dy={26} textAnchor="middle" fill="var(--text-secondary)" fontSize="9">
            {monthDay}
          </text>
        </g>
      );
    }
    
    // For 1w, 2w, 1m periods
    if (['2w', '1w', '1m'].includes(timePeriod) && payload.value && payload.value.includes('\n')) {
      // For 1m: Show every other day
      if (timePeriod === '1m') {
        const dataIndex = payload.index;
        if (dataIndex !== undefined && dataIndex % 2 !== 0) {
          return null;
        }
      }
      
      const [dayName, monthDate] = payload.value.split('\n');
      return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={12} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="500">
            {dayName}
          </text>
          <text x={0} y={0} dy={26} textAnchor="middle" fill="var(--text-secondary)" fontSize="9">
            {monthDate}
          </text>
        </g>
      );
    }
    
    // Default case for single day view
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="500">
          {payload.value}
        </text>
      </g>
    );
  };

  // Enhanced Custom Tooltip exactly like RecoveryComparisonChart
  const CustomSleepTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--card-bg)] border border-white/10 text-white p-4 rounded-lg shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{label}</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Sleep:</span>
              <span className="font-medium text-blue-300">{formatTime(data.totalSleep * 60)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Deep Sleep:</span>
              <span className="font-medium" style={{ color: stageColors.deep }}>{formatTime(data.deep)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">REM Sleep:</span>
              <span className="font-medium" style={{ color: stageColors.rem }}>{formatTime(data.rem)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Light Sleep:</span>
              <span className="font-medium" style={{ color: stageColors.light }}>{formatTime(data.light)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Awake:</span>
              <span className="font-medium" style={{ color: stageColors.awake }}>{formatTime(data.awake)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Efficiency:</span>
              <span className="font-medium">{data.efficiency}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
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

  // Render Enhanced Sleep Trend Chart using Recharts - MATCH RECOVERY DIMENSIONS
  const renderSleepTrendChart = () => {
    if (!trendData || trendData.length === 0) {
      return (
        <div className="flex items-center justify-center h-72 text-[var(--text-secondary)]"> {/* MATCH: Same height as RecoveryComparisonChart */}
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"> {/* MATCH: Same icon size as RecoveryComparisonChart */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
            <div className="text-base font-medium text-[var(--text-primary)] mb-2"> {/* MATCH: Same text styling as RecoveryComparisonChart */}
              No sleep data available
            </div>
            <div className="text-xs mb-2 max-w-md mx-auto"> {/* MATCH: Same text styling as RecoveryComparisonChart */}
              Sleep trends will appear when data is available for the selected period.
            </div>
            <div className="text-[10px] text-[var(--text-muted)]"> {/* MATCH: Same text styling as RecoveryComparisonChart */}
              Try selecting a different time period or date range
            </div>
          </div>
        </div>
      );
    }

    // MATCH: Same compact margins as RecoveryComparisonChart
    const chartMargin = { 
      top: 5,        // MATCH: Same as RecoveryComparisonChart
      right: 15,     // MATCH: Same as RecoveryComparisonChart
      left: 25,      // MATCH: Same as RecoveryComparisonChart
      bottom: (timePeriod === '2w' || timePeriod === '1w' || timePeriod === '1m') ? 45 : 35 // MATCH: Same as RecoveryComparisonChart
    };

    // Y-axis ticks for time intervals (0 to 12 hours)
    const yAxisTicks = [0, 2, 4, 6, 8, 10, 12];

    // Y-axis tick formatter for time format
    const formatYAxisTime = (value) => {
      return `${value}h`;
    };

    return (
      <BarChart 
        data={trendData} 
        margin={chartMargin} 
        barCategoryGap="8%" // MATCH: Same as RecoveryComparisonChart
        maxBarSize={50}     // MATCH: Same as RecoveryComparisonChart
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
        
        {/* MATCH: Same CartesianGrid as RecoveryComparisonChart */}
        <CartesianGrid 
          horizontal={true} 
          vertical={false} 
          stroke="rgba(255, 255, 255, 0.1)" 
          strokeDasharray="3 3"
        />
        
        {/* MATCH: Same XAxis configuration as RecoveryComparisonChart */}
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={(props) => <CustomSleepXAxisTick {...props} />}
          height={45} // MATCH: Same as RecoveryComparisonChart
          interval={0}
          padding={{ left: 5, right: 5 }} // MATCH: Same as RecoveryComparisonChart
        />
        
        {/* MATCH: Same YAxis configuration as RecoveryComparisonChart */}
        <YAxis 
          domain={[0, 12]}
          ticks={yAxisTicks}
          axisLine={false} 
          tickLine={false} 
          tick={{ 
            fontSize: 11, 
            fill: '#9ca3af', 
            fontWeight: 500 
          }}
          tickFormatter={formatYAxisTime}
          width={25} // MATCH: Same as RecoveryComparisonChart
        />
        
        {/* MATCH: Same Tooltip configuration as RecoveryComparisonChart */}
        <RechartsTooltip 
          content={<CustomSleepTooltip />} 
          cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} 
        />
        
        {/* Stacked Bar Components for Sleep Stages */}
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
          radius={[4, 4, 0, 0]} // Only top bars get rounded corners
          name="Awake"
        />
      </BarChart>
    );
  };

  // Render Daily BPM Chart - MATCH RECOVERY DIMENSIONS
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

  // ✅ ADDED: Format date for display
  const formatDateForMessage = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };

  // ENHANCED: Clean Sleep Stage Pie Chart Component (slightly larger)
  const SleepStagePieChart = ({ sleepStageData, activeStage, onStageClick }) => {
    if (!sleepStageData || (sleepStageData.awake + sleepStageData.light + sleepStageData.deep + sleepStageData.rem) === 0) {
      return null;
    }

    return (
      <div className="flex justify-center items-center">
        <div className="relative w-28 h-28"> {/* INCREASED: w-24 h-24 → w-28 h-28 for slightly larger pie chart */}
          <svg className="w-full h-full" viewBox="0 0 120 120">
            {/* Donut chart segments */}
            {(() => {
              const total = sleepStageData.awake + sleepStageData.light + sleepStageData.deep + sleepStageData.rem;
              const radius = 30; // INCREASED: 28 → 30 for slightly bigger segments
              const centerX = 60;
              const centerY = 60;
              
              const segments = [
                {
                  id: "awake",
                  label: "Awake",
                  color: stageColors.awake,
                  minutes: sleepStageData.awake,
                },
                {
                  id: "light",
                  label: "Light",
                  color: stageColors.light,
                  minutes: sleepStageData.light,
                },
                {
                  id: "rem",
                  label: "REM",
                  color: stageColors.rem,
                  minutes: sleepStageData.rem,
                },
                {
                  id: "deep",
                  label: "Deep",
                  color: stageColors.deep,
                  minutes: sleepStageData.deep,
                }
              ];

              let currentOffset = 0;
              segments.forEach(segment => {
                const percentage = segment.minutes / total;
                segment.angle = percentage * 360;
                segment.offset = currentOffset;
                currentOffset += segment.angle;
              });

              return segments.map((segment, index) => {
                const isActive = activeStage === segment.id;
                const startAngle = segment.offset * (Math.PI / 180);
                const endAngle = (segment.offset + segment.angle) * (Math.PI / 180);
                
                const radiusOffset = isActive ? 2 : 0;
                const startX = centerX + (radius + radiusOffset) * Math.sin(startAngle);
                const startY = centerY - (radius + radiusOffset) * Math.cos(startAngle);
                const endX = centerX + (radius + radiusOffset) * Math.sin(endAngle);
                const endY = centerY - (radius + radiusOffset) * Math.cos(endAngle);
                
                const largeArcFlag = segment.angle > 180 ? 1 : 0;
                
                const path = `
                  M ${centerX} ${centerY}
                  L ${startX} ${startY}
                  A ${radius + radiusOffset} ${radius + radiusOffset} 0 ${largeArcFlag} 1 ${endX} ${endY}
                  Z
                `;

                // Clean label position with slightly adjusted spacing
                const midAngle = (startAngle + endAngle) / 2;
                const labelRadius = radius + 14; // INCREASED: 12 → 14 for better spacing with larger chart
                const labelX = centerX + labelRadius * Math.sin(midAngle);
                const labelY = centerY - labelRadius * Math.cos(midAngle);
                
                return (
                  <g key={segment.id}>
                    {/* Main segment path - clean borders, no glow */}
                    <path
                      d={path}
                      fill={segment.color}
                      stroke="#1a1a1a"
                      strokeWidth="0.4"
                      opacity={activeStage && !isActive ? 0.4 : 0.95}
                      className="cursor-pointer transition-all duration-300 hover:opacity-80"
                      onClick={() => onStageClick && onStageClick(segment.id)}
                    />
                    
                    {/* Active highlight - clean border, no blur/glow */}
                    {isActive && (
                      <path
                        d={path}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="1.2"
                        opacity="0.8"
                        className="pointer-events-none"
                      />
                    )}

                    {/* Clean External Labels - no text shadow */}
                    <text
                      x={labelX}
                      y={labelY + 1}
                      textAnchor="middle"
                      className="fill-white pointer-events-none"
                      style={{ 
                        fontSize: '7px',
                        fontWeight: 'bold',
                        opacity: activeStage && !isActive ? 0.6 : 1
                      }}
                    >
                      {segment.label.toUpperCase()}
                    </text>
                  </g>
                );
              });
            })()}
            
            {/* Clean Inner circle - slightly larger to match proportions */}
            <circle 
              cx="60"
              cy="60"
              r="15" // INCREASED: 14 → 15 to maintain proportions with larger outer ring
              fill="#242D34" 
              stroke="#333"
              strokeWidth="0.6"
              className="cursor-pointer"
              onClick={() => onStageClick && onStageClick(null)}
            />
          </svg>
          
          {/* Removed pulse animation completely for clean look */}
        </div>
      </div>
    );
  };

  // ENHANCED: More Impressive and Informative Sleep Stage Summary
  const CompactSleepStageSummary = ({ sleepData, activeStage, onStageClick }) => {
    if (!sleepData) return null;

    const stages = [
      { id: 'deep', label: 'Deep', color: stageColors.deep, minutes: sleepData.deep },
      { id: 'rem', label: 'REM', color: stageColors.rem, minutes: sleepData.rem },
      { id: 'light', label: 'Light', color: stageColors.light, minutes: sleepData.light },
      { id: 'awake', label: 'Awake', color: stageColors.awake, minutes: sleepData.awake }
    ];

    // Calculate totals and percentages
    const totalSleep = sleepData.totalSleep || 0;
    const totalInBed = sleepData.totalInBed || 0;
    const efficiency = sleepData.efficiency || 0;

    // Prepare pie chart data
    const pieChartData = {
      awake: sleepData.awake,
      light: sleepData.light,
      deep: sleepData.deep,
      rem: sleepData.rem
    };

    return (
      <div className="flex items-center justify-between gap-3 py-0.4 px-4 bg-black/20 border border-white/5 rounded-xl backdrop-blur-sm"> {/* REDUCED: py-1.5 → py-1 for less vertical padding */}
        
        {/* Left side: Interactive Buttons with clean, professional styling */}
        <div className="flex items-center justify-start gap-2 flex-1">
          {stages.map((stage) => {
            const isActive = activeStage === stage.id;
            const time = formatTime(stage.minutes);
            const percentage = totalInBed > 0 ? Math.round((stage.minutes / totalInBed) * 100) : 0;
            
            return (
              <button
                key={stage.id}
                onClick={() => onStageClick && onStageClick(stage.id)}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${ /* REDUCED: py-2 → py-1.5 for less button height */
                  isActive 
                    ? 'bg-white/20 scale-105 border border-white/30'
                    : 'bg-white/8 hover:bg-white/15 hover:scale-102 border border-white/10 hover:border-white/25'
                }`}
                style={{
                  boxShadow: isActive 
                    ? `0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
                    : `0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  background: isActive 
                    ? `linear-gradient(135deg, ${stage.color}15 0%, ${stage.color}08 50%, rgba(255,255,255,0.08) 100%)`
                    : `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)`
                }}
              >
                {/* Clean Text content with percentage - NO DOTS/GLOWS */}
                <div className="flex flex-col items-start min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] font-semibold tracking-wide transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                    }`}>
                      {stage.label.toUpperCase()}
                    </span>
                    <span className={`text-[8px] font-medium transition-colors duration-300 opacity-70 ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                  <span className={`text-xs font-bold tabular-nums transition-colors duration-300 leading-tight ${
                    isActive ? 'text-white' : 'text-gray-100 group-hover:text-white'
                  }`}>
                    {time}
                  </span>
                </div>

                {/* Clean color accent bar on the left */}
                <div 
                  className={`absolute left-0 top-1 bottom-1 w-1 rounded-r transition-all duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'
                  }`}
                  style={{ backgroundColor: stage.color }}
                />

                {/* Subtle button depth with inner shadow */}
                <div 
                  className={`absolute inset-0 rounded-lg transition-opacity duration-300 pointer-events-none ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, transparent 0%, ${stage.color}03 50%, transparent 100%)`,
                    boxShadow: `inset 0 1px 2px rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.05)`
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Center: Sleep Summary Stats - reduced padding */}
        <div className="flex flex-col items-center justify-center px-2.5 border-l border-r border-white/10"> {/* REDUCED: px-3 → px-2.5 for tighter spacing */}
          <div className="text-center mb-0.5"> {/* REDUCED: mb-1 → mb-0.5 for less spacing */}
            <div className="text-lg font-bold text-white tabular-nums leading-none">
              {formatTime(totalSleep)}
            </div>
            <div className="text-[8px] font-semibold text-blue-300 uppercase tracking-wide">
              Total Sleep
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-[9px]">
            <div className="text-center">
              <div className="text-white font-bold tabular-nums">
                {formatTime(totalInBed)}
              </div>
              <div className="text-gray-400 font-medium uppercase tracking-wide">
                In Bed
              </div>
            </div>
            
            <div className="w-px h-6 bg-white/20"></div>
            
            <div className="text-center">
              <div className="text-white font-bold tabular-nums">
                {efficiency}%
              </div>
              <div className="text-gray-400 font-medium uppercase tracking-wide">
                Efficiency
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Pie Chart without Sleep Quality Indicator - reduced spacing */}
        <div className="flex-shrink-0 ml-1.5 pl-1.5 border-l border-white/10"> {/* REDUCED: ml-2 pl-2 → ml-1.5 pl-1.5 for tighter spacing */}
          <SleepStagePieChart 
            sleepStageData={pieChartData}
            activeStage={activeStage}
            onStageClick={onStageClick}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Chart Card - MATCH EXACT DIMENSIONS */}
      <div className="whoops-card min-h-[380px]" style={{
        background: 'var(--card-bg)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {/* Enhanced Header - MATCH EXACT SPACING */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1 text-sm text-[var(--text-muted)] mt-1">
              <span>
                {timePeriod === '1d' 
                  ? `Sleep stage analysis for ${formatDateForMessage(selectedDate).split(',')[1].trim()}` 
                  : "Track your sleep patterns and quality over time"
                }
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            <TimePeriodSelector 
              selectedPeriod={timePeriod} 
              onPeriodChange={setTimePeriod} 
            />
          </div>
        </div>

        {/* Content based on active view */}
        {timePeriod === '1d' ? (
          // Single-day chart view - IMPROVED LAYOUT
          <div className="flex-1 min-h-0 pt-1">
            <div className="w-full" style={{ height: '340px' }}>
              {/* Daily Chart Container - ENLARGED */}
              <div 
                className="relative rounded-xl overflow-hidden bg-black/20 p-3 pb-4 transition-all duration-300 ease-in-out"
                style={{ 
                  height: chartData ? `${Math.min(chartData.chartHeight + 40, 280)}px` : '280px', /* INCREASED: 270px → 280px for more chart space */
                  marginTop: '0px'
                }}
                ref={chartRef}
              >
                <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between">
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

              {/* COMPACT Sleep Stage Summary with Pie Chart - MINIMAL MARGINS */}
              <div className="mt-1.5 mb-0"> {/* REDUCED: mt-2 → mt-1.5 for even tighter spacing */}
                <CompactSleepStageSummary 
                  sleepData={sleepData}
                  activeStage={activeStage}
                  onStageClick={handleStageClick}
                />
              </div>
            </div>
          </div>
        ) : (
          // Multi-period trend view - MATCH EXACT DIMENSIONS
          <div className="flex-1 min-h-0 pt-1">
            {trendData.length > 0 ? (
              <div className="w-full" style={{ height: '340px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {renderSleepTrendChart()}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-72 text-[var(--text-secondary)]">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                  </svg>
                  <div className="text-base font-medium text-[var(--text-primary)] mb-2">
                    No sleep data available
                  </div>
                  <div className="text-xs mb-2 max-w-md mx-auto">
                    Sleep trends will appear when data is available for the selected period.
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    Try selecting a different time period or date range
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sleep Stage Legend - COMPACT (only for trend views) */}
      {timePeriod !== '1d' && (
        <div className="flex items-center justify-center gap-4 p-2 bg-[var(--card-bg)]/30 border border-white/5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-2 rounded shadow-sm border border-white/10"
              style={{ 
                backgroundColor: stageColors.deep,
                boxShadow: `0 0 6px ${stageColors.deep}30`
              }}
            ></div>
            <span className="text-[10px] font-medium" style={{ color: stageColors.deep }}>
              Deep Sleep
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-2 rounded shadow-sm border border-white/10"
              style={{ 
                backgroundColor: stageColors.rem,
                boxShadow: `0 0 6px ${stageColors.rem}30`
              }}
            ></div>
            <span className="text-[10px] font-medium" style={{ color: stageColors.rem }}>
              REM Sleep
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-2 rounded shadow-sm border border-white/10"
              style={{ 
                backgroundColor: stageColors.light,
                boxShadow: `0 0 6px ${stageColors.light}30`
              }}
            ></div>
            <span className="text-[10px] font-medium" style={{ color: stageColors.light }}>
              Light Sleep
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div 
              className="w-3 h-2 rounded shadow-sm border border-white/10"
              style={{ 
                backgroundColor: stageColors.awake,
                boxShadow: `0 0 6px ${stageColors.awake}30`
              }}
            ></div>
            <span className="text-[10px] font-medium" style={{ color: stageColors.awake }}>
              Awake
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SleepChart;