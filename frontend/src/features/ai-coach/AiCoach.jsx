import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, RotateCcw, Calendar, ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';
import whoopData from '../../data/day_wise_whoop_data.json';

const AiCoach = ({ selectedDate, setActiveTab }) => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: 'Hi! I\'m your WHOOP AI Coach. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSuggestions, setExpandedSuggestions] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Format selected date to match data format
  const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  
  // Get user data for the selected date
  const userData = formattedDate && whoopData[formattedDate] 
    ? whoopData[formattedDate] 
    : null;
  
  // Check if data is available for this date
  const hasDataForSelectedDate = !!userData;
  
  // Format the welcome message based on data availability
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 1) {
      let welcomeMessage = 'Hi! I\'m your WHOOP AI Coach. How can I help you today?';
      
      if (formattedDate) {
        const dateDisplay = new Date(formattedDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        });
        
        if (hasDataForSelectedDate) {
          welcomeMessage = `Hi! I'm your WHOOP AI Coach. I can see you have data for ${dateDisplay}. What would you like to know about your performance, recovery, or sleep?`;
        } else {
          welcomeMessage = `Hi! I'm your WHOOP AI Coach. I don't see any data for ${dateDisplay}, but I can still answer general fitness and wellness questions.`;
        }
      }
      
      setMessages([{ id: 1, role: 'ai', content: welcomeMessage }]);
    }
  }, [formattedDate, hasDataForSelectedDate]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Prepare a trimmed version of userData if it exists
      let trimmedUserData = null;
      if (userData) {
        // Only include essential data
        trimmedUserData = {
          physiological_summary: userData.physiological_summary || {},
          sleep_summary: userData.sleep_summary || {},
          // Extract only necessary workout data
          workouts: userData.workouts ? userData.workouts.map(workout => ({
            sport: workout.sport,
            duration_min: workout.duration_min,
            strain: workout.strain
          })) : []
        };
      }
      
      // Make API request to backend with trimmed data
      const response = await axios.post('http://localhost:8080/api/ai-coach', {
        message: input,
        userData: trimmedUserData,
        date: formattedDate,
        hasData: hasDataForSelectedDate
      });
      
      // Add AI response to chat
      const aiMessage = { 
        id: response.data.messageId || Date.now() + 1, 
        role: 'ai', 
        content: response.data.response
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI coach response:', error);
      // Add error message
      const errorMessage = { 
        id: Date.now() + 1, 
        role: 'ai', 
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };
  
  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Clear chat history
  const handleClearChat = () => {
    setMessages([
      { id: 1, role: 'ai', content: 'Hi! I\'m your WHOOP AI Coach. How can I help you today?' }
    ]);
  };

  // Suggested questions
  const suggestedQuestions = [
    "What are my recovery trends?",
    "How can I improve my sleep quality?",
    "Suggest a workout for today?",
    "What's my strain pattern this week?",
    "How is my HRV trending?"
  ];

  // Toggle suggestion expansion
  const toggleSuggestion = (index) => {
    setExpandedSuggestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        {/* Back button */}
        <button
          onClick={() => setActiveTab && setActiveTab('overview')}
          className="p-1 rounded-full hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        {/* Title */}
        <div className="text-center">
          <h1 className="text-lg font-semibold">WHOOP AI COACH</h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-sm text-gray-400">BETA V1.0</p>
            {formattedDate && (
              <>
                <span className="text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <div 
                    className={`w-2 h-2 rounded-full ${hasDataForSelectedDate ? 'bg-green-500' : 'bg-yellow-500'}`}
                  ></div>
                  <span className="text-xs text-gray-400">
                    {hasDataForSelectedDate ? 'Data Available' : 'No Data'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Reset button */}
        <button
          onClick={handleClearChat}
          className="p-1 rounded-full hover:bg-gray-700 transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-32">
        {messages.map((message) => (
          <div key={message.id}>
            {message.role === 'ai' ? (
              /* AI Message */
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-white">W</span>
                </div>
                <div className="flex-1">
                  <div className="text-base leading-relaxed mb-4">
                    {message.content}
                  </div>
                  
                  {/* Action Buttons for AI messages */}
                  <div className="flex space-x-4 mb-4">
                    <button className="p-1 rounded-full hover:bg-gray-700 transition-colors">
                      <Calendar className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                    <button className="p-1 rounded-full hover:bg-gray-700 transition-colors">
                      <ThumbsUp className="w-5 h-5 text-gray-400 hover:text-green-400" />
                    </button>
                    <button className="p-1 rounded-full hover:bg-gray-700 transition-colors">
                      <ThumbsDown className="w-5 h-5 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* User Message */
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl px-4 py-3">
                  {message.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">W</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Questions - Only show if it's the initial conversation */}
        {messages.length === 1 && !isLoading && (
          <div className="space-y-3">
            <div className="text-sm text-gray-400 font-medium mb-3">Suggested questions:</div>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="flex items-center justify-between w-full py-3 px-0 text-left border-b border-gray-700 hover:bg-gray-700/30 transition-colors rounded"
              >
                <span className="text-white">{question}</span>
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-blue-500"></div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-gray-400" />
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full bg-transparent border-2 border-blue-500 rounded-full px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              placeholder="Ask your AI coach anything..."
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} className={`${input.trim() && !isLoading ? 'text-blue-400' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
        
        {/* Home Indicator */}
        <div className="w-32 h-1 bg-white rounded-full mx-auto mt-4 opacity-30"></div>
      </div>
    </div>
  );
};

export default AiCoach;
