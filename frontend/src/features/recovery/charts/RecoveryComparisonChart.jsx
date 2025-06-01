import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Area,
  BarChart,
  Bar,
  AreaChart,
  Cell,
} from 'recharts';
import { TrendingUp, Heart, Moon } from 'lucide-react';
import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';
import whoopData from '../../../data/day_wise_whoop_data.json';

// Recovery level color mapping
const RECOVERY_COLORS = {
  high: '#16EC06',     // High Recovery 67-100%
  medium: '#FFDE00',   // Medium Recovery 34-66%
  low: '#FF0026'       // Low Recovery 0-33%
};

// Get recovery color based on percentage
const getRecoveryColor = (recoveryPercent) => {
  if (recoveryPercent >= 67) return RECOVERY_COLORS.high;
  if (recoveryPercent >= 34) return RECOVERY_COLORS.medium;
  return RECOVERY_COLORS.low;
};

// Get recovery level text
const getRecoveryLevel = (recoveryPercent) => {
  if (recoveryPercent >= 67) return 'High';
  if (recoveryPercent >= 34) return 'Medium';
  return 'Low';
};

// Enhanced X-Axis Tick Component (inspired by strain chart)
const CustomRecoveryXAxisTick = ({ x, y, payload, timePeriod }) => {
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

// Enhanced Custom Y-Axis Tick with colors
const CustomYAxisTick = ({ x, y, payload }) => {
  // Determine color based on percentage value
  const getYAxisColor = (value) => {
    if (value >= 67) return RECOVERY_COLORS.high;
    if (value >= 34) return RECOVERY_COLORS.medium;
    if (value <= 33) return RECOVERY_COLORS.low;
    return 'var(--text-secondary)'; // Default for values like 50
  };

  const color = getYAxisColor(payload.value);
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dy={4} 
        textAnchor="end" 
        fill={color}
        fontSize="11" 
        fontWeight="600"
        style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }}
      >
        {payload.value}%
      </text>
    </g>
  );
};

// Enhanced recovery data generation with real data integration
const generateRecoveryDataForPeriod = (selectedDate, duration) => {
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
  let globalSundayIndex = 0;

  while (currentDate <= endDate) {
    const dateStr = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const dayData = whoopData[dateStr];
    
    let recovery = 75;
    let hrv = 66;
    let restingHr = 63;
    let sleepPerformance = 90;
    
    if (dayData?.physiological_summary) {
      recovery = dayData.physiological_summary["Recovery score %"] || 75;
      hrv = dayData.physiological_summary["Heart rate variability (ms)"] || 66;
      restingHr = dayData.physiological_summary["Resting heart rate (bpm)"] || 63;
      sleepPerformance = dayData.physiological_summary["Sleep performance %"] || 90;
    }

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

    const recoveryRounded = Math.round(recovery);
    const dataPoint = {
      name: formatDate(currentDate, duration),
      recovery: recoveryRounded,
      hrv: Math.round(hrv),
      restingHr: Math.round(restingHr),
      sleepPerformance: Math.round(sleepPerformance),
      fullDate: new Date(currentDate),
      recoveryLevel: getRecoveryLevel(recoveryRounded),
      recoveryColor: getRecoveryColor(recoveryRounded)
    };

    // Add Sunday indexing for 6m view
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

// Enhanced Recovery Tooltip
const CustomRecoveryTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[var(--card-bg)] border border-white/10 text-white p-4 rounded-lg shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.recoveryColor }}
          />
          <span className="font-semibold">{label}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Recovery:</span>
            <span className="font-medium" style={{ color: data.recoveryColor }}>
              {data.recovery}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Level:</span>
            <span className="font-medium" style={{ color: data.recoveryColor }}>
              {data.recoveryLevel}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">HRV:</span>
            <span className="font-medium">{data.hrv} ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Resting HR:</span>
            <span className="font-medium">{data.restingHr} bpm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Sleep:</span>
            <span className="font-medium">{data.sleepPerformance}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Bar component for color-coded bars
