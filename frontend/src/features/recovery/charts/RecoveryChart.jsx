import React, { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip,
  Cell
} from "recharts";
import { format, eachDayOfInterval, isSunday, subMonths, startOfToday } from "date-fns";

// Utility function for class name joining
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Generate data with Sunday intervals for 3m and 6m views
const generateData = (selectedPeriod) => {
  if (selectedPeriod === "3m" || selectedPeriod === "6m") {
    const today = startOfToday();
    const months = selectedPeriod === "3m" ? 3 : 6;
    const startDate = subMonths(today, months);
    
    // Get all days in the interval and filter for Sundays
    const allDays = eachDayOfInterval({
      start: startDate,
      end: today
    });
    
    const sundays = allDays.filter(day => isSunday(day));
    
    // Generate data points for each Sunday
    const data = [];
    
    sundays.forEach(sunday => {
      // Format the date as "Sun MMM d" (e.g., "Sun Feb 23")
      const formattedDate = `Sun ${format(sunday, 'MMM d')}`;
      
      // Generate 2-4 data points per Sunday
      const pointsCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < pointsCount; i++) {
        // Random value between 0-100, weighted to match distribution in screenshot
        let score;
        const rand = Math.random();
        if (rand < 0.5) {
          // 50% chance of being yellow (50-67%)
          score = Math.floor(Math.random() * 17) + 50;
        } else if (rand < 0.75) {
          // 25% chance of being green (67-100%)
          score = Math.floor(Math.random() * 33) + 67;
        } else {
          // 25% chance of being red (0-33%)
          score = Math.floor(Math.random() * 33);
        }
        
        data.push({
          date: format(sunday, 'MMM d'),  // Simple date format for internal use
          formattedDate: formattedDate,   // Full formatted date for display
          score
        });
      }
    });
    
    return data;
  } else {
    // For other time periods, use the original logic but update the data structure
    const dates = [
      "Feb 23", "Mar 2", "Mar 9", "Mar 16", "Mar 23", "Mar 30",
      "Apr 6", "Apr 13", "Apr 20", "Apr 27", "May 4", "May 11", "May 18"
    ];

    const data = [];
    
    dates.forEach(date => {
      const pointsCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < pointsCount; i++) {
        let score;
        const rand = Math.random();
        if (rand < 0.5) {
          score = Math.floor(Math.random() * 17) + 50;
        } else if (rand < 0.75) {
          score = Math.floor(Math.random() * 33) + 67;
        } else {
          score = Math.floor(Math.random() * 33);
        }
        
        data.push({
          date,
          formattedDate: date,
          score
        });
      }
    });

    return data;
  }
};

// Generate comparison data for bar chart
const generateComparisonData = () => {
  return [
    {
      name: "Heart Rate Variability",
      today: 60,
      yesterday: 65
    },
    {
      name: "Resting Heart Rate",
      today: 55,
      yesterday: 59
    },
    {
      name: "Sleep Performance",
      today: 80,
      yesterday: 75
    }
  ];
};

// Generate weekly data for 1w, 2w, and 1m views
const generateWeeklyData = (period = "1w") => {
  if (period === "1w") {
    return [
      {
        day: "Thu",
        date: "May 15",
        value: 72,
        color: "#7AE582" // green
      },
      {
        day: "Fri",
        date: "May 16",
        value: 70,
        color: "#7AE582" // green
      },
      {
        day: "Sat",
        date: "May 17",
        value: 85,
        color: "#7AE582" // green
      },
      {
        day: "Sun",
        date: "May 18",
        value: 20,
        color: "#FF6B6B" // red
      },
      {
        day: "Mon",
        date: "May 19",
        value: 52,
        color: "#FFE566" // yellow
      },
      {
        day: "Tue",
        date: "May 20",
        value: 70,
        color: "#7AE582" // green
      },
      {
        day: "Wed",
        date: "May 21",
        value: 49,
        color: "#FFE566" // yellow
      }
    ];
  } else if (period === "2w") {
    // 2 week data based on the image provided
    return [
      // First week (older data)
      {
        day: "Thu",
        date: "May 8",
        value: 75,
        color: "#7AE582" // green
      },
      {
        day: "Fri",
        date: "May 9",
        value: 60,
        color: "#FFE566" // yellow
      },
      // ...existing entries...
    ];
  } else if (period === "1m") {
    // Generate 1 month data (approximately 4 weeks)
    return [
      // Week 1
      {
        day: "Sun",
        date: "Apr 23",
        value: 65,
        color: "#FFE566" // yellow
      },
      // ...existing entries...
    ];
  }
  return [];
};

