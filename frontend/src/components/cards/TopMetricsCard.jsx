import React, { useState, useRef } from 'react';
import { ChevronDown, Info, User, Calendar, LayoutDashboard, ChevronLeft, Bot } from 'lucide-react';
import StrainRing from '../../features/strain/components/StrainRing';
import RecoveryRing from '../../features/recovery/components/RecoveryRing';
import SleepPerformanceRing from '../../features/sleep/components/SleepPerformanceRing';
import whoopLogo from '../../assets/whoop.svg';
import whoopData from '../../data/day_wise_whoop_data.json';

const TopMetricsCard = ({
  userData = {
    fullName: "Aftab Hussain",
    username: "aftab33",
    profileImage: null
  },
  selectedDate = new Date(),
  setSelectedDate = () => {},
  setActiveTab = () => {},
  activeTab = 'overview'
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarButtonRef = useRef(null);
  const [hoveredRing, setHoveredRing] = useState(null);
  
  // Format date string for lookup in the data
  const dateStr = selectedDate.toISOString().split('T')[0];
  
  // Get data for the selected date
  const dayData = whoopData[dateStr] || {};
  const physiologicalData = dayData.physiological_summary || {};
  const sleepData = dayData.sleep_summary || {};
  
  // Extract metrics or use defaults if data is not available
  const metrics = {
    strain: physiologicalData["Day Strain"] || 7.6,
    recovery: physiologicalData["Recovery score %"] || 67,
    sleep: {
      score: sleepData["Sleep performance %"] || 89,
      hours: `${Math.floor(sleepData["Asleep duration (min)"] / 60 || 6)}:${String(sleepData["Asleep duration (min)"] % 60 || 20).padStart(2, '0')}`,
      needed: `${Math.floor(sleepData["Sleep need (min)"] / 60 || 7)}:${String(sleepData["Sleep need (min)"] % 60 || 8).padStart(2, '0')}`
    }
  };
  
  // Format the selected date for display
  const formattedDate = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric'
  });
  
  // Get recovery color based on value
  const getRecoveryColor = (value) => {
    if (value >= 67) return "#16EC06"; // High Recovery
    if (value >= 34) return "#FFDE00"; // Medium Recovery
    return "#FF0026"; // Low Recovery
  };
  
  const recoveryColor = getRecoveryColor(metrics.recovery);

  return (
    <div className="font-['Plus_Jakarta_Sans']">
      {/* Header with centered logo and user profile on left - REDUCED PADDING */}
      <div className="flex items-center bg-[var(--bg-base)] px-4 py-2 relative"> {/* Reduced from px-5 py-3.5 to px-4 py-2 */}
        {/* Left section - User profile and back button when needed */}
        <div className="flex items-center space-x-2 flex-1"> {/* Reduced from space-x-3 to space-x-2 */}
          {/* Back to overview button - only visible when not on overview page */}
          {activeTab !== 'overview' && (
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--card-bg)] hover:bg-[var(--bg-hover)] transition-colors" // Reduced from w-8 h-8 to w-7 h-7
              title="Back to Overview"
            >
              <ChevronLeft size={16} /> {/* Reduced from size={18} to size={16} */}
            </button>
          )}
          
          {/* User avatar - SMALLER */}
          <div className="w-7 h-7 rounded-full overflow-hidden border border-[rgba(255,255,255,0.15)] flex-shrink-0 bg-[var(--card-bg)]"> {/* Reduced from w-8 h-8 to w-7 h-7 */}
            {userData.profileImage ? (
              <img 
                src={userData.profileImage} 
                alt={userData.fullName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <User size={14} className="text-[var(--text-muted)]" /> {/* Reduced from size={16} to size={14} */}
              </div>
            )}
          </div>
          
          {/* Name and username - stacked - SMALLER TEXT */}
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{userData.fullName}</div> {/* Reduced from text-sm to text-xs */}
            <div className="text-[9px] text-[var(--text-muted)] leading-tight">@{userData.username}</div> {/* Reduced from text-[10px] to text-[9px] */}
          </div>
        </div>
        
        {/* Center - WHOOP logo - SMALLER */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <img 
            src={whoopLogo} 
            alt="WHOOP" 
            className="h-5 text-white cursor-pointer" // Reduced from h-6 to h-5
            style={{ filter: 'brightness(0) invert(1)' }}
            onClick={() => setActiveTab('overview')}
            title="Return to Overview" 
          />
        </div>
        
        {/* Right section - AI Coach button - SMALLER */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setActiveTab('ai-coach')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${  // Reduced gap and padding
              activeTab === 'ai-coach' 
                ? 'bg-purple-600 text-white' 
                : 'bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
            style={{
              background: activeTab === 'ai-coach' ? '#8754e0' : 'var(--card-bg)',
              boxShadow: activeTab === 'ai-coach' ? '0 2px 8px rgba(135, 84, 224, 0.3)' : 'none'
            }}
            title="Chat with your AI Coach"
          >
            <Bot size={14} className={activeTab === 'ai-coach' ? 'text-white' : 'text-purple-400'} /> {/* Reduced from size={16} to size={14} */}
            <span className="text-xs font-medium">AI Coach</span> {/* Reduced from text-sm to text-xs */}
          </button>
        </div>
      </div>
      
      {/* Metrics section - SIGNIFICANTLY REDUCED PADDING */}
      <div className="bg-[var(--bg-base)] px-20 py-6"> {/* Removed mt-2 to reduce space */}
        <div className="flex justify-center items-start gap-80"> {/* Changed from justify-between to justify-center and added gap-8 */}
          {/* Strain Ring - SLIGHTLY BIGGER */}
          <div 
            className="flex flex-col items-center relative cursor-pointer transition-all duration-300"
            onClick={() => setActiveTab('strain')}
            onMouseEnter={() => setHoveredRing('strain')}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              transform: activeTab === 'strain' 
                ? 'translateY(-8px) scale(1.06)' // Reduced animation scale
                : hoveredRing === 'strain' 
                  ? 'translateY(-4px) scale(1.03)' // Reduced hover scale
                  : 'translateY(0) scale(1)',
              filter: activeTab === 'strain' 
                ? 'drop-shadow(0 6px 12px rgba(0, 147, 231, 0.25))' // Reduced shadow
                : hoveredRing === 'strain'
                  ? 'drop-shadow(0 4px 8px rgba(0, 147, 231, 0.15))'
                  : 'none',
              zIndex: (activeTab === 'strain' || hoveredRing === 'strain') ? 10 : 1
            }}
          >
            <div className="relative">
              <StrainRing 
                value={metrics.strain} 
                max={21} 
                size={120} // Increased from 110 to 120
                isInteractive={activeTab !== 'strain'}
              />
              
              {/* Interactive pulse effect on hover when not active */}
              {activeTab !== 'strain' && hoveredRing === 'strain' && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, rgba(0, 147, 231, 0.08) 0%, rgba(0, 147, 231, 0) 70%)',
                    transform: 'scale(1.1)', // Reduced from 1.12
                    animation: 'pulse 2s infinite'
                  }}
                ></div>
              )}
            </div>
          </div>
          
          {/* Recovery Ring - SLIGHTLY BIGGER */}
          <div 
            className="flex flex-col items-center relative cursor-pointer transition-all duration-300"
            onClick={() => setActiveTab('recovery')}
            onMouseEnter={() => setHoveredRing('recovery')}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              transform: activeTab === 'recovery' 
                ? 'translateY(-8px) scale(1.06)' // Reduced animation scale
                : hoveredRing === 'recovery' 
                  ? 'translateY(-4px) scale(1.03)' // Reduced hover scale
                  : 'translateY(0) scale(1)',
              filter: activeTab === 'recovery' 
                ? `drop-shadow(0 6px 12px ${recoveryColor}40)` // Reduced shadow
                : hoveredRing === 'recovery'
                  ? `drop-shadow(0 4px 8px ${recoveryColor}30)`
                  : 'none',
              zIndex: (activeTab === 'recovery' || hoveredRing === 'recovery') ? 10 : 1
            }}
          >
            <div className="relative">
              <RecoveryRing 
                value={metrics.recovery} 
                size={120} // Increased from 110 to 120
                isInteractive={activeTab !== 'recovery'}
              />
              
              {/* Interactive pulse effect on hover when not active */}
              {activeTab !== 'recovery' && hoveredRing === 'recovery' && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${recoveryColor}14 0%, ${recoveryColor}00 70%)`,
                    transform: 'scale(1.1)', // Reduced from 1.12
                    animation: 'pulse 2s infinite'
                  }}
                ></div>
              )}
            </div>
          </div>
          
          {/* Sleep Performance Ring - SLIGHTLY BIGGER */}
          <div 
            className="flex flex-col items-center relative cursor-pointer transition-all duration-300"
            onClick={() => setActiveTab('sleep')}
            onMouseEnter={() => setHoveredRing('sleep')}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              transform: activeTab === 'sleep' 
                ? 'translateY(-8px) scale(1.06)' // Reduced animation scale
                : hoveredRing === 'sleep' 
                  ? 'translateY(-4px) scale(1.03)' // Reduced hover scale
                  : 'translateY(0) scale(1)',
              filter: activeTab === 'sleep' 
                ? 'drop-shadow(0 6px 12px rgba(123, 161, 187, 0.25))' // Reduced shadow
                : hoveredRing === 'sleep'
                  ? 'drop-shadow(0 4px 8px rgba(123, 161, 187, 0.15))'
                  : 'none',
              zIndex: (activeTab === 'sleep' || hoveredRing === 'sleep') ? 10 : 1
            }}
          >
            <div className="relative">
              <SleepPerformanceRing 
                value={metrics.sleep.score} 
                max={100} 
                size={120} // Increased from 110 to 120
                isInteractive={activeTab !== 'sleep'}
              />
              
              {/* Interactive pulse effect on hover when not active */}
              {activeTab !== 'sleep' && hoveredRing === 'sleep' && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, rgba(123, 161, 187, 0.08) 0%, rgba(123, 161, 187, 0) 70%)',
                    transform: 'scale(1.1)', // Reduced from 1.12
                    animation: 'pulse 2s infinite'
                  }}
                ></div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for animation - UPDATED */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1.06); opacity: 0.2; }
          50% { transform: scale(1.12); opacity: 0.3; }
          100% { transform: scale(1.06); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default TopMetricsCard;