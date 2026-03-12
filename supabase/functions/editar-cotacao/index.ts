import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const dbfreteLoginUrl = "https://dbfreteapi.dyndns-web.com/login";
const dbfreteCotacaoUrl = "https://dbfreteapi.dyndns-web.com/tms/cotacao";

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token DB Frete não encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  if (!registro.token || (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000) {
    const response = await fetch(dbfreteLoginUrl, {
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
      console.error("❌ Resposta inesperada ao renovar token:", text);
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

async function fetchCotacaoExistente(idOrcamento: number, token: string): Promise<any> {
  const url = `${dbfreteCotacaoUrl}/${idOrcamento}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const err = await resp.text();
    if (resp.status === 401) throw new Error("Token expirado ou inválido");
    if (resp.status === 404) throw new Error(`Cotação ${idOrcamento} não encontrada`);
    throw new Error(`Erro ao buscar cotação: ${err}`);
  }

  const data = await resp.json();
  return data;
}

async function sendCotacaoUpdate(payload: any, token: string) {
  const resp = await fetch(dbfreteCotacaoUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();

  try {
    return JSON.parse(text);
  } catch {
    if (resp.status === 401) throw new Error("Token expirado ou inválido");
    throw new Error(text);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const { idOrcamento, ...dadosParaAtualizar } = body;

    if (!idOrcamento || idOrcamento <= 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "idOrcamento é obrigatório e deve ser maior que 0 para edição" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getToken();

    const cotacaoExistente = await fetchCotacaoExistente(idOrcamento, token);

    const cotacaoPayload = {
      ...cotacaoExistente,
      ...dadosParaAtualizar,
      idOrcamento,
      itens: dadosParaAtualizar.itens || cotacaoExistente.itens || [],
    };

    const cotacaoResp = await sendCotacaoUpdate(cotacaoPayload, token);

    return new Response(JSON.stringify({
      success: true,
      data: cotacaoResp
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("❌ Erro na função editar-cotacao:", err);

    try {
      const bodyClone = await req.clone().json().catch(() => ({}));
      await supabase.from("erros").insert({
        titulo: "Erro na edição de cotação",
        descricao: err.message || "Erro desconhecido",
        categoria: "cotacao",
        pagina: "/area-cliente/editar-cotacao",
        nivel: "error",
        tipo: "api",
        dados_extra: {
          payload: bodyClone,
          stack: err.stack || null,
          timestamp: new Date().toISOString()
        },
        resolvido: false,
        data_ocorrencia: new Date().toISOString()
      });
    } catch (logErr) {
      console.error("❌ Falha ao salvar erro na tabela:", logErr);
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: err.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
