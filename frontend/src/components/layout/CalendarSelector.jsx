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
    } else {
      console.warn('setActiveTab function is not available');
    }
  };
  
  // Check if a date has data
  const hasData = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return datesWithData.includes(dateStr);
  };
  
  // Check if a date is the selected date
  const isSelectedDate = (year, month, day) => {
    const checkDate = new Date(year, month, day);
    return (
      checkDate.getFullYear() === selectedDate.getFullYear() &&
      checkDate.getMonth() === selectedDate.getMonth() &&
      checkDate.getDate() === selectedDate.getDate()
    );
  };
  
  // Get strain data for a date (if available)
  const getStrainForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = whoopData[dateStr];
    return dayData?.physiological_summary?.["Day Strain"] || 0;
  };
  
  // Get recovery data for a date (if available)
  const getRecoveryForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = whoopData[dateStr];
    return dayData?.physiological_summary?.["Recovery score %"] || 0;
  };
  
  // Get sleep performance data for a date (if available)
  const getSleepPerformanceForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = whoopData[dateStr];
    return dayData?.sleep_summary?.["Sleep performance %"] || 0;
  };
  
  // Get indicator based on active tab
  const getIndicatorForDate = (year, month, day) => {
    const dataAvailable = hasData(year, month, day);
    if (!dataAvailable) return { show: false };
    
    switch (activeTab) {
      case 'strain':
        const strain = getStrainForDate(year, month, day);
        return {
          show: strain >= 10,
          color: '#0093E7', // Strain blue
          label: 'Strain 10.0+'
        };
      
      case 'recovery':
        const recovery = getRecoveryForDate(year, month, day);
        // Show ALL days with recovery data, color-coded by score
        if (recovery > 0) {
          if (recovery >= 67) {
            return {
              show: true,
              color: '#16EC06', // High Recovery - Green
              label: 'Recovery High/Med/Low'
            };
          } else if (recovery >= 34) {
            return {
              show: true,
              color: '#FFDE00', // Medium Recovery - Yellow
              label: 'Recovery High/Med/Low'
            };
          } else {
            return {
              show: true,
              color: '#FF0026', // Low Recovery - Red
              label: 'Recovery High/Med/Low'
            };
          }
        }
        return { show: false };
      
      case 'sleep':
        const sleepPerformance = getSleepPerformanceForDate(year, month, day);
        // Show ALL days with sleep data
        return {
          show: sleepPerformance > 0, // Show if there's any sleep data
          color: '#7BA1BB', // Sleep blue-gray
          label: 'Sleep data available'
        };
      
      default:
        // For overview and other tabs, show strain data
        const defaultStrain = getStrainForDate(year, month, day);
        return {
          show: defaultStrain >= 10,
          color: '#0093E7',
          label: 'Strain 10.0+'
        };
    }
  };
  
  // Generate three consecutive months
  const months = [];
  for (let i = 0; i < 3; i++) {
    const monthDate = new Date(startMonth);
    monthDate.setMonth(startMonth.getMonth() + i);
    months.push(monthDate);
  }
  
  // Generate calendar for a specific month - UPDATED WITH DYNAMIC INDICATORS
  const generateCalendarMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Week day headers - SMALLER
    const weekDayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
      <div key={`header-${index}`} className="h-6 text-center text-gray-400 text-xs">
        {day}
      </div>
    ));
    
    // Blank cells for days before start of month - SMALLER
    const blanks = Array.from({ length: firstDay }, (_, i) => (
      <div key={`blank-${i}`} className="h-6 text-center"></div>
    ));
    
    // Day cells - SMALLER WITH DYNAMIC INDICATORS
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const isSelected = isSelectedDate(year, month, day);
      const dataAvailable = hasData(year, month, day);
      const indicator = getIndicatorForDate(year, month, day);
      
      return (
        <div 
          key={`day-${day}`} 
          onClick={() => dataAvailable && onDateSelect(new Date(year, month, day))}
          className={`
            h-6 text-center cursor-pointer flex items-center justify-center relative text-xs
            ${isSelected ? 'bg-white text-[#333] rounded-full' : 'text-gray-400'}
            ${!dataAvailable ? 'opacity-30 cursor-not-allowed' : ''}
          `}
        >
          <span className={isSelected ? 'font-medium' : ''}>{day}</span>
          {indicator.show && !isSelected && (
            <div 
              className="absolute -bottom-0.5 w-1 h-1 rounded-full"
              style={{ backgroundColor: indicator.color }}
            ></div>
          )}
        </div>
      );
    });
    
    return (
      <div className="px-2">
        <div className="text-center font-medium mb-2 text-white text-sm">
          {formatMonth(date)}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekDayHeaders}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
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
        width: 'min(95vw, 580px)' // Changed from 90vw to 95vw for mobile
      }}
    >
      {/* Calendar Header with navigation - MOBILE RESPONSIVE */}
      <div className="flex items-center justify-between border-b border-gray-700 px-2 sm:px-3 py-2">
        <div className="flex-1 text-center text-xs sm:text-sm font-medium text-white">Calendar</div>
        
        <div className="flex items-center space-x-1">
          <button 
            onClick={goToPreviousMonths}
            className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gray-600 bg-opacity-40 hover:bg-opacity-60 transition-colors"
          >
            <ChevronLeft size={14} className="text-white sm:w-4 sm:h-4" />
          </button>
          
          <button 
            onClick={goToNextMonths}
            className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-gray-600 bg-opacity-40 hover:bg-opacity-60 transition-colors"
          >
            <ChevronRight size={14} className="text-white sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
      
      {/* Calendar Grid - MOBILE RESPONSIVE */}
      <div className="flex border-b border-gray-700 overflow-x-auto sm:overflow-x-visible">
        {months.map((month, index) => (
          <div key={index} className="flex-shrink-0 w-full sm:flex-1 py-1 sm:py-2 min-w-[120px]">
            {generateCalendarMonth(month)}
          </div>
        ))}
      </div>
      
      {/* Footer with legend - MOBILE RESPONSIVE */}
      <div className="flex flex-col sm:flex-row sm:justify-between px-2 sm:px-3 py-2 items-start sm:items-center space-y-1 sm:space-y-0">
        <div className="text-xs text-gray-400 text-center sm:text-left w-full sm:w-auto">
          {activeTab !== 'overview' ? 'Select a date or return to Overview' : 'Select a date'}
        </div>
        
        <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto">
          {(() => {
            switch (activeTab) {
              case 'recovery':
                return (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* High Recovery */}
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: '#16EC06' }}
                      ></div>
                      <span className="text-xs text-gray-300">High</span>
                    </div>
                    
                    {/* Medium Recovery */}
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: '#FFDE00' }}
                      ></div>
                      <span className="text-xs text-gray-300">Med</span>
                    </div>
                    
                    {/* Low Recovery */}
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: '#FF0026' }}
                      ></div>
                      <span className="text-xs text-gray-300">Low</span>
                    </div>
                  </div>
                );
              
              case 'strain':
                return (
                  <>
                    <div 
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: '#0093E7' }}
                    ></div>
                    <span className="text-xs text-gray-300">Strain 10.0+</span>
                  </>
                );
              
              case 'sleep':
                return (
                  <>
                    <div 
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: '#7BA1BB' }}
                    ></div>
                    <span className="text-xs text-gray-300">Sleep data</span>
                  </>
                );
              
              default:
                return (
                  <>
                    <div 
                      className="w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: '#0093E7' }}
                    ></div>
                    <span className="text-xs text-gray-300">Strain 10.0+</span>
                  </>
                );
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default CalendarSelector;