
export interface Contato {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  subject: string;
  message: string;
  location?: string;
  status: 'novo' | 'em_andamento' | 'respondido' | 'fechado';
  source: 'n8n' | 'supabase';
  referenceId?: string;
  createdAt: string;
  updatedAt?: string;
  respondedAt?: string;
  respondedBy?: string;
  // Aliases for compatibility
  nome?: string;
  telefone?: string;
  assunto?: string;
  mensagem?: string;
}
