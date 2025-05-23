import React, { useState, useMemo } from 'react';

const DailyStrainChart = ({ 
  strainData, 
  activeWorkout, 
  hoveredTime,
  onWorkoutHover,
  viewMode = 'time', // 'time' or 'duration'
  chartMode = 'raw', // 'raw' or 'percentage'
  timePeriod = '1d' // '6m', '3m', '1m', '2w', '1w', '1d'
}) => {
  // Chart dimensions and scaling
  const chartWidth = 1200;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  // Process strain data for visualization
  const processedData = useMemo(() => {
    if (!strainData || !strainData.length) return null;

    // Find min/max values for scaling
    const strainValues = strainData.map(d => d.strain || 0);
    const maxStrain = Math.max(...strainValues, 20); // Minimum scale of 20
    const minStrain = Math.min(...strainValues, 0);

    // Create chart points
    const points = strainData.map((point, index) => {
      const x = (index / (strainData.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
      const y = chartHeight - padding.bottom - ((point.strain - minStrain) / (maxStrain - minStrain)) * (chartHeight - padding.top - padding.bottom);
      
      return {
        x,
        y,
        strain: point.strain,
        time: point.time,
        activity: point.activity || 'rest',
        isWorkout: point.isWorkout || false
      };
    });

    // Create SVG path for strain line
    const pathData = points.map((point, index) => {
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    }).join(' ');

    // Create area path (filled area under curve)
    const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

    // Create workout segments
    const workoutSegments = [];
    let currentWorkout = null;
    
    points.forEach((point, index) => {
      if (point.isWorkout && !currentWorkout) {
        currentWorkout = { start: index, points: [point] };
      } else if (point.isWorkout && currentWorkout) {
        currentWorkout.points.push(point);
      } else if (!point.isWorkout && currentWorkout) {
        currentWorkout.end = index - 1;
        workoutSegments.push(currentWorkout);
        currentWorkout = null;
      }
    });

    // Close any open workout segment
    if (currentWorkout) {
      currentWorkout.end = points.length - 1;
      workoutSegments.push(currentWorkout);
    }

    return {
      points,
      pathData,
      areaPath,
      workoutSegments,
      maxStrain,
      minStrain,
      yLabels: [0, 5, 10, 15, 20].filter(val => val <= Math.ceil(maxStrain))
    };
  }, [strainData, chartWidth, chartHeight]);

  // Time period options
  const timePeriodOptions = [
    { value: '6m', label: '6m' },
    { value: '3m', label: '3m' },
    { value: '1m', label: '1m' },
    { value: '2w', label: '2w' },
    { value: '1w', label: '1w' },
    { value: '1d', label: '1d' }
  ];

  if (!processedData) {
    return (
      <div className="whoops-card h-96 flex items-center justify-center">
        <p className="text-[var(--text-muted)]">No strain data available</p>
      </div>
    );
  }

  return (
    <div className="whoops-card relative">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--text-secondary)]">Duration</span>
            <div className="relative w-14 h-7 bg-gray-600 rounded-full cursor-pointer">
              <div 
                className={`absolute top-0.5 w-6 h-6 bg-gray-800 rounded-full transition-transform duration-200 ${
                  viewMode === 'time' ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-white font-medium">Time</span>
          </div>

          {/* Chart Mode Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--text-secondary)]">Raw HR</span>
            <div className="relative w-14 h-7 bg-gray-600 rounded-full cursor-pointer">
              <div 
                className={`absolute top-0.5 w-6 h-6 bg-gray-800 rounded-full transition-transform duration-200 ${
                  chartMode === 'percentage' ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">% of Max</span>
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
          {timePeriodOptions.map((option) => (
            <button
              key={option.value}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timePeriod === option.value
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-80 bg-gray-800/30 rounded-lg overflow-hidden">
        {/* Y-axis grid lines and labels */}
        <div className="absolute inset-0 pointer-events-none">
          {processedData.yLabels.map((value, i) => {
            const y = chartHeight - padding.bottom - ((value - processedData.minStrain) / (processedData.maxStrain - processedData.minStrain)) * (chartHeight - padding.top - padding.bottom);
            return (
              <div key={value}>
                {/* Grid line */}
                <div
                  className="border-b border-gray-600/30 w-full h-0 absolute"
                  style={{ 
                    top: `${(y / chartHeight) * 100}%`,
                    left: `${padding.left}px`,
                    right: `${padding.right}px`
                  }}
                />
                {/* Y-label */}
                <div
                  className="absolute text-xs text-gray-400 font-medium"
                  style={{ 
                    top: `${(y / chartHeight) * 100}%`,
                    left: '8px',
                    transform: 'translateY(-50%)'
                  }}
                >
                  {value}
                </div>
              </div>
            );
          })}
        </div>

        {/* SVG Chart */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          preserveAspectRatio="none"
        >
          <defs>
            {/* Main strain gradient */}
            <linearGradient id="strainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5D8DEE" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#5D8DEE" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#5D8DEE" stopOpacity="0.05" />
            </linearGradient>

            {/* Workout highlight gradient */}
            <linearGradient id="workoutGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6A2C" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#FF6A2C" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF6A2C" stopOpacity="0.1" />
            </linearGradient>

            {/* Glow filter for line */}
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Main strain area */}
          <path 
            d={processedData.areaPath} 
            fill="url(#strainGradient)" 
            stroke="none"
            opacity={activeWorkout ? 0.3 : 0.8}
            className="transition-opacity duration-300"
          />

          {/* Workout segments */}
          {processedData.workoutSegments.map((segment, index) => (
            <g key={index}>
              {/* Workout area highlight */}
              <path
                d={`M ${segment.points[0].x} ${chartHeight - padding.bottom} ${
                  segment.points.map(p => `L ${p.x} ${p.y}`).join(' ')
                } L ${segment.points[segment.points.length - 1].x} ${chartHeight - padding.bottom} Z`}
                fill="url(#workoutGradient)"
                opacity={activeWorkout === index ? 1 : 0.6}
                className="transition-opacity duration-300 cursor-pointer"
                onMouseEnter={() => onWorkoutHover?.(index)}
                onMouseLeave={() => onWorkoutHover?.(null)}
              />
            </g>
          ))}

          {/* Main strain line */}
          <path 
            d={processedData.pathData} 
            fill="none" 
            stroke="#5D8DEE"
            strokeWidth="2.5" 
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#lineGlow)"
            opacity={activeWorkout !== null ? 0.6 : 1}
            className="transition-opacity duration-300"
          />

          {/* Workout line highlights */}
          {processedData.workoutSegments.map((segment, index) => (
            <path
              key={`workout-line-${index}`}
              d={`M ${segment.points[0].x} ${segment.points[0].y} ${
                segment.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
              }`}
              fill="none"
              stroke="#FF6A2C"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#lineGlow)"
              opacity={activeWorkout === index ? 1 : 0.8}
              className="transition-opacity duration-300 cursor-pointer"
              onMouseEnter={() => onWorkoutHover?.(index)}
              onMouseLeave={() => onWorkoutHover?.(null)}
            />
          ))}

          {/* Data points for workouts */}
          {processedData.workoutSegments.map((segment, segIndex) => 
            segment.points.map((point, pointIndex) => (
              <circle
                key={`point-${segIndex}-${pointIndex}`}
                cx={point.x}
                cy={point.y}
                r={activeWorkout === segIndex ? 4 : 2.5}
                fill="#FF6A2C"
                stroke="#ffffff"
                strokeWidth="1"
                opacity={activeWorkout === segIndex ? 1 : 0.7}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => onWorkoutHover?.(segIndex)}
                onMouseLeave={() => onWorkoutHover?.(null)}
              />
            ))
          )}

          {/* Hover line */}
          {hoveredTime && (
            <line 
              x1={hoveredTime.x} 
              y1={padding.top} 
              x2={hoveredTime.x} 
              y2={chartHeight - padding.bottom}
              stroke="white" 
              strokeWidth="1"
              strokeDasharray="4,2"
              opacity="0.8"
            />
          )}
        </svg>

        {/* Time labels */}
        <div className="absolute left-0 right-0 bottom-2">
          <div className="flex justify-between px-16 text-xs text-gray-400 font-medium">
            <span>7:00pm</span>
            <span>7:10pm</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-700/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--strain-blue)]"></div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">Base Strain</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--steps-orange)]"></div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">Workout Strain</span>
        </div>
      </div>
    </div>
  );
};

export default DailyStrainChart;