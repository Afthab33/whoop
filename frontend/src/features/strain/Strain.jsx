// src/components/dashboard/strain/Strain.jsx
import React from 'react';
import { ChevronRight, Info } from 'lucide-react';
import StrainTrendChart from './charts/StrainTrendChart';
import CaloriesChart from './charts/CaloriesChart';
import AverageHrChart from './charts/AverageHrChart';
import StrainRing from './components/StrainRing';
import AiInsightCard from '../../components/cards/AiInsightCard';

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
    } else if (trend === 'none') {
      return <svg className="text-[var(--text-muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="4" fill="currentColor"/>
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

// Component for activity stats like in the first image
const ActivityStatCard = () => {
  return (
    <div className="whoops-card p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Weightlifting Statistics</h2>
        <div className="text-[var(--text-secondary)]">
          <span className="text-[var(--strain-blue)]">Thu, Apr 17th</span> vs 1 Week Past
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Max HR */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <svg className="text-[var(--text-muted)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              <path d="M12 22V17" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-lg font-medium text-[var(--text-primary)] mb-1">Max HR</div>
          <div className="flex items-center justify-center">
            <span className="text-4xl font-bold text-[var(--strain-blue)]">150</span>
            <svg className="text-[var(--recovery-green)] ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-[var(--text-muted)]">146</div>
        </div>
        
        {/* Average HR */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <svg className="text-[var(--text-muted)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div className="text-lg font-medium text-[var(--text-primary)] mb-1">Average HR</div>
          <div className="flex items-center justify-center">
            <span className="text-4xl font-bold text-[var(--strain-blue)]">122</span>
            <svg className="text-[var(--recovery-green)] ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-[var(--text-muted)]">115</div>
        </div>
        
        {/* Calories */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <svg className="text-[var(--text-muted)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6.5 10C6.5 8 7.8 6 9.5 6C11.5 6 11.5 9 14 9C16 9 17 11 17 13" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19C9.79086 19 8 17.2091 8 15C8 13.5 8.5 12.5 9.5 11.5C10.5 10.5 11 9.5 11 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 19C17.1046 19 18 18.1046 18 17C18 15.8954 17.1046 15 16 15C14.8954 15 14 15.8954 14 17C14 18.1046 14.8954 19 16 19Z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="text-lg font-medium text-[var(--text-primary)] mb-1">Calories</div>
          <div className="flex items-center justify-center">
            <span className="text-4xl font-bold text-[var(--strain-blue)]">155</span>
            <svg className="text-[var(--alert-red)] ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 12L12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-[var(--text-muted)]">186</div>
        </div>
        
        {/* Duration */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <svg className="text-[var(--text-muted)]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="text-lg font-medium text-[var(--text-primary)] mb-1">Duration</div>
          <div className="flex items-center justify-center">
            <span className="text-4xl font-bold text-[var(--strain-blue)]">0:29:27</span>
            <svg className="text-[var(--alert-red)] ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 12L12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-[var(--text-muted)]">0:43:59</div>
        </div>
      </div>
    </div>
  );
};

const Strain = ({ selectedDate }) => {
  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      {/* AI Insight Card */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl">
          <AiInsightCard type="strain" />
        </div>
      </div>
      
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">STRAIN STATISTICS</h1>
        <div className="flex justify-between items-center">
          <p className="text-[var(--text-secondary)]">Daily activity and performance metrics</p>
          <p className="text-[var(--text-secondary)]">VS. PREVIOUS 30 DAYS</p>
        </div>
      </div>
      
      {/* Activity Statistics Card */}
      <ActivityStatCard />
      
      {/* Steps Card */}
      <MetricCard 
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13.5 5.5C13.5 4.4 14.4 3.5 15.5 3.5C16.6 3.5 17.5 4.4 17.5 5.5C17.5 6.6 16.6 7.5 15.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.5 19.5L8.5 21.5L7.5 20.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 11L13.5 15L11.5 12.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21.5 15.5C21.5 14.4 20.6 13.5 19.5 13.5C18.4 13.5 17.5 14.4 17.5 15.5C17.5 16.6 18.4 17.5 19.5 17.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.5 8.5C10.5 9.6 9.6 10.5 8.5 10.5C7.4 10.5 6.5 9.6 6.5 8.5C6.5 7.4 7.4 6.5 8.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 14.5C4.5 13.4 5.4 12.5 6.5 12.5C7.6 12.5 8.5 13.4 8.5 14.5C8.5 15.6 7.6 16.5 6.5 16.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        title="STEPS" 
        value="6,465" 
        baseline="10,822" 
        trend="down" 
        color="text-[var(--text-primary)]" 
      />
      
      {/* Calories Card */}
      <div className="mt-4">
        <MetricCard 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6.5 10C6.5 8 7.8 6 9.5 6C11.5 6 11.5 9 14 9C16 9 17 11 17 13" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19C9.79086 19 8 17.2091 8 15C8 13.5 8.5 12.5 9.5 11.5C10.5 10.5 11 9.5 11 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 19C17.1046 19 18 18.1046 18 17C18 15.8954 17.1046 15 16 15C14.8954 15 14 15.8954 14 17C14 18.1046 14.8954 19 16 19Z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          }
          title="CALORIES" 
          value="1,018" 
          baseline="2,108" 
          trend="down" 
          color="text-[var(--text-primary)]" 
        />
      </div>
      
      {/* HR Zones 1-3 Card */}
      <div className="mt-4">
        <MetricCard 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              <path d="M3.5 12h2l2-6 2 12 2-6h2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="HR ZONES 1-3 (WEEKLY)" 
          value="2:01" 
          baseline="1:02" 
          trend="up" 
          color="text-[var(--text-primary)]" 
        />
      </div>
      
      {/* HR Zones 4-5 Card */}
      <div className="mt-4">
        <MetricCard 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              <path d="M3.5 12h2l1.5-6 3 12 3-6h2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="HR ZONES 4-5 (WEEKLY)" 
          value="0:00" 
          baseline="0:00" 
          trend="none" 
          color="text-[var(--text-primary)]" 
        />
      </div>
      
      {/* VO2 Max Card */}
      <div className="mt-4">
        <MetricCard 
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="8" />
              <text x="10" y="14" fontSize="7" fontWeight="bold" fill="currentColor">O₂</text>
            </svg>
          }
          title="VO₂ MAX" 
          value="43" 
          baseline="42" 
          trend="up" 
          color="text-[var(--text-primary)]" 
        />
      </div>

      {/* Strain Visualization Card with StrainRing */}
      <div className="mt-8">
        <div className="whoops-card p-6 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/3 mb-6 md:mb-0 flex justify-center">
            <StrainRing value={9.1} maxValue={21.0} />
          </div>
          <div className="w-full md:w-2/3">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">TODAY'S STRAIN</h2>
              <p className="text-[var(--text-secondary)]">Your body worked at 43% of its capacity</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[var(--text-secondary)] text-sm">Average Heart Rate</span>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-[var(--strain-blue)]">122</span>
                  <span className="ml-1 text-[var(--text-muted)]">bpm</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--text-secondary)] text-sm">Max Heart Rate</span>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-[var(--strain-blue)]">150</span>
                  <span className="ml-1 text-[var(--text-muted)]">bpm</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--text-secondary)] text-sm">Calories Burned</span>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-[var(--strain-blue)]">1,018</span>
                  <span className="ml-1 text-[var(--text-muted)]">kcal</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--text-secondary)] text-sm">Active Time</span>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-[var(--strain-blue)]">0:29:27</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Weekly Strain Chart */}
      <div className="mt-8">
        <StrainTrendChart />
      </div>
      
      {/* Weekly Calories Chart */}
      <div className="mt-8">
        <CaloriesChart />
      </div>
      
      {/* Weekly Average HR Chart */}
      <div className="mt-8">
        <AverageHrChart />
      </div>
      
      {/* Strain Insights */}
      <div className="mt-8">
        <div className="whoops-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Activity Insights</h2>
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
                  <h3 className="text-[var(--text-primary)] font-bold">Your HR Zone training is up</h3>
                  <p className="text-[var(--text-secondary)]">You've spent more time in zones 1-3 this week</p>
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
                  <h3 className="text-[var(--text-primary)] font-bold">Your steps are below average</h3>
                  <p className="text-[var(--text-secondary)]">Try to increase your daily activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Strain;