// src/components/dashboard/overview/Overview.jsx
import React from 'react';
import { ChevronRight, Plus, Clock, Check, ArrowUp, ArrowDown, Info, Activity, Heart } from 'lucide-react';
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
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="flex flex-col gap-8">

          {/* Daily Outlook Card - Enhanced */}
          <div 
            className="whoops-card relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--strain-blue) 0%, var(--ai-coach-purple) 100%)',
              boxShadow: '0 8px 32px rgba(93, 141, 238, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: 'rgba(255, 255, 255, 0.15)' }}
                >
                  <Activity className="text-white" size={20} />
                </div>
                <div>
                  <span className="text-white font-bold text-xl tracking-wide">Daily Outlook</span>
                  <div className="text-white/80 text-sm mt-1">Your health at a glance</div>
                </div>
              </div>
              <ChevronRight className="text-white/80 hover:text-white transition-colors" size={24} />
            </div>
            
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-32 h-32 border border-white/20 rounded-full"></div>
              <div className="absolute bottom-4 right-8 w-20 h-20 border border-white/10 rounded-full"></div>
            </div>
          </div>

          {/* Heart Rate Analysis Section - Seamless Integration */}
          <div className="space-y-6">
            {/* Section divider with subtle styling */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--text-muted)]/20 to-transparent"></div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full" style={{ background: 'var(--bg-subcard)' }}>
                <Heart size={16} className="text-[var(--strain-blue)]" />
                <span className="text-[var(--text-muted)] text-sm font-medium">Health Analytics</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--text-muted)]/20 to-transparent"></div>
            </div>
            
            {/* Index Chart Component - Direct integration without extra wrapper */}
            <IndexChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;