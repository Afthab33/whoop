import React from 'react';
import { ChevronRight } from 'lucide-react';

const AiInsightCard = ({ 
  type = 'sleep', // 'sleep', 'recovery', 'strain'
  insights = [], 
  setActiveTab,
  selectedDate
}) => {
  // Page-specific AI insights based on the current page
  const pageSpecificInsights = {
    sleep: "Your Sleep Performance is sufficient, but there's room to improve - Sleep Consistency could use attention to help you get to optimal sleep.",
    recovery: "Your HRV (64 ms) and RHR (58 bpm) are within their usual ranges which resulted in a solid recovery. Stay on track with your fitness goals by building moderate Strain today.",
    strain: "You've made solid progress on your Strain today. A moderate activity could bring you closer to your optimal Strain range and improve overall fitness."
  };

  const displayInsight = insights.length > 0 ? insights[0] : pageSpecificInsights[type] || "";

  // Simple navigation to AI Coach
  const handleAiCoachClick = () => {
    if (setActiveTab) {
      setActiveTab('ai-coach');
    }
  };

  return (
    <div className="w-full mb-2">
      <div className="relative p-3 sm:p-4 rounded-lg overflow-hidden bg-transparent cursor-pointer transition-all duration-200 hover:scale-[1.01]" onClick={handleAiCoachClick}>
        {/* Gradient border effect */}
        <div 
          className="absolute inset-0 rounded-lg border border-transparent bg-transparent transition-opacity duration-200 hover:opacity-80" 
          style={{
            background: 'linear-gradient(to right bottom, rgba(151, 71, 255, 0.5), rgba(77, 168, 255, 0.5)) border-box',
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        
        {/* Subtle hover glow effect */}
        <div 
          className="absolute inset-0 rounded-lg opacity-0 hover:opacity-10 transition-opacity duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(151, 71, 255, 0.3), rgba(77, 168, 255, 0.3))'
          }}
        />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          {/* Main insight text */}
          <p className="text-white text-sm font-medium mb-3 sm:mb-0 sm:mr-4 leading-tight sm:max-w-[70%]">
            {displayInsight}
          </p>
          
          {/* Call to action button */}
          <div className="flex items-center justify-center sm:justify-end flex-shrink-0 group">
            <span 
              className="text-xs font-bold tracking-wide mr-1 uppercase whitespace-nowrap transition-all duration-200 group-hover:tracking-wider"
              style={{
                background: 'linear-gradient(90deg, #9747FF 0%, #4DA8FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent'
              }}
            >
              Chat with AI Coach
            </span>
            <ChevronRight 
              style={{ color: '#4DA8FF' }}
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiInsightCard;