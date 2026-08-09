import React, { 
  useReducer, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo 
} from 'react';
import { X, Mic, ArrowUp, SquarePen, MessageSquare } from 'lucide-react';
import axios from 'axios';

// ================= REDUCER DEFINITION =================
const initialState = {
  input: '',
  sessions: [],
  activeSessionId: null,
  loading: false,
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload };

    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };

    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSessionId: action.payload };

    case 'START_NEW_CHAT':
      return { ...state, activeSessionId: null, input: '' };

    case 'OPTIMISTIC_ADD_MESSAGE': {
      const { tempId, pendingMsg, userPrompt } = action.payload;
      let newSessions;
      let newActiveId = state.activeSessionId;

      if (state.activeSessionId) {
        newSessions = state.sessions.map((session) =>
          session._id === state.activeSessionId
            ? { ...session, messages: [...session.messages, pendingMsg] }
            : session
        );
      } else {
        const tempSession = {
          _id: tempId,
          title: userPrompt.length > 25 ? userPrompt.substring(0, 25) + '...' : userPrompt,
          messages: [pendingMsg],
        };
        newSessions = [tempSession, ...state.sessions];
        newActiveId = tempId;
      }

      return {
        ...state,
        sessions: newSessions,
        activeSessionId: newActiveId,
        input: '',
        loading: true,
      };
    }

    case 'RESOLVE_MESSAGE_SUCCESS': {
      const { updatedSession } = action.payload;
      const filtered = state.sessions.filter((s) => !s._id.startsWith('temp-'));
      const exists = filtered.some((s) => s._id === updatedSession._id);

      const newSessions = exists
        ? filtered.map((s) => (s._id === updatedSession._id ? updatedSession : s))
        : [updatedSession, ...filtered];

      return {
        ...state,
        sessions: newSessions,
        activeSessionId: updatedSession._id,
        loading: false,
      };
    }

    case 'RESOLVE_MESSAGE_ERROR':
      return { ...state, loading: false };

    default:
      return state;
  }
}

const App = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat window to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ================= USEMEMO DERIVED STATES =================
  // Memoize active session object lookup
  const activeSession = useMemo(() => {
    return state.sessions.find((s) => s._id === state.activeSessionId) || null;
  }, [state.sessions, state.activeSessionId]);

  // Memoize current messages list
  const currentMessages = useMemo(() => {
    return activeSession ? activeSession.messages : [];
  }, [activeSession]);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, state.loading, scrollToBottom]);

  // Fetch all chat session objects from backend on load
  const fetchSessions = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/chat/history');
      if (res.data.success) {
        dispatch({ type: 'SET_SESSIONS', payload: res.data.data });
      }
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Memoized helper to extract clean sidebar display title
  const getSessionTitle = useCallback((session) => {
    if (session.title && session.title !== 'New Conversation' && session.title !== 'Untitled Conversation') {
      return session.title;
    }
    if (session.messages && session.messages.length > 0 && session.messages[0].userMessage) {
      const firstMsg = session.messages[0].userMessage;
      return firstMsg.length > 25 ? firstMsg.substring(0, 25) + '...' : firstMsg;
    }
    return 'Chat Session';
  }, []);

  // ================= USECALLBACK EVENT HANDLERS =================
  // New Chat Handler
  const handleNewChat = useCallback(() => {
    dispatch({ type: 'START_NEW_CHAT' });
  }, []);

  // Input change handler
  const handleInputChange = useCallback((e) => {
    dispatch({ type: 'SET_INPUT', payload: e.target.value });
  }, []);

  // Select session handler
  const handleSelectSession = useCallback((sessionId) => {
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: sessionId });
  }, []);

  // Send Message Handler
  const sendMessage = useCallback(async () => {
    if (!state.input.trim() || state.loading) return;

    const userPrompt = state.input.trim();
    const tempId = 'temp-' + Date.now();
    const pendingMsg = { _id: Date.now(), userMessage: userPrompt, aiResponse: null };

    // 1. Dispatch optimistic UI update
    dispatch({
      type: 'OPTIMISTIC_ADD_MESSAGE',
      payload: { tempId, pendingMsg, userPrompt },
    });

    try {
      // 2. Call backend API with prompt & optional chatId
      const response = await axios.post('http://localhost:3000/api/chat/send', {
        message: userPrompt,
        chatId: state.activeSessionId && !state.activeSessionId.startsWith('temp-') ? state.activeSessionId : null,
      });

      if (response.data.success) {
        dispatch({
          type: 'RESOLVE_MESSAGE_SUCCESS',
          payload: { updatedSession: response.data.data },
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      dispatch({ type: 'RESOLVE_MESSAGE_ERROR' });
    }
  }, [state.input, state.loading, state.activeSessionId]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f4f5f8]">
      
      {/* ================= SIDEBAR (LEFT) ================= */}
      <aside className="w-64 bg-[#0d0d0f] text-gray-300 flex flex-col p-4 border-r border-gray-800/80 flex-shrink-0">
        
        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-[14px] transition cursor-pointer mb-4 ${
            state.activeSessionId === null
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
            {state.sessions.length > 0 ? (
              state.sessions.map((session) => {
                const titleText = getSessionTitle(session);
                return (
                  <button
                    key={session._id}
                    onClick={() => handleSelectSession(session._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-normal transition text-left cursor-pointer truncate ${
                      state.activeSessionId === session._id
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
                value={state.input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              <button className="text-[#1c1c1e] hover:opacity-70 transition cursor-pointer flex-shrink-0">
                <Mic className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Circular Arrow Up Send Button */}
            <button 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition flex-shrink-0 cursor-pointer ${
                state.input.trim() && !state.loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  : 'bg-[#f2f3f6] hover:bg-[#e4e5ea] text-[#1c1c1e]'
              }`} 
              onClick={sendMessage}
              disabled={!state.input.trim() || state.loading}
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