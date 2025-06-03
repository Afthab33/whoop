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
    <div className="min-h-screen" style={{ background: 'transparent' }}> {/* CHANGED: Remove gradient */}
      <div className="p-1 max-w-5xl mx-auto">
        <div className="flex flex-col gap-2"> {/* MATCH: Same gap-2 as Recovery */}

          {/* Daily Outlook Card - ULTRA COMPACT to match Recovery spacing */}
          <div className="whoops-card flex items-center justify-between rounded-3xl py-1 px-3 mb-1"> {/* REDUCED: py-1.5 → py-1, px-4 → px-3 */}
            {/* Left section with W logo - MORE COMPACT */}
            <div className="flex items-center space-x-2"> {/* REDUCED: space-x-3 → space-x-2 */}
              {/* Smaller W Logo with gradient border */}
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 p-0.5"> {/* REDUCED: w-12 h-12 → w-10 h-10, rounded-xl → rounded-lg */}
                  <div className="w-full h-full rounded-lg flex items-center justify-center" style={{ background: 'var(--card-bg)' }}> {/* UPDATED: rounded-xl → rounded-lg */}
                    <img src={WhoopLogo} alt="WHOOP" width="16" height="16" /> {/* REDUCED: 18x18 → 16x16 */}
                  </div>
                </div>
              </div>

              {/* Weather icon and text - MORE COMPACT */}
              <div className="flex items-center space-x-2"> {/* REDUCED: space-x-3 → space-x-2 */}
                {/* Smaller Sun icon */}
                <div className="text-gray-300">
                  <Sun size={14} /> {/* REDUCED: size={16} → size={14} */}
                </div>

                {/* Smaller Text */}
                <h2 className="text-white text-base font-medium">Your Daily Outlook</h2> {/* REDUCED: text-lg → text-base */}
              </div>
            </div>

            {/* Smaller Right arrow */}
            <div className="text-gray-400 hover:text-white transition-colors cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> {/* REDUCED: 16x16 → 14x14 */}
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Heart Rate Analysis Section - MATCH Recovery spacing */}
          <div className="space-y-2"> {/* MATCH: Same space-y-2 as Recovery */}     
            <IndexChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;