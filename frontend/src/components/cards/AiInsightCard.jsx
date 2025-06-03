import React from 'react';
import { ChevronRight, Bot } from 'lucide-react';

const AiInsightCard = ({ 
  type = 'sleep', // 'sleep', 'recovery', 'strain'
  insights = [], 
  setActiveTab,
  selectedDate
}) => {
  // Get the date string for data lookup
  const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  
  // Page-specific AI insights based on the current page
  const pageSpecificInsights = {
    sleep: "Your Sleep Performance is sufficient, but there's room to improve - Sleep Consistency could use attention to help you get to optimal sleep.",
    recovery: "Your HRV (64 ms) and RHR (58 bpm) are within their usual ranges which resulted in a solid recovery. Stay on track with your fitness goals by building moderate Strain today.",
    strain: "You've made solid progress on your Strain today. A moderate activity could bring you closer to your optimal Strain range and improve overall fitness."
  };

  // Detailed AI Coach responses for each page
  const aiCoachResponses = {
    sleep: `Great job hitting a 77% Sleep Performance last night - solid work staying in the sufficient range!

Your Sleep Efficiency was strong at 88% (near the optimal 90%+), and Sleep Stress was impressively low, with just 4 minutes of medium stress. These are wins worth celebrating!

What held you back was Hours vs. Needed at 75% - you slept 5:57 but needed 7:54. Sleep Consistency also came in at 60%, below the 80%+ optimal range, likely due to going to bed later than your 30-day average of 1:04 a.m.

To improve, try setting a consistent bedtime closer to your average or slightly earlier. This will boost Sleep Consistency and help you meet your sleep need. Avoiding late-night screen time or caffeine can also support earlier, better-quality sleep.

You're making progress - keep building on these habits! Every small adjustment adds up to better recovery and performance. Let's aim for 85%+ next time!`,

    recovery: `Excellent work on your 67% Recovery score today - you're solidly in the yellow zone and ready for moderate training!

Your HRV of 64 ms and RHR of 58 bpm are both within your normal ranges, showing your body is responding well to your recent training load. Your sleep contributed positively with good efficiency and low stress levels.

What's working: Your cardiovascular fitness is strong (evidenced by that solid RHR), and your autonomic nervous system is well-balanced (shown by consistent HRV patterns).

To push into the green zone (70%+): Focus on sleep consistency - getting to bed closer to your optimal time will help boost both HRV and overall recovery. Consider adding 10-15 minutes of breathwork or meditation before bed to enhance parasympathetic recovery.

Today's plan: You're primed for moderate Strain activities. A good workout or active session will complement this recovery level perfectly without pushing into overreach territory.

Keep this momentum going - consistent recovery habits lead to breakthrough performance gains!`,

    strain: `Nice work building your Strain today - you're making smart progress toward your fitness goals!

Your current approach shows good balance between effort and recovery. The moderate activity levels you've been maintaining are in the sweet spot for sustainable fitness building without overreaching.

What's working: You're staying consistent with daily movement and allowing proper recovery between higher-intensity sessions. This approach builds aerobic capacity while minimizing injury risk.

To optimize further: Consider adding one slightly higher-intensity session this week if your recovery supports it. Look for opportunities to build Strain through longer duration activities rather than just higher intensity - this develops your aerobic base effectively.

Your strain patterns show you understand the importance of progressive overload. The key is maintaining this consistency while gradually challenging yourself when recovery allows.

Tomorrow's strategy: Based on your recent patterns, aim for moderate Strain again, but listen to your body. If you're feeling strong, push a bit harder. If you're feeling tired, dial it back and prioritize recovery.

You're building sustainable fitness habits - this is exactly how long-term improvements happen!`
  };

  const displayInsight = insights.length > 0 ? insights[0] : pageSpecificInsights[type] || "";

  // Handle AI Coach navigation with pre-loaded response
  const handleAiCoachClick = () => {
    if (setActiveTab) {
      // Store the AI response in sessionStorage so the AI Coach can pick it up
      const aiResponse = aiCoachResponses[type];
      sessionStorage.setItem('aiCoachPreloadedResponse', JSON.stringify({
        type: type,
        response: aiResponse,
        timestamp: Date.now()
      }));
      
      // Navigate to AI Coach
      setActiveTab('ai-coach');
    }
  };

  return (
    <div className="w-full mb-2">
      <div className="relative p-3 rounded-lg overflow-hidden bg-transparent cursor-pointer transition-all duration-200 hover:scale-[1.01]" onClick={handleAiCoachClick}>
        {/* Gradient border effect - Enhanced for interactivity */}
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
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Main insight text */}
          <p className="text-white text-sm font-medium mb-2 md:mb-0 md:mr-4 leading-tight md:max-w-[70%]">
            {displayInsight}
          </p>
          
          {/* Enhanced call to action button */}
          <div className="flex items-center flex-shrink-0 group">
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