import React, { useState, useEffect } from 'react';
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
  Legend,
  AreaChart,
} from 'recharts';

// Import the TimePeriodSelector component instead of using custom DurationButton
import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';
import { Switch } from '../../../components/ui/switch';

// Define the cn utility function if not imported
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Sample data generation for Heart Rate
const generateHrData = () => {
  const data = [];
  const startTime = new Date();
  startTime.setHours(17, 45, 0, 0); // 5:45 PM

  for (let i = 0; i < 61; i++) { // 61 points for 1 hour
    const currentTime = new Date(startTime.getTime() + i * 60 * 1000);
    let hr = 80 + Math.random() * 40;
    if (i > 10 && i < 25) hr += Math.random() * 20;
    if (i > 40 && i < 55) hr -= Math.random() * 10;
    hr = Math.max(50, Math.min(160, Math.round(hr)));

    data.push({
      time: currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(' ', ''),
      hr: hr,
      fullTime: currentTime,
    });
  }
  return data;
};

const DEMO_STRAIN_END_DATE = new Date(2025, 4, 5); // May 5, 2025 (month is 0-indexed)

// Helper functions for date manipulation
const subDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const subMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
};

const eachDayOfInterval = ({ start, end }) => {
  const days = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const format = (date, formatStr) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (formatStr === 'EEE MMM d') {
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
  } else if (formatStr === 'EEE\nMMM d' || formatStr === '1m-format') {
    return `${days[date.getDay()]}\n${months[date.getMonth()]} ${date.getDate()}`;
  } else if (formatStr === '2w-format') {
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNumber = date.getDate();
    return `${dayName}\n${monthName} ${dayNumber}`;
  } else if (formatStr === '3m-format' || formatStr === '6m-format') {
    // Updated format for 3M and 6M: Day name on top, Month + Day on bottom
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNumber = date.getDate();
    // Only showing Sundays, so we'll format specifically for Sunday
    return `${dayName}\n${monthName} ${dayNumber}`;
  }
  return date.toLocaleDateString();
};

const parse = (dateStr, formatStr, baseDate) => {
  return new Date(dateStr);
};

// Sample data generation for Day Strain
const generateStrainData = (duration) => {
  let startDate;
  const endDate = DEMO_STRAIN_END_DATE;

  // Set the start date based on duration
  switch (duration) {
    case '1w':
      startDate = subDays(endDate, 6);
      break;
    case '2w':
      startDate = subDays(endDate, 13);
      break;
    case '1m':
      startDate = subDays(endDate, 29); // Approx 1 month
      break;
    case '3m':
      startDate = subMonths(endDate, 3);
      break;
    case '6m':
      startDate = subMonths(endDate, 6);
      break;
    default:
      return []; // Return empty for unsupported durations
  }

  const daysArray = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Mimic image data for '1w' if possible, otherwise random
  if (duration === '1w') {
    const specificStrainData = [
      { date: '2025-04-29', strain: 0.0 }, // Tue Apr 29
      { date: '2025-04-30', strain: 10.8 }, // Wed Apr 30
      { date: '2025-05-01', strain: 7.5 },  // Thu May 1
      { date: '2025-05-02', strain: 7.5 },  // Fri May 2
      { date: '2025-05-03', strain: 2.1 },  // Sat May 3
      { date: '2025-05-04', strain: 7.0 },  // Sun May 4
      { date: '2025-05-05', strain: 11.6 }, // Mon May 5
    ];
    return specificStrainData.map(item => ({
      name: format(parse(item.date, 'yyyy-MM-dd', new Date()), '2w-format'), // Use the same format as 2w
      strain: item.strain,
      fullDate: parse(item.date, 'yyyy-MM-dd', new Date()),
    }));
  }

  // For 3m and 6m, filter to show only Sundays
  if (duration === '3m' || duration === '6m') {
    // First, get all days in the interval
    let sundayCounter = 0; // To track which Sunday this is
    
    const allDays = daysArray.map(day => {
      // Generate random strain data
      const dayOfMonth = day.getDate();
      const weekOfMonth = Math.floor(dayOfMonth / 7);
      const isSunday = day.getDay() === 0;
      
      // Increment Sunday counter if this is a Sunday
      if (isSunday) {
        sundayCounter++;
      }
      
      const isBreakWeek = (weekOfMonth % 4 === 3) || 
                        (duration === '6m' && day < subMonths(endDate, 5) && day > subMonths(endDate, 5.5));
      
      let strain = 0;
      if (!isBreakWeek) {
        const baseStrain = Math.random() * 9 + 3;
        const isSpike = Math.random() > 0.9; 
        strain = isSpike ? Math.min(14, baseStrain * 1.3) : baseStrain;
        
        if (Math.random() > 0.92) {
          strain = 0;
        }
      }
      
      return {
        name: format(day, `${duration}-format`),
        strain: parseFloat(strain.toFixed(1)),
        fullDate: day,
        isSunday: isSunday,
        // Add Sunday index (0-based) to help with filtering for 6M
        sundayIndex: isSunday ? sundayCounter - 1 : undefined
      };
    });
    
    // Return all days for data rendering, but we'll handle display in CustomXAxisTick
    return allDays;
  }

  // For other durations (2w, 1m)
  return daysArray.map((day, index) => ({
    name: format(day, 
      duration === '2w' ? '2w-format' : 
      (duration === '1m' ? '1m-format' : 'EEE MMM d')
    ),
    strain: parseFloat((Math.random() * 10 + 2).toFixed(1)),
    fullDate: day,
    index: index
  }));
};

