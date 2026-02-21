import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const dbfreteLoginUrl = "https://dbfreteapi.dyndns-web.com/login";
const dbfreteTabelasUrl = "https://dbfreteapi.dyndns-web.com/tms/tabelas";

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
    const body = await req.json().catch(() => ({}));
    const { nome } = body;

    console.log("📥 Buscando tabelas de preço...", nome ? `Filtro: ${nome}` : "Sem filtro");

    // Busca token válido (com renovação automática se necessário)
    const token = await getToken();

    // Montar URL com filtro opcional
    let url = dbfreteTabelasUrl;
    if (nome && nome.trim()) {
      const params = new URLSearchParams();
      params.append("nome", nome.trim());
      url = `${dbfreteTabelasUrl}?${params.toString()}`;
    }

    console.log("🔍 Buscando tabelas na API DB Frete:", url);
    
    const tabelasResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!tabelasResponse.ok) {
      const errorText = await tabelasResponse.text();
      console.error("❌ Erro ao buscar tabelas:", tabelasResponse.status, errorText);
      
      if (tabelasResponse.status === 401) {
        throw new Error("Token expirado ou inválido");
      }
      throw new Error(`Erro ao buscar tabelas: ${errorText}`);
    }

    const tabelasData = await tabelasResponse.json();
    console.log("✅ Tabelas obtidas com sucesso:", Array.isArray(tabelasData) ? tabelasData.length : 1);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: tabelasData 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("❌ Erro na função buscar-tabelas:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    // Salvar erro na tabela erros
    try {
      await supabase.from("erros").insert({
        titulo: "Erro ao buscar tabelas de preço",
        descricao: errorMessage,
        categoria: "tabela",
        pagina: "/buscar-tabelas",
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
