import React from 'react';
import { ChevronRight } from 'lucide-react';

const SleepPerformanceRing = ({ value = 81, max = 100, size = 120, isInteractive = false }) => {
  // SVG parameters
  const strokeWidth = size * 0.067;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const strokeDashoffset = circumference - percentage * circumference;
  
  // Calculate display sizes
  const displaySize = size <= 120 ? 'w-24 h-24' : 'w-32 h-32';
  const fontSize = size <= 120 ? 'text-4xl' : 'text-5xl';
  const percentSize = size <= 120 ? 'text-lg' : 'text-xl';

  return (
    <div className="flex flex-col items-center justify-center text-white">
      <div className={`relative ${displaySize}`}>
        <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          {/* Define gradient - blue tones based on #7BA1BB */}
          <defs>
            <linearGradient id="sleepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6B91A7" stopOpacity="1" />
              <stop offset="100%" stopColor="#7BA1BB" stopOpacity="1" />
            </linearGradient>
          </defs>
          
          {/* Background ring - darker */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1A2125"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress ring with gradient - slightly rounded ends */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="url(#sleepGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>

        {/* Center value - Use DINPro for numbers */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className={`${fontSize} font-bold`}
            style={{ fontFamily: 'DINPro, system-ui, sans-serif' }}
          >
            {value}
          </span>
          <span 
            className={`${percentSize} font-bold`} // Now smaller
            style={{ fontFamily: 'DINPro, system-ui, sans-serif' }}
          >
            %
          </span>
        </div>
      </div>

      {/* Label with Proxima Nova - Updated */}
      <div className="flex items-center mt-1 group" style={{ color: '#7BA1BB' }}>
        <span 
          className="text-sm font-bold uppercase tracking-[0.1em]"
          style={{ fontFamily: 'Proxima Nova, system-ui, sans-serif' }}
        >
          Sleep
        </span>
        {isInteractive && (
          <ChevronRight 
            size={14} 
            className="ml-0.5 transition-transform group-hover:translate-x-0.5" 
          />
        )}
      </div>
    </div>
  );
};

export default SleepPerformanceRing;