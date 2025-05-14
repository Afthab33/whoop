// src/components/dashboard/recovery/charts/RecoveryTrendChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Text } from 'recharts';

const RecoveryTrendChart = () => {
  // Mock data for the chart - would come from API in real app
  const recoveryData = [
    { day: 'Sun', date: '13', value: 87, color: '#3FB65E' },
    { day: 'Mon', date: '14', value: 85, color: '#3FB65E' },
    { day: 'Tue', date: '15', value: 67, color: '#3FB65E' },
    { day: 'Wed', date: '16', value: 77, color: '#3FB65E' },
    { day: 'Thu', date: '17', value: 87, color: '#3FB65E' },
    { day: 'Fri', date: '18', value: 83, color: '#3FB65E' },
    { day: 'Sat', date: '19', value: 61, color: '#FFCD4C', isToday: true }
  ];

  // Custom label component for the bars
  const renderCustomLabel = (props) => {
    const { x, y, width, value, index } = props;
    const data = recoveryData[index];
    
    return (
      <text
        x={x + width / 2}
        y={y - 10}
        fill={data.color}
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
      >
        {`${value}%`}
      </text>
    );
  };

  // Custom X-Axis tick
  const renderCustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    const data = recoveryData[payload.index];
    
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
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">RECOVERY STATISTICS</h2>
        </div>
        <div className="text-[var(--text-secondary)]">VS. LAST 7 DAYS</div>
      </div>
      
      <div className="flex items-center mb-6">
        <svg className="mr-3 text-[var(--text-secondary)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19c0-4.971-4.029-9-9-9 4.971 0 9-4.029 9-9 0 4.971 4.029 9 9 9-4.971 0-9 4.029-9 9z" />
        </svg>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">RECOVERY</h3>
      </div>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={recoveryData}
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
              domain={[0, 100]} 
              hide={true} 
            />
            <Bar 
              dataKey="value" 
              barSize={40} 
              label={renderCustomLabel}
            >
              {recoveryData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  radius={[4, 4, 0, 0]}
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

export default RecoveryTrendChart;