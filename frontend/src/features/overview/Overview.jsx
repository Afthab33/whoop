// src/components/dashboard/overview/Overview.jsx
import React from 'react';
import { ChevronRight, Plus, Clock, Check, ArrowUp, ArrowDown, Info, Activity, Heart, Sun } from 'lucide-react';
import IndexChart from './charts/Index'; // Import the Index chart component
import WhoopLogo from '../../assets/WHOOP Circle White.svg';

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

const Overview = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="flex flex-col gap-8">

          {/* Daily Outlook Card - New Design */}
          <div className="whoops-card flex items-center justify-between rounded-3xl py-2">
            {/* Left section with W logo */}
            <div className="flex items-center space-x-4">
              {/* W Logo with gradient border */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 p-0.5">
                  <div className="w-full h-full rounded-2xl flex items-center justify-center" style={{ background: 'var(--card-bg)' }}>
                    <img src={WhoopLogo} alt="WHOOP" width="24" height="24" />
                  </div>
                </div>
              </div>

              {/* Weather icon and text */}
              <div className="flex items-center space-x-4">
                {/* Sun icon */}
                <div className="text-gray-300">
                  <Sun size={20} />
                </div>

                {/* Text */}
                <h2 className="text-white text-xl font-medium">Your Daily Outlook</h2>
              </div>
            </div>

            {/* Right arrow */}
            <div className="text-gray-400 hover:text-white transition-colors cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Heart Rate Analysis Section - Only IndexChart with built-in LineChart logic */}
          <div className="space-y-6">     
            <IndexChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;