// Custom dot component for the chart
const CustomDot = (props) => {
  const { cx, cy, payload } = props;

  let color = "";
  if (payload.score >= 67) {
    color = "chart-green";
  } else if (payload.score >= 33) {
    color = "chart-yellow";
  } else {
    color = "chart-red";
  }

  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={5} 
      stroke="white" 
      strokeWidth={1} 
      className={`fill-${color}`} 
      style={{ opacity: 1 }}
    />
  );
};

// Time period options
const timePeriods = [
  { value: "6m", label: "6m" },
  { value: "3m", label: "3m", default: true },
  { value: "1m", label: "1m" },
  { value: "2w", label: "2w" },
  { value: "1w", label: "1w" },
  { value: "1d", label: "1d" },
];

const VIEW_TYPES = {
  LINE: "line",
  BAR: "bar",
  WEEKLY: "weekly"
};

// Simple Button component
const Button = ({ children, className, onClick }) => {
  return (
    <button 
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default function RecoveryChart({ userName = "Aftab Hussain" }) {
  const [selectedPeriod, setSelectedPeriod] = useState("3m");
  const [viewType, setViewType] = useState(VIEW_TYPES.LINE);
  const [chartData, setChartData] = useState([]);
  const comparisonData = generateComparisonData();
  const weeklyData = generateWeeklyData(selectedPeriod);
  
  const today = format(new Date(), 'MMMM d');
  const yesterday = format(new Date(Date.now() - 86400000), 'MMMM d');
  
  // Update chart data when period changes
  useEffect(() => {
    setChartData(generateData(selectedPeriod));
  }, [selectedPeriod]);
  
  // Automatically set the view type based on the selected period
  useEffect(() => {
    if (selectedPeriod === "1d") {
      setViewType(VIEW_TYPES.BAR);
    } else if (selectedPeriod === "1w" || selectedPeriod === "2w" || selectedPeriod === "1m") {
      setViewType(VIEW_TYPES.WEEKLY);
    } else {
      setViewType(VIEW_TYPES.LINE);
    }
  }, [selectedPeriod]);

  // Generate title based on selected period
  const getTitle = () => {
    switch(selectedPeriod) {
      case "1w": return "1 Week Recovery Score";
      case "2w": return "2 Weeks Recovery Score";
      case "1m": return "1 Month Recovery Score";
      case "3m": return "3 Month Recovery Score";
      case "6m": return "6 Month Recovery Score";
      default: return "Day Recovery";
    }
  };

  // Function to get Y-axis tick color
  const getTickColor = (value) => {
    if (value <= 33) return "#FF6B6B"; // red
    if (value <= 67) return "#FFE566"; // yellow
    return "#7AE582"; // green
  };
  
  // Calculate the appropriate bar size based on the selected period
  const getBarSize = () => {
    // Use consistent sizing across all weekly views as shown in the examples
    return 30; // Fixed width for all 1w, 2w, and 1m views
  };
  
  return (
    <div className="w-full max-w-5xl rounded-xl bg-white p-6 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {getTitle()}
          </h2>
          {selectedPeriod === "1d" && (
            <h3 className="text-lg text-gray-500">Today, May 21st <span className="font-medium">vs</span> Tue, May 20th</h3>
          )}
          {(selectedPeriod === "1w" || selectedPeriod === "2w" || selectedPeriod === "1m") && (
            <h3 className="text-lg text-gray-500">{userName}</h3>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex rounded-full bg-gray-100 p-1">
          {timePeriods.map((period) => (
            <Button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-colors",
                selectedPeriod === period.value
                  ? "bg-red-500 text-white"
                  : "bg-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-[400px] w-full">
        {viewType === VIEW_TYPES.LINE ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 20,
              }}
            >
              <CartesianGrid 
                stroke="#e0e0e0" 
                strokeDasharray="3 3" 
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey={selectedPeriod === "3m" || selectedPeriod === "6m" ? "formattedDate" : "date"}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
                tickMargin={10}
                interval={0}
                height={60}
                tickFormatter={(value) => value}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 17, 33, 50, 67, 83, 100]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Score']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#cccccc"
                strokeWidth={1}
                dot={<CustomDot />}
                activeDot={{ r: 8 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : viewType === VIEW_TYPES.BAR ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{
                top: 20,
                right: 20,
                left: 20,
                bottom: 20,
              }}
              barGap={20}
              barCategoryGap={80}
            >
              <CartesianGrid 
                stroke="#e0e0e0" 
                strokeDasharray="3 3" 
                horizontal={true} 
                vertical={false} 
              />
              <XAxis 
                dataKey="name" 
                axisLine={{ stroke: '#e0e0e0' }}
                tickLine={false}
                tick={{ fill: '#333', fontSize: 14, fontWeight: 500 }}
                tickMargin={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, '']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '8px'
                }}
              />
              <Bar 
                dataKey="today" 
                name="Today" 
                fill="#546E7A" 
                radius={[2, 2, 0, 0]} 
                maxBarSize={60}
              >
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#546E7A">
                    <text 
                      x={index * 200 + 30} 
                      y={100 - entry.today - 10} 
                      textAnchor="middle" 
                      fill="#546E7A" 
                      fontSize={14} 
                      fontWeight="bold"
                    >
                      {entry.today}%
                    </text>
                  </Cell>
                ))}
              </Bar>
              <Bar 
                dataKey="yesterday" 
                name="Yesterday" 
                fill="#D3D3D3" 
                radius={[2, 2, 0, 0]} 
                maxBarSize={60}
              >
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#D3D3D3">
                    <text 
                      x={index * 200 + 90} 
                      y={100 - entry.yesterday - 10} 
                      textAnchor="middle" 
                      fill="#D3D3D3" 
                      fontSize={14} 
                      fontWeight="bold"
                    >
                      {entry.yesterday}%
                    </text>
                  </Cell>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{
                top: 20,
                right: 20,
                left: 20,
                bottom: 20,
              }}
              barCategoryGap={12}
            >
              <CartesianGrid 
                stroke="#e0e0e0" 
                strokeDasharray="3 3" 
                horizontal={true} 
                vertical={false}
              />
              <XAxis 
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
                tickMargin={5}
              />
              <XAxis 
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
                tickMargin={10}
                xAxisId="date"
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 17, 33, 50, 67, 83, 100]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                tick={(props) => {
                  const { x, y, payload } = props;
                  let fillColor = '#888';
                  const value = payload.value;
                  
                  if (value === 0 || value === 17 || value === 33) {
                    fillColor = "#FF6B6B"; // red
                  } else if (value === 50) {
                    fillColor = "#FFE566"; // yellow
                  } else if (value === 67 || value === 83 || value === 100) {
                    fillColor = "#7AE582"; // green
                  }
                  
                  return (
                    <text
                      x={x}
                      y={y}
                      dy={4}
                      textAnchor="end"
                      fill={fillColor}
                      fontSize={12}
                    >
                      {`${value}%`}
                    </text>
                  );
                }}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Recovery Score']}
                labelFormatter={(label) => label}
                contentStyle={{
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  padding: '8px'
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[2, 2, 0, 0]} 
                maxBarSize={getBarSize()}
              >
                {weeklyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    fillOpacity={0.3}
                    stroke={entry.color}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Only show toggle buttons if not in 1d, 1w, 2w, or 1m mode */}
      {(selectedPeriod !== "1d" && selectedPeriod !== "1w" && selectedPeriod !== "2w" && selectedPeriod !== "1m") && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={() => setViewType(VIEW_TYPES.LINE)}
            className={cn(
              "mx-2",
              viewType === VIEW_TYPES.LINE
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            )}
          >
            Line Chart
          </Button>
          <Button
            onClick={() => setViewType(VIEW_TYPES.BAR)}
            className={cn(
              "mx-2",
              viewType === VIEW_TYPES.BAR
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            )}
          >
            Comparison View
          </Button>
        </div>
      )}
    </div>
  );
}