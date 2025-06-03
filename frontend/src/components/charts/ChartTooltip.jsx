import React from 'react';
// Make sure this import path is correct
import { stageColors } from '../../utils/constants';
// If the above import fails, define stageColors directly:
/*
const stageColors = {
  awake: '#c8c8c8', 
  light: '#a4a3f1', 
  deep: '#fa96f9', 
  rem: '#ac5aed'
};
*/

const ChartTooltip = ({ hoveredTime }) => {
  if (!hoveredTime) return null;
  
  return (
    <div className="absolute pointer-events-none z-10" 
         style={{ 
           left: `${hoveredTime.x}px`, 
           bottom: '25px',
           transform: 'translateX(-50%)' 
         }}>
      <div className="bg-[var(--card-bg)] rounded-lg p-3 shadow-xl border border-gray-700/50">
        <div className="text-xs font-medium text-gray-400">{hoveredTime.time}</div>
        <div className="text-sm font-bold text-white mt-1 flex items-center">
          {hoveredTime.stage && (
            <span className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: stageColors[hoveredTime.stage] || '#ffffff' }}></span>
          )}
          {hoveredTime.stage ? `${hoveredTime.stage.charAt(0).toUpperCase() + hoveredTime.stage.slice(1)} - ` : ''}
          <span className="ml-1">{hoveredTime.bpm || 'N/A'} BPM</span>
        </div>
      </div>
    </div>
  );
};

export default ChartTooltip;