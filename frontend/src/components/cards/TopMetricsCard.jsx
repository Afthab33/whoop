import React, { useState, useRef } from 'react';
import { ChevronDown, Info, User, Calendar, LayoutDashboard, ChevronLeft } from 'lucide-react';
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
  
  return (
    <div className="font-['Plus_Jakarta_Sans']">
      {/* Header with centered logo and user profile on left */}
      <div className="flex items-center bg-[var(--bg-base)] px-5 py-3.5 relative">
        {/* Left section - User profile and back button when needed */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Back to overview button - only visible when not on overview page */}
          {activeTab !== 'overview' && (
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--card-bg)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Back to Overview"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          
          {/* User avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[rgba(255,255,255,0.15)] flex-shrink-0 bg-[var(--card-bg)]">
            {userData.profileImage ? (
              <img 
                src={userData.profileImage} 
                alt={userData.fullName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <User size={16} className="text-[var(--text-muted)]" />
              </div>
            )}
          </div>
          
          {/* Name and username - stacked */}
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{userData.fullName}</div>
            <div className="text-[10px] text-[var(--text-muted)] leading-tight">@{userData.username}</div>
          </div>
        </div>
        
        {/* Center - WHOOP logo */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <img 
            src={whoopLogo} 
            alt="WHOOP" 
            className="h-6 text-white cursor-pointer" 
            style={{ filter: 'brightness(0) invert(1)' }}
            onClick={() => setActiveTab('overview')}
            title="Return to Overview" 
          />
        </div>
        
        {/* Right section - Empty or reserved for future use */}
        <div className="flex-1 flex justify-end">
          {/* Placeholder for future elements (notifications, settings, etc.) */}
        </div>
      </div>
      
      {/* Metrics section with refined interactive rings */}
      <div className="bg-[var(--bg-base)] px-40 py-10 mt-4">
        <div className="flex justify-between items-start">
          {/* Strain Ring - Enhanced interactive effects */}
          <div 
            className="flex flex-col items-center relative cursor-pointer transition-all duration-300"
            onClick={() => setActiveTab('strain')}
            onMouseEnter={() => setHoveredRing('strain')}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              transform: activeTab === 'strain' 
                ? 'translateY(-10px) scale(1.08)' 
                : hoveredRing === 'strain' 
                  ? 'translateY(-5px) scale(1.04)' 
                  : 'translateY(0) scale(1)',
              filter: activeTab === 'strain' 
                ? 'drop-shadow(0 8px 16px rgba(93, 141, 238, 0.25))' 
                : hoveredRing === 'strain'
                  ? 'drop-shadow(0 6px 12px rgba(93, 141, 238, 0.15))'
                  : 'none',
              zIndex: (activeTab === 'strain' || hoveredRing === 'strain') ? 10 : 1
            }}
          >
            <div className="relative">
              <StrainRing 
                value={metrics.strain} 
                max={21} 
                size={130} 
                isInteractive={activeTab !== 'strain'}
              />
              
              {/* Interactive pulse effect on hover when not active */}
              {activeTab !== 'strain' && hoveredRing === 'strain' && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, rgba(93, 141, 238, 0.08) 0%, rgba(93, 141, 238, 0) 70%)',
                    transform: 'scale(1.12)',
                    animation: 'pulse 2s infinite'
                  }}
                ></div>
              )}
            </div>
          </div>
          
          {/* Recovery Ring - Enhanced interactive effects */}
          <div 
            className="flex flex-col items-center relative cursor-pointer transition-all duration-300"
            onClick={() => setActiveTab('recovery')}
            onMouseEnter={() => setHoveredRing('recovery')}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              transform: activeTab === 'recovery' 
                ? 'translateY(-10px) scale(1.08)' 
                : hoveredRing === 'recovery' 
                  ? 'translateY(-5px) scale(1.04)' 
                  : 'translateY(0) scale(1)',
              filter: activeTab === 'recovery' 
                ? 'drop-shadow(0 8px 16px rgba(63, 182, 94, 0.25))' 
                : hoveredRing === 'recovery'
                  ? 'drop-shadow(0 6px 12px rgba(63, 182, 94, 0.15))'
                  : 'none',
              zIndex: (activeTab === 'recovery' || hoveredRing === 'recovery') ? 10 : 1
            }}
          >
            <div className="relative">
              <RecoveryRing 
                value={metrics.recovery} 
                size={130} 
                isInteractive={activeTab !== 'recovery'}
              />
              
              {/* Interactive pulse effect on hover when not active */}
              {activeTab !== 'recovery' && hoveredRing === 'recovery' && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, rgba(63, 182, 94, 0.08) 0%, rgba(63, 182, 94, 0) 70%)',
                    transform: 'scale(1.12)',
                    animation: 'pulse 2s infinite'
                  }}
                ></div>
              )}
              
            </div>
          </div>
          
          {/* Sleep Performance Ring - Enhanced interactive effects */}
          <div 
            className="flex flex-col items-center relative cursor-pointer transition-all duration-300"
            onClick={() => setActiveTab('sleep')}
            onMouseEnter={() => setHoveredRing('sleep')}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              transform: activeTab === 'sleep' 
                ? 'translateY(-10px) scale(1.08)' 
                : hoveredRing === 'sleep' 
                  ? 'translateY(-5px) scale(1.04)' 
                  : 'translateY(0) scale(1)',
              filter: activeTab === 'sleep' 
                ? 'drop-shadow(0 8px 16px rgba(110, 163, 195, 0.25))' 
                : hoveredRing === 'sleep'
                  ? 'drop-shadow(0 6px 12px rgba(110, 163, 195, 0.15))'
                  : 'none',
              zIndex: (activeTab === 'sleep' || hoveredRing === 'sleep') ? 10 : 1
            }}
          >
            <div className="relative">
              <SleepPerformanceRing 
                value={metrics.sleep.score} 
                max={100} 
                size={130} 
                isInteractive={activeTab !== 'sleep'}
              />
              
              {/* Interactive pulse effect on hover when not active */}
              {activeTab !== 'sleep' && hoveredRing === 'sleep' && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, rgba(110, 163, 195, 0.08) 0%, rgba(110, 163, 195, 0) 70%)',
                    transform: 'scale(1.12)',
                    animation: 'pulse 2s infinite'
                  }}
                ></div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1.08); opacity: 0.2; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(1.08); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default TopMetricsCard;