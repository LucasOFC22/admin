import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Endpoints DB Frete ---
const DBFRETE = {
  FINANCEIRO: "https://dbfreteapi.dyndns-web.com/tms/financeiro/receber",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- Obter token valido ---
async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token DB Frete nao encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  // Se token expirou ou nao existe
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

    // Trata resposta que pode nao ser JSON
    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Resposta inesperada ao renovar token (nao e JSON)");
    }

    if (!data.token) throw new Error("Nao foi possivel renovar token DB Frete");

    // --- Atualiza token e empresas no Supabase ---
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

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}


// --- Servidor HTTP ---
serve(async (req) => {
  try {
    const filtrosRecebidos = await req.json();
    console.log("Filtros recebidos:", filtrosRecebidos);

    const token = await getToken();

    // Monta query string apenas com campos preenchidos
    const params = new URLSearchParams();
    for (const key in filtrosRecebidos) {
      const val = filtrosRecebidos[key];
      if (val !== "" && val !== null && val !== undefined) {
        params.append(key, String(val));
      }
    }

    const url = `${DBFRETE.FINANCEIRO}?${params.toString()}`;

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
      return new Response(JSON.stringify({ error: "Resposta invalida da API", detalhes: text }), {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (err: any) {
    console.error("Erro na funcao:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro desconhecido" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
