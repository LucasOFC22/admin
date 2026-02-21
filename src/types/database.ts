// Tipos baseados nos esquemas das tabelas Supabase

import { CnpjCpfData } from './cnpjcpf';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cnpjcpf?: CnpjCpfData | string[]; // Objeto JSONB { cnpjcpf: string[], cnpjcpf_atual: string } ou array legado
  cargo: number;
  acesso_area_cliente?: boolean;
  ativo?: boolean;
  supabase_id?: string;
  data_criacao?: string;
  data_ultima_atividade?: string;
  atualizado_em?: string;
  acesso_area_admin?: boolean;
  nivel_hierarquico?: number; // Nível hierárquico (1-10)
  filas?: number[]; // IDs das filas de WhatsApp vinculadas ao usuário
  tags?: number[]; // IDs das tags vinculadas ao usuário
}

export interface Cargo {
  id: number;
  nome: string;
  permissoes?: string[];
  pode_excluir?: boolean;
  created_at?: string;
  updated_at?: string;
  level?: number;
  descricao?: string;
  departamento?: number;
  ativo?: boolean;
}

export interface CargosDepartamento {
  id: number;
  nome: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Tipo para cargo com informações de departamento
export interface CargoComDepartamento extends Cargo {
  departamento_info?: CargosDepartamento;
  userCount?: number; // Contador de usuários vinculados (usado em views)
}

// Tipos para formulários (sem campos auto-gerados)
export interface CreateUsuarioData {
  nome: string;
  email: string;
  telefone?: string;
  cnpjcpf?: CnpjCpfData | string[]; // Objeto JSONB ou array legado
  cargo: number;
  acesso_area_cliente?: boolean;
  ativo?: boolean;
  acesso_area_admin?: boolean;
  nivel_hierarquico?: number; // Nível hierárquico (1-10)
  filas?: number[]; // IDs das filas de WhatsApp
  tags?: number[]; // IDs das tags
}

export interface UpdateUsuarioData extends Partial<CreateUsuarioData> {
  data_ultima_atividade?: string;
  updated_at?: string;
}

export interface CreateCargoData {
  nome: string;
  permissoes?: string[];
  pode_excluir?: boolean;
  level?: number;
  descricao?: string;
  departamento?: number;
  ativo?: boolean;
}

export interface UpdateCargoData extends Partial<CreateCargoData> {
  updated_at?: string;
}

// Solicitações de Documentos
export interface SolicitacaoDocumento {
  id: string;
  usuario_id: string;
  tipo_documento: 'comprovante_entrega' | 'cte' | 'boleto';
  numero_cte?: string;
  numero_nfe?: string;
  cpf_cnpj?: string;
  email_resposta: string;
  origem: 'whatsapp' | 'site';
  status: 'pendente' | 'em_processamento' | 'finalizado' | 'erro';
  criado_em?: string;
  atualizado_em?: string;
}

export interface CreateSolicitacaoDocumentoData {
  usuario_id: string;
  tipo_documento: 'comprovante_entrega' | 'cte' | 'boleto';
  numero_cte?: string;
  numero_nfe?: string;
  cpf_cnpj?: string;
  email_resposta: string;
  origem?: 'whatsapp' | 'site';
  status?: 'pendente' | 'em_processamento' | 'finalizado' | 'erro';
}

export interface UpdateSolicitacaoDocumentoData extends Partial<CreateSolicitacaoDocumentoData> {
  status?: 'pendente' | 'em_processamento' | 'finalizado' | 'erro';
  atualizado_em?: string;
}