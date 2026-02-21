
import { n8nApi } from './apiService';

interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  sender: 'user' | 'agent' | 'bot' | 'admin';
  senderName?: string;
  senderEmail?: string;
  timestamp: string;
  isRead?: boolean;
}

interface ChatSession {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  status: 'active' | 'waiting' | 'closed';
  startedAt: string;
  lastActivity: string;
  lastMessage?: string;
  unreadCount: number;
}

export class N8nChatService {
  private static validSessionCache = new Set<string>();
  private static invalidSessionCache = new Set<string>();

  static isValidSessionId(sessionId: string): boolean {
    if (!sessionId || sessionId === 'undefined' || sessionId.includes('undefined')) {
      return false;
    }
    
    // Verificar cache de sessões inválidas
    if (this.invalidSessionCache.has(sessionId)) {
      return false;
    }
    
    // Verificar cache de sessões válidas
    if (this.validSessionCache.has(sessionId)) {
      return true;
    }
    
    return true; // Permitir tentativa se não estiver em cache
  }

  static markSessionAsValid(sessionId: string): void {
    this.validSessionCache.add(sessionId);
    this.invalidSessionCache.delete(sessionId);
  }

  static markSessionAsInvalid(sessionId: string): void {
    this.invalidSessionCache.add(sessionId);
    this.validSessionCache.delete(sessionId);
  }

  static async sendMessage(messageData: {
    sessionId: string;
    content: string;
    sender: 'user' | 'agent' | 'bot' | 'admin';
    senderName?: string;
    senderEmail?: string;
  }): Promise<boolean> {
    if (!this.isValidSessionId(messageData.sessionId)) {
      return false;
    }

    try {
      const payload = {
        eventType: "chat_mensagem",
        acao: "enviar_mensagem",
        dados: {
          session_id: messageData.sessionId,
          conteudo: messageData.content,
          remetente: messageData.sender,
          nome_remetente: messageData.senderName || '',
          email_remetente: messageData.senderEmail || '',
          timestamp: new Date().toISOString()
        },
        origem: "fp_transportes_chat_sistema"
      };

      const response = await n8nApi.makeN8nRequest(payload, false);

      if (response.success) {
        this.markSessionAsValid(messageData.sessionId);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  static async getMessages(sessionId: string): Promise<ChatMessage[]> {
    if (!this.isValidSessionId(sessionId)) {
      this.markSessionAsInvalid(sessionId);
      return [];
    }

    try {
      const payload = {
        eventType: "chat_mensagem",
        acao: "buscar_mensagens",
        dados: {
          session_id: sessionId
        },
        origem: "fp_transportes_chat_sistema"
      };

      const response = await n8nApi.makeN8nRequest(payload, false);

      if (response.success) {
        const data = response.data as any;
        
        if (data && data.success && Array.isArray(data.messages)) {
          this.markSessionAsValid(sessionId);
          return data.messages.map((msg: any) => ({
            id: msg.id || Date.now().toString(),
            sessionId: sessionId,
            content: msg.conteudo || msg.content,
            sender: msg.remetente || msg.sender,
            senderName: msg.nome_remetente || msg.senderName,
            senderEmail: msg.email_remetente || msg.senderEmail,
            timestamp: msg.timestamp,
            isRead: msg.lido || msg.isRead || false
          }));
        } else {
          this.markSessionAsValid(sessionId); // Sessão válida, mas sem mensagens
        }
      } else {
        this.markSessionAsInvalid(sessionId);
      }
      
      return [];
    } catch (error) {
      this.markSessionAsInvalid(sessionId);
      return [];
    }
  }

  static async getSessions(): Promise<ChatSession[]> {
    try {
      const payload = {
        eventType: "chat_sessao",
        acao: "buscar_sessoes",
        dados: {},
        origem: "fp_transportes_chat_sistema"
      };

      const response = await n8nApi.makeN8nRequest(payload, false);

      if (response.success) {
        const data = response.data as any;
        
        if (data && data.success && Array.isArray(data.sessions)) {
          return data.sessions.map((session: any) => ({
            id: session.id,
            userId: session.user_id || session.userId,
            userName: session.user_name || session.userName || 'Usuário',
            userEmail: session.user_email || session.userEmail,
            status: session.status || 'active',
            startedAt: session.started_at || session.startedAt,
            lastActivity: session.last_activity || session.lastActivity,
            lastMessage: session.last_message || session.lastMessage,
            unreadCount: session.unread_count || session.unreadCount || 0
          }));
        }
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }

  static async updateSessionStatus(sessionId: string, status: 'active' | 'waiting' | 'closed'): Promise<boolean> {
    if (!this.isValidSessionId(sessionId)) {
      return false;
    }

    try {
      const payload = {
        eventType: "chat_sessao",
        acao: "atualizar_status",
        dados: {
          session_id: sessionId,
          status: status
        },
        origem: "fp_transportes_chat_sistema"
      };

      const response = await n8nApi.makeN8nRequest(payload, false);
      
      if (response.success) {
        this.markSessionAsValid(sessionId);
      }
      
      return response.success;
    } catch (error) {
      return false;
    }
  }

  static clearCaches(): void {
    this.validSessionCache.clear();
    this.invalidSessionCache.clear();
  }
}
