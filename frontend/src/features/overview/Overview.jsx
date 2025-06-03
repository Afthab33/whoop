// src/components/dashboard/overview/Overview.jsx
import React from 'react';
import { ChevronRight, Plus, Clock, Check, ArrowUp, ArrowDown, Info, Activity, Heart, Sun } from 'lucide-react';
import IndexChart from './charts/Index'; // Import the Index chart component
import WhoopLogo from '../../assets/Whoop White Symbol.svg'; // Update import

const MetricCard = ({ title, value, baseline, icon, trend, color }) => {
  return (
    <div className="whoops-card flex flex-col flex-1" style={{ background: 'var(--card-bg)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="mr-2">{icon}</div>
          <h3 className="text-xs uppercase tracking-wider font-medium text-[var(--text-muted)]">{title}</h3>
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="flex items-center">
          <span className={`text-4xl font-bold ${color}`}>{value}</span>
          {trend === 'up' ? 
            <ArrowUp size={16} className="text-[var(--positive-green)] ml-1" /> : 
            <ArrowDown size={16} className="text-[var(--alert-red)] ml-1" />
          }
        </div>
        <span className="text-sm text-[var(--text-subvalue)]">{baseline}</span>
      </div>
    </div>
  );
};

const Overview = ({ setActiveTab }) => { // Add setActiveTab prop
  
  // Handle AI Coach card click
  const handleAiCoachClick = () => {
    if (setActiveTab) {
      setActiveTab('ai-coach');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'transparent' }}>
      <div className="p-1 max-w-5xl mx-auto flex-1">
        <div className="flex flex-col gap-1">

          {/* AI Coach Prompt Card - MOBILE RESPONSIVE */}
          <div 
            className="whoops-card flex items-center justify-between rounded-2xl sm:rounded-3xl py-1 sm:py-0.5 px-2 sm:px-3 cursor-pointer group hover:scale-[1.01] transition-all duration-200" // MOBILE: Smaller padding and border radius
            onClick={handleAiCoachClick}
            style={{
              background: 'var(--card-bg)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Left section with W logo - MOBILE RESPONSIVE */}
            <div className="flex items-center space-x-1.5 sm:space-x-2"> {/* MOBILE: Smaller spacing */}
              {/* W Logo - MOBILE RESPONSIVE */}
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 p-0.5 group-hover:from-purple-400 group-hover:via-blue-400 group-hover:to-cyan-300 transition-all duration-200"> {/* MOBILE: Smaller logo */}
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-base)' }}
                >
                  <img src={WhoopLogo} alt="WHOOP" className="w-3 h-3 sm:w-4 sm:h-4" /> {/* MOBILE: Smaller logo */}
                </div>
              </div>

              {/* AI Chat icon and engaging text - MOBILE RESPONSIVE */}
              <div className="flex items-center space-x-2">
                {/* Engaging text that changes on hover - MOBILE RESPONSIVE */}
                <div className="flex flex-col">
                  <h2 className="text-white text-sm sm:text-base font-medium group-hover:text-blue-100 transition-colors"> {/* MOBILE: Smaller text */}
                    <span className="group-hover:hidden">Ask your AI Coach anything</span>
                    <span className="hidden group-hover:inline">Get personalized insights now</span>
                  </h2>
                  <span className="text-xs text-gray-400 group-hover:text-blue-300 transition-colors">
                    Tap to start conversation
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Right arrow - MOBILE RESPONSIVE */}
            <div className="text-gray-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-200">
              <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> {/* MOBILE: Smaller arrow */}
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Heart Rate Analysis Section - MOBILE RESPONSIVE */}
          <div className="space-y-1">
            <IndexChart />
          </div>
        </div>
      </div>

      {/* Made by Aftab Footer - Fixed at bottom edge */}
      <div className="mt-auto">
          <p className="text-center sm:text-sm text-gray-500">
            Developed by Aftab Hussain
          </p>
        </div>
      </div>
  );
};

export default Overview;