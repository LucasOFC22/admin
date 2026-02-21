// supabase/functions/dbfrete-cotacao/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const dbfreteLoginUrl = "https://dbfreteapi.dyndns-web.com/login";
const dbfreteClientesUrl = "https://dbfreteapi.dyndns-web.com/tms/clientes/cadastro";
const dbfreteCotacaoUrl = "https://dbfreteapi.dyndns-web.com/tms/cotacao";

const supabase = createClient(supabaseUrl, supabaseKey);

async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token DB Frete nao encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  // Se token expirou ou nao existe
  if (!registro.token || (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000) {

    const response = await fetch(dbfreteLoginUrl, {
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
    return data.token;
  }
  
  return registro.token;
}

async function fetchClienteId(cnpjcpf: string, token: string) {
  const url = `${dbfreteClientesUrl}?cnpjcpf=${encodeURIComponent(cnpjcpf)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    const err = await resp.text();
    if (resp.status === 401) throw new Error("Token expirado ou invalido");
    throw new Error(`Erro ao consultar cliente: ${err}`);
  }

  const data = await resp.json();

  if (!data || !data.idCliente) {
    throw new Error(`Cliente nao encontrado para CNPJ/CPF ${cnpjcpf}`);
  }

  return data.idCliente;
}

async function sendCotacao(payload: any, token: string) {
  const resp = await fetch(dbfreteCotacaoUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    if (resp.status === 401) throw new Error("Token expirado ou invalido");
    throw new Error(text);
  }
}

serve(async (req) => {
  const body = await req.json();

  try {
    const { remetente, destinatario, carga, contato, observacoes } = body;

    if (!remetente?.document || !destinatario?.document) {
      return new Response(JSON.stringify({ error: "Remetente e destinatario obrigatorios" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    // Le token do Supabase
    const { data: registro, error: readError } = await supabase
      .from("dbfrete_token")
      .select("*")
      .single();

    if (readError) throw readError;

    let token = registro?.token;
    const expira_em = registro?.expira_em ? new Date(registro.expira_em) : null;
    const agora = new Date();

    if (!token || !expira_em || expira_em <= agora) {
      token = await getToken();
    }

    // Busca ID do remetente e destinatario
    const idRemetente = await fetchClienteId(remetente.document, token);
    const idDestinatario = await fetchClienteId(destinatario.document, token);

    /* -------- Montagem do JSON da cotacao -------- */
    let totPeso = 0;
    let totVolume = 0;
    let totM3 = 0;
    let totValorMerc = 0;
    let totPesoCubado = 0;

    const itens = carga.itens.map((item: any) => {
      const altura = item.dimensoes?.altura || 0;
      const comprimento = item.dimensoes?.comprimento || 0;
      const largura = item.dimensoes?.largura || 0;
      const m3 = altura * comprimento * largura;

      totPeso += item.peso || 0;
      totVolume += item.quantidade || 0;
      totM3 += m3;
      totValorMerc += item.valor || 0;
      totPesoCubado += item.pesoCubado || 0;

      return {
        vlrMerc: item.valor,
        un: "UN",
        peso: item.peso,
        vol: item.quantidade,
        a: altura,
        b: comprimento,
        c: largura,
        pesoCubado: item.pesoCubado,
        m3,
        obs: item.observacoes || "Carga automatizada",
      };
    });

    const tipoFrete = body.tipoFrete?.toLowerCase() || "cif";
    const idCliente = tipoFrete === "fob" ? idDestinatario : idRemetente;
    const idTomador = idCliente;
    
    // Montagem do JSON da cotacao
    const cotacaoPayload = {
      pos: "D",
      idOrcamento: 0,
      contato: contato?.name || "Nao informado",
      idEmpresa: 1,
      idCliente,
      idRemetente,
      idDestinatario,
      idTomador,
      idConsignatario: 0,
      idTabela: 1,
      cidadeOrigem: remetente.address.city,
      ufOrigem: remetente.address.state,
      cidadeDestino: destinatario.address.city,
      ufDestino: destinatario.address.state,
      coleta: 0,
      entrega: 0,
      fretePeso: 0,
      freteValor: 0,
      secat: 0,
      outros: 0,
      pedagio: 0,
      gris: 0,
      tde: 0,
      tas: 0,
      agenda: 0,
      restricao: 0,
      tda: 0,
      somarICM: false,
      km: 0,
      percICM: 12.0,
      valorTotal: 0,
      ddPgto: 15,
      validadeDias: 7,
      obs: observacoes || "",
      obsInterna: "",
      totPeso,
      totVolume,
      totM3,
      totValorMerc,
      totPesoCubado,
      descontoPerc: 0,
      previsao: new Date().toISOString(),
      descontoValor: 0,
      idCidadeOrigem: 3550308,
      idCidadeDestino: 4106902,
      rota: `${remetente.address.state}->${destinatario.address.state}`,
      vlrDespacho: 0,
      itens,
    };

    // Envia a cotacao para o endpoint
    const cotacaoResp = await sendCotacao(cotacaoPayload, token);
    return new Response(JSON.stringify(cotacaoResp), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (err: any) {
    console.error("Erro na funcao:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
