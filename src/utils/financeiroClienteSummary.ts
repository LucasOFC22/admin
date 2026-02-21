/**
 * Helper compartilhado para normalizar e calcular resumos financeiros
 * Garante que área cliente e admin usem a mesma lógica de cálculo
 * Baseado no padrão de /admin/contas-receber
 */

export interface TituloFinanceiro {
  valorTitulo?: number;
  vlrTitulo?: number;
  valor?: number;
  saldo?: number;
  valorPago?: number;
  vlrPago?: number;
  status?: string;
  pago?: string;
  [key: string]: any;
}

export interface FinanceiroSummary {
  valorTotal: number;
  valorPago: number;
  valorEmAberto: number;
  valorAtrasado: number;
  qtdTitulos: number;
  qtdAtrasados: number;
  qtdEmAberto: number;
}

/**
 * Extrai o valor do título (prioridade: saldo > valorTitulo > vlrTitulo > valor)
 * Mesma lógica do admin/contas-receber
 */
function getValorTitulo(titulo: TituloFinanceiro): number {
  const val = titulo.saldo ?? titulo.valorTitulo ?? titulo.vlrTitulo ?? titulo.valor ?? 0;
  return typeof val === 'string' ? parseFloat(val) || 0 : Number(val) || 0;
}

/**
 * Extrai o valor pago de um título
 */
function getValorPago(titulo: TituloFinanceiro): number {
  const val = titulo.valorPago ?? titulo.vlrPago ?? 0;
  return typeof val === 'string' ? parseFloat(val) || 0 : Number(val) || 0;
}

/**
 * Verifica se o status indica título atrasado (case-insensitive)
 */
function isAtrasado(titulo: TituloFinanceiro): boolean {
  const status = (titulo.status || '').toString().toLowerCase().trim();
  return status === 'atrasado' || status === 'vencido';
}

/**
 * Verifica se o título está em aberto/pendente (case-insensitive)
 */
function isEmAberto(titulo: TituloFinanceiro): boolean {
  const status = (titulo.status || '').toString().toLowerCase().trim();
  const pago = (titulo.pago || '').toString().toUpperCase().trim();
  
  return (
    status === 'pendente' || 
    status === 'aberto' || 
    status === 'em aberto' || 
    status === 'open' ||
    pago === 'N'
  );
}

/**
 * Verifica se o título está liquidado/pago (case-insensitive)
 */
function isLiquidado(titulo: TituloFinanceiro): boolean {
  const status = (titulo.status || '').toString().toLowerCase().trim();
  return status === 'liquidado' || status === 'pago';
}

/**
 * Calcula o resumo financeiro usando a mesma lógica do admin/contas-receber
 * 
 * Fórmulas (alinhadas com ContasReceber.tsx):
 * - valorTotal: soma de (saldo ?? valorTitulo) de todos os títulos
 * - valorPago: soma de valorPago dos títulos liquidados
 * - valorEmAberto: soma de (saldo ?? valorTitulo) dos títulos pendentes/abertos + atrasados
 * - valorAtrasado: soma de (saldo ?? valorTitulo) dos títulos atrasados
 */
export function calcFinanceiroSummary(titulos: TituloFinanceiro[]): FinanceiroSummary {
  let valorTotal = 0;
  let valorPago = 0;
  let valorAtrasado = 0;
  let valorEmAbertoPuro = 0;
  let qtdAtrasados = 0;
  let qtdEmAbertoPuro = 0;

  for (const titulo of titulos) {
    const valor = getValorTitulo(titulo);
    const pago = getValorPago(titulo);

    valorTotal += valor;

    if (isLiquidado(titulo)) {
      valorPago += pago;
    } else if (isAtrasado(titulo)) {
      valorAtrasado += valor;
      qtdAtrasados++;
    } else if (isEmAberto(titulo)) {
      valorEmAbertoPuro += valor;
      qtdEmAbertoPuro++;
    }
  }

  // Valor em Aberto inclui pendentes + atrasados (mesma lógica do admin)
  const valorEmAberto = valorEmAbertoPuro + valorAtrasado;
  const qtdEmAberto = qtdEmAbertoPuro + qtdAtrasados;

  return {
    valorTotal,
    valorPago,
    valorEmAberto,
    valorAtrasado,
    qtdTitulos: titulos.length,
    qtdAtrasados,
    qtdEmAberto
  };
}

/**
 * Filtra apenas títulos em aberto (não liquidados)
 */
export function filtrarTitulosEmAberto(titulos: TituloFinanceiro[]): TituloFinanceiro[] {
  return titulos.filter(t => isEmAberto(t) || isAtrasado(t));
}

/**
 * Filtra apenas títulos atrasados
 */
export function filtrarTitulosAtrasados(titulos: TituloFinanceiro[]): TituloFinanceiro[] {
  return titulos.filter(t => isAtrasado(t));
}
