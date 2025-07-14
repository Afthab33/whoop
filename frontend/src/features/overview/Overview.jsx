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
  
  const handleAiCoachClick = () => {
    if (setActiveTab) {
      setActiveTab('ai-coach');
    }
  };

  return (
    <div className="p-1 max-w-5xl mx-auto" style={{ background: 'transparent' }}>
      <div className="mb-0.5 sm:mb-1">
        <div className="w-full"> {/* Changed: Removed max-w-4xl to match chart width */}
          <div 
            className="whoops-card flex items-center justify-between rounded-3xl py-0.5 px-3 cursor-pointer group hover:scale-[1.01] transition-all duration-200"
            onClick={handleAiCoachClick}
            style={{
              background: 'var(--card-bg)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex items-center space-x-4">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 p-0.5 group-hover:from-purple-400 group-hover:via-blue-400 group-hover:to-cyan-300 transition-all duration-200">
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-base)' }}
                >
                  <img src={WhoopLogo} alt="WHOOP" className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex flex-col">
                  <h2 className="text-white text-base font-medium group-hover:text-blue-100 transition-colors">
                    <span className="group-hover:hidden">Ask your AI Coach anything</span>
                    <span className="hidden group-hover:inline">Get personalized insights now</span>
                  </h2>
                  <span className="text-xs text-gray-400 group-hover:text-blue-300 transition-colors">
                    Tap to start conversation
                  </span>
                </div>
              </div>
            </div>

            <div className="text-gray-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-1 sm:gap-2 mb-1 sm:mb-2">
        <div className="w-full order-1">
          <div className="space-y-1">     
            <IndexChart />
          </div>
        </div>
      </div>
      
      <div className="mt-auto">
        <p className="text-center sm:text-sm text-gray-500">
          Developed by Aftab Hussain
        </p>
      </div>
    </div>
  );
};

export default Overview;