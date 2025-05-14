// src/components/dashboard/strain/charts/AverageHrChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const AverageHrChart = () => {
  // Mock data for the chart - would come from API in real app
  const heartRateData = [
    { day: 'Sun', date: '13', value: 70 },
    { day: 'Mon', date: '14', value: 77 },
    { day: 'Tue', date: '15', value: 79 },
    { day: 'Wed', date: '16', value: 75 },
    { day: 'Thu', date: '17', value: 79 },
    { day: 'Fri', date: '18', value: 75 },
    { day: 'Sat', date: '19', value: 73, isToday: true }
  ];

  // Custom data point component
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    
    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r={payload.isToday ? 8 : 6} 
          fill="#5D8DEE" 
          stroke={payload.isToday ? "#5D8DEE" : "#353a3e"} 
          strokeWidth={payload.isToday ? 2 : 2} 
        />
        <text 
          x={cx} 
          y={cy - 16} 
          textAnchor="middle" 
          fill="#5D8DEE" 
          fontSize={payload.isToday ? "18" : "16"} 
          fontWeight="bold"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  // Custom X-Axis tick
  const renderCustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    const data = heartRateData[payload.index];
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill={data.isToday ? "white" : "var(--text-secondary)"}
          fontSize={14}
        >
          {data.day}
        </text>
        <text
          x={0}
          y={16}
          dy={16}
          textAnchor="middle"
          fill={data.isToday ? "white" : "var(--text-secondary)"}
          fontSize={14}
          fontWeight={data.isToday ? "bold" : "normal"}
        >
          {data.date}
        </text>
      </g>
    );
  };

  return (
    <div className="whoops-card p-6">
      <div className="flex items-center mb-6">
        <svg className="mr-4 text-[var(--text-secondary)]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">AVERAGE HR</h2>
      </div>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={heartRateData}
            margin={{ top: 40, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid 
              stroke="rgba(255, 255, 255, 0.1)" 
              vertical={false} 
              horizontalPoints={[100, 200, 300, 400]} 
            />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={renderCustomXAxisTick}
              height={60}
            />
            <YAxis 
              domain={[65, 85]} 
              hide={true} 
            />
            <Tooltip 
              content={() => null} // Disable the default tooltip
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#5D8DEE" 
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />
            {/* Custom dots with labels */}
            {heartRateData.map((entry, index) => (
              <Line
                key={`line-${index}`}
                dataKey="value"
                data={[entry]}
                stroke="transparent"
                dot={<CustomDot />}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Today indicator */}
      <div className="relative bottom-12 right-0 flex justify-end">
        <div className="bg-[#353a3e] px-4 py-2 rounded-lg opacity-80 mr-4">
          <span className="text-white font-bold">Sat</span>
          <span className="text-white font-bold ml-2">19</span>
        </div>
      </div>
    </div>
  );
};

export default AverageHrChart;