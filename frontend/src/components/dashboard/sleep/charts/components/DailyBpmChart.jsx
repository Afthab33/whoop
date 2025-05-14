import React from 'react';
import { stageColors } from '../../../../../utils/constants';

const DailyBpmChart = ({ chartData, activeStage, hoveredTime }) => {
  // Safety check to prevent rendering errors
  if (!chartData || !chartData.chartWidth || !chartData.chartHeight) {
    return null;
  }

  return (
    <>
      {/* Add horizontal grid lines with explicit positioning */}
      <div className="absolute inset-0 pointer-events-none">
        {[150, 125, 100, 75, 50, 25].map((value, i) => (
          <div
            key={i}
            className="border-b border-gray-700/50 w-full h-0 absolute"
            style={{ 
              top: `${(i * 100) / 6}%`,  // Position each line at the correct percentage height
              left: 0,
              right: 0
            }}
          ></div>
        ))}
      </div>

      <svg className="absolute inset-0" viewBox={`0 0 ${chartData.chartWidth} ${chartData.chartHeight}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="bpmGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7ca1bb" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7ca1bb" stopOpacity="0.05" />
          </linearGradient>
          
          {Object.entries(stageColors).map(([stage, color]) => (
            <linearGradient key={stage} id={`${stage}Gradient`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          ))}
          
          {activeStage && chartData.stagePaths && chartData.stagePaths[activeStage] && (
            <clipPath id={`${activeStage}Clip`}>
              <path 
                d={chartData.stagePaths[activeStage]?.path} 
                strokeWidth="6"
              />
            </clipPath>
          )}
        </defs>
        
        {/* BPM Area (gradient background under line) */}
        {chartData.bpmAreaPath && (
          <path 
            d={chartData.bpmAreaPath} 
            fill="url(#bpmGradient)" 
            stroke="none"
            opacity={activeStage ? 0.2 : 0.4}
          />
        )}
        
        {/* Main BPM Line */}
        {chartData.bpmPath && (
          <path 
            d={chartData.bpmPath} 
            fill="none" 
            stroke={activeStage ? "#6e7a85" : "#7ca1bb"}
            strokeWidth="2.5" 
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeMiterlimit="1"
            opacity={activeStage ? 0.4 : 1}
            className="filter drop-shadow-sm transition-opacity duration-300"
          />
        )}
        
        {/* BPM Segments (for disconnected BPM data) */}
        {chartData.bpmSegments && chartData.bpmSegments.map((segment, i) => (
          <React.Fragment key={i}>
            {segment.areaPath && (
              <path 
                d={segment.areaPath} 
                fill="url(#bpmGradient)" 
                stroke="none"
                opacity={activeStage ? 0.2 : 0.4}
              />
            )}
            
            {segment.path && (
              <path 
                d={segment.path} 
                fill="none" 
                stroke={activeStage ? "#6e7a85" : "#7ca1bb"}
                strokeWidth="2" 
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeMiterlimit="1"
                opacity={activeStage ? 0.4 : 1}
              />
            )}
          </React.Fragment>
        ))}
        
        {/* Active Sleep Stage Visualization */}
        {activeStage && chartData.stagePaths && chartData.stagePaths[activeStage] && (
          <>
            {chartData.stagePaths[activeStage].fillPaths && 
              chartData.stagePaths[activeStage].fillPaths.map((fillPath, i) => (
                <path
                  key={`fill-${i}`}
                  d={fillPath}
                  fill={stageColors[activeStage]}
                  fillOpacity="0.15"
                  strokeWidth="0"
                />
              ))
            }
            
            <path 
              d={chartData.stagePaths[activeStage].path}
              fill="none" 
              stroke={stageColors[activeStage]} 
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeMiterlimit="1"
              className="filter drop-shadow-md"
            />
          </>
        )}
        
        {/* Add hover line if hoveredTime exists */}
        {hoveredTime && (
          <line 
            x1={hoveredTime.x} 
            y1="0" 
            x2={hoveredTime.x} 
            y2={chartData.chartHeight}
            stroke="white" 
            strokeWidth="1"
            strokeDasharray="3,2"
            opacity="0.6"
          />
        )}
      </svg>
      
      {/* Time labels at the bottom */}
      <div className="absolute left-0 right-0 top-full mt-1">
        {chartData.timeLabels && chartData.timeLabels.map((label, i) => (
          <div 
            key={i}
            className="absolute -translate-x-1/2 text-xs font-medium text-gray-400"
            style={{ left: `${label.x}px` }}
          >
            {label.label}
          </div>
        ))}
      </div>
    </>
  );
};

export default DailyBpmChart;