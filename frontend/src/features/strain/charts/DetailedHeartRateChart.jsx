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
  AreaChart,
} from 'recharts';
import { Activity, Heart, TrendingUp, Clock, Zap, Calendar } from 'lucide-react';

import TimePeriodSelector from '../../../components/charts/TimePeriodSelector';
import whoopData from '../../../data/day_wise_whoop_data.json';

const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Check if there are actual activities (workouts) for the selected date
const hasActivitiesForDate = (selectedDate) => {
  // Format the selected date to match the JSON keys (YYYY-MM-DD)
  const dateStr = selectedDate.toLocaleDateString('en-CA'); // This gives YYYY-MM-DD format
  const dayData = whoopData[dateStr];
  
  if (!dayData || !dayData.workouts || dayData.workouts.length === 0) {
    return false;
  }
  
  // Check if there are actual workouts with meaningful activity
  const realWorkouts = dayData.workouts.filter(workout => 
    workout["Activity name"] && 
    workout["Activity name"].toLowerCase() !== "idle" &&
    workout["Duration (min)"] && 
    workout["Duration (min)"] > 0
  );
  
  return realWorkouts.length > 0;
};

// Get activity data for the selected date
const getActivitiesForDate = (selectedDate) => {
  // Format the selected date to match the JSON keys (YYYY-MM-DD)
  const dateStr = selectedDate.toLocaleDateString('en-CA'); // This gives YYYY-MM-DD format
  const dayData = whoopData[dateStr];
  
  if (!dayData || !dayData.workouts) {
    return [];
  }
  
  return dayData.workouts.filter(workout => 
    workout["Activity name"] && 
    workout["Activity name"].toLowerCase() !== "idle" &&
    workout["Duration (min)"] && 
    workout["Duration (min)"] > 0
  );
};

// Enhanced HR data generation - only for workout periods with per-minute data
const generateHrDataForDate = (selectedDate) => {
  // Format the selected date to match the JSON keys (YYYY-MM-DD)
  const dateStr = selectedDate.toLocaleDateString('en-CA'); // This gives YYYY-MM-DD format
  const dayData = whoopData[dateStr];
  
  if (!hasActivitiesForDate(selectedDate)) {
    return [];
  }
  
  const data = [];
  const activities = getActivitiesForDate(selectedDate);
  
  // Generate HR data for each workout period
  activities.forEach((workout, workoutIndex) => {
    // Parse the workout start time correctly
    const startTime = new Date(workout["Workout start time"]);
    const endTime = new Date(workout["Workout end time"]);
    const duration = workout["Duration (min)"] || 60;
    const maxHr = workout["Max HR (bpm)"] || 150;
    const avgHr = workout["Average HR (bpm)"] || 120;
    
    // Verify that the workout times are on the correct date
    const workoutDate = startTime.toLocaleDateString('en-CA');
    if (workoutDate !== dateStr) {
      console.warn(`Workout date mismatch: Expected ${dateStr}, got ${workoutDate}`);
    }
    
    // Generate data points every minute during workout for more angular curves
    for (let i = 0; i <= duration; i += 1) {
      const currentTime = new Date(startTime.getTime() + i * 60 * 1000);
      
      if (currentTime > endTime) break;
      
      // Create more angular HR patterns during workout
      let hr;
      const progressRatio = i / duration;
      
      if (progressRatio < 0.1) {
        // Warm-up phase - gradual increase
        hr = avgHr * 0.7 + (progressRatio * 10) * 15 + Math.random() * 8;
      } else if (progressRatio < 0.8) {
        // Main workout phase - more angular variations
        const intensity = Math.sin(progressRatio * Math.PI * 4) * 25;
        const spikes = Math.random() > 0.7 ? Math.random() * 20 : 0; // Random spikes
        hr = avgHr + intensity + spikes;
      } else {
        // Cool-down phase - sharp decline
        const cooldownProgress = (progressRatio - 0.8) / 0.2;
        hr = avgHr * (1 - cooldownProgress * 0.3) + Math.random() * 5;
      }
      
      // Ensure HR stays within realistic bounds
      hr = Math.max(80, Math.min(maxHr, Math.round(hr)));
      
      const getHrZone = (heartRate) => {
        if (heartRate < 100) return { zone: 'Rest', color: '#22C55E' };
        if (heartRate < 120) return { zone: 'Fat Burn', color: '#FBBF24' };
        if (heartRate < 140) return { zone: 'Cardio', color: '#F97316' };
        if (heartRate < 160) return { zone: 'Peak', color: '#EF4444' };
        return { zone: 'Max', color: '#DC2626' };
      };

      const hrZone = getHrZone(hr);

      data.push({
        time: currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(' ', ''),
        hr: hr,
        fullTime: currentTime,
        zone: hrZone.zone,
        zoneColor: hrZone.color,
        percentMax: Math.round((hr / 185) * 100),
        activity: workout["Activity name"],
        workoutIndex: workoutIndex
      });
    }
  });
  
  return data.sort((a, b) => a.fullTime - b.fullTime);
};

