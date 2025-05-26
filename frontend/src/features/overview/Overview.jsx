// src/components/dashboard/overview/Overview.jsx
import React from 'react';
import { ChevronRight, Plus, Clock, Check, ArrowUp, ArrowDown, Info } from 'lucide-react';
import StrainRecoveryChart from './charts/StrainRecoveryChart';
import StressMonitorChart from './charts/StressMonitorChart';
import IndexChart from './charts/Index'; // Import the Index chart component

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
    <div className="p-4 max-w-screen-xl mx-auto">
      <div className="flex flex-col gap-6">
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
        
        {/* Heart Rate Chart Section */}
        <div className="whoops-card bg-[var(--card-bg)] rounded-xl shadow-lg border border-gray-800/30 overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Heart Rate Analysis</h2>
              <div className="flex items-center space-x-1">
                <Info size={14} className="text-[var(--text-muted)]" />
                <span className="text-[var(--text-muted)] text-sm">
                  View trends over time
                </span>
              </div>
            </div>
            
            {/* Embed the Index chart with styling adjustments */}
            <div className="bg-[var(--card-bg)]">
              <IndexChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;