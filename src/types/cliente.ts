/**
 * Types for Cliente (Customer) entities
 */

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cnpjcpf?: string;
  senha?: string;
  ativo: boolean;
  empresa?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClienteFormData {
  nome: string;
  email: string;
  telefone?: string;
  cnpjcpf?: string;
  senha?: string;
  ativo: boolean;
}

export interface ClienteCreateInput extends Omit<ClienteFormData, 'ativo'> {
  ativo?: boolean;
}

export interface ClienteUpdateInput extends Partial<Omit<ClienteFormData, 'email'>> {
  id: string;
}

/**
 * Type guard to check if value is a valid Cliente
 */
export function isCliente(value: unknown): value is Cliente {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'nome' in value &&
    'email' in value
  );
}
