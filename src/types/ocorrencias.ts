export type TipoOcorrencia = 
  | 'atraso_entrega'
  | 'extravio'
  | 'mercadoria_danificada'
  | 'problema_documentacao'
  | 'outros';

export type StatusOcorrencia = 'pendente' | 'em_analise' | 'resolvido' | 'cancelado';

export interface Ocorrencia {
  id: string;
  usuario_id: string;
  tipo_ocorrencia: TipoOcorrencia;
  email_resposta: string;
  descricao?: string;
  numero_cte?: string;
  numero_nfe?: string;
  cpf_cnpj?: string;
  endereco_entrega?: string;
  nome_recebedor?: string;
  saiu_entrega?: string;
  dano_descricao?: string;
  fotos?: string[]; // Array de URLs das fotos
  documento_relacionado?: string;
  problema_documento?: string;
  status: StatusOcorrencia;
  criado_em?: string;
  atualizado_em?: string;
  responsavel?: string;
  resumo?: string;
  conteudo_mercadoria?: string;
  // Dados do contato (join)
  contato?: {
    nome: string;
    telefone: string;
  };
}

export interface OcorrenciaHistorico {
  id: string;
  ocorrencia_id: string;
  usuario_id: number;
  acao: string;
  campo_alterado?: string;
  valor_anterior?: string;
  valor_novo?: string;
  created_at: string;
  usuario?: { nome: string; email: string };
}

export const TIPO_OCORRENCIA_LABELS: Record<TipoOcorrencia, string> = {
  atraso_entrega: 'Atraso na Entrega',
  extravio: 'Extravio / Mercadoria não localizada',
  mercadoria_danificada: 'Mercadoria Danificada',
  problema_documentacao: 'Problema com Documentação',
  outros: 'Outros'
};

export const STATUS_OCORRENCIA_LABELS: Record<StatusOcorrencia, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  resolvido: 'Resolvido',
  cancelado: 'Cancelado'
};

export const CAMPOS_OBRIGATORIOS: Record<TipoOcorrencia, string[]> = {
  atraso_entrega: ['numero_nfe', 'cpf_cnpj', 'nome_recebedor', 'endereco_entrega', 'resumo', 'email_resposta'],
  extravio: ['numero_cte', 'cpf_cnpj', 'conteudo_mercadoria', 'email_resposta', 'resumo', 'responsavel'],
  mercadoria_danificada: ['numero_cte', 'fotos', 'nome_recebedor', 'email_resposta', 'dano_descricao', 'resumo', 'responsavel'],
  problema_documentacao: ['email_resposta', 'documento_relacionado', 'problema_documento', 'responsavel'],
  outros: ['email_resposta', 'resumo', 'responsavel']
};

export const LABELS_CAMPOS: Record<string, string> = {
  numero_nfe: 'Número NF-e',
  numero_cte: 'Número CT-e',
  cpf_cnpj: 'CPF/CNPJ',
  endereco_entrega: 'Endereço de Entrega',
  nome_recebedor: 'Responsável pelo Recebimento',
  resumo: 'Resumo',
  email_resposta: 'E-mail para Resposta',
  conteudo_mercadoria: 'Conteúdo da Mercadoria',
  fotos: 'Fotos',
  dano_descricao: 'Descrição do Dano',
  documento_relacionado: 'Documento Relacionado',
  problema_documento: 'Problema no Documento',
  descricao: 'Descrição',
  status: 'Status',
  responsavel: 'Responsável'
};
