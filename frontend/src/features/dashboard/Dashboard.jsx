// src/components/dashboard/Dashboard.jsx
import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, LayoutDashboard } from 'lucide-react';
import TopMetricsCard from '../../components/cards/TopMetricsCard';
import CalendarSelector from '../../components/layout/CalendarSelector';
import whoopData from '../../data/day_wise_whoop_data.json';

// Import content components
import Overview from '../overview/Overview';
import Sleep from '../sleep/Sleep';
import Recovery from '../recovery/Recovery';
import Strain from '../strain/Strain';
import AiCoach from '../ai-coach/AiCoach';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 3, 17)); // April 17, 2025
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarButtonRef = useRef(null);
  
  // Get dates that have data in the Whoop dataset
  const datesWithData = Object.keys(whoopData).sort();
  
  // Format date for display (e.g., "THU, APR 17")
  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options).toUpperCase();
  };
  
  // Handle date selection from calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };
  
  // Toggle calendar visibility
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };
  
  // Navigate to next/previous date with data
  const navigateDate = (direction) => {
    const currentDateStr = selectedDate.toISOString().split('T')[0];
    const currentIndex = datesWithData.indexOf(currentDateStr);
    
    if (currentIndex !== -1) {
      let newIndex;
      
      if (direction === 'next' && currentIndex < datesWithData.length - 1) {
        newIndex = currentIndex + 1;
      } else if (direction === 'prev' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else {
        return; // No valid date to navigate to
      }
      
      const newDateStr = datesWithData[newIndex];
      setSelectedDate(new Date(newDateStr));
    } else {
      // If current date is not in the dataset, find the closest date
      const closestDate = findClosestDate(selectedDate);
      if (closestDate) {
        setSelectedDate(new Date(closestDate));
      }
    }
  };
  
  // Find the closest date in our dataset to the given date
  const findClosestDate = (date) => {
    if (datesWithData.length === 0) return null;
    
    const dateTimestamp = date.getTime();
    
    // Sort by difference to find closest date
    const sortedDates = [...datesWithData].sort((a, b) => {
      const diffA = Math.abs(new Date(a).getTime() - dateTimestamp);
      const diffB = Math.abs(new Date(b).getTime() - dateTimestamp);
      return diffA - diffB;
    });
    
    return sortedDates[0];
  };
  
  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview selectedDate={selectedDate} setActiveTab={setActiveTab} />; // Added setActiveTab
      case 'sleep':
        return <Sleep selectedDate={selectedDate} setActiveTab={setActiveTab} />; // Already has it
      case 'recovery':
        return <Recovery selectedDate={selectedDate} setActiveTab={setActiveTab} />; // Added setActiveTab
      case 'strain':
        return <Strain selectedDate={selectedDate} setActiveTab={setActiveTab} />; // Added setActiveTab
      case 'ai-coach':
        return <AiCoach selectedDate={selectedDate} setActiveTab={setActiveTab} />;
      default:
        return <Overview selectedDate={selectedDate} setActiveTab={setActiveTab} />; // Added setActiveTab
    }
  };
  
  // Close the calendar
  const handleCloseCalendar = () => {
    setShowCalendar(false);
  };
  
  // Check if there are previous/next dates available
  const hasPrevDate = datesWithData.indexOf(selectedDate.toISOString().split('T')[0]) > 0;
  const hasNextDate = datesWithData.indexOf(selectedDate.toISOString().split('T')[0]) < datesWithData.length - 1;
  
  // AI Coach gets full screen treatment
  if (activeTab === 'ai-coach') {
    return (
      <div className="h-screen overflow-hidden" style={{ background: "var(--bg-gradient-main)" }}>
        <AiCoach selectedDate={selectedDate} setActiveTab={setActiveTab} />
      </div>
    );
  }
  
  // Regular dashboard layout for other tabs
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-gradient-main)" }}>
      {/* TopMetricsCard */}
      <TopMetricsCard 
        selectedDate={selectedDate} 
        setSelectedDate={setSelectedDate} 
        setActiveTab={setActiveTab}
        activeTab={activeTab}
      />
      
      {/* Calendar and Navigation Button Group - MOBILE RESPONSIVE */}
      <div className="flex justify-center mt-2 sm:mt-3 px-2 sm:px-0"> {/* MOBILE: Added padding and reduced margin */}
        <div className="flex items-center relative w-full sm:w-auto justify-center">
          {/* Overview button - Left of calendar group - MOBILE RESPONSIVE */}
          {activeTab !== 'overview' && (
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center px-3 sm:px-4 py-1.5 rounded-full mr-2 sm:mr-3 transition-colors text-sm font-medium" // MOBILE: Smaller padding and margin
              style={{
                background: "var(--card-bg)",
                color: "var(--text-primary)",
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.color = 'var(--text-primary)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--card-bg)';
                e.target.style.color = 'var(--text-primary)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
              title="Return to Overview"
            >
              <span className="hidden sm:inline">Overview</span> {/* MOBILE: Hide text on mobile */}
              <span className="sm:hidden">
                <LayoutDashboard size={16} /> {/* MOBILE: Show icon only */}
              </span>
            </button>
          )}
          
          {/* Date Navigation Group - MOBILE RESPONSIVE */}
          <div className="flex items-center flex-1 sm:flex-initial justify-center">
            {/* Previous date button - MOBILE RESPONSIVE */}
            <button
              onClick={() => navigateDate('prev')}
              disabled={!hasPrevDate}
              className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-1 sm:mr-1.5 transition-colors ${ // MOBILE: Smaller buttons
                hasPrevDate ? 'hover:bg-gray-700 text-white' : 'text-gray-600 cursor-not-allowed'
              }`}
              style={{
                background: "var(--card-bg)",
              }}
            >
              <ChevronLeft size={14} className="sm:w-4 sm:h-4" /> {/* MOBILE: Smaller icon */}
            </button>
            
            {/* Calendar button - MOBILE RESPONSIVE */}
            <button
              ref={calendarButtonRef}
              onClick={toggleCalendar}
              className="flex items-center px-3 sm:px-4 py-1.5 rounded-full transition-colors flex-1 sm:flex-initial justify-center" // MOBILE: Flex-1 for mobile, smaller padding
              style={{
                background: "var(--card-bg)",
                color: "var(--text-primary)",
              }}
            >
              <Calendar size={12} className="mr-1.5 text-[var(--strain-blue)] sm:w-3.5 sm:h-3.5" /> {/* MOBILE: Smaller icon */}
              <span className="font-medium text-xs sm:text-sm">{formatDate(selectedDate)}</span> {/* MOBILE: Smaller text */}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 sm:h-4 sm:w-4 ml-1.5 text-[var(--text-muted)] transition-transform ${showCalendar ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* MOBILE: Smaller chevron */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Next date button - MOBILE RESPONSIVE */}
            <button
              onClick={() => navigateDate('next')}
              disabled={!hasNextDate}
              className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ml-1 sm:ml-1.5 transition-colors ${ // MOBILE: Smaller buttons
                hasNextDate ? 'hover:bg-gray-700 text-white' : 'text-gray-600 cursor-not-allowed'
              }`}
              style={{
                background: "var(--card-bg)",
              }}
            >
              <ChevronRight size={14} className="sm:w-4 sm:h-4" /> {/* MOBILE: Smaller icon */}
            </button>
          </div>
          
          {/* Calendar Dropdown */}
          {showCalendar && (
            <CalendarSelector
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onClose={handleCloseCalendar}
              anchorRef={calendarButtonRef}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      </div>
      
      {/* Main Content Area - MOBILE RESPONSIVE */}
      <div className="p-2 sm:p-4 mt-1 sm:mt-2"> {/* MOBILE: Smaller padding and margin */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;