import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// --- Config DBFrete ---
const DBFRETE = {
  ENCERRAR_MDFE: "https://dbfreteapi.dyndns-web.com/manifestos/encerrar/",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- FunÃÂ§ÃÂ£o para obter token vÃÂ¡lido ---
async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token DB Frete nÃ£o encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  if (!registro.token || (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000) {
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
      throw new Error("Resposta inesperada ao renovar token (nÃ£o Ã© JSON)");
    }

    if (!data.token) throw new Error("NÃ£o foi possÃ­vel renovar token DB Frete");

    await supabase
      .from("dbfrete_token")
      .update({ token: data.token, atualizado_em: new Date().toISOString() })
      .eq("id", registro.id);

    return data.token;
  }

  return registro.token;
}

// --- FunÃÂ§ÃÂ£o principal ---
serve(async (req) => {
  try {

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "MÃÂ©todo nÃÂ£o permitido. Use POST." }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Captura a URL e extrai a chave MDF-e
    const url = new URL(req.url);
    const chave = url.pathname.split("/").pop();

    if (!chave) {
      return new Response(JSON.stringify({ error: "Informe a chaveMDF-e na URL." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ObtÃÂ©m token
    const token = await getToken();

    // Faz requisiÃÂ§ÃÂ£o ao DBFrete com body mÃÂ­nimo
    const endpoint = `${DBFRETE.ENCERRAR_MDFE}${chave}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await response.text();


    // Tratamento: se nÃÂ£o for JSON, retorna como mensagem
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { message: text.trim() };
    }

    return new Response(JSON.stringify({
      sucesso: true,
      chave,
      resposta: result,
    }), {
      status: 200, // ✅ força retorno HTTP 200
      headers: { "Content-Type": "application/json" },
    });


  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno ao encerrar MDF-e" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
