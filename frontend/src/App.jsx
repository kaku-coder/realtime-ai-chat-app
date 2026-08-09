import React, { 
  useReducer, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  useState
} from 'react';
import { 
  X, 
  SquarePen, 
  MessageSquare, 
  Menu, 
  Pencil, 
  Trash2, 
  Check, 
  Moon, 
  Sun, 
  Send, 
  Paperclip, 
  Globe, 
  Mic, 
  FileText, 
  Code, 
  Sparkles,
  FileCode
} from 'lucide-react';
import axios from 'axios';

// Custom MOGO 3D Robot Avatar Component
const AILogo = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-6 h-6 sm:w-7 sm:h-7 rounded-lg p-0.5",
    md: "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl p-0.5",
    lg: "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1",
  };

  return (
    <div className={`${sizeClasses[size]} overflow-hidden bg-[#18181b] border border-gray-700/60 shadow-md flex-shrink-0 flex items-center justify-center`}>
      <img src="/MOGO.png" alt="MOGO AI" className="w-full h-full object-contain drop-shadow-sm" />
    </div>
  );
};

// Suggested Prompt Pills Data
const SUGGESTED_PROMPTS = [
  { 
    id: 1, 
    icon: FileText, 
    label: "Explain AI in simple terms", 
    prompt: "Explain Artificial Intelligence in simple terms for a beginner" 
  },
  { 
    id: 2, 
    icon: Code, 
    label: "Help me write code", 
    prompt: "Help me write a clean React component using hooks" 
  },
  { 
    id: 3, 
    icon: Sparkles, 
    label: "Give me productivity tips", 
    prompt: "Give me 5 practical productivity tips for software developers" 
  },
];

// ================= REDUCER DEFINITION =================
const initialState = {
  input: '',
  sessions: [],
  activeSessionId: null,
  loading: false,
  sidebarOpen: false,
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload };

    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };

    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSessionId: action.payload, sidebarOpen: false };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'CLOSE_SIDEBAR':
      return { ...state, sidebarOpen: false };

    case 'START_NEW_CHAT':
      return { ...state, activeSessionId: null, input: '', sidebarOpen: false };

    case 'RENAME_SESSION': {
      const { id, title } = action.payload;
      const updatedSessions = state.sessions.map((s) =>
        s._id === id ? { ...s, title } : s
      );
      return { ...state, sessions: updatedSessions };
    }

    case 'DELETE_SESSION': {
      const { id } = action.payload;
      const filteredSessions = state.sessions.filter((s) => s._id !== id);
      const newActiveId = state.activeSessionId === id ? null : state.activeSessionId;
      return {
        ...state,
        sessions: filteredSessions,
        activeSessionId: newActiveId,
      };
    }

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://realtime-ai-chat-app1.onrender.com';

const App = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [editingId, setEditingId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('mogo_theme') === 'dark';
  });

  // Toolbar Features State
  const [attachedFile, setAttachedFile] = useState(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Toggle Dark / Light Theme
  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => {
      const nextTheme = !prev;
      localStorage.setItem('mogo_theme', nextTheme ? 'dark' : 'light');
      return nextTheme;
    });
  }, []);

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
      const res = await axios.get(`${API_BASE_URL}/api/chat/history`);
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
    setAttachedFile(null);
  }, []);

  // Input change handler
  const handleInputChange = useCallback((e) => {
    dispatch({ type: 'SET_INPUT', payload: e.target.value });
  }, []);

  // Select session handler
  const handleSelectSession = useCallback((sessionId) => {
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: sessionId });
  }, []);

  // Start Editing Chat Title Handler
  const handleStartEdit = useCallback((session, e) => {
    e.stopPropagation();
    setEditingId(session._id);
    setEditTitleInput(session.title || getSessionTitle(session));
  }, [getSessionTitle]);

  // Save Renamed Title Handler
  const handleSaveEdit = useCallback(async (sessionId, e) => {
    if (e) e.stopPropagation();
    if (!editTitleInput.trim()) return;

    try {
      const res = await axios.put(`${API_BASE_URL}/api/chat/${sessionId}/title`, {
        title: editTitleInput.trim(),
      });
      if (res.data.success) {
        dispatch({
          type: 'RENAME_SESSION',
          payload: { id: sessionId, title: res.data.data.title },
        });
      }
    } catch (err) {
      console.error('Error renaming chat title:', err);
    }
    setEditingId(null);
  }, [editTitleInput]);

  // Open Delete Confirmation Modal Handler
  const handleDeleteClick = useCallback((sessionId, e) => {
    e.stopPropagation();
    setDeleteTargetId(sessionId);
  }, []);

  // Confirm Delete Action Handler
  const confirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;

    try {
      const res = await axios.delete(`${API_BASE_URL}/api/chat/${deleteTargetId}`);
      if (res.data.success) {
        dispatch({
          type: 'DELETE_SESSION',
          payload: { id: deleteTargetId },
        });
      }
    } catch (err) {
      console.error('Error deleting chat session:', err);
    }
    setDeleteTargetId(null);
  }, [deleteTargetId]);

  // ================= TOOLBAR HANDLERS =================
  // 1. Handle File Upload / Attachment
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        content: event.target?.result || '',
      });
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    // Reset file input
    e.target.value = '';
  };

  // 2. Handle Voice Recognition Input (Speech to Text)
  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome or MS Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (err) => {
      console.error("Speech Recognition Error:", err);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');

      dispatch({ type: 'SET_INPUT', payload: transcript });
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // Send Message Handler
  const sendMessage = useCallback(async (customPrompt = null) => {
    let basePrompt = typeof customPrompt === 'string' ? customPrompt : state.input.trim();
    if ((!basePrompt && !attachedFile) || state.loading) return;

    // Combine attached file info with prompt if attached
    let finalPrompt = basePrompt;
    if (attachedFile) {
      finalPrompt = attachedFile.content && typeof attachedFile.content === 'string' && !attachedFile.content.startsWith('data:')
        ? `[Attached File: ${attachedFile.name}]\n${attachedFile.content}\n\nUser Question: ${basePrompt || 'Please review this file.'}`
        : `[Attached File: ${attachedFile.name}]\nUser Question: ${basePrompt || 'Please analyze this file.'}`;
    }

    const tempId = 'temp-' + Date.now();
    const pendingMsg = { _id: Date.now(), userMessage: basePrompt || `Attached ${attachedFile?.name}`, aiResponse: null };

    // Clear attached file state
    setAttachedFile(null);

    // 1. Dispatch optimistic UI update
    dispatch({
      type: 'OPTIMISTIC_ADD_MESSAGE',
      payload: { tempId, pendingMsg, userPrompt: finalPrompt },
    });

    try {
      // 2. Call backend API with prompt & optional chatId
      const response = await axios.post(`${API_BASE_URL}/api/chat/send`, {
        message: finalPrompt,
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
  }, [state.input, state.loading, state.activeSessionId, attachedFile]);

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
    <div className={`flex h-screen w-screen overflow-hidden transition-colors duration-300 relative ${
      darkMode ? 'bg-[#0a0a0f] text-gray-100' : 'bg-[#f5f4f9] text-gray-900'
    }`}>
      
      {/* Hidden File Input for Paperclip */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="text/*,.js,.jsx,.ts,.tsx,.json,.py,.java,.cpp,.html,.css,.md,image/*"
      />

      {/* Custom Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className={`border rounded-2xl p-5 sm:p-6 max-w-sm w-full text-center shadow-2xl space-y-4 ${
            darkMode ? 'bg-[#181726] border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'
          }`}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Delete Chat</h3>
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Do you want to delete the history or not?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
                  darkMode ? 'bg-[#262438] hover:bg-[#302d46] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium shadow-md transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {state.sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
        />
      )}

      {/* ================= SIDEBAR (LEFT) ================= */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-64 flex flex-col p-4 border-r flex-shrink-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          darkMode ? 'bg-[#0e0d16] border-gray-800/80 text-gray-300' : 'bg-[#0f0e17] border-gray-900 text-gray-300'
        } ${state.sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        
        {/* Mobile Close Button & Header */}
        <div className="flex items-center justify-between md:hidden mb-3 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <AILogo size="sm" />
            <span className="text-sm font-semibold text-gray-200">MOGO Chat History</span>
          </div>
          <button 
            onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-[14px] transition cursor-pointer mb-4 ${
            state.activeSessionId === null
              ? 'bg-[#242235] text-white shadow-sm border border-gray-700/80'
              : 'hover:bg-[#1a1926] text-gray-300 bg-[#161522]'
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
                  <div
                    key={session._id}
                    className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-normal transition text-left cursor-pointer ${
                      state.activeSessionId === session._id
                        ? 'bg-[#242235] text-white font-medium shadow-sm'
                        : 'text-gray-300 hover:bg-[#1a1926] hover:text-white'
                    }`}
                    onClick={() => handleSelectSession(session._id)}
                    title={titleText}
                  >
                    {editingId === session._id ? (
                      <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitleInput}
                          onChange={(e) => setEditTitleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(session._id, e);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="w-full bg-[#181726] border border-gray-600 rounded px-2 py-0.5 text-xs text-white outline-none focus:border-purple-500"
                          autoFocus
                        />
                        <button 
                          onClick={(e) => handleSaveEdit(session._id, e)} 
                          className="p-1 hover:text-green-400 text-gray-300 transition"
                          title="Save Title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingId(null); }} 
                          className="p-1 hover:text-red-400 text-gray-400 transition"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{titleText}</span>
                        </div>
                        {/* Edit & Delete Action Buttons (visible on hover) */}
                        <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => handleStartEdit(session, e)}
                            className="p-1 hover:text-white text-gray-400 hover:bg-gray-700/60 rounded transition"
                            title="Edit Title"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(session._id, e)}
                            className="p-1 hover:text-red-400 text-gray-400 hover:bg-gray-700/60 rounded transition"
                            title="Delete Chat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
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
      <main className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 h-full overflow-hidden">
        
        {/* Ask MOGO AI Modal Container */}
        <div className={`w-full max-w-[720px] rounded-2xl sm:rounded-[32px] p-4 sm:p-6 md:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.08)] border flex flex-col justify-between h-[94vh] max-h-[760px] md:h-[700px] transition-colors duration-300 relative ${
          darkMode 
            ? 'bg-[#13121f] border-gray-800/80 text-white' 
            : 'bg-gradient-to-b from-[#f3e8ff]/40 via-[#faf7ff] to-white border-purple-100/60 text-gray-900'
        }`}>
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200/20">
            <div className="flex items-center gap-2.5">
              {/* Mobile Hamburger Menu Toggle */}
              <button 
                className={`md:hidden p-1.5 rounded-lg transition ${
                  darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-purple-100/60'
                }`}
                onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
                title="Toggle History Sidebar"
              >
                <Menu className="w-5 h-5 stroke-[2]" />
              </button>

              {/* MOGO 3D Avatar Logo */}
              <AILogo size="sm" />

              <h2 className="text-[16px] sm:text-[17px] font-semibold tracking-tight flex items-center gap-1.5">
                <span>MOGO AI</span>
              </h2>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Dark / Light Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition cursor-pointer ${
                  darkMode 
                    ? 'bg-[#222035] text-amber-400 hover:bg-[#2b2943]' 
                    : 'bg-purple-100/80 text-purple-700 hover:bg-purple-200/80'
                }`}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Start New Chat Cross Button */}
              <button 
                className={`p-2 rounded-full transition cursor-pointer ${
                  darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'
                }`}
                onClick={handleNewChat}
                title="Start New Chat"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Chat Window / Welcome State */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
            {currentMessages.length > 0 ? (
              currentMessages.map((msg, index) => (
                <React.Fragment key={msg._id || index}>
                  {/* User Message Bubble */}
                  {msg.userMessage && (
                    <div className="flex justify-end">
                      <div className="bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white px-4.5 py-3 sm:px-5 sm:py-3.5 rounded-[22px] rounded-tr-xs max-w-[88%] sm:max-w-[84%] text-[14px] sm:text-[15px] leading-snug font-normal shadow-sm">
                        {msg.userMessage}
                      </div>
                    </div>
                  )}

                  {/* AI Message Bubble OR Typing Indicator */}
                  {msg.aiResponse ? (
                    <div className="flex items-end gap-2.5 sm:gap-3">
                      <AILogo size="md" />
                      
                      <div className={`px-4.5 py-3.5 sm:px-5 sm:py-4 rounded-[22px] rounded-bl-xs max-w-[88%] sm:max-w-[85%] text-[14px] sm:text-[15px] leading-normal font-normal ${
                        darkMode 
                          ? 'bg-[#1c1b2c] text-gray-100 border border-gray-800/60' 
                          : 'bg-[#f3f2f8] text-gray-900 border border-gray-200/50'
                      }`}>
                        {msg.aiResponse}
                      </div>
                    </div>
                  ) : (
                    /* Animated Typing Dots Indicator */
                    <div className="flex items-end gap-2.5 sm:gap-3">
                      <AILogo size="md" />
                      <div className={`px-4.5 py-3.5 sm:px-5 sm:py-4 rounded-[22px] rounded-bl-xs text-[14px] sm:text-[15px] flex items-center gap-1.5 ${
                        darkMode ? 'bg-[#1c1b2c] text-gray-400' : 'bg-[#f3f2f8] text-gray-500'
                      }`}>
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))
            ) : (
              /* Beautiful Mockup-Matched Empty State Screen */
              <div className="h-full flex flex-col items-center justify-center text-center px-2 py-4 space-y-6">
                
                {/* Avatar with Soft Glowing Halo */}
                <div className="relative group">
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 opacity-40 blur-md group-hover:opacity-70 transition duration-500"></div>
                  <div className="relative p-2 sm:p-2.5 rounded-3xl bg-[#181726] border border-purple-500/30 shadow-xl">
                    <img src="/MOGO.png" alt="MOGO Avatar" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md" />
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
                    <span>Hi, I'm MOGO</span>
                    <span className="animate-wave inline-block origin-bottom-right">👋</span>
                  </h3>
                  <p className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    How can I help you today?
                  </p>
                </div>

                {/* Suggested Prompt Cards */}
                <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {SUGGESTED_PROMPTS.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => sendMessage(item.prompt)}
                        className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-xs font-medium space-y-2 hover:scale-[1.02] active:scale-95 ${
                          darkMode 
                            ? 'bg-[#1a1928] border-gray-800/80 hover:border-purple-500/50 text-gray-200' 
                            : 'bg-white/80 backdrop-blur-xs border-purple-100 hover:border-purple-300 text-gray-700 shadow-sm'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="line-clamp-2 leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>

              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Card (Matching Mockup Toolbar) */}
          <div className="pt-2">
            <div className={`rounded-3xl p-3 sm:p-4 border transition-all duration-300 space-y-2 ${
              darkMode 
                ? 'bg-[#1a1928] border-gray-800 focus-within:border-purple-500/60 shadow-lg' 
                : 'bg-[#f8f7fc] border-purple-100/80 focus-within:border-purple-400/60 shadow-sm'
            }`}>
              
              {/* Attached File Pill Badge */}
              {attachedFile && (
                <div className="flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 px-3 py-1.5 rounded-xl w-fit text-xs text-purple-300 mb-1">
                  <FileCode className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="font-medium truncate max-w-[200px]">{attachedFile.name}</span>
                  <span className="text-[10px] text-gray-400">({attachedFile.size})</span>
                  <button 
                    onClick={() => setAttachedFile(null)} 
                    className="p-0.5 hover:text-white text-gray-400 transition ml-1"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Text Input Area */}
              <input
                type="text"
                placeholder={isListening ? "Listening to your voice..." : "Ask MOGO anything..."}
                className={`w-full bg-transparent outline-none text-[14px] sm:text-[15px] px-1 ${
                  darkMode ? 'text-white placeholder-[#787694]' : 'text-gray-900 placeholder-[#9b98b8]'
                } ${isListening ? 'text-purple-400 font-medium' : ''}`}
                value={state.input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />

              {/* Bottom Actions Toolbar */}
              <div className="flex items-center justify-between pt-1">
                
                {/* Left Side Action Icons (Attachment & Web Search Toggle) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Paperclip File Upload Button */}
                  <button 
                    type="button"
                    onClick={handleFileClick}
                    className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer relative ${
                      attachedFile 
                        ? 'text-purple-400 bg-purple-500/15 border border-purple-500/30' 
                        : darkMode 
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                          : 'text-gray-500 hover:text-purple-600 hover:bg-purple-100/60'
                    }`}
                    title="Attach File (Code, Text, Image)"
                  >
                    <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>

                  {/* Globe Live Web Search Toggle Button */}
                  <button 
                    type="button"
                    onClick={() => setWebSearchEnabled((prev) => !prev)}
                    className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-medium ${
                      webSearchEnabled 
                        ? 'text-purple-400 bg-purple-500/15 border border-purple-500/30' 
                        : darkMode 
                          ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' 
                          : 'text-gray-400 hover:text-purple-600 hover:bg-purple-100/60'
                    }`}
                    title={webSearchEnabled ? "Live Web Search: ENABLED" : "Live Web Search: DISABLED"}
                  >
                    <Globe className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${webSearchEnabled ? 'text-purple-400' : 'text-gray-500'}`} />
                  </button>
                </div>

                {/* Right Side Actions (Mic Voice Input & Circular Purple Send Button) */}
                <div className="flex items-center gap-2">
                  {/* Speech to Text Mic Button */}
                  <button 
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer ${
                      isListening 
                        ? 'text-red-500 bg-red-500/15 border border-red-500/30 animate-pulse' 
                        : darkMode 
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                          : 'text-gray-500 hover:text-purple-600 hover:bg-purple-100/60'
                    }`}
                    title={isListening ? "Listening... Click to stop" : "Voice Input (Speech-to-Text)"}
                  >
                    <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>

                  {/* Circular Send Button */}
                  <button 
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                      (state.input.trim() || attachedFile) && !state.loading
                        ? 'bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-md shadow-purple-500/30 hover:scale-105 active:scale-95'
                        : 'bg-purple-500/20 text-purple-400 opacity-60'
                    }`} 
                    onClick={() => sendMessage()}
                    disabled={(!state.input.trim() && !attachedFile) || state.loading}
                    title="Send Message"
                  >
                    <Send className="w-4 h-4 stroke-[2.2] translate-x-0.5 -translate-y-0.5" />
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>
      </main>

    </div>
  );
};

export default App;