import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Config Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Endpoints DB Frete ---
const DBFRETE = {
  CLIENTES: "https://dbfreteapi.dyndns-web.com/tms/clientes/cadastro",
  COLETA: "https://dbfreteapi.dyndns-web.com/tms/coleta",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// --- Obter token valido ---
async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").maybeSingle();
  if (error || !registro) {
    console.error("Erro ao buscar registro de token:", error);
    throw new Error("Registro de token DB Frete nao encontrado");
  }

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

// --- Servidor HTTP ---
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const { cnpjcpf, filtros } = body;

    // Modo 1: Busca por CNPJ/CPF (igual buscar-cotacao)
    if (cnpjcpf) {

      const token = await getToken();

      // --- Buscar cliente ---
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
        throw new Error(`Resposta invalida ao buscar cliente: ${clienteText}`);
      }

      // --- Identificar id_cliente ---
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

      if (!cliente?.idCliente) {
        return new Response(JSON.stringify({
          success: true,
          data: [],
          total: 0,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
        });
      }

      const filtrosBusca = [
        { chave: "id_remetente", valor: cliente.idCliente },
        { chave: "id_destinatario", valor: cliente.idCliente },
      ];

      let todasColetas: any[] = [];

      for (const filtro of filtrosBusca) {
        const url = `${DBFRETE.COLETA}?${filtro.chave}=${filtro.valor}`;

        const resp = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const text = await resp.text();
        if (!text || text.trim() === "") continue;

        let coletas: any[] = [];
        try {
          const data = JSON.parse(text);
          coletas = Array.isArray(data) ? data : [data];
        } catch {
          console.warn(`Resposta invalida para filtro ${filtro.chave}:`, text);
          continue;
        }

        todasColetas.push(...coletas);
      }

      // --- Remover duplicados ---
      const coletasUnicas = Array.from(
        new Map(todasColetas.map(c => [c.idColeta || c.id || JSON.stringify(c), c])).values()
      );

      // --- Filtrar apenas empresa 2 ---
      const coletasEmpresa2 = coletasUnicas.filter((c: any) => c.idEmpresa === 2);

      return new Response(JSON.stringify({
        success: true,
        data: coletasEmpresa2,
        total: coletasEmpresa2.length,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    // Modo 2: Busca por filtros genericos (mantem compatibilidade)
    if (filtros && typeof filtros === 'object') {

      const token = await getToken();

      const params = new URLSearchParams(filtros);
      const urlComParametros = `${DBFRETE.COLETA}?${params.toString()}`;

      const resp = await fetch(urlComParametros, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const text = await resp.text();

      let resultado: any[];
      try {
        resultado = JSON.parse(text);
      } catch {
        if (resp.status === 401) throw new Error("Token expirado ou invalido");
        throw new Error(text);
      }

      if (!Array.isArray(resultado)) {
        throw new Error("Resposta inesperada ao buscar coletas");
      }

      return new Response(JSON.stringify({
        success: true,
        data: resultado,
        total: resultado.length,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    // Nenhum parametro valido
    return new Response(JSON.stringify({
      success: false,
      error: "Parametro 'cnpjcpf' ou 'filtros' e obrigatorio"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (err: any) {
    console.error("Erro na funcao buscar-coleta:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
