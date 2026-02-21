/**
 * Helper compartilhado para normalizar e calcular resumos de Contas a Receber
 * Garante que /admin e /admin/contas-receber usem a mesma lógica
 */

export interface ContaReceber {
  id?: string | number;
  status?: string;
  saldo?: number | string;
  valorTitulo?: number | string;
  vlrTitulo?: number | string;
  valor?: number | string;
  vlrPago?: number | string;
  valorPago?: number | string;
  dataVencimento?: string;
  [key: string]: any;
}

export interface ContasReceberSummary {
  valorTotal: number;
  valorPago: number;
  valorEmAberto: number;
  valorAtrasado: number;
  qtdAtrasados: number;
  totalContas: number;
}

/**
 * Normaliza a resposta da API de contas a receber para um array de contas
 * Suporta múltiplos formatos de resposta do N8N/Proxy
 */
export function normalizeContasReceberResponse(responseData: any): ContaReceber[] {
  if (!responseData) return [];

  // Caso 1: Array direto de contas
  if (Array.isArray(responseData)) {
    // Verifica se é wrapper [{success, data: [...]}]
    if (responseData.length === 1 && responseData[0]?.data && Array.isArray(responseData[0].data)) {
      return responseData[0].data;
    }
    // Array direto de contas
    return responseData;
  }

  // Caso 2: Objeto com .data sendo array
  if (responseData.data && Array.isArray(responseData.data)) {
    return responseData.data;
  }

  // Caso 3: Objeto com .data.data (nested)
  if (responseData.data?.data && Array.isArray(responseData.data.data)) {
    return responseData.data.data;
  }

  // Caso 4: Objeto com .titulos
  if (responseData.titulos && Array.isArray(responseData.titulos)) {
    return responseData.titulos;
  }

  console.warn('[normalizeContasReceberResponse] Formato não reconhecido:', {
    type: typeof responseData,
    keys: Object.keys(responseData || {}),
    isArray: Array.isArray(responseData)
  });

  return [];
}

/**
 * Extrai o valor numérico de um título (saldo ou valorTitulo)
 * Usa a mesma prioridade do ContasReceber.tsx
 */
function getValorTitulo(conta: ContaReceber): number {
  // Prioridade: saldo > valorTitulo > vlrTitulo > valor
  const val = conta.saldo ?? conta.valorTitulo ?? conta.vlrTitulo ?? conta.valor ?? 0;
  return typeof val === 'string' ? parseFloat(val) || 0 : Number(val) || 0;
}

/**
 * Extrai o valor pago de um título
 */
function getValorPago(conta: ContaReceber): number {
  const val = conta.vlrPago ?? conta.valorPago ?? 0;
  return typeof val === 'string' ? parseFloat(val) || 0 : Number(val) || 0;
}

/**
 * Verifica se o título está atrasado (case-insensitive)
 */
function isAtrasado(conta: ContaReceber): boolean {
  const status = (conta.status || '').toString().toLowerCase().trim();
  return status === 'atrasado';
}

/**
 * Verifica se o título está pendente/aberto (case-insensitive)
 */
function isPendenteOuAberto(conta: ContaReceber): boolean {
  const status = (conta.status || '').toString().toLowerCase().trim();
  return status === 'pendente' || status === 'aberto' || status === 'open';
}

/**
 * Calcula o resumo de contas a receber
 * Usa EXATAMENTE a mesma lógica do ContasReceber.tsx
 */
export function calcContasReceberSummary(contas: ContaReceber[]): ContasReceberSummary {
  let valorTotal = 0;
  let valorPago = 0;
  let valorAtrasado = 0;
  let qtdAtrasados = 0;

  for (const conta of contas) {
    const valor = getValorTitulo(conta);
    const pago = getValorPago(conta);

    valorTotal += valor;
    valorPago += pago;

    if (isAtrasado(conta)) {
      valorAtrasado += valor;
      qtdAtrasados++;
    }
  }

  // Valor em Aberto = Total - Pago (mesma fórmula do ContasReceber.tsx)
  const valorEmAberto = valorTotal - valorPago;

  return {
    valorTotal,
    valorPago,
    valorEmAberto,
    valorAtrasado,
    qtdAtrasados,
    totalContas: contas.length
  };
}
