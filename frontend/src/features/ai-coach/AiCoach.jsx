import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, RotateCcw, ThumbsUp, ThumbsDown, MessageSquare, ChevronUp, Copy, Check } from 'lucide-react';
import whoopData from '../../data/day_wise_whoop_data.json';
import WhoopLogo from '../../assets/Whoop White Symbol.svg';

const TypingText = ({ text, onComplete, speed = 15 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        const chunkSize = Math.floor(Math.random() * 4) + 3;
        const nextChunk = text.slice(currentIndex, currentIndex + chunkSize);
        
        setDisplayedText(prev => prev + nextChunk);
        setCurrentIndex(prev => prev + chunkSize);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 100);
      return () => clearTimeout(completeTimer);
    }
  }, [currentIndex, text, speed, onComplete]);

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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [ratedMessages, setRatedMessages] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  
  const userData = formattedDate && whoopData[formattedDate] 
    ? whoopData[formattedDate] 
    : null;
  
  const hasDataForSelectedDate = !!userData;

  useEffect(() => {
    const welcomeMessage = "Hi! I'm your WHOOP AI Coach. How can I help you today?";
    
    setMessages([{ 
      id: 1, 
      role: 'ai', 
      content: welcomeMessage,
      isTyping: false,
      isComplete: true
    }]);
  }, [formattedDate, hasDataForSelectedDate]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleTypingComplete = (messageId) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isTyping: false, isComplete: true }
        : msg
    ));
  };

  const handleCopyMessage = async (messageContent, messageId) => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleRating = (messageId, rating) => {
    setRatedMessages(prev => ({
      ...prev,
      [messageId]: rating
    }));
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    const userMessage = { 
      id: Date.now(), 
      role: 'user', 
      content: messageText,
      isComplete: true
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await axios.post('https://whoopapp-795777136792.europe-west1.run.app/api/ai-coach', {
        message: messageText
      });
      
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
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSendMessage = async () => {
    await sendMessage(input);
  };

  const handleSuggestedQuestionClick = async (question) => {
    await sendMessage(question);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleClearChat = () => {
    setMessages([
      { 
        id: 1, 
        role: 'ai', 
        content: "Hi! I'm your WHOOP AI Coach. How can I help you today?",
        isTyping: false,
        isComplete: true
      }
    ]);
    setRatedMessages({});
    setCopiedMessageId(null);
  };

  const suggestedQuestions = [
    "What are my recovery trends?",
    "How can I improve my sleep quality?",
    "Suggest a workout for today?",
    "What's my strain pattern this week?",
    "How is my HRV trending?"
  ];

  return (
    <div 
      className="h-screen text-white flex flex-col"
      style={{ 
        background: 'var(--bg-gradient-main)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ 
          background: 'var(--card-bg)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <button
          onClick={() => setActiveTab && setActiveTab('overview')}
          className="p-2 rounded-lg transition-colors"
          style={{ 
            background: 'transparent',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={(e) => e.target.style.background = 'var(--bg-subcard)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
            WHOOP COACH
          </h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              BETA V1.0
            </p>
            {formattedDate && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <div className="flex items-center gap-1">
                  <div 
                    className={`w-1.5 h-1.5 rounded-full ${hasDataForSelectedDate ? 'bg-green-500' : 'bg-yellow-500'}`}
                  ></div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {hasDataForSelectedDate ? 'Data Available' : 'No Data'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <button
          onClick={handleClearChat}
          className="p-2 rounded-lg transition-colors"
          title="Reset conversation"
          style={{ 
            background: 'transparent',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={(e) => e.target.style.background = 'var(--bg-subcard)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="max-w-full mx-auto px-3">
            {messages.map((message) => (
              <div key={message.id} className="mb-5">
                {message.role === 'ai' ? (
                  <div className="flex items-start space-x-3">
                    {/* Updated AI Avatar with smaller circle and new logo */}
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 p-0.5">
                      <div 
                        className="w-full h-full rounded-full flex items-center justify-center"
                        style={{ background: 'var(--bg-base)' }}
                      >
                        <img src={WhoopLogo} alt="WHOOP" className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 max-w-2xl">
                      <div 
                        className="text-sm leading-relaxed mb-3 whitespace-pre-line"
                        style={{ color: 'var(--text-primary)' }}
                      >
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
                      
                      {message.isComplete && (
                        <div className="flex space-x-2 mb-3">
                          <button 
                            onClick={() => handleCopyMessage(message.content, message.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            title="Copy response"
                            style={{ 
                              background: 'transparent',
                              color: 'var(--text-muted)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'var(--bg-subcard)';
                              e.target.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                              e.target.style.color = 'var(--text-muted)';
                            }}
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button 
                            onClick={() => handleRating(message.id, 'up')}
                            className="p-1.5 rounded-lg transition-colors"
                            title="Helpful response"
                            style={{ 
                              background: 'transparent',
                              color: ratedMessages[message.id] === 'up' ? '#4ade80' : 'var(--text-muted)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'var(--bg-subcard)';
                              if (ratedMessages[message.id] !== 'up') {
                                e.target.style.color = '#4ade80';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                              if (ratedMessages[message.id] !== 'up') {
                                e.target.style.color = 'var(--text-muted)';
                              }
                            }}
                          >
                            <ThumbsUp 
                              className={`w-4 h-4 transition-colors ${
                                ratedMessages[message.id] === 'up' ? 'fill-current' : ''
                              }`} 
                            />
                          </button>
                          
                          <button 
                            onClick={() => handleRating(message.id, 'down')}
                            className="p-1.5 rounded-lg transition-colors"
                            title="Not helpful"
                            style={{ 
                              background: 'transparent',
                              color: ratedMessages[message.id] === 'down' ? '#f87171' : 'var(--text-muted)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'var(--bg-subcard)';
                              if (ratedMessages[message.id] !== 'down') {
                                e.target.style.color = '#f87171';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                              if (ratedMessages[message.id] !== 'down') {
                                e.target.style.color = 'var(--text-muted)';
                              }
                            }}
                          >
                            <ThumbsDown 
                              className={`w-4 h-4 transition-colors ${
                                ratedMessages[message.id] === 'down' ? 'fill-current' : ''
                              }`} 
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div 
                      className="max-w-lg rounded-2xl px-4 py-3"
                      style={{ 
                        background: 'var(--strain-blue)',
                        color: 'white'
                      }}
                    >
                      <div className="text-sm">{message.content}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-3 mb-5">
                {/* Updated Loading Avatar with smaller circle and new logo */}
                <div className="w-7 h-7 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 p-0.5">
                  <div 
                    className="w-full h-full rounded-full flex items-center justify-center"
                    style={{ background: 'var(--bg-base)' }}
                  >
                    <img src={WhoopLogo} alt="WHOOP" className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div 
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: 'var(--text-muted)' }}
                  ></div>
                  <div 
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ 
                      background: 'var(--text-muted)',
                      animationDelay: '0.1s'
                    }}
                  ></div>
                  <div 
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ 
                      background: 'var(--text-muted)',
                      animationDelay: '0.2s'
                    }}
                  ></div>
                </div>
              </div>
            )}

            <div 
              className="space-y-0 border-t pt-4 max-w-2xl mx-auto"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div 
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Quick questions:
              </div>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestionClick(question)}
                  disabled={isLoading}
                  className="flex items-center justify-between w-full py-3 px-0 text-left border-b transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => !isLoading && (e.target.style.background = 'rgba(255, 255, 255, 0.05)')}
                  onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                >
                  <span className="text-sm">{question}</span>
                  <ChevronUp 
                    className="w-4 h-4 rotate-90" 
                    style={{ color: 'var(--strain-blue)' }}
                  />
                </button>
              ))}
            </div>

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div 
        className="border-t p-4 flex-shrink-0"
        style={{ 
          background: 'var(--card-bg)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-3">
            <MessageSquare 
              className="w-5 h-5" 
              style={{ color: 'var(--text-muted)' }}
            />
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full bg-transparent border-2 rounded-full px-4 py-3 pr-11 text-sm focus:outline-none"
                style={{ 
                  borderColor: 'var(--strain-blue)',
                  color: 'var(--text-primary)',
                  '::placeholder': { color: 'var(--text-muted)' }
                }}
                placeholder="Ask your AI coach anything..."
                disabled={isLoading}
                onFocus={(e) => e.target.style.borderColor = 'var(--strain-blue)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--strain-blue)'}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: 'transparent',
                  color: 'var(--strain-blue)'
                }}
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.background = 'var(--strain-blue)';
                    e.target.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--strain-blue)';
                }}
              >
                <ChevronUp className="w-4 h-4 rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiCoach;
