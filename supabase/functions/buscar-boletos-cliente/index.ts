import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Endpoints DB Frete ---
const DBFRETE = {
  CLIENTES_CNPJ: "https://dbfreteapi.dyndns-web.com/tms/clientes/cadastro",
  FINANCEIRO: "https://dbfreteapi.dyndns-web.com/tms/financeiro/receber",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- Obter token valido ---
async function getToken() {
  const { data: registro, error } = await supabase
    .from("dbfrete_token")
    .select("*")
    .single();
  if (error || !registro) throw new Error("Registro de token DB Frete nao encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  // Se token expirou ou nao existe
  if (!registro.token || agora.getTime() - atualizadoEm.getTime() > 60 * 60 * 1000) {
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
      console.error("Resposta inesperada ao renovar token:", text);
      throw new Error("Resposta inesperada ao renovar token (nao e JSON)");
    }

    if (!data.token) throw new Error("Nao foi possivel renovar token DB Frete");

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

// --- Buscar ID do cliente pelo CPF/CNPJ ---
async function fetchClienteId(cnpjcpf: string, token: string) {

  const url = `${DBFRETE.CLIENTES_CNPJ}?cnpjcpf=${encodeURIComponent(cnpjcpf)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const text = await response.text();
  let data: any;

  try {
    data = JSON.parse(text);
  } catch {
    console.error("Resposta nao e JSON. Conteudo bruto:", text);
    throw new Error("Resposta inesperada ao buscar cliente (nao e JSON)");
  }

  // o endpoint retorna um objeto direto com campo idCliente
  if (!data || !data.idCliente) {
    console.error("Cliente nao encontrado ou campo idCliente ausente:", data);
    throw new Error("Cliente nao encontrado no DB Frete");
  }
  return data.idCliente;
}

// --- Buscar boletos pelo ID do cliente ---
async function fetchBoletos(id_cliente: string, dias: number | undefined, token: string) {
  let url = `${DBFRETE.FINANCEIRO}?id_cliente=${id_cliente}&empresas=1`;

  if (dias) {
    const hoje = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(hoje.getDate() - dias);
    const emissao_inicio = formatDate(dataInicio);
    url += `&emissao_inicio=${emissao_inicio}`;
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let data = [];
  try {
    data = await response.json();
  } catch {
    console.log("Nenhum dado retornado do endpoint de boletos");
  }

  if (!data || !Array.isArray(data)) return [];
  return data;
}



// --- Servidor HTTP ---
serve(async (req) => {
  try {
    const { cnpjcpf, tempo } = await req.json();
    console.log(cnpjcpf)
    console.log(tempo)

    if (!cnpjcpf) {
      return new Response(
        JSON.stringify({ error: "cnpjcpf e obrigatorio" }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } },
      );
    }

    const token = await getToken();
    const id_cliente = await fetchClienteId(cnpjcpf, token);

    // Passa tempo como undefined se nao for enviado
    const boletos = await fetchBoletos(id_cliente, tempo ? parseInt(tempo) : undefined, token);

    return new Response(JSON.stringify(boletos), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err: unknown) {
    console.error("Erro geral:", err);
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
});
