import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { stageColors } from '../../../utils/constants';

const SleepBarChart = ({ chartData, onBarHover, onBarClick, hiddenStages = [] }) => {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!chartData || !chartData.bars || chartData.bars.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-400">No sleep data available</p>
      </div>
    );
  }

  // Improved bar hover handler with better tooltip positioning
  const handleBarMouseEnter = useCallback((bar, index, event) => {
    setHoveredBar(bar.date);
    
    // Get more accurate positioning
    const rect = event.currentTarget.getBoundingClientRect();
    const chartContainer = event.currentTarget.closest('.chart-container');
    const containerRect = chartContainer ? chartContainer.getBoundingClientRect() : rect.parentElement.getBoundingClientRect();
    
    // Calculate metrics
    const metrics = {
      total: 0,
      awake: 0,
      light: 0,
      deep: 0,
      rem: 0
    };
    
    // Calculate totals for each sleep stage
    bar.segments.forEach(segment => {
      metrics[segment.stage] = segment.duration;
      if (segment.stage !== 'awake') {
        metrics.total += segment.duration;
      }
    });
    
    // Format duration helper
    const formatDuration = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = Math.floor(minutes % 60);
      return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    };
    
    // Set tooltip data with proper positioning
    setActiveTooltip({
      bar,
      metrics: {
        totalSleep: formatDuration(metrics.total),
        awake: formatDuration(metrics.awake),
        light: formatDuration(metrics.light),
        deep: formatDuration(metrics.deep),
        rem: formatDuration(metrics.rem),
      },
      position: {
        x: rect.left - containerRect.left + (rect.width / 2),
        y: rect.top
      }
    });
    
    if (onBarHover) onBarHover(bar.date);
  }, [onBarHover]);

  const handleBarMouseLeave = useCallback(() => {
    setHoveredBar(null);
    setActiveTooltip(null);
    if (onBarHover) onBarHover(null);
  }, [onBarHover]);

  return (
    <div className="absolute inset-0 overflow-hidden chart-container">
      {/* Simplified horizontal grid lines - only show essential lines */}

      
      {/* BARS CONTAINER - Enhanced interactive version */}
      <div className="absolute inset-x-0 bottom-0 top-0">
        {chartData.bars.map((bar, index) => {
          // Calculate total height as percentage of chart height
          const totalHeightPercent = bar.segments.reduce(
            (total, segment) => total + (segment.height / chartData.chartHeight) * 100,
            0
          );
          
          const isActive = hoveredBar === bar.date;
          
          return (
            <div
              key={index}
              className="group absolute transition-all duration-300 hover:z-20"
              style={{
                left: `${bar.x}px`,
                width: `${bar.width}px`,
                bottom: 0,
                height: `${totalHeightPercent}%`, 
                filter: isActive ? 'drop-shadow(0 0 5px rgba(255,255,255,0.25))' : 'none',
              }}
              onMouseEnter={(e) => handleBarMouseEnter(bar, index, e)}
              onMouseLeave={handleBarMouseLeave}
              onClick={() => onBarClick && onBarClick(bar.date)}
            >
              {/* Add subtle highlighting effect for active bars */}
              {isActive && (
                <div 
                  className="absolute inset-0 opacity-15 rounded-t-md"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                    transform: 'scale(1.05, 1)',
                    transformOrigin: 'bottom center',
                    zIndex: 1
                  }}
                />
              )}
              
              {/* Empty state */}
              {(!bar.segments || bar.segments.length === 0) && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-8 bg-gray-700/30 border border-gray-600/30 rounded-sm"
                />
              )}
              
              {/* Render bar segments */}
              {bar.segments && bar.segments.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse h-full">
                  {bar.segments
                    .filter(segment => !hiddenStages.includes(segment.stage))
                    .map((segment, segIndex, filteredSegments) => {
                      // Calculate height as percentage of the TOTAL bar height
                      const heightPercent = (segment.height / chartData.chartHeight) * 100 / totalHeightPercent * 100;
                      const isLastSegment = segIndex === filteredSegments.length - 1;
                      
                      return (
                        <div
                          key={segIndex}
                          className="w-full transition-all duration-200 relative group/segment"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: segment.color,
                            opacity: isActive ? 1 : 0.85,
                            boxShadow: isActive ? '0 2px 5px rgba(0,0,0,0.3)' : 'none',
                            borderTopLeftRadius: isLastSegment ? '3px' : 0,
                            borderTopRightRadius: isLastSegment ? '3px' : 0,
                            transform: isActive ? 'scaleX(1.08)' : 'scaleX(1)',
                            transformOrigin: 'bottom center',
                            zIndex: 10 - segIndex
                          }}
                        >
                          {/* Individual segment hover tooltip */}
                          {isActive && (
                            <div 
                              className="hidden absolute left-full ml-2 bg-gray-800/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-30 group-hover/segment:block pointer-events-none"
                              style={{
                                top: '50%',
                                transform: 'translateY(-50%)',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}
                            >
                              {segment.stage.charAt(0).toUpperCase() + segment.stage.slice(1)}: {Math.floor(segment.duration / 60)}h {Math.floor(segment.duration % 60)}m
                            </div>
                          )}
                        </div>
                      );
                  })}
                </div>
              )}
              
              {/* Average BPM indicator - enhanced */}
              {bar.avgBpm && (
                <div 
                  className="absolute left-0 right-0 transition-all duration-200"
                  style={{
                    bottom: `${(bar.avgBpm / 150) * 100}%`,
                    zIndex: 20,
                  }}
                >
                  <div
                    className="h-0.5 transition-all duration-200"
                    style={{
                      backgroundColor: '#ff8c8c',
                      opacity: isActive ? 0.9 : 0.6,
                      width: isActive ? '100%' : '70%',
                      marginLeft: isActive ? '0%' : '15%',
                      boxShadow: isActive ? '0 0 4px rgba(255,140,140,0.5)' : 'none',
                    }}
                  />
                  
                  {/* Add small circular indicator when hovered */}
                  {isActive && (
                    <div
                      className="absolute h-2 w-2 rounded-full bg-red-300 right-0 top-1/2 -translate-y-1/2 -translate-x-1/2"
                      style={{
                        boxShadow: '0 0 4px rgba(255,140,140,0.6)',
                      }}
                    >
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mt-[-4px] bg-gray-800/90 text-white text-[10px] px-1 py-0.5 rounded whitespace-nowrap">
                        BPM: {bar.avgBpm}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Day indicator dot - enhanced */}
              <div
                className="absolute left-1/2 rounded-full transition-all duration-300"
                style={{
                  bottom: '-8px',
                  width: isActive ? '3px' : '2px',
                  height: isActive ? '3px' : '2px',
                  transform: 'translateX(-50%)',
                  backgroundColor: isActive 
                    ? 'rgba(255,255,255,1)' 
                    : 'rgba(156,163,175,0.5)',
                  boxShadow: isActive ? '0 0 4px rgba(255,255,255,0.5)' : 'none',
                  zIndex: 30
                }}
              />
              
              {/* Date indicator on hover */}
              {isActive && (
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 bg-gray-800/80 text-white text-xs px-2 py-0.5 rounded-sm pointer-events-none whitespace-nowrap"
                  style={{
                    bottom: '-24px',
                    zIndex: 40
                  }}
                >
                  {format(new Date(bar.date), 'MMM d')}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Enhanced main tooltip - now with animation and better visuals */}
      {activeTooltip && (
        <div 
          className="absolute z-50 bg-gray-800/95 text-white px-4 py-3 rounded-lg shadow-xl text-xs pointer-events-none"
          style={{
            left: `${activeTooltip.position.x}px`,
            bottom: '100%',
            marginBottom: '15px',
            transform: 'translateX(-50%)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            maxWidth: '280px',
            animation: 'tooltipFadeIn 0.2s ease-out'
          }}
        >
          <div className="font-medium text-sm pb-1.5 border-b border-white/10">
            {format(new Date(activeTooltip.bar.date), 'EEEE, MMM d')}
          </div>
          
          <div className="mt-2">
            <div className="font-medium mb-2 text-sm flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-400/30 mr-1.5"></div>
              <span>Total Sleep: <span className="text-blue-300">{activeTooltip.metrics.totalSleep}</span></span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <div className="flex items-center gap-1.5 hover:bg-white/5 p-1 rounded-md transition-colors">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stageColors.deep }}></div>
                <span>Deep: <span className="font-medium text-teal-300">{activeTooltip.metrics.deep}</span></span>
              </div>
              
              <div className="flex items-center gap-1.5 hover:bg-white/5 p-1 rounded-md transition-colors">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stageColors.rem }}></div>
                <span>REM: <span className="font-medium text-blue-300">{activeTooltip.metrics.rem}</span></span>
              </div>
              
              <div className="flex items-center gap-1.5 hover:bg-white/5 p-1 rounded-md transition-colors">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stageColors.light }}></div>
                <span>Light: <span className="font-medium text-yellow-300">{activeTooltip.metrics.light}</span></span>
              </div>
              
              <div className="flex items-center gap-1.5 hover:bg-white/5 p-1 rounded-md transition-colors">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: stageColors.awake }}></div>
                <span>Awake: <span className="font-medium text-red-300">{activeTooltip.metrics.awake}</span></span>
              </div>
            </div>
            
            {activeTooltip.bar.avgBpm && (
              <div className="mt-2.5 pt-1.5 border-t border-white/10 flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-400 mr-1.5"></div>
                <span className="font-medium">
                  Avg BPM: <span className="text-red-300">{activeTooltip.bar.avgBpm}</span>
                </span>
              </div>
            )}
          </div>
          
          {/* Add triangle pointer with subtle glow */}
          <div 
            className="absolute left-1/2 w-3 h-3 bg-gray-800/95 transform -translate-x-1/2 rotate-45 border-r border-b border-white/15"
            style={{ 
              bottom: '-6px',
              boxShadow: '2px 2px 2px rgba(0,0,0,0.2)'
            }}
          />
        </div>
      )}
      
      {/* Date labels */}
      <div className="absolute left-0 right-0 top-full">
        {chartData.dateLabels && chartData.dateLabels.map((label, i) => (
          <div 
            key={i}
            className="absolute -translate-x-1/2 text-xs font-medium transition-colors duration-200"
            style={{ 
              left: `${label.x}px`, 
              top: '12px',
              color: hoveredBar && label.date === hoveredBar ? 'white' : 'rgb(156, 163, 175)'
            }}
          >
            {label.label}
          </div>
        ))}
      </div>
      
      {/* Add keyframes for tooltip animation */}
      <style jsx>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SleepBarChart;