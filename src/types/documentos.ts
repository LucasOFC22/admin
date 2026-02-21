// Tipos para o sistema de documentos (simplificado)

export type DocumentoTipo = 
  | 'contrato'
  | 'manual'
  | 'formulario'
  | 'relatorio'
  | 'outros';

export type DocumentoCategoria = 
  | 'financeiro'
  | 'operacional'
  | 'administrativo'
  | 'comercial'
  | 'outros';

export const DOCUMENTO_TIPO_LABELS: Record<DocumentoTipo, string> = {
  contrato: 'Contrato',
  manual: 'Manual',
  formulario: 'Formulário',
  relatorio: 'Relatório',
  outros: 'Outros'
};

export const DOCUMENTO_CATEGORIA_LABELS: Record<DocumentoCategoria, string> = {
  financeiro: 'Financeiro',
  operacional: 'Operacional',
  administrativo: 'Administrativo',
  comercial: 'Comercial',
  outros: 'Outros'
};

export interface DocumentoRepositorio {
  id: string;
  titulo: string;
  descricao: string | null;
  instrucoes: string | null;
  nome_arquivo: string;
  storage_path: string;
  mime_type: string | null;
  tamanho_bytes: number | null;
  ativo: boolean;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  // Relacionamentos opcionais
  criador?: {
    id: string;
    nome: string;
  };
  downloads_count?: number;
}

export interface DocumentoDownload {
  id: string;
  documento_id: string;
  usuario_id: string | null;
  cnpj_cpf: string | null;
  ip_address: string | null;
  user_agent: string | null;
  baixado_em: string;
  documento?: DocumentoRepositorio;
  usuario?: {
    id: string;
    nome: string;
  };
}

export interface CreateDocumentoData {
  titulo: string;
  descricao?: string;
  instrucoes?: string;
  nome_arquivo: string;
  storage_path: string;
  mime_type?: string;
  tamanho_bytes?: number;
  ativo?: boolean;
}

export interface UpdateDocumentoData {
  titulo?: string;
  descricao?: string;
  instrucoes?: string;
  ativo?: boolean;
}

export interface DocumentoFilters {
  ativo?: boolean;
  search?: string;
}
