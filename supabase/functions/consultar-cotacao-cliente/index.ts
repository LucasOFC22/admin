import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Endpoints DB Frete ---
const DBFRETE = {
  CLIENTES: "https://dbfreteapi.dyndns-web.com/tms/clientes/cadastro",
  COTACAO: "https://dbfreteapi.dyndns-web.com/tms/cotacao/",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- Obter token valido ---
async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token DB Frete nao encontrado");

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

// --- Servidor HTTP ---
serve(async (req) => {
  try {
    const { cnpjcpf } = await req.json();

    if (!cnpjcpf)
      return new Response(JSON.stringify({ error: "Parametro 'cnpjcpf' e obrigatorio" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });

    const token = await getToken();

    const clienteResp = await fetch(`${DBFRETE.CLIENTES}?cnpjcpf=${cnpjcpf}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const clienteText = await clienteResp.text();

    let clienteData: any;
    try {
      clienteData = JSON.parse(clienteText);
    } catch {
      throw new Error("Resposta invalida ao buscar cliente");
    }

    let cliente;
    if (Array.isArray(clienteData)) {
      cliente = clienteData[0];
    } else if (clienteData?.clientes && Array.isArray(clienteData.clientes)) {
      cliente = clienteData.clientes[0];
    } else if (clienteData?.data && Array.isArray(clienteData.data)) {
      cliente = clienteData.data[0];
    } else {
      cliente = clienteData;
    }

    if (!cliente?.idCliente)
      throw new Error("Cliente nao encontrado ou resposta invalida do DB Frete");

    const filtros = [
      { chave: "id_cliente", valor: cliente.idCliente },
      { chave: "id_remetente", valor: cliente.idCliente },
      { chave: "id_destinatario", valor: cliente.idCliente },
    ];
    
    let todasCotacoes: any[] = [];
    
    for (const filtro of filtros) {
      const url = `${DBFRETE.COTACAO}?${filtro.chave}=${filtro.valor}`;
    
      const resp = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
    
      const text = await resp.text();
      if (!text || text.trim() === "") continue;
    
      let cotacoes: any[] = [];
      try {
        const data = JSON.parse(text);
        cotacoes = Array.isArray(data) ? data : [data];
      } catch {
        console.warn("Resposta invalida para filtro " + filtro.chave);
        continue;
      }
    
      todasCotacoes.push(...cotacoes);
    }
    
    const cotacoesUnicas = Array.from(
      new Map(todasCotacoes.map(c => [c.id || JSON.stringify(c), c])).values()
    );
    
    return new Response(JSON.stringify(cotacoesUnicas), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (err: any) {
    console.error("Erro geral:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro desconhecido" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
