// src/components/dashboard/strain/charts/CaloriesChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Text } from 'recharts';

const CaloriesChart = () => {
  // Mock data for the chart - would come from API in real app
  const caloriesData = [
    { day: 'Sun', date: '13', value: 1983 },
    { day: 'Mon', date: '14', value: 2084 },
    { day: 'Tue', date: '15', value: 2020 },
    { day: 'Wed', date: '16', value: 2049 },
    { day: 'Thu', date: '17', value: 2115 },
    { day: 'Fri', date: '18', value: 2313 },
    { day: 'Sat', date: '19', value: 1147, isToday: true }
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
        {value.toLocaleString()}
      </text>
    );
  };

  // Custom X-Axis tick
  const renderCustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    const data = caloriesData[payload.index];
    
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
          <path d="M6.5 10C6.5 8 7.8 6 9.5 6C11.5 6 11.5 9 14 9C16 9 17 11 17 13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 19C9.79086 19 8 17.2091 8 15C8 13.5 8.5 12.5 9.5 11.5C10.5 10.5 11 9.5 11 8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 19C17.1046 19 18 18.1046 18 17C18 15.8954 17.1046 15 16 15C14.8954 15 14 15.8954 14 17C14 18.1046 14.8954 19 16 19Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">CALORIES</h2>
      </div>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={caloriesData}
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
              domain={[0, 2500]} 
              hide={true} 
            />
            <Bar 
              dataKey="value" 
              barSize={40} 
              fill="#5D8DEE" 
              radius={[4, 4, 0, 0]}
              label={renderCustomLabel}
            >
              {caloriesData.map((entry, index) => (
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

export default CaloriesChart;