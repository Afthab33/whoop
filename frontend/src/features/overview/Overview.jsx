// src/components/dashboard/overview/Overview.jsx
import React from 'react';
import { ChevronRight, Plus, Clock, Check, ArrowUp, ArrowDown, Info } from 'lucide-react';
import StrainRecoveryChart from './charts/StrainRecoveryChart';
import StressMonitorChart from './charts/StressMonitorChart';

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
    <div className="p-4">
      {/* New two-column layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column - Cards */}
        <div className="w-full md:w-2/5 space-y-4">
          {/* Top Metrics Cards - 2x2 grid instead of row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Heart Rate Variability */}
            <MetricCard 
              title="Heart Rate Variability"
              value="67"
              baseline="60"
              trend="up"
              color="text-white"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                <path d="M3 12h4l3-9 4 18 3-9h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>}
            />
            
            {/* Sleep Performance */}
            <MetricCard 
              title="Sleep Performance"
              value="81%"
              baseline="71%"
              trend="up"
              color="text-white"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>}
            />
            
            {/* Steps (Beta) */}
            <MetricCard 
              title="Steps (Beta)"
              value="42"
              baseline="10,543"
              trend="down"
              color="text-white"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                <path d="M13.5 5.5C13.5 4.4 14.4 3.5 15.5 3.5C16.6 3.5 17.5 4.4 17.5 5.5C17.5 6.6 16.6 7.5 15.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.5 19.5L8.5 21.5L7.5 20.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 11L13.5 15L11.5 12.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21.5 15.5C21.5 14.4 20.6 13.5 19.5 13.5C18.4 13.5 17.5 14.4 17.5 15.5C17.5 16.6 18.4 17.5 19.5 17.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10.5 8.5C10.5 9.6 9.6 10.5 8.5 10.5C7.4 10.5 6.5 9.6 6.5 8.5C6.5 7.4 7.4 6.5 8.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.5 14.5C4.5 13.4 5.4 12.5 6.5 12.5C7.6 12.5 8.5 13.4 8.5 14.5C8.5 15.6 7.6 16.5 6.5 16.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>}
            />
            
            {/* Calories */}
            <MetricCard 
              title="Calories"
              value="862"
              baseline="2,055"
              trend="down"
              color="text-white"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                <path d="M6.5 10C6.5 8 7.8 6 9.5 6C11.5 6 11.5 9 14 9C16 9 17 11 17 13" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 18C14 20.2 12.2 22 10 22C7.8 22 6 20.2 6 18C6 15.8 7.8 14 10 14C12.2 14 14 15.8 14 18Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M17 14C18.1046 14 19 13.1046 19 12C19 10.8954 18.1046 10 17 10C15.8954 10 15 10.8954 15 12C15 13.1046 15.8954 14 17 14Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 2V6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18 6V2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>}
            />
          </div>

          {/* Health Monitor Card */}
          <div className="bg-[#2F353A] rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-white text-lg uppercase">Health Monitor</h2>
              <ChevronRight className="text-[var(--text-muted)]" size={24} />
            </div>
            
            <div className="flex items-center mt-4">
              <div className="w-14 h-14 bg-[#00C853] rounded-xl flex items-center justify-center mr-3">
                <Check className="text-white" size={28} />
              </div>
              <div>
                <div className="text-[#00C853] font-bold text-xl">WITHIN RANGE</div>
                <div className="text-gray-400">5/5 Metrics</div>
              </div>
            </div>
          </div>
          
          {/* Daily Outlook Card */}
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-[#232529] rounded-full flex items-center justify-center mr-3">
                  <span className="font-bold">W</span>
                </div>
                <span className="text-white font-bold text-lg uppercase">Daily Outlook</span>
              </div>
              <ChevronRight className="text-white" size={24} />
            </div>
          </div>
          
          {/* Today's Activities */}
          <div className="bg-[#2F353A] rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-bold text-lg uppercase">Today's Activities</h2>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </div>
            
            {/* Sleep Activity */}
            <div className="bg-[#232529] rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-16 h-12 rounded-lg bg-blue-500 bg-opacity-30 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">7:05</div>
                    <div className="text-sm text-gray-400">SLEEP</div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div>12:37 AM</div>
                  <div>8:31 AM</div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-[#232529] text-white p-3 rounded-xl flex items-center justify-center hover:bg-[#2a2d33] transition-colors">
                <Plus size={18} className="mr-2" />
                ADD ACTIVITY
              </button>
              <button className="bg-[#232529] text-white p-3 rounded-xl flex items-center justify-center hover:bg-[#2a2d33] transition-colors">
                <Clock size={18} className="mr-2" />
                START ACTIVITY
              </button>
            </div>
          </div>
          
          {/* Tonight's Sleep */}
          <div className="bg-[#2F353A] rounded-2xl p-5">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-bold text-lg uppercase">Tonight's Sleep</h2>
              <ChevronRight className="text-gray-400" size={24} />
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-[#232529] flex items-center justify-center mx-auto mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-xl font-bold text-white">9:42</div>
                <div className="text-xs text-gray-400">RECOMMENDED</div>
                <div className="text-xs text-gray-400">BEDTIME</div>
              </div>
              
              <div className="border-t border-dashed border-gray-600 w-16 h-0 mt-4"></div>
              
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-[#232529] flex items-center justify-center mx-auto mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-xl font-bold text-white">6:00</div>
                <div className="text-xs text-gray-400">WAKE TIME</div>
                <div className="text-xs text-gray-400">(ALARM OFF)</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Charts */}
        <div className="w-full md:w-3/5 space-y-6">
          {/* Strain & Recovery Chart */}
          <div className="h-[calc(50%-12px)]">
            <StrainRecoveryChart />
          </div>
          
          {/* Stress Monitor Chart */}
          <div className="h-[calc(50%-12px)]">
            <StressMonitorChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;