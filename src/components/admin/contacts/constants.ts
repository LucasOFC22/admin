
import { AlertCircle, CheckCircle, Clock, Archive } from 'lucide-react';

export const STATUS_OPTIONS = [
  {
    value: 'novo',
    label: 'Novo',
    icon: AlertCircle
  },
  {
    value: 'em_andamento',
    label: 'Em Andamento',
    icon: Clock
  },
  {
    value: 'respondido',
    label: 'Respondido',
    icon: CheckCircle
  },
  {
    value: 'fechado',
    label: 'Fechado',
    icon: Archive
  }
];

export const DEPARTMENT_OPTIONS = [
  { value: 'geral', label: 'Geral' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'financeiro', label: 'Financeiro' }
];

export const DEPARTMENTS = DEPARTMENT_OPTIONS;

export const LOCATION_OPTIONS = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
  { value: 'outros', label: 'Outros' }
];
