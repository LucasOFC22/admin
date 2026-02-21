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
  CLIENTES: "https://dbfreteapi.dyndns-web.com/tms/clientes/cadastro",
};

// --- Helper: fetch com timeout ---
async function fetchTimeout(resource: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// --- Obter token valido ---
async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token DB Frete nao encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  if (!registro.token || (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000) {
    const response = await fetchTimeout(DBFRETE.LOGIN, {
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
    try { data = JSON.parse(text); } catch { throw new Error("Resposta inesperada ao renovar token"); }

    if (!data.token) throw new Error("Nao foi possivel renovar token DB Frete");

    await supabase
      .from("dbfrete_token")
      .update({ token: data.token, atualizado_em: new Date().toISOString() })
      .eq("id", registro.id);

    return data.token;
  }

  return registro.token;
}

// --- Buscar cliente por CNPJ/CPF e retornar idCliente ---
async function getClienteId(cnpjcpf: string, token: string) {
  const resp = await fetchTimeout(`${DBFRETE.CLIENTES}?cnpjcpf=${cnpjcpf}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  const text = await resp.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`Resposta invalida ao buscar cliente (${cnpjcpf}): ${text}`); }

  let cliente;
  if (Array.isArray(data)) cliente = data[0];
  else if (data?.clientes?.length) cliente = data.clientes[0];
  else if (data?.data?.length) cliente = data.data[0];
  else cliente = data;

  if (!cliente?.idCliente) throw new Error(`Cliente nao encontrado para CNPJ/CPF ${cnpjcpf}`);
  return cliente.idCliente;
}

// --- Edge Function principal ---
serve(async (req) => {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || !body.cnpjcpf) {
      return new Response(JSON.stringify({ error: "Campo 'cnpjcpf' e obrigatorio." }), {
        status: 400, headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const token = await getToken();
    const idCliente = await getClienteId(body.cnpjcpf, token);

    const resultados: any[] = [];

    // Requisicao para remetente_id
    const urlRemetente = `${DBFRETE.CONSULTA_NOTA}?remetente_id=${idCliente}&empresas=1`;
    const respRem = await fetchTimeout(urlRemetente, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    const textRem = await respRem.text();
    let dataRem: any = [];
    try { dataRem = JSON.parse(textRem); } catch {}
    if (Array.isArray(dataRem)) resultados.push(...dataRem);

    // Requisicao para destinatario_id
    const urlDest = `${DBFRETE.CONSULTA_NOTA}?destinatario_id=${idCliente}&empresas=1`;
    const respDest = await fetchTimeout(urlDest, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    const textDest = await respDest.text();
    let dataDest: any = [];
    try { dataDest = JSON.parse(textDest); } catch {}
    if (Array.isArray(dataDest)) resultados.push(...dataDest);

    // Remover duplicatas se necessario (opcional)
    const finalData = Array.isArray(resultados) ? resultados : [];

    return new Response(JSON.stringify({ success: true, data: finalData }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (err: any) {
    console.error("Erro na funcao buscar-nfe-cliente:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro desconhecido" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
