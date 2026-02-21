import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config DBFrete ---
const DBFRETE = {
  IMPRIMIR_MDFE: "https://dbfreteapi.dyndns-web.com/manifestos/imprimir/",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- FunÃ§Ã£o para obter token ---
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

    const data = await response.json();
    if (!data.token) throw new Error("NÃ£o foi possÃ­vel renovar token DB Frete");

    await supabase
      .from("dbfrete_token")
      .update({ token: data.token, atualizado_em: new Date().toISOString() })
      .eq("id", registro.id);

    return data.token;
  }

  return registro.token;
}

// --- Edge Function para baixar PDF do MDF-e ---
serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const chaveMdfe = pathParts[pathParts.length - 1];

    if (!chaveMdfe) throw new Error("chaveMdfe obrigatÃ³ria");

    const token = await getToken();

    // 1ï¸â£ Baixa PDF do MDF-e
    const response = await fetch(`${DBFRETE.IMPRIMIR_MDFE}/${chaveMdfe}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Erro ao baixar PDF: ${response.statusText}`);

    const pdfBuffer = await response.arrayBuffer();

    // 2ï¸â£ Retorna PDF direto para o navegador
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="MDF-e_${chaveMdfe}.pdf"`,
      },
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro desconhecido" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
