import React, { useState, useRef } from 'react';
import { ChevronDown, Info, User, Calendar, LayoutDashboard, Menu } from 'lucide-react'; // ADDED: Menu import, REMOVED: Bot import
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
  const [showMenu, setShowMenu] = useState(false); // NEW: Menu state
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
    <div className="font-['Plus_Jakarta_Sans']" style={{ background: 'transparent' }}>
      {/* Header with centered logo and user profile on left */}
      <div className="flex items-center px-4 py-2 relative" style={{ background: 'transparent' }}>
        {/* Left section - Menu and user profile */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Menu button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)] relative"
            style={{ background: 'transparent' }}
            title="Menu"
          >
            <Menu size={20} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
          </button>
          
          {/* User avatar */}
          <div className="w-7 h-7 rounded-full overflow-hidden border border-[rgba(255,255,255,0.15)] flex-shrink-0 bg-[var(--card-bg)]">
            {userData.profileImage ? (
              <img 
                src={userData.profileImage} 
                alt={userData.fullName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <User size={14} className="text-[var(--text-muted)]" />
              </div>
            )}
          </div>
          
          {/* Name and username - stacked */}
          <div>
            <div className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{userData.fullName}</div>
            <div className="text-[9px] text-[var(--text-muted)] leading-tight">@{userData.username}</div>
          </div>
        </div>
        
        {/* Center - WHOOP logo */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <img 
            src={whoopLogo} 
            alt="WHOOP" 
            className="h-5 text-white cursor-pointer"
            style={{ filter: 'brightness(0) invert(1)' }}
            onClick={() => setActiveTab('overview')}
            title="Return to Overview" 
          />
        </div>
        
        {/* Right section - Empty now that Overview moved */}
        <div className="flex-1 flex justify-end">
          {/* Overview button removed - now in Dashboard beside calendar */}
        </div>
      </div>
      
      {/* Metrics section */}
      <div className="px-20 py-6" style={{ background: 'transparent' }}>
        <div className="flex justify-center items-start gap-80">
          {/* Strain Ring */}
          <div 
            className="flex flex-col items-center relative cursor-pointer transition-all duration-300"
            onClick={() => setActiveTab('strain')}
            onMouseEnter={() => setHoveredRing('strain')}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              transform: activeTab === 'strain' 
                ? 'translateY(-8px) scale(1.06)'
                : hoveredRing === 'strain' 
                  ? 'translateY(-4px) scale(1.03)'
                  : 'translateY(0) scale(1)',
              filter: activeTab === 'strain' 
                ? 'drop-shadow(0 6px 12px rgba(0, 147, 231, 0.25))'
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
                size={120}
                isInteractive={activeTab !== 'strain'}
              />
              
              {activeTab !== 'strain' && hoveredRing === 'strain' && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, rgba(0, 147, 231, 0.08) 0%, rgba(0, 147, 231, 0) 70%)',
                    transform: 'scale(1.1)',
                    animation: 'pulse 2s infinite'
                  }}
                ></div>
              )}
            </div>
          </div>
          
          {/* Recovery Ring */}
          <div 
            className="flex flex-col items-center relative cursor-pointer transition-all duration-300"
            onClick={() => setActiveTab('recovery')}
            onMouseEnter={() => setHoveredRing('recovery')}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              transform: activeTab === 'recovery' 
                ? 'translateY(-8px) scale(1.06)'
                : hoveredRing === 'recovery' 
                  ? 'translateY(-4px) scale(1.03)'
                  : 'translateY(0) scale(1)',
              filter: activeTab === 'recovery' 
                ? `drop-shadow(0 6px 12px ${recoveryColor}40)`
                : hoveredRing === 'recovery'
                  ? `drop-shadow(0 4px 8px ${recoveryColor}30)`
                  : 'none',
              zIndex: (activeTab === 'recovery' || hoveredRing === 'recovery') ? 10 : 1
            }}
          >
            <div className="relative">
              <RecoveryRing 
                value={metrics.recovery} 
                size={120}
                isInteractive={activeTab !== 'recovery'}
              />
              
              {activeTab !== 'recovery' && hoveredRing === 'recovery' && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${recoveryColor}14 0%, ${recoveryColor}00 70%)`,
                    transform: 'scale(1.1)',
                    animation: 'pulse 2s infinite'
                  }}
                ></div>
              )}
            </div>
          </div>
          
          {/* Sleep Performance Ring */}
          <div 
            className="flex flex-col items-center relative cursor-pointer transition-all duration-300"
            onClick={() => setActiveTab('sleep')}
            onMouseEnter={() => setHoveredRing('sleep')}
            onMouseLeave={() => setHoveredRing(null)}
            style={{
              transform: activeTab === 'sleep' 
                ? 'translateY(-8px) scale(1.06)'
                : hoveredRing === 'sleep' 
                  ? 'translateY(-4px) scale(1.03)'
                  : 'translateY(0) scale(1)',
              filter: activeTab === 'sleep' 
                ? 'drop-shadow(0 6px 12px rgba(123, 161, 187, 0.25))'
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
                size={120}
                isInteractive={activeTab !== 'sleep'}
              />
              
              {activeTab !== 'sleep' && hoveredRing === 'sleep' && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, rgba(123, 161, 187, 0.08) 0%, rgba(123, 161, 187, 0) 70%)',
                    transform: 'scale(1.1)',
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
          0% { transform: scale(1.06); opacity: 0.2; }
          50% { transform: scale(1.12); opacity: 0.3; }
          100% { transform: scale(1.06); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default TopMetricsCard;