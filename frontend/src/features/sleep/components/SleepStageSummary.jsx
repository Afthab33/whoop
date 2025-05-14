import React, { useState, useEffect } from 'react';
import whoopData from '../../../data/day_wise_whoop_data.json';

const SleepStageSummary = ({ selectedDate, setActiveStage, activeStage }) => {
  const [sleepData, setSleepData] = useState(null);
  
  // Sleep stage colors to match SleepStagesChart
  const stageColors = {
    awake: '#c8c8c8', // Gray
    light: '#a4a3f1', // Light purple
    deep: '#fa96f9',  // Pink
    rem: '#ac5aed',   // Purple
  };
  
  useEffect(() => {
    if (!selectedDate) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    if (!whoopData[dateStr] || !whoopData[dateStr].sleep_summary) return;
    
    const daySummary = whoopData[dateStr].sleep_summary;
    
    setSleepData({
      awake: daySummary["Awake duration (min)"] || 0,
      light: daySummary["Light sleep duration (min)"] || 0,
      deep: daySummary["Deep (SWS) duration (min)"] || 0,
      rem: daySummary["REM duration (min)"] || 0,
      totalInBed: daySummary["In bed duration (min)"] || 0
    });
  }, [selectedDate]);
  
  const formatTime = (minutes) => {
    if (!minutes) return '0:00';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };
  
  const handleStageClick = (stage) => {
    setActiveStage(activeStage === stage ? null : stage);
  };
  
  if (!sleepData) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-3 text-center h-full flex items-center justify-center">
        <p className="text-gray-400">No sleep data available</p>
      </div>
    );
  }
  
  // Calculate percentages for the ring chart
  const total = sleepData.awake + sleepData.light + sleepData.deep + sleepData.rem;
  
  // Create ring segments - each segment needs stroke length and position
  const segments = [
    {
      id: "awake",
      label: "Awake",
      color: stageColors.awake,
      minutes: sleepData.awake,
      time: formatTime(sleepData.awake)
    },
    {
      id: "light",
      label: "Light",
      color: stageColors.light,
      minutes: sleepData.light,
      time: formatTime(sleepData.light)
    },
    {
      id: "rem",
      label: "REM",
      color: stageColors.rem,
      minutes: sleepData.rem,
      time: formatTime(sleepData.rem)
    },
    {
      id: "deep",
      label: "SWS Deep",
      color: stageColors.deep,
      minutes: sleepData.deep,
      time: formatTime(sleepData.deep)
    }
  ];
  
  // Calculate donut chart segments
  const radius = 40; // Increased from 36 to make the pie chart larger
  const circumference = 2 * Math.PI * radius;
  
  // We need to calculate stroke-dasharray and stroke-dashoffset for each segment
  let currentOffset = 0;
  segments.forEach(segment => {
    const percentage = segment.minutes / total;
    segment.dashArray = circumference;
    segment.dashOffset = circumference * (1 - percentage);
    segment.angle = percentage * 360;
    segment.offset = currentOffset;
    currentOffset += segment.angle;
  });
  
  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-4 h-full flex flex-col justify-between">
      <div className="text-sm font-medium text-white mb-3">Sleep Stages</div>
      
      {/* Enhanced Donut Chart - Made Larger */}
      <div className="flex justify-center mb-5">
        <div className="relative w-40 h-40"> {/* Increased from w-32 h-32 */}
          {/* Subtle glow effect behind the chart */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(40,50,60,0.1)] rounded-full blur-xl"></div>
          
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle 
              cx="50" 
              cy="50" 
              r={radius} 
              fill="transparent" 
              stroke="#2A3339" 
              strokeWidth="9" // Increased from 8
            />
            
            {/* Donut chart segments with enhanced effects */}
            {segments.map((segment, index) => {
              const isActive = activeStage === segment.id;
              const startAngle = segment.offset * (Math.PI / 180);
              const endAngle = (segment.offset + segment.angle) * (Math.PI / 180);
              
              // Calculate segment points with slight offset for active segments
              const radiusOffset = isActive ? 2.5 : 0;
              const startX = 50 + (radius + radiusOffset) * Math.sin(startAngle);
              const startY = 50 - (radius + radiusOffset) * Math.cos(startAngle);
              const endX = 50 + (radius + radiusOffset) * Math.sin(endAngle);
              const endY = 50 - (radius + radiusOffset) * Math.cos(endAngle);
              
              // Determine if the arc is more than 180 degrees
              const largeArcFlag = segment.angle > 180 ? 1 : 0;
              
              // Create SVG path for the arc
              const path = `
                M 50 50
                L ${startX} ${startY}
                A ${radius + radiusOffset} ${radius + radiusOffset} 0 ${largeArcFlag} 1 ${endX} ${endY}
                Z
              `;
              
              return (
                <g key={segment.id} onClick={() => handleStageClick(segment.id)} className="cursor-pointer">
                  {/* Main segment path */}
                  <path
                    d={path}
                    fill={segment.color}
                    stroke={isActive ? "#fff" : "transparent"}
                    strokeWidth={isActive ? 0.8 : 0}
                    opacity={activeStage && !isActive ? 0.4 : 0.95}
                    className="transition-all duration-300"
                  />
                  
                  {/* Add more pronounced glow effect for active segment */}
                  {isActive && (
                    <>
                      <path
                        d={path}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="1.5"
                        opacity="0.6"
                        filter="blur(3px)"
                      />
                      <path
                        d={path}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="0.8"
                        opacity="0.4"
                        filter="blur(6px)"
                      />
                    </>
                  )}
                </g>
              );
            })}
            
            {/* Inner circle with text */}
            <circle 
              cx="50" 
              cy="50" 
              r="24" // Increased from 22
              fill="#242D34" 
              stroke={activeStage ? "transparent" : "#333"}
              strokeWidth="0.5"
              className="cursor-pointer"
              onClick={() => handleStageClick(null)}
            />
            
            <text 
              x="50" 
              y="45" 
              textAnchor="middle" 
              className="fill-gray-400"
              style={{ fontSize: '8px' }} // Increased from 7px
            >
              Time In Bed
            </text>
            
            <text 
              x="50" 
              y="58" 
              textAnchor="middle" 
              className="font-bold fill-white"
              style={{ fontSize: '13px' }} // Increased from 12px
            >
              {formatTime(sleepData.totalInBed)}
            </text>
          </svg>
          
          {/* Add a subtle pulse animation for the active segment */}
          {activeStage && (
            <div 
              className="absolute inset-0 rounded-full animate-pulse-slow"
              style={{
                backgroundColor: stageColors[activeStage],
                opacity: 0.05,
                animationDuration: '3s'
              }}
            />
          )}
        </div>
      </div>
      
      {/* Stage List - Enhanced with animation and better visual feedback */}
      <div className="space-y-2"> {/* Increased spacing between items */}
        {segments.map((stage) => {
          const isActive = activeStage === stage.id;
          const percentage = Math.round((stage.minutes / sleepData.totalInBed) * 100);
          
          return (
            <div 
              key={stage.id}
              onClick={() => handleStageClick(stage.id)}
              className={`relative flex justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-200 ${
                isActive ? 'bg-[#2A3339]' : 'hover:bg-[#2A3339] hover:bg-opacity-50'
              }`}
              style={{ 
                opacity: activeStage && activeStage !== stage.id ? 0.6 : 1,
                transform: isActive ? 'translateX(2px)' : 'none'
              }}
            >
              {/* Background progress indicator */}
              <div 
                className="absolute inset-0 left-0 top-0 bottom-0 opacity-15 rounded-md transition-all duration-300"
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: stage.color,
                  transform: isActive ? 'scaleX(1.02)' : 'scaleX(0.96)',
                  transformOrigin: 'left',
                }}
              />
              
              <div className="flex items-center z-10">
                <div
                  className={`w-3 h-3 rounded-full mr-2.5 transition-all duration-200 ${
                    isActive ? 'scale-125 shadow-glow' : ''
                  }`}
                  style={{ 
                    backgroundColor: stage.color,
                    boxShadow: isActive ? `0 0 8px ${stage.color}70` : 'none'
                  }}
                />
                <span className={`text-xs transition-colors ${
                  isActive ? 'text-white font-medium' : 'text-gray-300'
                }`}>
                  {stage.label}
                </span>
              </div>
              
              <div className="flex items-center z-10">
                <span className={`text-xs transition-colors ${
                  isActive ? 'text-white font-medium' : 'text-gray-400'
                }`}>
                  {stage.time}
                </span>
                <span className={`text-xs ml-1.5 ${
                  isActive ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Add this to your CSS or tailwind config
// @keyframes pulse-slow {
//   0%, 100% { opacity: 0.05; }
//   50% { opacity: 0.15; }
// }
// .animate-pulse-slow {
//   animation: pulse-slow 3s infinite;
// }

export default SleepStageSummary;