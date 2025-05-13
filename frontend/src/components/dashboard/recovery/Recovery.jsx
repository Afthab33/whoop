// src/components/dashboard/recovery/Recovery.jsx
import React from 'react';
import { ChevronRight, Info } from 'lucide-react';
import RecoveryRing from './RecoveryRing';
import HrvTrendChart from './charts/HrvTrendChart';
import RestingHeartRateChart from './charts/RestingHeartRateChart';
import RespiratoryRateChart from './charts/RespiratoryRateChart';
import RecoveryTrendChart from './charts/RecoveryTrendChart';

const MetricCard = ({ icon, title, value, baseline, trend, color }) => {
  const getTrendIcon = () => {
    if (trend === 'up') {
      return <svg className="text-[var(--recovery-green)]" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>;
    } else if (trend === 'down') {
      return <svg className="text-[var(--alert-red)]" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 12L12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>;
    }
    return null;
  };

  return (
    <div className="whoops-card flex flex-col px-6 py-5">
      <div className="flex items-center mb-2">
        <div className="mr-3 text-[var(--text-secondary)]">{icon}</div>
        <h3 className="uppercase text-xl font-medium text-[var(--text-secondary)]">{title}</h3>
      </div>
      
      <div className="flex items-end justify-between">
        <div className="flex items-center">
          <span className={`text-6xl font-bold ${color}`}>{value}</span>
          <span className="ml-2">{getTrendIcon()}</span>
        </div>
        <span className="text-2xl text-[var(--text-muted)]">{baseline}</span>
      </div>
    </div>
  );
};

const Recovery = () => {
  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">RECOVERY STATISTICS</h1>
        <div className="flex justify-between items-center">
          <p className="text-[var(--text-secondary)]">Detailed recovery metrics from your last sleep</p>
          <p className="text-[var(--text-secondary)]">VS. PREVIOUS 30 DAYS</p>
        </div>
      </div>

      {/* Recovery Ring and Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Metric Cards */}
        <div className="space-y-4 lg:col-span-3">
          <MetricCard 
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h4l3-9 4 18 3-9h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="HRV" 
            value="78" 
            baseline="61" 
            trend="up" 
            color="text-[var(--text-primary)]" 
          />
          
          <MetricCard 
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                <path d="M12 5.67V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            }
            title="RHR" 
            value="63" 
            baseline="66" 
            trend="down" 
            color="text-[var(--text-primary)]" 
          />
          
          <MetricCard 
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6.38 6.98C7.03 5.14 8.83 3.88 10.88 3.88C13.5 3.88 15.63 6.01 15.63 8.63C15.63 11.25 18.25 13.01 20.88 11.63" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.91 15.75C7.15 18.01 9.35 19.13 11.38 19.13C14 19.13 16.13 17 16.13 14.38C16.13 11.75 18.75 10 21.38 11.38" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 8.25C4.24 10.51 6.44 11.63 8.47 11.63C11.09 11.63 13.22 9.5 13.22 6.88C13.22 4.25 15.84 2.5 18.47 3.88" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 17.25C4.24 19.51 6.44 20.63 8.47 20.63C11.09 20.63 13.22 18.5 13.22 15.88C13.22 13.25 15.84 11.5 18.47 12.88" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            title="RESPIRATORY RATE" 
            value="13.1" 
            baseline="12.9" 
            trend="up" 
            color="text-[var(--text-primary)]" 
          />
        </div>
      </div>

      {/* Recovery Trend Chart */}
      <div className="mb-8">
        <RecoveryTrendChart />
      </div>

      {/* Charts Grid - HRV, RHR, Respiratory Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <HrvTrendChart />
        <RestingHeartRateChart />
        <RespiratoryRateChart />
        
        {/* Recovery Insights Card */}
        <div className="whoops-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Recovery Insights</h2>
            <Info className="text-[var(--text-muted)]" size={20} />
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-[var(--bg-subcard)] rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[var(--recovery-green)] rounded-full flex items-center justify-center mr-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 className="text-[var(--text-primary)] font-bold">Your HRV is above baseline</h3>
                  <p className="text-[var(--text-secondary)]">Your nervous system is showing positive recovery signs</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[var(--bg-subcard)] rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[var(--alert-red)] rounded-full flex items-center justify-center mr-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div>
                  <h3 className="text-[var(--text-primary)] font-bold">Your sleep performance is declining</h3>
                  <p className="text-[var(--text-secondary)]">Consider adjusting your sleep schedule</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day Statistics removed since we have individual charts */}
    </div>
  );
};

export default Recovery;