// Tipos para o sistema de threading do backend

export interface ThreadParticipant {
  name: string;
  email: string;
  isMe: boolean;
}

export interface BackendEmailThread {
  thread_id: string;
  emails: BackendFormattedEmail[];
  participants: ThreadParticipant[];
  subject: string;
  last_date: string;
  unread: boolean;
  starred: boolean;
  has_attachments: boolean;
  message_count: number;
}

export interface BackendFormattedEmail {
  id: string;
  uid: string;
  message_id: string;
  de: string;
  de_nome: string;
  para: string[];
  cc: string[];
  assunto: string;
  data: string;
  lido: boolean;
  starred: boolean;
  pasta: string;
  references: string[];
  in_reply_to: string;
  preview?: string;
  corpo?: string;
  origem?: 'imap' | 'local';
}

export interface ThreadPagination {
  page: number;
  total_threads: number;
  total_pages: number;
  threads_per_page: number;
}

export interface ThreadsResponse {
  success: boolean;
  threads: BackendEmailThread[];
  pagination: ThreadPagination;
  pasta: string;
  error?: string;
}
