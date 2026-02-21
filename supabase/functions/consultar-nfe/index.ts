import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Endpoints DB Frete ---
const DBFRETE = {
  CONSULTA_NOTA: "https://dbfreteapi.dyndns-web.com/tms/consultaNota",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- Obter token vÃ¡lido ---
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

    // Atualiza token e empresas no Supabase
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

// --- Edge Function ---
serve(async (req) => {
  try {
    const filtrosRecebidos = await req.json();
    console.log("?? Filtros recebidos:", filtrosRecebidos);

    const token = await getToken();

    // Monta query string apenas com campos preenchidos
    const params = new URLSearchParams();
    for (const key in filtrosRecebidos) {
      const val = filtrosRecebidos[key];
      if (val !== "" && val !== null && val !== undefined) {
        params.append(key, String(val));
      }
    }

    const url = `${DBFRETE.CONSULTA_NOTA}?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    const text = await response.text();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      // Se resposta nÃ£o for JSON vÃ¡lido, retorna array vazio
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Se nÃ£o houver dados, retorna array vazio
    if (!data || !data.length) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("? Erro na funÃ§Ã£o:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro desconhecido" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
