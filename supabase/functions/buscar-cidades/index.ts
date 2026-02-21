import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Endpoints DB Frete ---
const DBFRETE = {
  CIDADES: "https://dbfreteapi.dyndns-web.com/tms/cidades",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- Obter token valido ---
async function getToken() {
  const { data: registro, error } = await supabase
    .from("dbfrete_token")
    .select("*")
    .single();

  if (error || !registro) throw new Error("Token DB Frete nao encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em
    ? new Date(registro.atualizado_em)
    : new Date(0);

  const expirado = agora.getTime() - atualizadoEm.getTime() > 60 * 60 * 1000;

  if (!registro.token || expirado) {
    const resp = await fetch(DBFRETE.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: registro.usuario,
        senha: registro.senha,
        id_cliente: registro.id_cliente,
      }),
    });

    const text = await resp.text();
    const data = JSON.parse(text);

    if (!data.token) throw new Error("Erro ao renovar token DB Frete");

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

// --- Endpoint Cidades ---
serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    const nome = body.nome || "";
    const uf = body.uf || "";

    // Monta query string dinamicamente
    const params = new URLSearchParams();

    if (nome) params.append("nome", nome);
    if (uf) params.append("uf", uf);

    const token = await getToken();

    const url = `${DBFRETE.CIDADES}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Resposta inesperada do DB Frete");
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }
});
