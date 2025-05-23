// src/components/dashboard/recovery/charts/HrvTrendChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const HrvTrendChart = () => {
  // Mock data for the chart - would come from API in real app
  const hrvData = [
    { day: 'Sun', date: '13', value: 68 },
    { day: 'Mon', date: '14', value: 66 },
    { day: 'Tue', date: '15', value: 57 },
    { day: 'Wed', date: '16', value: 63 },
    { day: 'Thu', date: '17', value: 68 },
    { day: 'Fri', date: '18', value: 67 },
    { day: 'Sat', date: '19', value: 78, isToday: true }
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
    const data = hrvData[payload.index];
    
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
          <path d="M3 12h4l3-9 4 18 3-9h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">HEART RATE VARIABILITY</h2>
      </div>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={hrvData}
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
              domain={[50, 80]} 
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
            {hrvData.map((entry, index) => (
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

export default HrvTrendChart;