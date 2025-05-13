import React from 'react';

const RecoveryRing = ({ value = 67, size = 120 }) => {
  // SVG parameters
  const strokeWidth = size * 0.067; // Scaling stroke width proportionally
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / 100, 1);
  const strokeDashoffset = circumference - percentage * circumference;
  
  // Calculate display sizes
  const displaySize = size <= 120 ? 'w-24 h-24' : 'w-32 h-32';
  const fontSize = size <= 120 ? 'text-4xl' : 'text-5xl';
  const percentSize = size <= 120 ? 'text-xl' : 'text-2xl';

  return (
    <div className="flex flex-col items-center justify-center text-white">
      <div className={`relative ${displaySize}`}>
        <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          {/* Define gradient - darker green tones */}
          <defs>
            <linearGradient id="recoveryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2A9645" stopOpacity="1" />
              <stop offset="100%" stopColor="#3FB65E" stopOpacity="1" />
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
          
          {/* Progress ring with gradient - flat ends */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="url(#recoveryGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>

        {/* Center value - responsive size */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-bold font-sans`}>{value}</span>
          <span className={`${percentSize} font-bold font-sans`}>%</span>
        </div>
      </div>

      {/* Label - darker green to match image */}
      <div className="text-[#3FB65E] text-sm font-medium mt-1">Recovery</div>
    </div>
  );
};

export default RecoveryRing;