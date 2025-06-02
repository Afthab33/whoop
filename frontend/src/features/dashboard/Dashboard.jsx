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
        return <Overview selectedDate={selectedDate} />;
      case 'sleep':
        return <Sleep selectedDate={selectedDate} />;
      case 'recovery':
        return <Recovery selectedDate={selectedDate} />;
      case 'strain':
        return <Strain selectedDate={selectedDate} />;
      case 'ai-coach':
        return <AiCoach selectedDate={selectedDate} setActiveTab={setActiveTab} />;
      default:
        return <Overview selectedDate={selectedDate} />;
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
      <div className="h-screen overflow-hidden">
        <AiCoach selectedDate={selectedDate} setActiveTab={setActiveTab} />
      </div>
    );
  }
  
  // Regular dashboard layout for other tabs
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* TopMetricsCard */}
      <TopMetricsCard 
        selectedDate={selectedDate} 
        setSelectedDate={setSelectedDate} 
        setActiveTab={setActiveTab}
        activeTab={activeTab}
      />
      
      {/* Calendar and Navigation Button Group */}
      <div className="flex justify-center mt-3"> {/* Reduced from mt-4 to mt-3 */}
        <div className="flex items-center relative">
          {/* Overview button - Only visible when not on overview page - SMALLER */}
          {activeTab !== 'overview' && (
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full mr-2 transition-colors" // Reduced gap, padding, and margin
              style={{
                background: "var(--strain-blue)",
                color: "white",
              }}
              title="Return to Overview"
            >
              <LayoutDashboard size={14} /> {/* Reduced from size={16} to size={14} */}
              <span className="font-medium text-sm">Overview</span> {/* Added text-sm */}
            </button>
          )}
          
          {/* Previous date button - SMALLER */}
          <button
            onClick={() => navigateDate('prev')}
            disabled={!hasPrevDate}
            className={`flex items-center justify-center w-8 h-8 rounded-full mr-1.5 transition-colors ${ // Reduced from w-10 h-10 and mr-2
              hasPrevDate ? 'hover:bg-gray-700 text-white' : 'text-gray-600 cursor-not-allowed'
            }`}
            style={{
              background: "var(--card-bg)",
            }}
          >
            <ChevronLeft size={16} /> {/* Reduced from size={20} to size={16} */}
          </button>
          
          {/* Calendar button - SMALLER */}
          <button
            ref={calendarButtonRef}
            onClick={toggleCalendar}
            className="flex items-center px-4 py-1.5 rounded-full transition-colors" // Reduced from px-6 py-2 to px-4 py-1.5
            style={{
              background: "var(--card-bg)",
              color: "var(--text-primary)",
            }}
          >
            <Calendar size={14} className="mr-1.5 text-[var(--strain-blue)]" /> {/* Reduced size and margin */}
            <span className="font-medium text-sm">{formatDate(selectedDate)}</span> {/* Added text-sm */}
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1.5 text-[var(--text-muted)] transition-transform ${showCalendar ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Reduced from h-5 w-5 and ml-2 */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Next date button - SMALLER */}
          <button
            onClick={() => navigateDate('next')}
            disabled={!hasNextDate}
            className={`flex items-center justify-center w-8 h-8 rounded-full ml-1.5 transition-colors ${ // Reduced from w-10 h-10 and ml-2
              hasNextDate ? 'hover:bg-gray-700 text-white' : 'text-gray-600 cursor-not-allowed'
            }`}
            style={{
              background: "var(--card-bg)",
            }}
          >
            <ChevronRight size={16} /> {/* Reduced from size={20} to size={16} */}
          </button>
          
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
      
      {/* Main Content Area - REDUCED TOP MARGIN */}
      <div className="p-4 mt-2"> {/* Reduced from mt-4 to mt-2 */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;