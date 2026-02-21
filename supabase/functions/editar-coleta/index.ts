import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const dbfreteLoginUrl = "https://dbfreteapi.dyndns-web.com/login";
const dbfreteColetaUrl = "https://dbfreteapi.dyndns-web.com/tms/coleta";

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

// Buscar coleta existente pelo ID
async function fetchColetaExistente(idColeta: number, token: string): Promise<any> {
  console.log(`🔍 Buscando coleta existente: ${idColeta}`);
  
  const url = `${dbfreteColetaUrl}/${idColeta}`;
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
    if (resp.status === 404) throw new Error(`Coleta ${idColeta} não encontrada`);
    throw new Error(`Erro ao buscar coleta: ${err}`);
  }

  const data = await resp.json();
  console.log(`📦 Coleta encontrada:`, JSON.stringify(data));
  return data;
}

// Envia coleta para atualização (POST com idColeta > 0 = atualização)
async function sendColetaUpdate(payload: any, token: string) {
  console.log("📤 Enviando atualização de coleta para DB Frete:", JSON.stringify(payload, null, 2));

  const resp = await fetch(dbfreteColetaUrl, {
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
    console.log("📥 Requisição de edição recebida:", JSON.stringify(body, null, 2));

    const { idColeta, ...dadosParaAtualizar } = body;

    // Validação obrigatória: idColeta deve existir e ser maior que 0
    if (!idColeta || idColeta <= 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "idColeta é obrigatório e deve ser maior que 0 para edição" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca token válido
    const token = await getToken();

    // Buscar coleta existente
    const coletaExistente = await fetchColetaExistente(idColeta, token);

    // Mesclar dados existentes com os novos dados (edição parcial)
    // Os itens são substituídos completamente se enviados
    const coletaPayload = {
      ...coletaExistente,
      ...dadosParaAtualizar,
      idColeta, // Garantir que o ID está presente para a API entender como atualização
      // Se itens foram enviados, usar os novos; senão, manter os existentes
      itens: dadosParaAtualizar.itens || coletaExistente.itens || [],
    };

    console.log("📤 Payload final para atualização:", JSON.stringify(coletaPayload, null, 2));
    
    // Envia atualização para DB Frete
    const coletaResp = await sendColetaUpdate(coletaPayload, token);

    console.log("✅ Coleta atualizada com sucesso:", coletaResp);

    return new Response(JSON.stringify({
      success: true,
      data: coletaResp
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("❌ Erro na função editar-coleta:", err);

    // Salva o erro na tabela erros
    try {
      const bodyClone = await req.clone().json().catch(() => ({}));
      await supabase.from("erros").insert({
        titulo: "Erro na edição de coleta",
        descricao: err.message || "Erro desconhecido",
        categoria: "coleta",
        pagina: "/area-cliente/editar-coleta",
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