const CustomBar = (props) => {
  const { payload, ...rest } = props;
  if (payload) {
    return <Bar {...rest} fill={payload.recoveryColor} />;
  }
  return <Bar {...rest} />;
};

const RecoveryComparisonChart = ({ 
  selectedDate = new Date(), 
  timePeriod = '1d',
  onTimePeriodChange = () => {}
}) => {
  const [activeView, setActiveView] = useState('comparison');
  const [recoveryData, setRecoveryData] = useState([]);
  const [hoveredMetric, setHoveredMetric] = useState(null);

  // Single day comparison metrics (original functionality)
  const { metrics, comparisonDateInfo } = useMemo(() => {
    const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
    
    let metrics = {
      hrv: { current: 66, baseline: 55 },
      restingHr: { current: 63, baseline: 58 },
      sleepPerformance: { current: 93, baseline: 90 }
    };
    
    let comparisonDate = null;
    let comparisonDateStr = null;
    
    if (dateStr && whoopData[dateStr]) {
      const currentData = whoopData[dateStr];
      
      if (timePeriod === '1d') {
        const prevDay = new Date(selectedDate);
        prevDay.setDate(prevDay.getDate() - 1);
        comparisonDateStr = prevDay.toISOString().split('T')[0];
        comparisonDate = prevDay;
      } else {
        let daysToSubtract = 0;
        switch(timePeriod) {
          case '1w': daysToSubtract = 7; break;
          case '2w': daysToSubtract = 14; break;
          case '1m': daysToSubtract = 30; break;
          case '3m': daysToSubtract = 90; break;
          case '6m': daysToSubtract = 180; break;
          default: daysToSubtract = 7;
        }
        
        const rangeStartDate = new Date(selectedDate);
        rangeStartDate.setDate(rangeStartDate.getDate() - daysToSubtract);
        comparisonDateStr = rangeStartDate.toISOString().split('T')[0];
        comparisonDate = rangeStartDate;
      }
      
      const comparisonData = whoopData[comparisonDateStr];
      
      if (currentData?.physiological_summary) {
        metrics = {
          hrv: {
            current: currentData.physiological_summary["Heart rate variability (ms)"] || 66,
            baseline: (comparisonData?.physiological_summary && comparisonData.physiological_summary["Heart rate variability (ms)"]) || 55
          },
          restingHr: {
            current: currentData.physiological_summary["Resting heart rate (bpm)"] || 63,
            baseline: (comparisonData?.physiological_summary && comparisonData.physiological_summary["Resting heart rate (bpm)"]) || 58
          },
          sleepPerformance: {
            current: currentData.physiological_summary["Sleep performance %"] || 93,
            baseline: (comparisonData?.physiological_summary && comparisonData.physiological_summary["Sleep performance %"]) || 90
          }
        };
      }
    }
    
    return { 
      metrics,
      comparisonDateInfo: {
        date: comparisonDate,
        dateStr: comparisonDateStr
      }
    };
  }, [selectedDate, timePeriod]);

  // Multi-period data generation
  const chartData = useMemo(() => {
    if (timePeriod === '1d') {
      setActiveView('comparison');
      return [];
    } else {
      setActiveView('trend');
      return generateRecoveryDataForPeriod(selectedDate, timePeriod);
    }
  }, [selectedDate, timePeriod]);
  
  // Format dates for display
  const formattedDates = useMemo(() => {
    if (!selectedDate) return { current: '', comparison: '' };
    
    const current = format(selectedDate, 'EEE, MMM do');
    
    if (timePeriod === '1d' && comparisonDateInfo.date) {
      return {
        current,
        comparison: format(comparisonDateInfo.date, 'EEE, MMM do')
      };
    }
    
    if (comparisonDateInfo.date) {
      return {
        current,
        comparison: `${format(comparisonDateInfo.date, 'MMM do')} – ${format(selectedDate, 'MMM do')}`
      };
    }
    
    return { current, comparison: '' };
  }, [selectedDate, timePeriod, comparisonDateInfo]);
  
  // Calculate max value for proper scaling
  const maxValue = useMemo(() => {
    return Math.max(
      metrics.hrv.current || 0, 
      metrics.hrv.baseline || 0,
      metrics.restingHr.current || 0, 
      metrics.restingHr.baseline || 0,
      metrics.sleepPerformance.current || 0, 
      metrics.sleepPerformance.baseline || 0
    );
  }, [metrics]);

  // Enhanced color palette
  const chartColors = {
    current: '#4D94BB',
    currentGradient: 'linear-gradient(180deg, #5BA4C9 0%, #3C7FA0 100%)',
    baseline: '#9CA3AF',
    baselineGradient: 'linear-gradient(180deg, #ACAFB5 0%, #8D9096 100%)',
    highlight: 'rgba(255, 255, 255, 0.1)',
    gridLines: 'rgba(255, 255, 255, 0.06)',
  };
  
  // Get percentage difference between current and baseline
  const getPercentChange = (current, baseline) => {
    if (!baseline) return 0;
    return ((current - baseline) / baseline * 100).toFixed(1);
  };

  // Get chart title based on period
  const getChartTitle = () => {
    switch (timePeriod) {
      case '1d': return "Daily Recovery Comparison";
      case '1w': return "Weekly Recovery Trends";
      case '2w': return "2-Week Recovery Analysis";
      case '1m': return "Monthly Recovery Progress";
      case '3m': return "3-Month Recovery Overview";
      case '6m': return "6-Month Recovery History";
      default: return "Recovery Analysis";
    }
  };

  // Y-axis tick values - percentage based
  const yAxisTicks = [0, 17, 33, 50, 67, 83, 100];

  // Render trend chart for multi-period views
  const renderTrendChart = () => {
    const chartMargin = { 
      top: 10,        // ✅ Reduced from 20
      right: 20,      // ✅ Reduced from 30
      left: 40,       // ✅ Reduced from 70 for better space utilization
      bottom: (timePeriod === '2w' || timePeriod === '1w' || timePeriod === '1m') ? 60 : 45 // ✅ Optimized
    };

    if (['3m', '6m'].includes(timePeriod)) {
      return (
        <AreaChart data={chartData} margin={chartMargin}>
          <defs>
            {/* Create gradients for each recovery level */}
            <linearGradient id="highRecoveryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={RECOVERY_COLORS.high} stopOpacity={0.6}/>
              <stop offset="95%" stopColor={RECOVERY_COLORS.high} stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="mediumRecoveryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={RECOVERY_COLORS.medium} stopOpacity={0.6}/>
              <stop offset="95%" stopColor={RECOVERY_COLORS.medium} stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="lowRecoveryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={RECOVERY_COLORS.low} stopOpacity={0.6}/>
              <stop offset="95%" stopColor={RECOVERY_COLORS.low} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            horizontal={true} 
            vertical={false} 
            stroke="rgba(255, 255, 255, 0.1)" 
            strokeDasharray="3 3"
          />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={(props) => <CustomRecoveryXAxisTick {...props} timePeriod={timePeriod} />}
            height={60} // ✅ Reduced from 70
            interval={0}
            padding={{ left: 10, right: 10 }} // ✅ Added padding
          />
          <YAxis 
            domain={[0, 100]}
            ticks={yAxisTicks}
            axisLine={false} 
            tickLine={false} 
            tick={(props) => <CustomYAxisTick {...props} />}
            width={35} // ✅ Reduced from 70
          />
          <RechartsTooltip 
            content={<CustomRecoveryTooltip />} 
            cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1.5 }} 
          />
          <Area 
            type="monotone" 
            dataKey="recovery" 
            stroke={(entry) => entry?.recoveryColor || RECOVERY_COLORS.medium}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#mediumRecoveryGradient)"
            activeDot={{ 
              r: 6, 
              fill: (entry) => entry?.recoveryColor || RECOVERY_COLORS.medium, 
              stroke: 'white', 
              strokeWidth: 2 
            }}
          />
        </AreaChart>
      );
    } else {
      return (
        <BarChart 
          data={chartData} 
          margin={chartMargin} 
          barCategoryGap="10%" // ✅ Reduced from 20% for better space utilization
          maxBarSize={60}      // ✅ Added to prevent bars from getting too wide
        >
          <CartesianGrid 
            horizontal={true} 
            vertical={false} 
            stroke="rgba(255, 255, 255, 0.1)" 
            strokeDasharray="3 3"
          />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={(props) => <CustomRecoveryXAxisTick {...props} timePeriod={timePeriod} />}
            height={60} // ✅ Reduced from 70
            interval={0}
            padding={{ left: 10, right: 10 }} // ✅ Added padding
          />
          <YAxis 
            domain={[0, 100]}
            ticks={yAxisTicks}
            axisLine={false} 
            tickLine={false} 
            tick={(props) => <CustomYAxisTick {...props} />}
            width={35} // ✅ Reduced from 70
          />
          <RechartsTooltip 
            content={<CustomRecoveryTooltip />} 
            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} 
          />
          <Bar 
            dataKey="recovery" 
            radius={[6, 6, 0, 0]}
            strokeWidth={1}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.recoveryColor}
                stroke={entry.recoveryColor}
                opacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      );
    }
  };

  // Format date for display
  const formatDateForMessage = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Chart Card */}
      <div className="whoops-card min-h-[500px]" style={{ // ✅ Added min-height
        background: 'var(--card-bg)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {/* Enhanced Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{getChartTitle()}</h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {activeView === 'comparison' 
                ? `Recovery metrics comparison for ${formatDateForMessage(selectedDate)}` 
                : "Track your recovery trends and physiological markers"
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <TimePeriodSelector 
              selectedPeriod={timePeriod} 
              onPeriodChange={onTimePeriodChange} 
            />
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'comparison' ? (
          // Original single-day comparison view
          <div className="flex flex-col h-full">
            <div className="p-6 pb-0 flex-grow">
              {/* Date comparison info */}
              <div className="mb-6">
                <p className="text-[var(--text-secondary)] mt-1 flex items-center text-sm">
                  <span style={{ color: chartColors.current, fontWeight: 500 }}>{formattedDates.current}</span>
                  <span className="text-[var(--text-secondary)] mx-1.5"> vs </span>
                  <span style={{ color: chartColors.baseline, fontWeight: 500 }}>{formattedDates.comparison || 'baseline'}</span>
                </p>
              </div>
              
              {/* Optimized chart container */}
              <div 
                className="relative h-[280px] px-2"
                style={{
                  backgroundImage: `linear-gradient(0deg, ${chartColors.gridLines} 1px, transparent 1px)`,
                  backgroundSize: "100% 20%",
                  backgroundPosition: "bottom"
                }}
              >
                {/* Comparison bars */}
                <div className="absolute inset-0 flex items-end justify-between px-12">
                  {/* HRV */}
                  <div 
                    className="flex flex-col items-center w-1/3"
                    onMouseEnter={() => setHoveredMetric('hrv')}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    <div className="flex items-end h-[280px] gap-4 md:gap-6 mb-2 relative">
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out transform hover:scale-105 hover:brightness-110"
                          style={{ 
                            height: `${(metrics.hrv.current / maxValue) * 280}px`,
                            background: chartColors.currentGradient,
                            boxShadow: hoveredMetric === 'hrv' ? 
                              `0 0 15px rgba(92, 142, 169, 0.4), inset 0 0 0 1px rgba(255,255,255,0.2)` : 
                              `0 3px 8px rgba(92, 142, 169, 0.2), inset 0 0 0 1px rgba(255,255,255,0.1)`
                          }}
                        >
                          <div className="text-center -mt-8 font-bold text-[var(--text-primary)]">
                            {metrics.hrv.current}
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-full w-px bg-gray-600/30 mx-2"></div>
                      
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out"
                          style={{ 
                            height: `${(metrics.hrv.baseline / maxValue) * 280}px`,
                            background: chartColors.baselineGradient,
                            opacity: hoveredMetric === 'hrv' ? 0.7 : 0.5,
                            boxShadow: hoveredMetric === 'hrv' ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' : 'none'
                          }}
                        >
                          <div className="text-center -mt-8 font-bold text-[var(--text-secondary)]">
                            {metrics.hrv.baseline}
                          </div>
                        </div>
                      </div>
                      
                      {hoveredMetric === 'hrv' && (
                        <div 
                          className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2 border border-gray-700/30 z-10"
                          style={{ animation: 'fadeIn 0.2s ease-out' }}
                        >
                          <span className={metrics.hrv.current > metrics.hrv.baseline ? 'text-green-400' : 'text-red-400'}>
                            {metrics.hrv.current > metrics.hrv.baseline ? '↑' : '↓'} 
                            {Math.abs(getPercentChange(metrics.hrv.current, metrics.hrv.baseline))}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Resting HR */}
                  <div 
                    className="flex flex-col items-center w-1/3"
                    onMouseEnter={() => setHoveredMetric('restingHr')}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    <div className="flex items-end h-[280px] gap-4 md:gap-6 mb-2 relative">
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out transform hover:scale-105 hover:brightness-110"
                          style={{ 
                            height: `${(metrics.restingHr.current / maxValue) * 280}px`,
                            background: chartColors.currentGradient,
                            boxShadow: hoveredMetric === 'restingHr' ? 
                              `0 0 15px rgba(92, 142, 169, 0.4), inset 0 0 0 1px rgba(255,255,255,0.2)` : 
                              `0 3px 8px rgba(92, 142, 169, 0.2), inset 0 0 0 1px rgba(255,255,255,0.1)`
                          }}
                        >
                          <div className="text-center -mt-8 font-bold text-[var(--text-primary)]">
                            {metrics.restingHr.current}
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-full w-px bg-gray-600/30 mx-2"></div>
                      
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out"
                          style={{ 
                            height: `${(metrics.restingHr.baseline / maxValue) * 280}px`,
                            background: chartColors.baselineGradient,
                            opacity: hoveredMetric === 'restingHr' ? 0.7 : 0.5,
                            boxShadow: hoveredMetric === 'restingHr' ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' : 'none'
                          }}
                        >
                          <div className="text-center -mt-8 font-bold text-[var(--text-secondary)]">
                            {metrics.restingHr.baseline}
                          </div>
                        </div>
                      </div>
                      
                      {hoveredMetric === 'restingHr' && (
                        <div 
                          className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2 border border-gray-700/30 z-10"
                          style={{ animation: 'fadeIn 0.2s ease-out' }}
                        >
                          <span className={metrics.restingHr.current < metrics.restingHr.baseline ? 'text-green-400' : 'text-red-400'}>
                            {metrics.restingHr.current < metrics.restingHr.baseline ? '↓' : '↑'} 
                            {Math.abs(getPercentChange(metrics.restingHr.current, metrics.restingHr.baseline))}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Sleep Performance */}
                  <div 
                    className="flex flex-col items-center w-1/3"
                    onMouseEnter={() => setHoveredMetric('sleepPerformance')}
                    onMouseLeave={() => setHoveredMetric(null)}
                  >
                    <div className="flex items-end h-[280px] gap-4 md:gap-6 mb-2 relative">
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out transform hover:scale-105 hover:brightness-110"
                          style={{ 
                            height: `${(metrics.sleepPerformance.current / maxValue) * 280}px`,
                            background: chartColors.currentGradient,
                            boxShadow: hoveredMetric === 'sleepPerformance' ? 
                              `0 0 15px rgba(92, 142, 169, 0.4), inset 0 0 0 1px rgba(255,255,255,0.2)` : 
                              `0 3px 8px rgba(92, 142, 169, 0.2), inset 0 0 0 1px rgba(255,255,255,0.1)`
                          }}
                        >
                          <div className="text-center -mt-8 font-bold text-[var(--text-primary)]">
                            {metrics.sleepPerformance.current}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-full w-px bg-gray-600/30 mx-2"></div>
                      
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-12 md:w-16 rounded-t transition-all duration-500 ease-out"
                          style={{ 
                            height: `${(metrics.sleepPerformance.baseline / maxValue) * 280}px`,
                            background: chartColors.baselineGradient,
                            opacity: hoveredMetric === 'sleepPerformance' ? 0.7 : 0.5,
                            boxShadow: hoveredMetric === 'sleepPerformance' ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' : 'none'
                          }}
                        >
                          <div className="text-center -mt-8 font-bold text-[var(--text-secondary)]">
                            {metrics.sleepPerformance.baseline}%
                          </div>
                        </div>
                      </div>
                      
                      {hoveredMetric === 'sleepPerformance' && (
                        <div 
                          className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-[var(--card-bg)] px-3 py-1.5 rounded-md shadow-lg flex items-center gap-2 border border-gray-700/30 z-10"
                          style={{ animation: 'fadeIn 0.2s ease-out' }}
                        >
                          <span className={metrics.sleepPerformance.current > metrics.sleepPerformance.baseline ? 'text-green-400' : 'text-red-400'}>
                            {metrics.sleepPerformance.current > metrics.sleepPerformance.baseline ? '↑' : '↓'} 
                            {Math.abs(getPercentChange(metrics.sleepPerformance.current, metrics.sleepPerformance.baseline))}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>  
              </div>
            </div>
            
            {/* Labels section */}
            <div className="grid grid-cols-3 gap-8 mt-2 px-12 py-4 border-t border-gray-800/10">
              <div className="text-center text-[var(--text-primary)] font-medium flex items-center justify-center gap-2">
                <Heart size={16} className="text-[#4D94BB]" />
                Heart Rate Variability
              </div>
              <div className="text-center text-[var(--text-primary)] font-medium flex items-center justify-center gap-2">
                <TrendingUp size={16} className="text-[#4D94BB]" />
                Resting Heart Rate
              </div>
              <div className="text-center text-[var(--text-primary)] font-medium flex items-center justify-center gap-2">
                <Moon size={16} className="text-[#4D94BB]" />
                Sleep Performance
              </div>
            </div>
          </div>
        ) : (
          // Multi-period trend view
          <div className="flex-1 min-h-0 pt-4"> {/* ✅ Added flex container with padding */}
            {chartData.length > 0 ? (
              // ✅ IMPROVED: Better container with proper height management
              <div className="w-full" style={{ height: '420px' }}> {/* Fixed height instead of 450 */}
                <ResponsiveContainer width="100%" height="100%">
                  {renderTrendChart()}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-[var(--text-secondary)]">
                <div className="text-center">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                  <div>Loading recovery trend data...</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Animation styles */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}</style>
      </div>

      {/* Recovery Level Legend - Only show for multi-period views and make thinner */}
      {timePeriod !== '1d' && (
        <div className="flex items-center justify-center gap-6 p-3 bg-[var(--card-bg)]/30 border border-white/5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-3 rounded shadow-sm border border-white/10"
              style={{ 
                backgroundColor: RECOVERY_COLORS.high,
                boxShadow: `0 0 6px ${RECOVERY_COLORS.high}30`
              }}
            ></div>
            <span className="text-xs font-medium" style={{ color: RECOVERY_COLORS.high }}>
              High (67-100%)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-3 rounded shadow-sm border border-white/10"
              style={{ 
                backgroundColor: RECOVERY_COLORS.medium,
                boxShadow: `0 0 6px ${RECOVERY_COLORS.medium}30`
              }}
            ></div>
            <span className="text-xs font-medium" style={{ color: RECOVERY_COLORS.medium }}>
              Medium (34-66%)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-3 rounded shadow-sm border border-white/10"
              style={{ 
                backgroundColor: RECOVERY_COLORS.low,
                boxShadow: `0 0 6px ${RECOVERY_COLORS.low}30`
              }}
            ></div>
            <span className="text-xs font-medium" style={{ color: RECOVERY_COLORS.low }}>
              Low (0-33%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoveryComparisonChart;