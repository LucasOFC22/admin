
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'bot' | 'ai';
  timestamp: Date;
  senderName?: string;
  sessionId: string;
}

interface ChatSession {
  id: string;
  title: string;
  status: 'active' | 'closed' | 'waiting';
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  userName?: string;
  userEmail?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface ChatState {
  sessions: ChatSession[];
  messages: Record<string, ChatMessage[]>;
  activeSessions: string[];
  selectedSession: string | null;
  loading: boolean;
  n8nConnected: boolean;
  currentUser: {
    name: string;
    email: string;
  } | null;
}

interface ChatContextType {
  // State
  sessions: ChatSession[];
  messages: Record<string, ChatMessage[]>;
  activeSessions: string[];
  selectedSession: string | null;
  loading: boolean;
  n8nConnected: boolean;
  currentUser: { name: string; email: string; } | null;
  
  // Session management
  createSession: (title: string, userData?: { name: string; email: string; }) => string;
  selectSession: (sessionId: string) => void;
  closeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  
  // Message management
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  getSessionMessages: (sessionId: string) => ChatMessage[];
  markAsRead: (sessionId: string) => void;
  
  // Connection management
  setN8nConnected: (connected: boolean) => void;
  setCurrentUser: (user: { name: string; email: string; } | null) => void;
  
  // Utilities
  getTotalUnreadCount: () => number;
  getActiveSessionsCount: () => number;
  refreshSessions: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ChatState>({
    sessions: [],
    messages: {},
    activeSessions: [],
    selectedSession: null,
    loading: false,
    n8nConnected: false,
    currentUser: null
  });

  const createSession = useCallback((title: string, userData?: { name: string; email: string; }) => {
    const sessionId = Math.random().toString(36).substr(2, 9);
    const newSession: ChatSession = {
      id: sessionId,
      title,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userData?.email,
      userName: userData?.name,
      userEmail: userData?.email,
      unreadCount: 0
    };

    setState(prev => ({
      ...prev,
      sessions: [...prev.sessions, newSession],
      activeSessions: [...prev.activeSessions, sessionId],
      messages: { ...prev.messages, [sessionId]: [] }
    }));

    return sessionId;
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setState(prev => ({ ...prev, selectedSession: sessionId }));
  }, []);

  const closeSession = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === sessionId ? { ...session, status: 'closed' as const } : session
      ),
      activeSessions: prev.activeSessions.filter(id => id !== sessionId),
      selectedSession: prev.selectedSession === sessionId ? null : prev.selectedSession
    }));
  }, []);

  const updateSession = useCallback((sessionId: string, updates: Partial<ChatSession>) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === sessionId 
          ? { ...session, ...updates, updatedAt: new Date() }
          : session
      )
    }));
  }, []);

  const addMessage = useCallback((sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      sessionId
    };

    setState(prev => {
      const sessionMessages = prev.messages[sessionId] || [];
      const updatedMessages = [...sessionMessages, newMessage];
      
      // Update session with last message and unread count
      const updatedSessions = prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            lastMessage: newMessage,
            updatedAt: new Date(),
            unreadCount: message.sender !== 'user' ? session.unreadCount + 1 : session.unreadCount
          };
        }
        return session;
      });

      return {
        ...prev,
        messages: { ...prev.messages, [sessionId]: updatedMessages },
        sessions: updatedSessions
      };
    });
  }, []);

  const getSessionMessages = useCallback((sessionId: string) => {
    return state.messages[sessionId] || [];
  }, [state.messages]);

  const markAsRead = useCallback((sessionId: string) => {
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(session =>
        session.id === sessionId ? { ...session, unreadCount: 0 } : session
      )
    }));
  }, []);

  const setN8nConnected = useCallback((connected: boolean) => {
    setState(prev => ({ ...prev, n8nConnected: connected }));
  }, []);

  const setCurrentUser = useCallback((user: { name: string; email: string; } | null) => {
    setState(prev => ({ ...prev, currentUser: user }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const getTotalUnreadCount = useCallback(() => {
    return state.sessions.reduce((total, session) => total + session.unreadCount, 0);
  }, [state.sessions]);

  const getActiveSessionsCount = useCallback(() => {
    return state.activeSessions.length;
  }, [state.activeSessions]);

  const refreshSessions = useCallback(async () => {
    setLoading(true);
    try {
      // Here you would typically fetch from an API
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    sessions: state.sessions,
    messages: state.messages,
    activeSessions: state.activeSessions,
    selectedSession: state.selectedSession,
    loading: state.loading,
    n8nConnected: state.n8nConnected,
    currentUser: state.currentUser,
    createSession,
    selectSession,
    closeSession,
    updateSession,
    addMessage,
    getSessionMessages,
    markAsRead,
    setN8nConnected,
    setCurrentUser,
    getTotalUnreadCount,
    getActiveSessionsCount,
    refreshSessions,
    setLoading
  }), [
    state, createSession, selectSession, closeSession, updateSession, addMessage,
    getSessionMessages, markAsRead, setN8nConnected, setCurrentUser, getTotalUnreadCount,
    getActiveSessionsCount, refreshSessions, setLoading
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
