// ==================== DRE Types ====================

export interface DRELancamento {
  id: string;
  data: string;
  tipo: 'RECEITA' | 'DESPESA';
  conta: string;
  nome: string;
  cpfCnpj: string;
  documento: string;
  banco: string;
  valor: number;
  classe: string;
}

export interface DRESummary {
  totalReceitas: number;
  totalDespesas: number;
  qtdReceitas: number;
  qtdDespesas: number;
  resultado: number;
  margem: number;
}

export interface DREFiltros {
  empresas?: number[];  // Array de IDs das empresas
  regime?: 'caixa' | 'competencia-titulos' | 'competencia-cte';
  dataInicial: string;
  dataFinal: string;
}

export interface DREResponse {
  success: boolean;
  lancamentos: DRELancamento[];
  resumo: DRESummary;
  error?: string;
}

// ==================== Calendário Financeiro Types ====================

export interface CalendarioFiltros {
  empresa?: string;
  status?: 'todos' | 'aberto' | 'liquidado' | 'atrasado';
  contrato?: string;
  dataEmissaoInicio?: string;
  dataEmissaoFim?: string;
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  dataPagamentoInicio?: string;
  dataPagamentoFim?: string;
  mes?: number;
  ano?: number;
  modoVisualizacao?: 'titulos' | 'pagamentos';
}

export interface DayData {
  date: string;
  receitas: number;
  receitasRecebidas: number;
  despesas: number;
  despesasPagas: number;
}

export interface DayDetailItem {
  id: string;
  cliente: string;
  cpfCnpj: string;
  documento: string;
  valor: number;
  status: 'aberto' | 'atrasado' | 'liquidado';
  tipo: 'receita' | 'despesa';
  dataVencimento?: string;
  dataPagamento?: string;
}

export interface FinancialSummary {
  totalReceitas: number;
  receitasRecebidas: number;
  receitasAReceber: number;
  totalDespesas: number;
  despesasPagas: number;
  despesasAPagar: number;
}

export interface CalendarioFinanceiroResponse {
  success: boolean;
  dias: DayData[];
  resumo: FinancialSummary;
  items?: DayDetailItem[];
  error?: string;
}

export interface DetalheDiaResponse {
  success: boolean;
  items: DayDetailItem[];
  error?: string;
}
