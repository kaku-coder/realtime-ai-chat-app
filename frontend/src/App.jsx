import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, ArrowUp, SquarePen, MessageSquare } from 'lucide-react';
import axios from 'axios';

const App = () => {
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat window to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Find current active conversation session object
  const activeSession = sessions.find((s) => s._id === activeSessionId) || null;
  const currentMessages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, loading]);

  // Fetch all chat session objects from backend on load
  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/chat/history');
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching chat sessions:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Helper to extract clean sidebar display title
  const getSessionTitle = (session) => {
    if (session.title && session.title !== 'New Conversation' && session.title !== 'Untitled Conversation') {
      return session.title;
    }
    if (session.messages && session.messages.length > 0 && session.messages[0].userMessage) {
      const firstMsg = session.messages[0].userMessage;
      return firstMsg.length > 25 ? firstMsg.substring(0, 25) + '...' : firstMsg;
    }
    return 'Chat Session';
  };

  // New Chat Handler
  const handleNewChat = () => {
    setActiveSessionId(null);
    setInput('');
  };

  // Send Message Handler
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const currentInput = input.trim();
    setInput('');
    setLoading(true);

    // Optimistically create or append pending message in UI
    const pendingMsg = { _id: Date.now(), userMessage: currentInput, aiResponse: null };

    if (activeSessionId) {
      // Append to existing active session
      setSessions((prev) =>
        prev.map((session) =>
          session._id === activeSessionId
            ? { ...session, messages: [...session.messages, pendingMsg] }
            : session
        )
      );
    } else {
      // Create temporary new session object titled after user's prompt
      const tempSession = {
        _id: 'temp-' + Date.now(),
        title: currentInput.length > 25 ? currentInput.substring(0, 25) + '...' : currentInput,
        messages: [pendingMsg],
      };
      setSessions((prev) => [tempSession, ...prev]);
    }

    try {
      // Call API sending message & optional chatId
      const response = await axios.post('http://localhost:3000/api/chat/send', {
        message: currentInput,
        chatId: activeSessionId && !activeSessionId.startsWith('temp-') ? activeSessionId : null,
      });

      if (response.data.success) {
        const updatedSession = response.data.data;

        // Update sessions state with real MongoDB document
        setSessions((prev) => {
          const filtered = prev.filter((s) => !s._id.startsWith('temp-'));
          const exists = filtered.some((s) => s._id === updatedSession._id);
          if (exists) {
            return filtered.map((s) => (s._id === updatedSession._id ? updatedSession : s));
          } else {
            return [updatedSession, ...filtered];
          }
        });

        // Set active session ID to the newly saved MongoDB document ID
        setActiveSessionId(updatedSession._id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f5f8]">
      
      {/* ================= SIDEBAR (LEFT) ================= */}
      <aside className="w-64 bg-[#0d0d0f] text-gray-300 flex flex-col p-4 border-r border-gray-800/80 flex-shrink-0">
        
        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-[14px] transition cursor-pointer mb-4 ${
            activeSessionId === null
              ? 'bg-[#222227] text-white shadow-sm border border-gray-700'
              : 'hover:bg-[#1a1a1e] text-gray-300 bg-[#16161a]'
          }`}
        >
          <SquarePen className="w-4 h-4 text-gray-200" />
          <span>New chat</span>
        </button>

        {/* Pinned / Recent Conversations Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-gray-400 text-xs font-semibold tracking-wider px-3 pb-2">
            Pinned
          </h3>

          {/* List of Chat Session Objects */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {sessions.length > 0 ? (
              sessions.map((session) => {
                const titleText = getSessionTitle(session);
                return (
                  <button
                    key={session._id}
                    onClick={() => setActiveSessionId(session._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-normal transition text-left cursor-pointer truncate ${
                      activeSessionId === session._id
                        ? 'bg-[#222227] text-white font-medium shadow-sm'
                        : 'text-gray-300 hover:bg-[#1a1a1e] hover:text-white'
                    }`}
                    title={titleText}
                  >
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{titleText}</span>
                  </button>
                );
              })
            ) : (
              <div className="text-gray-500 text-xs px-3 py-4 text-center">
                No recent conversations
              </div>
            )}
          </div>
        </div>

      </aside>

      {/* ================= MAIN CHAT AREA (RIGHT) ================= */}
      <main className="flex-1 flex items-center justify-center p-6 h-full overflow-hidden">
        
        {/* Ask Super AI Modal Card */}
        <div className="w-full max-w-[680px] bg-white rounded-[32px] p-8 shadow-[0_12px_45px_rgba(0,0,0,0.06)] border border-gray-100/80 flex flex-col justify-between h-[680px]">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-[17px] font-semibold text-[#1c1c1e] tracking-tight">
              Ask Super AI
            </h2>
            <button 
              className="text-[#1c1c1e] hover:opacity-70 transition cursor-pointer p-1"
              onClick={handleNewChat}
              title="Start New Chat"
            >
              <X className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

          {/* Chat Window */}
          <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 scrollbar-thin">
            {currentMessages.length > 0 ? (
              currentMessages.map((msg, index) => (
                <React.Fragment key={msg._id || index}>
                  {/* User Message Bubble */}
                  {msg.userMessage && (
                    <div className="flex justify-end">
                      <div className="bg-[#ebf5ff] text-[#0076e8] px-5 py-3.5 rounded-[22px] rounded-tr-[6px] max-w-[86%] text-[15px] leading-snug font-normal">
                        {msg.userMessage}
                      </div>
                    </div>
                  )}

                  {/* AI Message Bubble OR Typing Dots Indicator */}
                  {msg.aiResponse ? (
                    <div className="flex items-end gap-3">
                      {/* Glossy Blue Gradient Sphere Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1d4ed8] via-[#3b82f6] to-[#93c5fd] shadow-sm flex-shrink-0 mb-1" />
                      
                      <div className="bg-[#f2f3f6] text-[#1c1c1e] px-5 py-4 rounded-[22px] rounded-bl-[6px] max-w-[85%] text-[15px] leading-normal font-normal">
                        {msg.aiResponse}
                      </div>
                    </div>
                  ) : (
                    /* Animated Typing Indicator Dots while waiting for AI */
                    <div className="flex items-end gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1d4ed8] via-[#3b82f6] to-[#93c5fd] shadow-sm flex-shrink-0 mb-1 animate-pulse" />
                      <div className="bg-[#f2f3f6] text-gray-500 px-5 py-4 rounded-[22px] rounded-bl-[6px] text-[15px] flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))
            ) : (
              /* Empty state for New Chat */
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1d4ed8] via-[#3b82f6] to-[#93c5fd] shadow-md flex items-center justify-center text-white text-lg font-bold">
                  AI
                </div>
                <p className="text-sm font-medium text-gray-500">Start a new conversation</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="flex items-center gap-3 pt-2">
            {/* Input Pill Container */}
            <div className="flex-1 flex items-center bg-[#f2f3f6] rounded-full px-5 py-3.5 gap-2">
              <input
                type="text"
                placeholder="How else can I help"
                className="w-full bg-transparent outline-none text-[#1c1c1e] placeholder-[#8e8e93] text-[15px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="text-[#1c1c1e] hover:opacity-70 transition cursor-pointer flex-shrink-0">
                <Mic className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Circular Arrow Up Send Button */}
            <button 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition flex-shrink-0 cursor-pointer ${
                input.trim() && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  : 'bg-[#f2f3f6] hover:bg-[#e4e5ea] text-[#1c1c1e]'
              }`} 
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              <ArrowUp className="w-5 h-5 stroke-[2]" />
            </button>
          </div>

        </div>
      </main>

    </div>
  );
};

export default App;