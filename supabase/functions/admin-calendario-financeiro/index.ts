import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Endpoints DB Frete ---
const DBFRETE = {
  FINANCEIRO_RECEBER: "https://dbfreteapi.dyndns-web.com/tms/financeiro/receber",
  FINANCEIRO_PAGAR: "https://dbfreteapi.dyndns-web.com/tms/financeiro/pagar",
  FINANCEIRO_PAGAMENTOS: "https://dbfreteapi.dyndns-web.com/tms/financeiro/pagamentoRecebimento",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

interface CalendarioFiltros {
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
}

interface DayData {
  date: string;
  receitas: number;
  receitasRecebidas: number;
  despesas: number;
  despesasPagas: number;
}

interface DayDetailItem {
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

interface FinancialSummary {
  totalReceitas: number;
  receitasRecebidas: number;
  receitasAReceber: number;
  totalDespesas: number;
  despesasPagas: number;
  despesasAPagar: number;
  qtdReceitas: number;
  qtdDespesas: number;
}

// --- Obter token vÃÂÃÂÃÂÃÂ¡lido da tabela dbfrete_token ---
async function getToken(): Promise<string> {
  const { data: registro, error } = await supabase
    .from("dbfrete_token")
    .select("*")
    .single();

  if (error || !registro) {
    console.error('[admin-calendario-financeiro] Erro ao buscar token:', error);
    throw new Error("Registro de token DB Frete nÃÂÃÂÃÂÃÂ£o encontrado");
  }

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  // Se token expirou ou nÃÂÃÂÃÂÃÂ£o existe (expira em 1 hora)
  if (!registro.token || agora.getTime() - atualizadoEm.getTime() > 60 * 60 * 1000) {
    console.log('[admin-calendario-financeiro] Token expirado, renovando...');
    
    const response = await fetch(DBFRETE.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: registro.usuario,
        senha: registro.senha,
        id_cliente: registro.id_cliente,
      }),
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[admin-calendario-financeiro] Resposta invÃÂÃÂÃÂÃÂ¡lida ao renovar token:', text);
      throw new Error("Resposta inesperada ao renovar token (nÃÂÃÂÃÂÃÂ£o ÃÂÃÂÃÂÃÂ© JSON)");
    }

    if (!data.token) throw new Error("NÃÂÃÂÃÂÃÂ£o foi possÃÂÃÂÃÂÃÂ­vel renovar token DB Frete");

    await supabase
      .from("dbfrete_token")
      .update({
        token: data.token,
        empresas: data.usuario?.empresas || [],
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", registro.id);

    console.log('[admin-calendario-financeiro] Token renovado com sucesso');
    return data.token;
  }

  return registro.token;
}

// FunÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ£o para buscar dados da API DB Frete
async function fetchDBFrete(endpoint: string, params: Record<string, any>, token: string) {
  const url = new URL(endpoint);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  console.log(`[admin-calendario-financeiro] Buscando: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[admin-calendario-financeiro] Erro DB Frete: ${response.status} - ${errorText}`);
    throw new Error(`Erro ao buscar dados: ${response.status}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('[admin-calendario-financeiro] Resposta nÃÂÃÂÃÂÃÂ£o ÃÂÃÂÃÂÃÂ© JSON:', text);
    return [];
  }
}

// Determinar status do tÃÂÃÂÃÂÃÂ­tulo de RECEITA (pago === "S")
function determineReceitaStatus(item: any): 'aberto' | 'atrasado' | 'liquidado' {
  // DB Frete usa pago === "S" para receitas liquidadas
  if (item.pago === "S" || item.pago === "s") {
    return 'liquidado';
  }
  
  const vencimento = item.dataVencimento || item.dtVencimento;
  if (vencimento) {
    const hoje = new Date();
    const dtVenc = new Date(vencimento);
    if (dtVenc < hoje) {
      return 'atrasado';
    }
  }
  
  return 'aberto';
}

// Determinar status do tÃÂÃÂÃÂÃÂ­tulo de DESPESA (statusTitulo === "Liquidado")
function determineDespesaStatus(item: any): 'aberto' | 'atrasado' | 'liquidado' {
  // DB Frete usa statusTitulo === "Liquidado" para despesas liquidadas
  if (item.statusTitulo === "Liquidado" || item.statusTitulo === "liquidado") {
    return 'liquidado';
  }
  
  const vencimento = item.dataVencimento || item.dtVencimento;
  if (vencimento) {
    const hoje = new Date();
    const dtVenc = new Date(vencimento);
    if (dtVenc < hoje) {
      return 'atrasado';
    }
  }
  
  return 'aberto';
}

// Normalizar item de receita - DB Frete usa valorTitulo para receitas
function normalizeReceitaItem(item: any): DayDetailItem {
  const status = determineReceitaStatus(item);
  // Para receitas liquidadas, usar valorPago; caso contrÃÂÃÂÃÂÃÂ¡rio, valorTitulo
  const valor = status === 'liquidado' 
    ? Number(item.valorPago || item.valorTitulo || 0)
    : Number(item.valorTitulo || 0);
  
  return {
    id: String(item.doc || item.idTitulo || ''),
    cliente: item.nomeCliente || item.cliente || item.nome || '',
    cpfCnpj: item.cpfCnpj || item.cnpjCpf || '',
    documento: String(item.nroDocumento || item.documento || item.nroCte || ''),
    valor,
    status,
    tipo: 'receita',
    dataVencimento: item.dataVencimento || item.dtVencimento || '',
    dataPagamento: item.dataPagamento || item.dtPagamento || '',
  };
}

// Normalizar item de despesa - DB Frete usa valor para despesas
function normalizeDespesaItem(item: any): DayDetailItem {
  const status = determineDespesaStatus(item);
  // Para despesas liquidadas, usar valorPago; caso contrÃÂÃÂÃÂÃÂ¡rio, valor
  const valor = status === 'liquidado'
    ? Number(item.valorPago || item.valor || 0)
    : Number(item.valor || 0);
  
  return {
    id: String(item.doc || item.idTitulo || ''),
    cliente: item.nomeFornecedor || item.fornecedor || item.nome || '',
    cpfCnpj: item.cpfCnpj || item.cnpjCpf || '',
    documento: String(item.nroDocumento || item.documento || ''),
    valor,
    status,
    tipo: 'despesa',
    dataVencimento: item.dataVencimento || item.dtVencimento || '',
    dataPagamento: item.dataPagamento || item.dtPagamento || '',
  };
}

// Normalizar item do modo Pagamentos (pagamentoRecebimento)
// tipoOperacao: "RECEITA" ou "DESPESA"
function normalizePagamentoItem(item: any): DayDetailItem {
  const isReceita = item.tipoOperacao === "RECEITA";
  // Usar valorPago como valor principal (ÃÂÃÂÃÂÃÂ© o que realmente foi pago/recebido)
  const valor = Number(item.valorPago || item.valor || 0);
  
  // Determinar status baseado em pago="S" ou statusTitulo="Liquidado"
  const isLiquidado = item.pago === "S" || item.pago === "s" || 
                      item.statusTitulo === "Liquidado" || item.statusTitulo === "liquidado";
  
  let status: 'aberto' | 'atrasado' | 'liquidado' = 'aberto';
  if (isLiquidado) {
    status = 'liquidado';
  } else {
    const vencimento = item.vencimento || item.dataVencimento;
    if (vencimento) {
      const hoje = new Date();
      const dtVenc = new Date(vencimento);
      if (dtVenc < hoje) {
        status = 'atrasado';
      }
    }
  }
  
  return {
    id: String(item.id || item.idMovimento || item.doc || ''),
    cliente: item.cliente || item.nomeCliente || item.nomeFornecedor || item.nome || '',
    cpfCnpj: item.cnpjCliente || item.cpfCnpj || item.cnpjCpf || '',
    documento: String(item.doc || item.nroDocumento || item.documento || '').trim(),
    valor,
    status,
    tipo: isReceita ? 'receita' : 'despesa',
    dataVencimento: item.vencimento || item.dataVencimento || item.dtVencimento || '',
    dataPagamento: item.dataPag || item.dataPagamento || item.dtPagamento || item.data || '',
  };
}

// Agrupar por data
function groupByDate(items: DayDetailItem[], usePagamentoDate: boolean = false): Map<string, DayData> {
  const grouped = new Map<string, DayData>();

  items.forEach(item => {
    // No modo pagamentos, agrupar por dataPagamento
    const dateKey = usePagamentoDate 
      ? (item.dataPagamento?.split('T')[0] || item.dataVencimento?.split('T')[0] || '')
      : (item.dataVencimento?.split('T')[0] || '');
    
    if (!dateKey) return;

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        date: dateKey,
        receitas: 0,
        receitasRecebidas: 0,
        despesas: 0,
        despesasPagas: 0,
      });
    }

    const dayData = grouped.get(dateKey)!;
    
    if (item.tipo === 'receita') {
      dayData.receitas += item.valor;
      if (item.status === 'liquidado') {
        dayData.receitasRecebidas += item.valor;
      }
    } else {
      dayData.despesas += item.valor;
      if (item.status === 'liquidado') {
        dayData.despesasPagas += item.valor;
      }
    }
  });

  return grouped;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      filtros, 
      acao,
      modoVisualizacao 
    }: { 
      filtros: CalendarioFiltros; 
      acao?: string;
      modoVisualizacao?: 'titulos' | 'pagamentos';
    } = body;

    const modo = modoVisualizacao || 'titulos';

    console.log('[admin-calendario-financeiro] AÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ£o:', acao || 'buscar');
    console.log('[admin-calendario-financeiro] Modo:', modo);
    console.log('[admin-calendario-financeiro] Filtros:', filtros);

    // Obter token da tabela dbfrete_token
    const token = await getToken();

    // Calcular perÃÂÃÂÃÂÃÂ­odo baseado em mes/ano ou filtros de data
    let dataInicial: string;
    let dataFinal: string;

    if (filtros.mes && filtros.ano) {
      const primeiroDia = new Date(filtros.ano, filtros.mes - 1, 1);
      const ultimoDia = new Date(filtros.ano, filtros.mes, 0);
      dataInicial = primeiroDia.toISOString().split('T')[0];
      dataFinal = ultimoDia.toISOString().split('T')[0];
    } else {
      dataInicial = filtros.dataEmissaoInicio || filtros.dataVencimentoInicio || new Date().toISOString().split('T')[0];
      dataFinal = filtros.dataEmissaoFim || filtros.dataVencimentoFim || new Date().toISOString().split('T')[0];
    }

    let allItems: DayDetailItem[] = [];

    if (modo === 'pagamentos') {
      // ==================== MODO PAGAMENTOS ====================
      // Usa endpoint /pagamentoRecebimento com emissao_inicio e emissao_fim
      const params = {
        empresa: filtros.empresa || '',
        status_titulo: filtros.status !== 'todos' ? filtros.status : '',
        emissao_inicio: filtros.dataEmissaoInicio || dataInicial,
        emissao_fim: filtros.dataEmissaoFim || dataFinal,
        vencimento_inicio: filtros.dataVencimentoInicio || '',
        vencimento_fim: filtros.dataVencimentoFim || '',
        data_pagamento_inicio: filtros.dataPagamentoInicio || '',
        data_pagamento_fim: filtros.dataPagamentoFim || '',
        apenas_contrato: filtros.contrato === 'S' || filtros.contrato === 'N' ? filtros.contrato : '',
      };

      console.log('[admin-calendario-financeiro] Buscando pagamentos com params:', params);

      const pagamentosResponse = await fetchDBFrete(DBFRETE.FINANCEIRO_PAGAMENTOS, params, token).catch(err => {
        console.error('[admin-calendario-financeiro] Erro pagamentos:', err);
        return [];
      });

      const pagamentosRaw = Array.isArray(pagamentosResponse) 
        ? pagamentosResponse 
        : (pagamentosResponse?.dados || pagamentosResponse?.data || []);

      console.log(`[admin-calendario-financeiro] Pagamentos raw count: ${pagamentosRaw.length}`);
      if (pagamentosRaw.length > 0) {
        console.log('[admin-calendario-financeiro] Sample pagamento item:', JSON.stringify(pagamentosRaw[0], null, 2));
      }

      allItems = pagamentosRaw.map(normalizePagamentoItem);

    } else {
      // ==================== MODO TÃÂÃÂÃÂÃÂTULOS ====================
      // Usa endpoints /receber e /pagar separados com emissao_inicio/emissao_fim
      const params = {
        empresa: filtros.empresa || '',
        emissao_inicio: filtros.dataEmissaoInicio || dataInicial,
        emissao_fim: filtros.dataEmissaoFim || dataFinal,
        vencimento_inicio: filtros.dataVencimentoInicio || '',
        vencimento_fim: filtros.dataVencimentoFim || '',
        data_pagamento_inicio: filtros.dataPagamentoInicio || '',
        data_pagamento_fim: filtros.dataPagamentoFim || '',
        status: filtros.status !== 'todos' ? filtros.status : '',
      };

      console.log('[admin-calendario-financeiro] Buscando tÃÂÃÂÃÂÃÂ­tulos com params:', params);

      // Buscar receitas e despesas em paralelo
      const [receitasResponse, despesasResponse] = await Promise.all([
        fetchDBFrete(DBFRETE.FINANCEIRO_RECEBER, params, token).catch(err => {
          console.error('[admin-calendario-financeiro] Erro receitas:', err);
          return [];
        }),
        fetchDBFrete(DBFRETE.FINANCEIRO_PAGAR, params, token).catch(err => {
          console.error('[admin-calendario-financeiro] Erro despesas:', err);
          return [];
        }),
      ]);

      // Normalizar dados
      const receitasRaw = Array.isArray(receitasResponse) 
        ? receitasResponse 
        : (receitasResponse?.dados || receitasResponse?.data || []);
      
      const despesasRaw = Array.isArray(despesasResponse) 
        ? despesasResponse 
        : (despesasResponse?.dados || despesasResponse?.data || []);
      
      if (receitasRaw.length > 0) {
        console.log('[admin-calendario-financeiro] Sample receita item:', JSON.stringify(receitasRaw[0], null, 2));
      }
      if (despesasRaw.length > 0) {
        console.log('[admin-calendario-financeiro] Sample despesa item:', JSON.stringify(despesasRaw[0], null, 2));
      }

      const receitas = receitasRaw.map(normalizeReceitaItem);
      const despesas = despesasRaw.map(normalizeDespesaItem);
      allItems = [...receitas, ...despesas];
    }

    // Se ÃÂÃÂÃÂÃÂ© busca de detalhes de um dia especÃÂÃÂÃÂÃÂ­fico
    if (acao === 'detalhe-dia' && body.data) {
      const dataFiltro = body.data.split('T')[0];
      const tipoFiltro = body.tipo || 'receita';
      
      const itemsDoDia = allItems.filter(item => {
        const itemDate = modo === 'pagamentos'
          ? (item.dataPagamento?.split('T')[0] || item.dataVencimento?.split('T')[0])
          : item.dataVencimento?.split('T')[0];
        return itemDate === dataFiltro && item.tipo === tipoFiltro;
      });

      return new Response(
        JSON.stringify({
          success: true,
          items: itemsDoDia,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Agrupar por data para calendÃÂÃÂÃÂÃÂ¡rio
    const usePagamentoDate = modo === 'pagamentos';
    const groupedData = groupByDate(allItems, usePagamentoDate);
    const dias: DayData[] = Array.from(groupedData.values());

    // Separar receitas e despesas para cÃÂÃÂÃÂÃÂ¡lculo
    const receitas = allItems.filter(i => i.tipo === 'receita');
    const despesas = allItems.filter(i => i.tipo === 'despesa');
    
    const resumo: FinancialSummary = modo === 'pagamentos' ? {
      // Modo Pagamentos: valorPago jÃÂÃÂÃÂÃÂ¡ ÃÂÃÂÃÂÃÂ© o valor efetivamente pago/recebido
      totalReceitas: receitas.reduce((sum: number, r: DayDetailItem) => sum + r.valor, 0),
      receitasRecebidas: receitas.reduce((sum: number, r: DayDetailItem) => sum + r.valor, 0), // Todos os valorPago
      receitasAReceber: 0, // No modo pagamentos nÃÂÃÂÃÂÃÂ£o hÃÂÃÂÃÂÃÂ¡ "a receber" - jÃÂÃÂÃÂÃÂ¡ estÃÂÃÂÃÂÃÂ¡ tudo pago
      totalDespesas: despesas.reduce((sum: number, d: DayDetailItem) => sum + d.valor, 0),
      despesasPagas: despesas.reduce((sum: number, d: DayDetailItem) => sum + d.valor, 0), // Todos os valorPago
      despesasAPagar: 0, // No modo pagamentos nÃÂÃÂÃÂÃÂ£o hÃÂÃÂÃÂÃÂ¡ "a pagar" - jÃÂÃÂÃÂÃÂ¡ estÃÂÃÂÃÂÃÂ¡ tudo pago
      qtdReceitas: receitas.length,
      qtdDespesas: despesas.length,
    } : {
      // Modo TÃÂÃÂÃÂÃÂ­tulos: usa lÃÂÃÂÃÂÃÂ³gica original com status
      totalReceitas: receitas.reduce((sum: number, r: DayDetailItem) => sum + r.valor, 0),
      receitasRecebidas: receitas.filter((r: DayDetailItem) => r.status === 'liquidado').reduce((sum: number, r: DayDetailItem) => sum + r.valor, 0),
      receitasAReceber: receitas.filter((r: DayDetailItem) => r.status !== 'liquidado').reduce((sum: number, r: DayDetailItem) => sum + r.valor, 0),
      totalDespesas: despesas.reduce((sum: number, d: DayDetailItem) => sum + d.valor, 0),
      despesasPagas: despesas.filter((d: DayDetailItem) => d.status === 'liquidado').reduce((sum: number, d: DayDetailItem) => sum + d.valor, 0),
      despesasAPagar: despesas.filter((d: DayDetailItem) => d.status !== 'liquidado').reduce((sum: number, d: DayDetailItem) => sum + d.valor, 0),
      qtdReceitas: receitas.length,
      qtdDespesas: despesas.length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        dias,
        resumo,
        items: allItems,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[admin-calendario-financeiro] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