// Custom Tooltip Component for HR
const CustomHrTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-blue-600 text-white p-3 rounded-md shadow-lg">
        <p className="text-lg font-semibold">{`${data.hr} bpm`}</p>
        <p className="text-sm">{`${data.time}`}</p>
      </div>
    );
  }
  return null;
};

// Custom Legend for Strain Chart
const CustomStrainLegend = () => {
  return (
    <div className="flex justify-center items-center space-x-4 mt-3 mb-1">
      <div className="flex items-center space-x-1">
        <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
        <span className="text-xs text-gray-500">Activities</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
        <span className="text-xs text-gray-500">Selection</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-2.5 h-2.5 bg-gray-400 rounded-sm"></div>
        <span className="text-xs text-gray-500">Day Strain</span>
      </div>
    </div>
  );
};

const CustomStrainTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 text-white p-2 rounded-md shadow-lg">
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-base">{`Strain: ${payload[0].value.toFixed(1)}`}</p>
      </div>
    );
  }
  return null;
};

// Custom multi-line tick component for 2W period
const CustomXAxisTick = ({ x, y, payload, activeDuration }) => {
  // For 3m and 6m, only show Sunday labels
  if (['3m', '6m'].includes(activeDuration)) {
    // Only show if it's a Sunday
    if (!payload.value || !payload.value.includes('Sun')) {
      return null;
    }
    
    // For 6m, show alternating Sundays
    if (activeDuration === '6m') {
      const isSunday = payload.payload && 
                      payload.payload.fullDate && 
                      payload.payload.fullDate.getDay() === 0;
      
      if (isSunday && payload.payload.sundayIndex !== undefined) {
        if (payload.payload.sundayIndex % 2 !== 0) {
          return null;
        }
      }
    }
    
    const [daySun, monthDay] = payload.value.split('\n');
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={12} textAnchor="middle" fill="white" fontSize="10" fontWeight="500">
          {daySun}
        </text>
        <text x={0} y={0} dy={26} textAnchor="middle" fill="white" fontSize="10" fontWeight="500">
          {monthDay}
        </text>
      </g>
    );
  }
  
  // For 1m, 2w, 1w with \n format
  if ((activeDuration === '2w' || activeDuration === '1w' || activeDuration === '1m') && 
      payload.value && payload.value.includes('\n')) {
    
    // For 1M, only show labels for alternate days
    if (activeDuration === '1m') {
      const dataIndex = payload.index;
      if (dataIndex !== undefined && dataIndex % 2 !== 0) {
        return null;
      }
    }
    
    const [dayName, monthDate] = payload.value.split('\n');
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={12} textAnchor="middle" fill="white" fontSize="10" fontWeight="500">
          {dayName}
        </text>
        <text x={0} y={0} dy={26} textAnchor="middle" fill="white" fontSize="10" fontWeight="500">
          {monthDate}
        </text>
      </g>
    );
  }
  
  // Default single line for other durations
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="white" fontSize="12" fontWeight="500">
        {payload.value}
      </text>
    </g>
  );
};

