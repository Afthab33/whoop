// src/components/dashboard/recovery/charts/RespiratoryRateChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const RespiratoryRateChart = () => {
  // Mock data for the chart - would come from API in real app
  const respiratoryData = [
    { day: 'Sun', date: '13', value: 12.8 },
    { day: 'Mon', date: '14', value: 12.7 },
    { day: 'Tue', date: '15', value: 12.9 },
    { day: 'Wed', date: '16', value: 12.5 },
    { day: 'Thu', date: '17', value: 12.4 },
    { day: 'Fri', date: '18', value: 12.4 },
    { day: 'Sat', date: '19', value: 13.1, isToday: true }
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
    const data = respiratoryData[payload.index];
    
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
          <path d="M6.38 6.98C7.03 5.14 8.83 3.88 10.88 3.88C13.5 3.88 15.63 6.01 15.63 8.63C15.63 11.25 18.25 13.01 20.88 11.63" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.91 15.75C7.15 18.01 9.35 19.13 11.38 19.13C14 19.13 16.13 17 16.13 14.38C16.13 11.75 18.75 10 21.38 11.38" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 8.25C4.24 10.51 6.44 11.63 8.47 11.63C11.09 11.63 13.22 9.5 13.22 6.88C13.22 4.25 15.84 2.5 18.47 3.88" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 17.25C4.24 19.51 6.44 20.63 8.47 20.63C11.09 20.63 13.22 18.5 13.22 15.88C13.22 13.25 15.84 11.5 18.47 12.88" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">RESPIRATORY RATE</h2>
      </div>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={respiratoryData}
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
              domain={[12, 13.5]} 
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
            {respiratoryData.map((entry, index) => (
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

export default RespiratoryRateChart;