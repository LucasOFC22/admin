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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { idOrcamento } = body;

    console.log("📥 Buscando detalhes da cotação:", idOrcamento);

    // Validação
    if (!idOrcamento || idOrcamento === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "idOrcamento é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Busca token válido (com renovação automática se necessário)
    const token = await getToken();

    // Buscar detalhes da cotação na API DB Frete
    console.log("🔍 Buscando cotação na API DB Frete...");
    const cotacaoResponse = await fetch(`${dbfreteCotacaoUrl}/${idOrcamento}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!cotacaoResponse.ok) {
      const errorText = await cotacaoResponse.text();
      console.error("❌ Erro ao buscar cotação:", cotacaoResponse.status, errorText);
      
      if (cotacaoResponse.status === 401) {
        throw new Error("Token expirado ou inválido");
      }
      if (cotacaoResponse.status === 404) {
        throw new Error(`Cotação ${idOrcamento} não encontrada`);
      }
      throw new Error(`Erro ao buscar cotação: ${errorText}`);
    }

    const cotacaoData = await cotacaoResponse.json();
    console.log("✅ Detalhes da cotação obtidos com sucesso");

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: cotacaoData 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("❌ Erro na função detalhes-cotacao:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    // Salvar erro na tabela erros
    try {
      await supabase.from("erros").insert({
        titulo: "Erro ao buscar detalhes da cotação",
        descricao: errorMessage,
        categoria: "cotacao",
        pagina: "/detalhes-cotacao",
        nivel: "error",
        tipo: "api",
        dados_extra: {
          timestamp: new Date().toISOString()
        },
        resolvido: false,
        data_ocorrencia: new Date().toISOString()
      });
    } catch (logErr) {
      console.error("❌ Falha ao salvar erro na tabela:", logErr);
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
