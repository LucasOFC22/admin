export interface ErrorLog {
  id?: number;
  titulo: string;
  descricao: string;
  categoria: string;
  pagina: string;
  nivel: 'info' | 'warning' | 'error' | 'critical';
  data_ocorrencia: string;
  dados_extra?: Record<string, any>;
  resolvido: boolean;
  resolvido_em?: string;
  criado_em: string;
}
