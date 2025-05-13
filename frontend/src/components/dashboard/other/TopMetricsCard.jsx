import React, { useState, useRef } from 'react';
import { ChevronDown, Info, User, Calendar } from 'lucide-react';
import StrainRing from '../strain/StrainRing'; 
import RecoveryRing from '../recovery/RecoveryRing';
import SleepPerformanceRing from '../sleep/SleepPerformanceRing';
import whoopLogo from '../../../assets/whoop.svg';
import whoopData from '../../../data/day_wise_whoop_data.json';

const TopMetricsCard = ({
  userData = {
    fullName: "Aftab Hussain",
    username: "aftab33",
    profileImage: null // URL or null for default
  },
  selectedDate = new Date(), // Accept selectedDate from parent
  setSelectedDate = () => {}, // Accept setter from parent
  setActiveTab = () => {} // Add this to allow changing the active tab
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarButtonRef = useRef(null);
  
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
  
  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };
  
  return (
    <div className="font-['Plus_Jakarta_Sans']">
      {/* Header with logo, profile and day selector */}
      <div className="flex items-center justify-between bg-[var(--bg-base)] px-5 py-3.5">
        {/* WHOOP logo */}
        <img src={whoopLogo} alt="WHOOP" className="h-5 text-white" style={{ filter: 'brightness(0) invert(1)' }} />
        
        {/* Compact profile section - inline */}
        <div className="flex items-center">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[rgba(255,255,255,0.15)] flex-shrink-0 bg-[var(--card-bg)] mr-2">
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
      </div>
      
      {/* Metrics section with rings - now clickable */}
      <div className="bg-[var(--bg-base)] px-40 py-7">
        <div className="flex justify-between items-start">
          {/* Strain Ring - Clickable */}
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setActiveTab('strain')}
            title="View Strain Details"
          >
            <StrainRing value={metrics.strain} max={21} size={130} />
          </div>
          
          {/* Recovery Ring - Clickable */}
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setActiveTab('recovery')}
            title="View Recovery Details"
          >
            <RecoveryRing value={metrics.recovery} size={130} />
          </div>
          
          {/* Sleep Performance Ring - Clickable */}
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setActiveTab('sleep')}
            title="View Sleep Details"
          >
            <SleepPerformanceRing 
              value={metrics.sleep.score}
              max={100}
              size={130}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopMetricsCard;