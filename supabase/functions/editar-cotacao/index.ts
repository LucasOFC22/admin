import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const dbfreteLoginUrl = "https://dbfreteapi.dyndns-web.com/login";
const dbfreteCotacaoUrl = "https://dbfreteapi.dyndns-web.com/tms/cotacao";

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token DB Frete não encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  // Se token expirou ou não existe (1 hora)
  if (!registro.token || (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000) {
    console.log("🔐 Renovando token DB Frete...");

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

    console.log("✅ Token renovado com sucesso");
    return data.token;
  }

  return registro.token;
}

// Buscar cotação existente pelo ID (usando idColeta conforme API)
async function fetchCotacaoExistente(idOrcamento: number, token: string): Promise<any> {
  console.log(`🔍 Buscando cotação existente: ${idOrcamento}`);
  
  // A API de cotação usa o endpoint /tms/cotacao/:idColeta para buscar
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
  console.log(`📦 Cotação encontrada:`, JSON.stringify(data));
  return data;
}

// Envia cotação para atualização (POST com idOrcamento > 0 = atualização)
async function sendCotacaoUpdate(payload: any, token: string) {
  console.log("📤 Enviando atualização de cotação para DB Frete:", JSON.stringify(payload, null, 2));

  const resp = await fetch(dbfreteCotacaoUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  console.log("📨 Resposta DB Frete:", text);

  try {
    return JSON.parse(text);
  } catch {
    if (resp.status === 401) throw new Error("Token expirado ou inválido");
    throw new Error(text);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("📥 Requisição de edição de cotação recebida:", JSON.stringify(body, null, 2));

    const { idOrcamento, ...dadosParaAtualizar } = body;

    // Validação obrigatória: idOrcamento deve existir e ser maior que 0
    if (!idOrcamento || idOrcamento <= 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "idOrcamento é obrigatório e deve ser maior que 0 para edição" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca token válido
    const token = await getToken();

    // Buscar cotação existente
    const cotacaoExistente = await fetchCotacaoExistente(idOrcamento, token);

    // Mesclar dados existentes com os novos dados (edição parcial)
    // Os itens são substituídos completamente se enviados
    const cotacaoPayload = {
      ...cotacaoExistente,
      ...dadosParaAtualizar,
      idOrcamento, // Garantir que o ID está presente para a API entender como atualização
      // Se itens foram enviados, usar os novos; senão, manter os existentes
      itens: dadosParaAtualizar.itens || cotacaoExistente.itens || [],
    };

    console.log("📤 Payload final para atualização:", JSON.stringify(cotacaoPayload, null, 2));
    
    // Envia atualização para DB Frete
    const cotacaoResp = await sendCotacaoUpdate(cotacaoPayload, token);

    console.log("✅ Cotação atualizada com sucesso:", cotacaoResp);

    return new Response(JSON.stringify({
      success: true,
      data: cotacaoResp
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("❌ Erro na função editar-cotacao:", err);

    // Salva o erro na tabela erros
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
      console.log("📝 Erro salvo na tabela erros");
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
