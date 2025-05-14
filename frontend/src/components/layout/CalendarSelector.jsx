// src/components/dashboard/other/CalendarSelector.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import whoopData from '../../data/day_wise_whoop_data.json';

const CalendarSelector = ({ 
  selectedDate, 
  onDateSelect, 
  onClose, 
  anchorRef,
  activeTab = 'overview',
  setActiveTab
}) => {
  // Start with the month containing the selected date as the middle month
  const initialDate = new Date(selectedDate);
  const initialMonth = initialDate.getMonth();
  const initialYear = initialDate.getFullYear();
  
  // Set the start month to be one month before the selected date's month
  const [startMonth, setStartMonth] = useState(new Date(initialYear, initialMonth - 1, 1));
  
  // Reference to the calendar dropdown
  const calendarRef = useRef(null);
  
  // Get dates that have data in the Whoop dataset
  const datesWithData = Object.keys(whoopData);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRef.current && 
        !calendarRef.current.contains(event.target) &&
        anchorRef.current && 
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Helpers for date calculations and formatting
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  // Format month name
  const formatMonth = (date) => {
    return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
  };
  
  // Navigation functions
  const goToPreviousMonths = () => {
    const newStartMonth = new Date(startMonth);
    newStartMonth.setMonth(startMonth.getMonth() - 3);
    setStartMonth(newStartMonth);
  };
  
  const goToNextMonths = () => {
    const newStartMonth = new Date(startMonth);
    newStartMonth.setMonth(startMonth.getMonth() + 3);
    setStartMonth(newStartMonth);
  };
  
  // Handle overview click
  const handleOverviewClick = () => {
    if (setActiveTab) {
      setActiveTab('overview');
      onClose();
      console.log('Returning to overview'); // Add this for debugging
    } else {
      console.warn('setActiveTab function is not available');
    }
  };
  
  // Check if a date has data
  const hasData = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return datesWithData.includes(dateStr);
  };
  
  // Get strain data for a date (if available)
  const getStrainForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = whoopData[dateStr];
    return dayData?.physiological_summary?.["Day Strain"] || 0;
  };
  
  // Check if a date is the currently selected date
  const isSelectedDate = (year, month, day) => {
    return selectedDate.getFullYear() === year && 
           selectedDate.getMonth() === month && 
           selectedDate.getDate() === day;
  };
  
  // Generate three consecutive months
  const months = [];
  for (let i = 0; i < 3; i++) {
    const monthDate = new Date(startMonth);
    monthDate.setMonth(startMonth.getMonth() + i);
    months.push(monthDate);
  }
  
  // Generate calendar for a specific month
  const generateCalendarMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Week day headers
    const weekDayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
      <div key={`header-${index}`} className="h-8 text-center text-gray-400 text-xs">
        {day}
      </div>
    ));
    
    // Blank cells for days before start of month
    const blanks = Array.from({ length: firstDay }, (_, i) => (
      <div key={`blank-${i}`} className="h-8 text-center"></div>
    ));
    
    // Day cells
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const isSelected = isSelectedDate(year, month, day);
      const dataAvailable = hasData(year, month, day);
      const strain = getStrainForDate(year, month, day);
      const hasHighStrain = strain >= 10;
      
      return (
        <div 
          key={`day-${day}`} 
          onClick={() => dataAvailable && onDateSelect(new Date(year, month, day))}
          className={`
            h-8 text-center cursor-pointer flex items-center justify-center relative
            ${isSelected ? 'bg-white text-[#333] rounded-full' : 'text-gray-400'}
            ${!dataAvailable ? 'opacity-30 cursor-not-allowed' : ''}
          `}
        >
          <span className={isSelected ? 'font-medium' : ''}>{day}</span>
          {dataAvailable && hasHighStrain && !isSelected && (
            <div className="absolute -bottom-1 w-1 h-1 bg-[#5D8DEE] rounded-full"></div>
          )}
        </div>
      );
    });
    
    return (
      <div className="px-3">
        <div className="text-center font-medium mb-4 text-white">
          {formatMonth(date)}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDayHeaders}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks}
          {days}
        </div>
      </div>
    );
  };
  
  return (
    <div 
      ref={calendarRef}
      className="absolute z-50 bg-[#2A3339] rounded-lg shadow-2xl overflow-hidden"
      style={{
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '8px',
        width: 'min(90vw, 650px)'
      }}
    >
      {/* Calendar Header with navigation */}
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        <div className="flex-1 text-center text-sm font-medium text-white">Calendar</div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={goToPreviousMonths}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 bg-opacity-10 hover:bg-opacity-15 transition-colors"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
          
          <button 
            onClick={goToNextMonths}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 bg-opacity-10 hover:bg-opacity-15 transition-colors"
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="flex border-b border-gray-700">
        {months.map((month, index) => (
          <div key={index} className="flex-1 py-3">
            {generateCalendarMonth(month)}
          </div>
        ))}
      </div>
      
      {/* Footer with legend */}
      <div className="flex justify-between px-4 py-3 items-center">
        <div className="text-xs text-gray-400">
          {activeTab !== 'overview' ? 'Select a date or return to Overview' : 'Select a date'}
        </div>
        
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#5D8DEE] rounded-full mr-2"></div>
          <span className="text-xs text-gray-300">Strain 10.0+</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarSelector;