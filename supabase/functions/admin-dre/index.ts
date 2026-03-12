import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DBFRETE = {
  FINANCEIRO_DRE: "https://dbfreteapi.dyndns-web.com/tms/financeiro/dre",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

interface DREFiltros {
  empresas?: number[];
  regime?: 'caixa' | 'competencia-titulos' | 'competencia-cte';
  dataInicial: string;
  dataFinal: string;
}

interface DRELancamento {
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
  empresa?: number;
}

interface DRESummary {
  totalReceitas: number;
  totalDespesas: number;
  qtdReceitas: number;
  qtdDespesas: number;
  resultado: number;
  margem: number;
}

function formatDateForAPI(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}-${month}-${year}`;
}

function getViewFromRegime(regime?: string): string {
  const viewMap: Record<string, string> = {
    'caixa': 'caixa',
    'competencia-titulos': 'competenciatitulo',
    'competencia-cte': 'competenciacte',
  };
  return viewMap[regime || 'competencia-cte'] || 'competenciacte';
}

async function getToken(): Promise<string> {
  const { data: registro, error } = await supabase
    .from("dbfrete_token")
    .select("*")
    .single();

  if (error || !registro) {
    throw new Error("Registro de token DB Frete não encontrado");
  }

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  if (!registro.token || agora.getTime() - atualizadoEm.getTime() > 60 * 60 * 1000) {
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
      throw new Error("Resposta inesperada ao renovar token (não é JSON)");
    }

    if (!data.token) throw new Error("Não foi possível renovar token DB Frete");

    await supabase
      .from("dbfrete_token")
      .update({
        token: data.token,
        empresas: data.usuario?.empresas || [],
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", registro.id);

    return data.token;
  }

  return registro.token;
}

async function fetchDBFrete(endpoint: string, params: Record<string, any>, token: string) {
  const url = new URL(endpoint);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao buscar dados: ${response.status} - ${errorText}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

function normalizeLancamento(item: any): DRELancamento {
  return {
    id: item.doc?.trim() || String(Math.random()),
    data: item.data || '',
    tipo: item.tipoDR === 'RECEITA' ? 'RECEITA' : 'DESPESA',
    conta: item.conta || '',
    nome: item.nome || '',
    cpfCnpj: item.cpfcnpj || '',
    documento: item.doc?.trim() || '',
    banco: item.contaBanco || '',
    valor: Number(item.valor || 0),
    classe: item.classe || item.contaBanco || '',
    empresa: item.idEmpresa,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { filtros }: { filtros: DREFiltros } = body;

    if (!filtros?.dataInicial || !filtros?.dataFinal) {
      return new Response(
        JSON.stringify({ error: 'Data inicial e final são obrigatórias' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = await getToken();

    const dataInicio = formatDateForAPI(filtros.dataInicial);
    const dataFim = formatDateForAPI(filtros.dataFinal);
    const view = getViewFromRegime(filtros.regime);
    const empresas = filtros.empresas?.length 
      ? filtros.empresas.join(',') 
      : '1,2';

    const params = {
      data_inicio: dataInicio,
      data_fim: dataFim,
      view: view,
      empresas: empresas,
    };

    const dreResponse = await fetchDBFrete(DBFRETE.FINANCEIRO_DRE, params, token);

    const lancamentosRaw = Array.isArray(dreResponse) 
      ? dreResponse 
      : (dreResponse?.dados || dreResponse?.data || []);

    const lancamentos: DRELancamento[] = lancamentosRaw.map(normalizeLancamento);

    const receitas = lancamentos.filter(l => l.tipo === 'RECEITA');
    const despesas = lancamentos.filter(l => l.tipo === 'DESPESA');

    lancamentos.sort((a, b) => b.data.localeCompare(a.data));

    const totalReceitas = receitas.reduce((sum, l) => sum + l.valor, 0);
    const totalDespesas = despesas.reduce((sum, l) => sum + l.valor, 0);
    const resultado = totalReceitas - totalDespesas;

    const resumo: DRESummary = {
      totalReceitas,
      totalDespesas,
      qtdReceitas: receitas.length,
      qtdDespesas: despesas.length,
      resultado,
      margem: totalReceitas > 0 ? (resultado / totalReceitas) * 100 : 0,
    };

    return new Response(
      JSON.stringify({
        success: true,
        lancamentos,
        resumo,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
