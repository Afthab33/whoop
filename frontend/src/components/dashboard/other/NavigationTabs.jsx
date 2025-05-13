// src/components/dashboard/other/NavigationTabs.jsx
import React from 'react';

const NavigationTabs = ({ activeTab, setActiveTab }) => {
  const tabs = ['OVERVIEW', 'SLEEP', 'RECOVERY', 'STRAIN'];
  
  return (
    <div className="flex justify-between px-60 border-b border-ring-bg">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`tab-button py-3 ${
            activeTab === tab.toLowerCase() 
              ? 'border-b-2 border-text-primary text-text-primary' 
              : 'text-text-secondary'
          }`}
          onClick={() => setActiveTab(tab.toLowerCase())}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default NavigationTabs;