// Enhanced strain data generation with real data integration
const generateStrainDataForPeriod = (selectedDate, duration) => {
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
  let sundayCount = 0; // Counter for Sundays encountered

  while (currentDate <= endDate) {
    // Use the same date formatting method for consistency
    const dateStr = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const dayData = whoopData[dateStr];
    
    let strain = 0;
    let recovery = 75;
    
    if (dayData) {
      strain = dayData.physiological_summary?.["Day Strain"] || 0;
      recovery = dayData.physiological_summary?.["Recovery score %"] || Math.random() * 40 + 60;
    } else {
      // Generate realistic data if no real data available
      strain = Math.random() * 15;
      recovery = Math.random() * 40 + 60;
    }

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

    // Track Sunday count for 6m view
    const dataPoint = {
      name: formatDate(currentDate, `${duration}-format`),
      strain: parseFloat(strain.toFixed(1)),
      recovery: Math.round(recovery),
      fullDate: new Date(currentDate),
      strainLevel: strain > 15 ? 'High' : strain > 8 ? 'Moderate' : strain > 0 ? 'Low' : 'Rest'
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

// Enhanced HR Tooltip
const CustomHrTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[var(--card-bg)] border border-white/10 text-white p-4 rounded-lg shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Heart size={16} className="text-red-400" />
          <span className="font-semibold text-lg">{data.hr} BPM</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Time:</span>
            <span>{data.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Activity:</span>
            <span className="text-[var(--strain-blue)]">{data.activity}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">% Max:</span>
            <span>{data.percentMax}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Enhanced Strain Tooltip
const CustomStrainTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[var(--card-bg)] border border-white/10 text-white p-4 rounded-lg shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={16} className="text-[#0093E7]" />
          <span className="font-semibold">{label}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Strain:</span>
            <span className="font-medium" style={{ color: '#0093E7' }}>{payload[0].value.toFixed(1)}</span>
          </div>
          {data.recovery && (
            <div className="flex justify-between">
              <span className="text-gray-400">Recovery:</span>
              <span className="font-medium">{data.recovery}%</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Level:</span>
            <span className="font-medium">{data.strainLevel}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Enhanced X-Axis Tick
const CustomXAxisTick = ({ x, y, payload, activeDuration }) => {
  if (['3m', '6m'].includes(activeDuration)) {
    if (!payload.value || !payload.value.includes('Sun')) {
      return null;
    }
    
    if (activeDuration === '6m') {
      // For 6-month view, show every other Sunday using the sundayIndex
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
  
  if ((activeDuration === '2w' || activeDuration === '1w' || activeDuration === '1m') && 
      payload.value && payload.value.includes('\n')) {
    
    if (activeDuration === '1m') {
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
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="500">
        {payload.value}
      </text>
    </g>
  );
};

const DetailedHeartRateChart = ({ selectedDate }) => {
  // State management - Remove internal selectedDate state
  const [activeView, setActiveView] = useState('heartRate');
  
  // HR Chart States
  const [hrData, setHrData] = useState([]);
  const [hasActivities, setHasActivities] = useState(false);
  const [activities, setActivities] = useState([]);
  
  // Strain Chart States
  const [strainData, setStrainData] = useState([]);
  
  // Shared State
  const [activeDuration, setActiveDuration] = useState('1d');
  
  const durationOptions = ['1d', '1w', '2w', '1m', '3m', '6m'];
  const strainYTicks = [0, 4, 8, 12, 16, 20];
  const hrYTicks = [60, 80, 100, 120, 140, 160, 180];

  const handlePeriodChange = (period) => {
    setActiveDuration(period);
  };

  // Update data when selectedDate prop or duration changes
  useEffect(() => {
    if (activeDuration === '1d') {
      setActiveView('heartRate');
      const hasWorkouts = hasActivitiesForDate(selectedDate);
      setHasActivities(hasWorkouts);
      
      if (hasWorkouts) {
        setHrData(generateHrDataForDate(selectedDate));
        setActivities(getActivitiesForDate(selectedDate));
      } else {
        setHrData([]);
        setActivities([]);
      }
    } else if (['1w', '2w', '1m', '3m', '6m'].includes(activeDuration)) {
      setActiveView('dayStrain');
      setStrainData(generateStrainDataForPeriod(selectedDate, activeDuration));
    }
  }, [selectedDate, activeDuration]);

  const formatXAxisHr = (tickItem, index) => {
    // ✅ UPDATED: Show only every 5th time label (skip 4 in between)
    if (index % 5 === 0) {
      return tickItem;
    }
    return ''; // Hide this label
  };

  const formatXAxisStrain = (value, index) => {
    const tickItem = String(value);

    if (activeView === 'dayStrain') {
      if (['2w', '1w', '1m'].includes(activeDuration)) {
        return '';
      }
      
      if (['3m', '6m'].includes(activeDuration)) {
        return tickItem;
      }
    }
    
    return tickItem;
  };

  const getStrainChartTitle = () => {
    switch (activeDuration) {
      case '1w': return "Weekly Strain Overview";
      case '2w': return "2-Week Strain Analysis";
      case '1m': return "Monthly Strain Trends";
      case '3m': return "3-Month Strain Progress";
      case '6m': return "6-Month Strain History";
      default: return "Strain Analysis";
    }
  };

  // Format date for no activities message
  const formatDateForMessage = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };

  const renderStrainChart = () => {
    const chartMargin = { 
      top: 10,        // ✅ Reduced from 20
      right: 20,      // ✅ Reduced from 30
      left: 40,       // ✅ Increased for better Y-axis spacing
      bottom: (activeDuration === '2w' || activeDuration === '1w' || activeDuration === '1m') ? 60 : 45 // ✅ Optimized
    };

    if (['3m', '6m'].includes(activeDuration)) {
      return (
        <AreaChart data={strainData} margin={chartMargin}>
          <defs>
            <linearGradient id="strainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0093E7" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#0093E7" stopOpacity={0.1}/>
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
            tick={(props) => <CustomXAxisTick {...props} activeDuration={activeDuration} />}
            tickFormatter={formatXAxisStrain}
            height={70}
            interval={0}
          />
          <YAxis 
            domain={[0, 20]} 
            ticks={strainYTicks} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => value.toFixed(0)}
            tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }}
            width={35} // ✅ Reduced from 50
          />
          <RechartsTooltip 
            content={<CustomStrainTooltip />} 
            cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1.5 }} 
          />
          <Area 
            type="monotone" 
            dataKey="strain" 
            stroke="#0093E7"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#strainGradient)"
            activeDot={{ r: 6, fill: '#0093E7', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      );
    } else {
      return (
        <BarChart 
          data={strainData} 
          margin={chartMargin} 
          barCategoryGap="10%" // ✅ Reduced for better space utilization
          maxBarSize={60}      // ✅ Added to prevent bars from getting too wide
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0093E7" stopOpacity={1}/>
              <stop offset="100%" stopColor="#006BB3" stopOpacity={1}/>
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
            tick={(props) => <CustomXAxisTick {...props} activeDuration={activeDuration} />}
            tickFormatter={formatXAxisStrain}
            height={(activeDuration === '2w' || activeDuration === '1w' || activeDuration === '1m') ? 70 : 40}
            interval={activeDuration === '1m' ? 1 : 0}
          />
          <YAxis 
            domain={[0, 20]} 
            ticks={strainYTicks} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => value.toFixed(0)}
            tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }}
            width={35} // ✅ Reduced from 50
          />
          <RechartsTooltip 
            content={<CustomStrainTooltip />} 
            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} 
          />
          <Bar 
            dataKey="strain" 
            fill="url(#barGradient)" 
            radius={[6, 6, 0, 0]}
            stroke="#006BB3"
            strokeWidth={1}
          />
        </BarChart>
      );
    }
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
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {activeView === 'heartRate' 
                ? (hasActivities 
                    ? `Heart rate monitoring for ${formatDateForMessage(selectedDate)}` 
                    : `Activity tracking for ${formatDateForMessage(selectedDate)}`
                  )
                : "Track your daily strain and recovery patterns"
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <TimePeriodSelector 
              selectedPeriod={activeDuration} 
              onPeriodChange={handlePeriodChange} 
            />
          </div>
        </div>

        {activeView === 'heartRate' ? (
          <div className="flex-1 min-h-0 pt-4"> {/* ✅ Added flex container with padding */}
            {hasActivities ? (
              // ✅ IMPROVED: Better container with proper height management
              <div className="w-full" style={{ height: '420px' }}> {/* Fixed height instead of 450 */}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={hrData}
                    margin={{ 
                      top: 10,     // ✅ Reduced from default
                      right: 20,   // ✅ Reduced from 30
                      left: 40,    // ✅ Increased for better spacing
                      bottom: 45   // ✅ Reduced from 50
                    }}
                  >
                    <defs>
                      <linearGradient id="hrAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      horizontal={true} 
                      vertical={false} 
                      stroke="rgba(255, 255, 255, 0.08)" 
                      strokeDasharray="2 4"
                    />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatXAxisHr}
                      interval={0} // ✅ CHANGED: Show all ticks instead of "preserveStartEnd"
                      tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }} // ✅ Increased font size back
                      padding={{ left: 10, right: 10 }}
                      height={40} // ✅ Reduced height since no angled text
                    />
                    <YAxis
                      domain={[60, 180]}
                      ticks={hrYTicks}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }}
                      width={35} // ✅ Reduced from default
                    />
                    <RechartsTooltip 
                      content={<CustomHrTooltip />} 
                      cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1.5 }} 
                    />
                    <Area 
                      type="linear"
                      dataKey="hr" 
                      strokeWidth={0} 
                      fillOpacity={1} 
                      fill="url(#hrAreaGradient)" 
                    />
                    <Line 
                      type="linear"
                      dataKey="hr" 
                      stroke="#3B82F6" 
                      strokeWidth={2.5} 
                      dot={false} 
                      activeDot={{ r: 6, fill: '#3B82F6', stroke: 'white', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-[var(--text-secondary)]">
                <div className="text-center">
                  <Calendar size={64} className="mx-auto mb-6 opacity-40" />
                  <div className="text-xl font-medium text-[var(--text-primary)] mb-2">
                    No activities on {formatDateForMessage(selectedDate).split(',')[1].trim()}
                  </div>
                  <div className="text-sm mb-4 max-w-md mx-auto">
                    Heart rate data is only shown for days with recorded workouts or activities.
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Try selecting a different date or record a new activity
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 pt-4"> {/* ✅ Added flex container with padding */}
            {strainData.length > 0 ? (
              // ✅ IMPROVED: Better container with proper height management
              <div className="w-full" style={{ height: '420px' }}> {/* Fixed height instead of 450 */}
                <ResponsiveContainer width="100%" height="100%">
                  {renderStrainChart()}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-[var(--text-secondary)]">
                <div className="text-center">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <div>Loading strain data...</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activities Summary - Below the chart card */}
      {activeView === 'heartRate' && hasActivities && activities.length > 0 && (
        <div className="whoops-card">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-[var(--strain-blue)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {activities.length} Activity{activities.length > 1 ? 'ies' : ''} on {formatDateForMessage(selectedDate).split(',')[1].trim()}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activities.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center gap-1 text-xs px-3 py-2 rounded-md"
                style={{ 
                  backgroundColor: 'var(--bg-subcard)',
                  color: 'var(--strain-blue)' 
                }}
              >
                <span className="font-medium">{activity["Activity name"]}</span>
                <span className="text-[var(--text-muted)]">•</span>
                <span>{activity["Duration (min)"]}min</span>
                <span className="text-[var(--text-muted)]">•</span>
                <span className="text-red-400">{activity["Max HR (bpm)"]} BPM max</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedHeartRateChart;