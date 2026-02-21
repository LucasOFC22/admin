import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- DBFrete ---
const DBFRETE = {
  IMPRIMIR_COTACAO: "https://dbfreteapi.dyndns-web.com/gerais/relatorios/imprimirOrcamento/",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- FunÃÂÃÂ§ÃÂÃÂ£o para pegar token ---
async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token nÃÂÃÂ£o encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  // Se token estiver vazio ou expirado (>1h)
  if (!registro.token || (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000) {
    const res = await fetch(DBFRETE.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: registro.usuario,
        senha: registro.senha,
        id_cliente: registro.id_cliente,
      }),
    });
    const data = await res.json();
    if (!data.token) throw new Error("NÃÂÃÂ£o foi possÃÂÃÂ­vel renovar token DBFrete");

    await supabase.from("dbfrete_token").update({
      token: data.token,
      atualizado_em: new Date().toISOString(),
    }).eq("id", registro.id);

    return data.token;
  }

  return registro.token;
}

// --- Servidor ---
serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const idCotacao = pathParts[pathParts.length - 1]; // ÃÂÃÂºltimo pedaÃÂÃÂ§o da URL

    if (!idCotacao) {
      return new Response(JSON.stringify({ error: "idCotacao ÃÂÃÂ© obrigatÃÂÃÂ³rio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    const token = await getToken();
    
    const response = await fetch(`${DBFRETE.IMPRIMIR_COTACAO}${idCotacao}?empresa=1`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const txt = await response.text();
      return new Response(JSON.stringify({ error: txt }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pdfArrayBuffer = await response.arrayBuffer();

    return new Response(pdfArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=Cotacao_${idCotacao}.pdf`,
      },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
