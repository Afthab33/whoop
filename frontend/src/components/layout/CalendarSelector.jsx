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
  
  // Format month name - MORE COMPACT
  const formatMonth = (date) => {
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`; // Changed from 'long' to 'short'
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
      console.log('Returning to overview');
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
  
  // Generate calendar for a specific month - MORE COMPACT
  const generateCalendarMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Week day headers - SMALLER
    const weekDayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
      <div key={`header-${index}`} className="h-6 text-center text-gray-400 text-xs"> {/* Reduced from h-8 to h-6 */}
        {day}
      </div>
    ));
    
    // Blank cells for days before start of month - SMALLER
    const blanks = Array.from({ length: firstDay }, (_, i) => (
      <div key={`blank-${i}`} className="h-6 text-center"></div>
    ));
    
    // Day cells - SMALLER
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
            h-6 text-center cursor-pointer flex items-center justify-center relative text-xs
            ${isSelected ? 'bg-white text-[#333] rounded-full' : 'text-gray-400'}
            ${!dataAvailable ? 'opacity-30 cursor-not-allowed' : ''}
          `} // Reduced from h-8 to h-6, added text-xs
        >
          <span className={isSelected ? 'font-medium' : ''}>{day}</span>
          {dataAvailable && hasHighStrain && !isSelected && (
            <div className="absolute -bottom-0.5 w-1 h-1 bg-[#5D8DEE] rounded-full"></div> // Adjusted position
          )}
        </div>
      );
    });
    
    return (
      <div className="px-2"> {/* Reduced from px-3 to px-2 */}
        <div className="text-center font-medium mb-2 text-white text-sm"> {/* Reduced from mb-4 to mb-2, added text-sm */}
          {formatMonth(date)}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1"> {/* Reduced gap from gap-1 to gap-0.5 */}
          {weekDayHeaders}
        </div>
        <div className="grid grid-cols-7 gap-0.5"> {/* Reduced gap from gap-1 to gap-0.5 */}
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
        width: 'min(90vw, 580px)' // Reduced from 650px to 580px
      }}
    >
      {/* Calendar Header with navigation - MORE COMPACT */}
      <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2"> {/* Reduced padding from px-4 py-3 to px-3 py-2 */}
        <div className="flex-1 text-center text-sm font-medium text-white">Calendar</div>
        
        <div className="flex items-center space-x-1"> {/* Reduced space from space-x-2 to space-x-1 */}
          <button 
            onClick={goToPreviousMonths}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 bg-opacity-10 hover:bg-opacity-15 transition-colors" // Reduced from w-8 h-8 to w-7 h-7
          >
            <ChevronLeft size={16} className="text-white" /> {/* Reduced from size={18} to size={16} */}
          </button>
          
          <button 
            onClick={goToNextMonths}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 bg-opacity-10 hover:bg-opacity-15 transition-colors" // Reduced from w-8 h-8 to w-7 h-7
          >
            <ChevronRight size={16} className="text-white" /> {/* Reduced from size={18} to size={16} */}
          </button>
        </div>
      </div>
      
      {/* Calendar Grid - MORE COMPACT */}
      <div className="flex border-b border-gray-700">
        {months.map((month, index) => (
          <div key={index} className="flex-1 py-2"> {/* Reduced from py-3 to py-2 */}
            {generateCalendarMonth(month)}
          </div>
        ))}
      </div>
      
      {/* Footer with legend - MORE COMPACT */}
      <div className="flex justify-between px-3 py-2 items-center"> {/* Reduced padding from px-4 py-3 to px-3 py-2 */}
        <div className="text-xs text-gray-400">
          {activeTab !== 'overview' ? 'Select a date or return to Overview' : 'Select a date'}
        </div>
        
        <div className="flex items-center">
          <div className="w-2 h-2 bg-[#5D8DEE] rounded-full mr-1.5"></div> {/* Reduced from w-3 h-3 and mr-2 */}
          <span className="text-xs text-gray-300">Strain 10.0+</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarSelector;