// Tipos para o sistema de contatos por conta de email

export interface EmailContato {
  id: string;
  email_conta_id: string;
  nome: string;
  email: string;
  telefone?: string;
  created_at: string;
  updated_at: string;
  // Grupos (via join)
  grupos?: EmailContatoGrupo[];
}

export interface EmailContatoGrupo {
  id: string;
  email_conta_id: string;
  nome: string;
  cor: string;
  created_at: string;
  updated_at: string;
}

export interface EmailContatoGrupoMembro {
  id: string;
  contato_id: string;
  grupo_id: string;
  created_at: string;
}

export interface EmailContatoFormData {
  nome: string;
  email: string;
  telefone?: string;
  grupos?: string[]; // IDs dos grupos
}

export interface EmailContatoGrupoFormData {
  nome: string;
  cor?: string;
}

export interface AutocompleteContact {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
}
