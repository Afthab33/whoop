import React from 'react';
import { ChevronRight } from 'lucide-react';

const AiInsightCard = ({ 
  type = 'sleep', // 'sleep', 'recovery', 'strain'
  insights = [], 
}) => {
  // Placeholder insights if none provided
  const defaultInsights = {
    sleep: [
      "Your Sleep Performance is sufficient, but there's room to improve - Sleep Consistency could use attention to help you get to optimal sleep."
    ],
    recovery: [
      "Your Recovery score has been trending higher this week compared to your monthly average. Your rest days are paying off."
    ],
    strain: [
      "Your Strain levels have been optimal for building fitness without overreaching. Keep this balance for continued improvement."
    ]
  };
  
  const displayInsight = insights.length > 0 ? insights[0] : defaultInsights[type][0] || "";
  
  // Adjust padding for sleep type to be more compact
  const padding = type === 'sleep' ? 'p-3' : 'p-4';
  
  return (
    <div className="w-full mb-2">
      <div className={`relative ${padding} rounded-lg overflow-hidden bg-transparent`}>
        {/* Gradient border effect */}
        <div 
          className="absolute inset-0 rounded-lg border border-transparent bg-transparent" 
          style={{
            background: 'linear-gradient(to right bottom, rgba(151, 71, 255, 0.5), rgba(77, 168, 255, 0.5)) border-box',
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Main insight text - reduced size */}
          <p className="text-white text-sm font-medium mb-2 md:mb-0 md:mr-4 leading-tight md:max-w-[70%]">
            {displayInsight}
          </p>
          
          {/* Call to action button - more compact */}
          <div className="flex items-center flex-shrink-0">
            <span 
              className="text-xs font-bold tracking-wide mr-1 uppercase whitespace-nowrap"
              style={{
                background: 'linear-gradient(90deg, #9747FF 0%, #4DA8FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent'
              }}
            >
              Learn more with WHOOP Coach
            </span>
            <ChevronRight 
              style={{
                color: '#4DA8FF'
              }}
              className="h-4 w-4" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiInsightCard;