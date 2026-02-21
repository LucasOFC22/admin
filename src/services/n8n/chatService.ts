
// N8N Chat Service - implementation with proper exports

export interface ChatSession {
  id: string;
  name?: string;
  userName?: string;
  email?: string;
  userEmail?: string;
  phone?: string;
  userPhone?: string;
  telefone?: string;
  status: 'nova' | 'em_atendimento' | 'aguardando' | 'resolvida' | 'active' | 'waiting' | 'closed' | 'escalated';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  lastMessage?: string;
  lastActivity?: any;
  siteOrigem?: string;
  createdAt?: any;
  updatedAt?: any;
  assignedAgent?: string;
  assignedAgentName?: string;
  assignedAt?: any;
  resolvedAt?: any;
  transferHistory?: TransferHistory[];
  tags?: string[];
  satisfaction?: Satisfaction;
  clienteInfo?: ClienteInfo;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'admin' | 'bot';
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  jobTitle?: string;
  timestamp: any;
  sessionId?: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  usage?: number;
}

export interface TransferHistory {
  fromAgent: string;
  toAgent: string;
  reason: string;
  timestamp: any;
}

export interface ClienteInfo {
  ip?: string;
  localizacao?: string;
  deviceInfo?: string;
  browserInfo?: string;
}

export interface Satisfaction {
  rating: number;
  feedback?: string;
  timestamp: any;
}

export const ChatService = {
  sendMessage: async (sessionId: string, messageData: any) => {
    return Promise.resolve({ id: 'mock-message-id' });
  },
  
  getMessages: async (sessionId: string) => {
    return Promise.resolve([]);
  },
  
  listenToChatMessages: (sessionId: string, callback: (messages: ChatMessage[]) => void) => {
    callback([]);
    return () => {};
  },

  listenToChatSessions: (callback: (sessions: ChatSession[]) => void) => {
    callback([]);
    return () => {};
  },

  submitSatisfactionRating: async (sessionId: string, rating: number, feedback: string) => {
    return Promise.resolve();
  },

  transferToAgent: async (sessionId: string, agentId: string) => {
    return Promise.resolve();
  },

  transferSession: async (sessionId: string, fromAgent: string, toAgent: string, toAgentName: string, reason: string) => {
    return Promise.resolve();
  },

  updateSessionStatus: async (sessionId: string, status: ChatSession['status']) => {
    return Promise.resolve();
  },

  markMessagesAsRead: async (sessionId: string) => {
    return Promise.resolve();
  },

  getSessions: async () => {
    return Promise.resolve([]);
  },

  getMessageTemplates: async () => {
    return Promise.resolve([]);
  },

  createMessageTemplate: async (template: Omit<MessageTemplate, 'id'>) => {
    return Promise.resolve({ id: 'mock-template-id', ...template });
  },

  useTemplate: async (templateId: string, sessionId: string) => {
    return Promise.resolve();
  }
};

// Export for compatibility
export const n8nChatService = ChatService;
