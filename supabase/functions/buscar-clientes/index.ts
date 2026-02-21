import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Endpoints DB Frete ---
const DBFRETE = {
  CLIENTES_CNPJ: "https://dbfreteapi.dyndns-web.com/tms/clientes/cadastro",
  CLIENTES_NOME: "https://dbfreteapi.dyndns-web.com/tms/clientes",
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

    console.log("Token expirado ou inexistente, renovando...");

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
      console.error("Resposta inesperada ao renovar token:", text);
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
    console.log("Resposta completa do login DBFrete:", data);
    console.log("Token e empresas atualizados com sucesso.");
    return data.token;
  }

  console.log("Token ainda valido, usando existente.");
  return registro.token;
}

// --- Funcao principal ---
serve(async (req) => {
  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Parametro 'query' e obrigatorio" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const token = await getToken();
    const isCpfCgc = /^[0-9./-]+$/.test(query.trim());

    if (isCpfCgc) {
      // Busca direta por CPF/CGC
      const url = `${DBFRETE.CLIENTES_CNPJ}?cnpjcpf=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const text = await response.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    } else {
      // Busca por nome
      const url = `${DBFRETE.CLIENTES_NOME}?nome=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const text = await response.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = text; }

      if (!Array.isArray(data)) {
        return new Response(JSON.stringify({ error: "Resposta invalida da API de nomes", detalhes: data }), {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }

      // Agora busca detalhes completos por CPF/CGC
      const detalhes = await Promise.all(
        data.map(async (item: any) => {
          if (!item.cpfcgc) return item; // caso nao tenha CPF/CGC
          const cgcUrl = `${DBFRETE.CLIENTES_CNPJ}?cnpjcpf=${encodeURIComponent(item.cpfcgc)}`;
          const cgcResp = await fetch(cgcUrl, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          const cgcText = await cgcResp.text();
          let cgcData: any;
          try { cgcData = JSON.parse(cgcText); } catch { cgcData = cgcText; }
          return cgcData;
        })
      );

      return new Response(JSON.stringify({ success: true, data: detalhes }), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Erro desconhecido" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
