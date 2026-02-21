import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Config DBFrete ---
const DBFRETE = {
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
  MANIFESTOS_PENDENTES: "https://dbfreteapi.dyndns-web.com/manifestos/pendentes",
};

// --- Funcao para obter token ---
async function getToken() {
  const { data: registro, error } = await supabase
    .from("dbfrete_token")
    .select("*")
    .single();

  if (error || !registro) {
    throw new Error("Registro de token DB Frete nao encontrado");
  }

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);
  const expirou = (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000; // 1 hora

  if (!registro.token || expirou) {
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
    if (!data.token) throw new Error("Falha ao renovar token DB Frete");

    await supabase
      .from("dbfrete_token")
      .update({
        token: data.token,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", registro.id);

    return data.token;
  }

  return registro.token;
}

// --- Servidor ---
serve(async (_req) => {
  try {
    const token = await getToken();

    const response = await fetch(DBFRETE.MANIFESTOS_PENDENTES, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    const text = await response.text();

    // Tenta converter em JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ raw: text }), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    // Garante que sempre seja array
    let manifestos = [];
    if (Array.isArray(data)) {
      manifestos = data;
    } else if (Array.isArray(data.body)) {
      manifestos = data.body;
    } else if (Array.isArray(data.data)) {
      manifestos = data.data;
    } else if (data.manifestos && Array.isArray(data.manifestos)) {
      manifestos = data.manifestos;
    } else {
      manifestos = [data];
    }

    return new Response(JSON.stringify(manifestos), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
