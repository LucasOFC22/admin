/**
 * Form-related types
 * Shared types for form data and validation
 */

import { CargoComDepartamento } from './database';

/**
 * Cargo form data
 */
export interface CargoFormData {
  nome: string;
  descricao?: string;
  departamento: number | null;
  permissoes: string[];
  level?: number;
  ativo: boolean;
  filas?: number[];
}

/**
 * User form data
 */
export interface UserFormData {
  nome: string;
  email: string;
  cargo: number;
  telefone?: string;
  ativo: boolean;
  acesso_area_cliente: boolean;
  acesso_area_admin: boolean;
}

/**
 * Cargo modal props
 */
export interface CargoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cargo?: CargoComDepartamento | null;
  onSave: (cargoData: CargoFormData) => Promise<void>;
}

/**
 * Delete confirmation props
 */
export interface DeleteModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: T | null;
  onConfirm: (id: number) => Promise<void>;
}

/**
 * Form validation errors
 */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Department data
 */
export interface DepartmentData {
  id: number;
  nome: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Quote form data (placeholder - to be expanded)
 */
export interface QuoteFormData {
  origem: string;
  destino: string;
  peso?: number;
  valorDeclarado?: number;
  tipoFrete?: string;
  necessitaColeta?: boolean;
  observacoes?: string;
}

/**
 * Contact form data
 */
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  department?: string;
}

/**
 * Proposal form data
 */
export interface ProposalFormData {
  quoteId: number | string;
  valor: number;
  prazoEntrega: string;
  validade: string;
  detalhes?: string;
  responsavel?: string;
}
