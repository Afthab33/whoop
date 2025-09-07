import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';

const DataDisclaimer = ({ 
  context = 'dashboard', // 'dashboard' or 'ai-coach'
  onClose = () => {} 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Always show popup on every refresh/load
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Popup */}
      <div 
        className="relative max-w-sm w-full rounded-xl p-5 shadow-2xl animate-slideUp"
        style={{
          background: 'rgba(20, 22, 28, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/5 transition-colors"
        >
          <X size={16} className="text-gray-500" />
        </button>
        
        {/* Icon and Title */}
        <div className="flex items-center space-x-2 mb-3">
          <Info size={18} className="text-[#4DA8FF]" />
          <h3 className="text-white font-medium text-base">
            Synthetic Data
          </h3>
        </div>
        
        {/* Content - Simple and Short */}
        <p className="text-gray-400 text-sm mb-3">
          This demo uses simulated WHOOP data. Cutoff date: <span className="text-white">June 3, 2025</span>.
        </p>
        
        {/* Action button - Simple */}
        <button
          onClick={handleDismiss}
          className="w-full py-2 px-4 rounded-lg font-medium text-sm transition-all bg-white/10 hover:bg-white/15 text-white"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;
document.head.appendChild(style);

export default DataDisclaimer;