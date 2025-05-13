// src/components/dashboard/strain/charts/StrainTrendChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Text } from 'recharts';

const StrainTrendChart = () => {
  // Mock data for the chart - would come from API in real app
  const strainData = [
    { day: 'Sun', date: '13', value: 4.1 },
    { day: 'Mon', date: '14', value: 11.0 },
    { day: 'Tue', date: '15', value: 7.7 },
    { day: 'Wed', date: '16', value: 7.9 },
    { day: 'Thu', date: '17', value: 9.1 },
    { day: 'Fri', date: '18', value: 7.7 },
    { day: 'Sat', date: '19', value: 5.5, isToday: true }
  ];

  // Custom label component for the bars
  const renderCustomLabel = (props) => {
    const { x, y, width, value, index } = props;
    
    return (
      <text
        x={x + width / 2}
        y={y - 10}
        fill="#5D8DEE"
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
      >
        {value.toFixed(1)}
      </text>
    );
  };

  // Custom X-Axis tick
  const renderCustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    const data = strainData[payload.index];
    
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <svg className="mr-4 text-[var(--text-secondary)]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 4h-6a4 4 0 0 0-4 4v12M5 7v12M6 21h10M11 8V4M15 8V4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">STRAIN</h2>
        </div>
        <div className="text-[var(--text-secondary)]">VS. LAST 7 DAYS</div>
      </div>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={strainData}
            margin={{ top: 40, right: 0, left: 0, bottom: 60 }}
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
              domain={[0, 12]} 
              hide={true} 
            />
            <Bar 
              dataKey="value" 
              barSize={40} 
              fill="#5D8DEE" 
              radius={[4, 4, 0, 0]}
              label={renderCustomLabel}
            >
              {strainData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill="#5D8DEE" 
                />
              ))}
            </Bar>
          </BarChart>
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

export default StrainTrendChart;