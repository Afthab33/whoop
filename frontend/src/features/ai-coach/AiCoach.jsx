import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, RotateCcw, Calendar, ThumbsUp, ThumbsDown, MessageSquare, ChevronUp, Copy, Check } from 'lucide-react';
import whoopData from '../../data/day_wise_whoop_data.json';
import WhoopLogo from '../../assets/WHOOP Circle White.svg';

// Professional streaming text animation like ChatGPT/Claude
const TypingText = ({ text, onComplete, speed = 15 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        // Add chunks of 3-6 characters at once for faster, more natural flow
        const chunkSize = Math.floor(Math.random() * 4) + 3; // Random between 3-6
        const nextChunk = text.slice(currentIndex, currentIndex + chunkSize);
        
        setDisplayedText(prev => prev + nextChunk);
        setCurrentIndex(prev => prev + chunkSize);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      // Reduced delay before completion
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 100);
      return () => clearTimeout(completeTimer);
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className="whitespace-pre-line">
      {displayedText}
    </div>
  );
};

const AiCoach = ({ selectedDate, setActiveTab }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'ai', 
      content: 'Hi! I\'m your WHOOP AI Coach. How can I help you today?',
      isTyping: false,
      isComplete: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSuggestions, setExpandedSuggestions] = useState({});
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [ratedMessages, setRatedMessages] = useState({}); // Track thumbs up/down states
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
      
      setMessages([{ 
        id: 1, 
        role: 'ai', 
        content: welcomeMessage,
        isTyping: false,
        isComplete: true
      }]);
    }
  }, [formattedDate, hasDataForSelectedDate]);
  
  // Handle message typing completion
  const handleTypingComplete = (messageId) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isTyping: false, isComplete: true }
        : msg
    ));
  };

  // Copy message to clipboard
  const handleCopyMessage = async (messageContent, messageId) => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopiedMessageId(messageId);
      // Reset copy state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Handle thumbs up/down
  const handleRating = (messageId, rating) => {
    setRatedMessages(prev => ({
      ...prev,
      [messageId]: rating
    }));
    // You can add analytics or feedback API calls here
    console.log(`Message ${messageId} rated: ${rating}`);
  };

  // Send message function (extracted for reuse)
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    // Add user message to chat
    const userMessage = { 
      id: Date.now(), 
      role: 'user', 
      content: messageText,
      isComplete: true
    };
    setMessages(prev => [...prev, userMessage]);
    setInput(''); // Clear input
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
        message: messageText,
        userData: trimmedUserData,
        date: formattedDate,
        hasData: hasDataForSelectedDate
      });
      
      // Add AI response to chat with typing effect
      const aiMessage = { 
        id: response.data.messageId || Date.now() + 1, 
        role: 'ai', 
        content: response.data.response,
        isTyping: true,
        isComplete: false
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI coach response:', error);
      // Add error message
      const errorMessage = { 
        id: Date.now() + 1, 
        role: 'ai', 
        content: 'Sorry, I encountered an error. Please try again.',
        isTyping: true,
        isComplete: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Handle sending a message from input
  const handleSendMessage = async () => {
    await sendMessage(input);
  };

  // Handle suggested question click - auto send
  const handleSuggestedQuestionClick = async (question) => {
    await sendMessage(question);
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
      { 
        id: 1, 
        role: 'ai', 
        content: 'Hi! I\'m your WHOOP AI Coach. How can I help you today?',
        isTyping: false,
        isComplete: true
      }
    ]);
    setRatedMessages({}); // Clear ratings
    setCopiedMessageId(null); // Clear copy state
  };

  // Suggested questions - Always visible
  const suggestedQuestions = [
    "What are my recovery trends?",
    "How can I improve my sleep quality?",
    "Suggest a workout for today?",
    "What's my strain pattern this week?",
    "How is my HRV trending?"
  ];

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        {/* Back button */}
        <button
          onClick={() => setActiveTab && setActiveTab('overview')}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        {/* Title */}
        <div className="text-center">
          <h1 className="text-lg font-bold tracking-wide">WHOOP COACH</h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs text-gray-400 font-medium">BETA V1.0</p>
            {formattedDate && (
              <>
                <span className="text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <div 
                    className={`w-1.5 h-1.5 rounded-full ${hasDataForSelectedDate ? 'bg-green-500' : 'bg-yellow-500'}`}
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
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Chat Content - Centered to align with input */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="max-w-full mx-auto px-3"> {/* Added inner container for perfect alignment */}
            {messages.map((message) => (
              <div key={message.id} className="mb-5">
                {message.role === 'ai' ? (
                  /* AI Message with SVG */
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 p-0.5">
                      <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center">
                        <img src={WhoopLogo} alt="WHOOP" className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 max-w-2xl">
                      <div className="text-sm leading-relaxed mb-3 whitespace-pre-line">
                        {message.isTyping ? (
                          <TypingText 
                            text={message.content} 
                            onComplete={() => handleTypingComplete(message.id)}
                            speed={15}
                          />
                        ) : (
                          message.content
                        )}
                      </div>
                      
                      {/* Action Buttons - Only show when typing is complete */}
                      {message.isComplete && (
                        <div className="flex space-x-2 mb-3">
                          {/* Copy Button */}
                          <button 
                            onClick={() => handleCopyMessage(message.content, message.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                            title="Copy response"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                            )}
                          </button>
                          
                          {/* Thumbs Up */}
                          <button 
                            onClick={() => handleRating(message.id, 'up')}
                            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                            title="Helpful response"
                          >
                            <ThumbsUp 
                              className={`w-4 h-4 transition-colors ${
                                ratedMessages[message.id] === 'up' 
                                  ? 'text-green-400 fill-green-400' 
                                  : 'text-gray-400 hover:text-green-400'
                              }`} 
                            />
                          </button>
                          
                          {/* Thumbs Down */}
                          <button 
                            onClick={() => handleRating(message.id, 'down')}
                            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                            title="Not helpful"
                          >
                            <ThumbsDown 
                              className={`w-4 h-4 transition-colors ${
                                ratedMessages[message.id] === 'down' 
                                  ? 'text-red-400 fill-red-400' 
                                  : 'text-gray-400 hover:text-red-400'
                              }`} 
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* User Message */
                  <div className="flex justify-end">
                    <div className="max-w-lg bg-blue-600 text-white rounded-2xl px-4 py-3">
                      <div className="text-sm">{message.content}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator with SVG */}
            {isLoading && (
              <div className="flex items-start space-x-3 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 p-0.5">
                  <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center">
                    <img src={WhoopLogo} alt="WHOOP" className="w-4 h-4" />
                  </div>
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

            {/* Always Visible Suggested Questions - Centered */}
            <div className="space-y-0 border-t border-gray-800 pt-4 max-w-2xl mx-auto"> {/* Added mx-auto for centering */}
              <div className="text-xs text-gray-400 font-medium mb-2">Quick questions:</div>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestionClick(question)}
                  disabled={isLoading}
                  className="flex items-center justify-between w-full py-3 px-0 text-left border-b border-gray-800 hover:bg-gray-800/30 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-white text-sm">{question}</span>
                  <ChevronUp className="w-4 h-4 text-blue-500 rotate-90" />
                </button>
              ))}
            </div>

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Input Area - More compact */}
      <div className="border-t border-gray-800 bg-gray-900 p-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full bg-transparent border-2 border-blue-500 rounded-full px-4 py-3 pr-11 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                placeholder="Ask your AI coach anything..."
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-4 h-4 text-blue-400 rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiCoach;
