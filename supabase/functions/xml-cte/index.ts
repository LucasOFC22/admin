import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config DBFrete ---
const DBFRETE = {
  CTE_XML: "https://dbfreteapi.dyndns-web.com/tms/cte/xml",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- FunÃÂ§ÃÂ£o para obter token ---
async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token DB Frete nÃÂ£o encontrado");

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
      throw new Error("Resposta inesperada ao renovar token (nÃÂ£o ÃÂ© JSON)");
    }

    if (!data.token) throw new Error("NÃÂ£o foi possÃÂ­vel renovar token DB Frete");

    await supabase
      .from("dbfrete_token")
      .update({ token: data.token, atualizado_em: new Date().toISOString() })
      .eq("id", registro.id);

    return data.token;
  }

  return registro.token;
}

// --- Edge Function para baixar XML do CTe ---
serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const idconhecimento = pathParts[pathParts.length - 1];

    if (!idconhecimento) throw new Error("idconhecimento ÃÂ© obrigatÃÂ³rio");

    const token = await getToken();

    // Faz requisiÃÂ§ÃÂ£o GET para a API DBFrete
    const response = await fetch(`${DBFRETE.CTE_XML}/${idconhecimento}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });

    const xmlText = await response.text();

    if (!xmlText || xmlText.trim() === "") {
      throw new Error("XML vazio ou nÃÂ£o encontrado para o CTe informado");
    }

    // --- LOG do XML para debug ---
    console.log("Ã­Â Â½Ã­Â³Â XML recebido do CTe:", xmlText);

    // Converte XML para base64 (suporta UTF-8)
    const base64 = btoa(unescape(encodeURIComponent(xmlText)));

    return new Response(
      JSON.stringify({ fileName: `CTE_${idconhecimento}.xml`, data: base64 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Ã¢ÂÂ Erro na funÃÂ§ÃÂ£o:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro desconhecido" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
