
export interface LogFilters {
  usuario_id?: string; // UUID
  modulo?: string;
  acao?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ActivityLog {
  id: string;
  usuario_id: string; // UUID
  acao: string;
  modulo?: string;
  detalhes: any; // jsonb
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  usuario?: {
    nome: string;
    email: string;
  };
}