const DetailedHeartRateChart = () => {
  const [activeView, setActiveView] = useState('heartRate');
  
  // HR Chart States
  const [hrData, setHrData] = useState(generateHrData());
  const [timeToggle, setTimeToggle] = useState(true);
  const [rawHrToggle, setRawHrToggle] = useState(true);
  const [durationToggle, setDurationToggle] = useState(false);
  const [percentMaxToggle, setPercentMaxToggle] = useState(false);

  // Strain Chart States
  const [strainData, setStrainData] = useState([]);
  
  // Shared State
  const [activeDuration, setActiveDuration] = useState('1d'); // Default for HR
  
  const durationOptions = ['1d', '1w', '2w', '1m', '3m', '6m']; // Reordered to match TimePeriodSelector
  const strainYTicks = [0, 8, 12, 14, 16, 18, 20, 21];
  const hrYTicks = [0, 25, 50, 75, 100, 125, 150, 175];

  // Handle period change from TimePeriodSelector
  const handlePeriodChange = (period) => {
    setActiveDuration(period);
  };

  useEffect(() => {
    // Set view based on duration
    if (activeDuration === '1d') {
      setActiveView('heartRate');
    } else if (['1w', '2w', '1m', '3m', '6m'].includes(activeDuration)) {
      setActiveView('dayStrain');
      setStrainData(generateStrainData(activeDuration));
    }
  }, [activeDuration]);

  // Format X-axis ticks for HR chart
  const formatXAxisHr = (tickItem) => {
    const minute = parseInt(tickItem.split(':')[1].substring(0,2), 10);
    if (minute % 15 === 0) {
      return tickItem;
    }
    return '';
  };

  // Determine which days should show labels for 2W
  const shouldShowDayLabel = (index, total) => {
    if (activeDuration === '2w') {
      // Show all days for 2W
      return true;
    }
    return true; // Show all for other periods too
  };
  // Format X-axis ticks for longer duration charts (3m, 6m) for Strain
  const formatXAxisStrain = (value, index) => {
    const tickItem = String(value); // Ensure tickItem is a string

    if (activeView === 'dayStrain') {
      // For 2w, 1w, and 1m, don't show default labels
      if (['2w', '1w', '1m'].includes(activeDuration)) {
        return '';
      }
      
      // For 3m and 6m, we'll handle display in CustomXAxisTick
      if (['3m', '6m'].includes(activeDuration)) {
        return tickItem; // Pass the value to CustomXAxisTick which will filter
      }
    }
    
    // Default behavior
    return tickItem;
  };

  const getStrainChartTitle = () => {
    switch (activeDuration) {
      case '1w': return "1 Week Day Strain";
      case '2w': return "2 Week Day Strain";
      case '1m': return "1 Month Day Strain";
      case '3m': return "3 Months Day Strain";
      case '6m': return "6 Months Day Strain";
      default: return "Day Strain"; // Should not happen if UI restricts options
    }
  };

  // Determine chart type based on duration
  const renderStrainChart = () => {
    if (['3m', '6m'].includes(activeDuration)) {
      // For longer durations, use AreaChart
      return (
        <AreaChart 
          data={strainData} 
          margin={{ top: 20, right: 30, left: 10, bottom: 70 }}
        >
          <defs>
            <linearGradient id="colorUvStrain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#93C5FD" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#93C5FD" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={true} vertical={false} stroke="#E5E7EB" strokeDasharray="3 3"/>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={(props) => <CustomXAxisTick {...props} activeDuration={activeDuration} />}
            tickFormatter={formatXAxisStrain}
            height={70}
            interval={0}
          />
          <YAxis 
            domain={[0, 21]} 
            ticks={strainYTicks} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => value.toFixed(1)}
            tick={{ fontSize: 12, fill: '#0093E7', fontWeight: 500 }}
            width={50}
          />
          <RechartsTooltip content={<CustomStrainTooltip />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1.5 }} />
          <Area 
            type="monotone" 
            dataKey="strain" 
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUvStrain)"
            activeDot={{ r: 6, fill: '#3B82F6', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      );
    } else {
      // For shorter durations, use BarChart
      return (
        <BarChart 
          data={strainData} 
          margin={{ 
            top: 20, 
            right: 30, 
            left: 10, 
            bottom: (activeDuration === '2w' || activeDuration === '1w' || activeDuration === '1m') ? 80 : 50
          }}
          barCategoryGap="20%"
        >
          <CartesianGrid horizontal={true} vertical={false} stroke="#E5E7EB" strokeDasharray="3 3"/>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={(props) => <CustomXAxisTick {...props} activeDuration={activeDuration} />}
            tickFormatter={formatXAxisStrain}
            height={(activeDuration === '2w' || activeDuration === '1w' || activeDuration === '1m') ? 70 : 40}
            interval={activeDuration === '1m' ? 1 : 0}
          />
          <YAxis 
            domain={[0, 21]} 
            ticks={strainYTicks} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => value.toFixed(1)}
            tick={{ fontSize: 12, fill: '#0093E7', fontWeight: 500 }}
            width={50}
          />
          <RechartsTooltip content={<CustomStrainTooltip />} cursor={{ fill: 'rgba(209, 213, 219, 0.3)' }} />
          <Legend content={<CustomStrainLegend />} verticalAlign="bottom" />
          <Bar dataKey="strain" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto"> {/* Removed whoops-card class */}
      {/* Use TimePeriodSelector instead of custom duration buttons */}
      <div className="flex justify-end mb-6">
        <TimePeriodSelector 
          selectedPeriod={activeDuration} 
          onPeriodChange={handlePeriodChange} 
        />
      </div>

      {/* Content based on active duration */}
      {activeView === 'heartRate' ? (
        <div>
          {/* HR Specific Controls */}
          <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Duration</span>
              <Switch id="duration-toggle" checked={durationToggle} onCheckedChange={setDurationToggle} />
              <span className="text-sm font-medium text-[var(--text-secondary)]">Time</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="time-toggle" checked={timeToggle} onCheckedChange={setTimeToggle} />
              <span className="text-sm font-medium text-[var(--text-secondary)]">Raw HR</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="rawhr-toggle" checked={rawHrToggle} onCheckedChange={setRawHrToggle} />
              <span className="text-sm font-medium text-[var(--text-secondary)]">% of Max</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="percentmax-toggle" checked={percentMaxToggle} onCheckedChange={setPercentMaxToggle} />
            </div>
          </div>
          {/* HR Chart Section */}
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <LineChart
                data={hrData}
                margin={{ top: 20, right: 30, left: 10, bottom: 50 }}
              >
                <defs>
                  <linearGradient id="colorUvHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BFDBFE" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#BFDBFE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={true} vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatXAxisHr}
                  interval={0}
                  tick={{ fontSize: 12, fill: 'white', fontWeight: 500 }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  domain={[0, 175]}
                  ticks={hrYTicks}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#0093E7', fontWeight: 500 }}
                  width={50}
                />
                <RechartsTooltip content={<CustomHrTooltip />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1.5 }} />
                <Area type="monotone" dataKey="hr" strokeWidth={0} fillOpacity={1} fill="url(#colorUvHr)" />
                <Line type="monotone" dataKey="hr" stroke="#3B82F6" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#3B82F6', stroke: 'white', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 text-center">{getStrainChartTitle()}</h3>
          {strainData.length > 0 ? (
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                {renderStrainChart()}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-[var(--text-secondary)]">
              Loading strain data...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DetailedHeartRateChart;