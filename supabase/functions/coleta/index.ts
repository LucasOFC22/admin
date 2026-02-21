import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const dbfreteLoginUrl = "https://dbfreteapi.dyndns-web.com/login";
const dbfreteColetaUrl = "https://dbfreteapi.dyndns-web.com/tms/coleta";
const dbfreteClientesUrl = "https://dbfreteapi.dyndns-web.com/tms/clientes/cadastro";

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token DB Frete nao encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  // Se token expirou ou nao existe (1 hora)
  if (!registro.token || (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000) {
    console.log("Renovando token DB Frete...");

    const response = await fetch(dbfreteLoginUrl, {
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

    console.log("Token renovado com sucesso");
    return data.token;
  }

  return registro.token;
}

// Busca dados do cliente pelo CNPJ/CPF na API DBFrete (retorna idCliente, idCidade e nome)
interface ClienteData {
  idCliente: number;
  idCidade: number;
  nome: string;
}

async function fetchClienteData(cnpjcpf: string, token: string): Promise<ClienteData> {
  const cleanDoc = cnpjcpf.replace(/\D/g, '');
  console.log(`Buscando cliente por CNPJ/CPF: ${cleanDoc}`);
  
  const url = `${dbfreteClientesUrl}?cnpjcpf=${encodeURIComponent(cleanDoc)}`;
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
  console.log(`Resultado busca cliente:`, JSON.stringify(data));

  if (!data || !data.idCliente) {
    throw new Error(`Cliente nao encontrado para CNPJ/CPF ${cleanDoc}`);
  }

  // Nome pode vir como razaoSocial, nomeCliente, nome ou nomeFantasia
  const nome = data.razaoSocial || data.nomeCliente || data.nome || data.nomeFantasia || "";

  return {
    idCliente: data.idCliente,
    idCidade: data.idCidade || 0,
    nome
  };
}

async function sendColeta(payload: any, token: string) {
  console.log("Enviando coleta para DB Frete:", JSON.stringify(payload, null, 2));

  const resp = await fetch(dbfreteColetaUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  console.log("Resposta DB Frete:", text);

  try {
    return JSON.parse(text);
  } catch {
    if (resp.status === 401) throw new Error("Token expirado ou invalido");
    throw new Error(text);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Requisicao recebida:", JSON.stringify(body, null, 2));

    const {
      idEmpresa = 2,
      tipoRegistro = "coleta",
      status = "PENDENTE",
      cidadeOrigem,
      ufOrigem,
      idCidadeOrigem,
      cidadeDestino,
      ufDestino,
      idCidadeDestino,
      idRemetente,
      nomeRemetente,
      cpfCnpjRemetente,
      cidadeRemetente,
      ufRemetente,
      bairroRemetente,
      idCidadeRemetente,
      idDestinatario,
      nomeDestinatario,
      cpfCnpjDestinatario,
      cidadeDestinatario,
      ufDestinatario,
      bairroDestinatario,
      idCidadeDestinatario,
      localColeta,
      localEntrega,
      nomeSolicitante = "",
      dataColeta,
      dataPrevisaoEntrega,
      horarioColeta,
      horarioInicioAtendimento = "",
      horarioFimAtendimento = "",
      paraAlmoco = false,
      horarioInicioAlmoco = "",
      horarioFimAlmoco = "",
      observacoes = "",
      totPeso,
      totVolume,
      totM3,
      totValorMerc,
      totPesoCubado,
      itens = []
    } = body;

    // Validacoes basicas - precisa de ID ou CNPJ para remetente e destinatario
    if ((!idRemetente || idRemetente === 0) && !cpfCnpjRemetente) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "idRemetente ou cpfCnpjRemetente e obrigatorio" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    if ((!idDestinatario || idDestinatario === 0) && !cpfCnpjDestinatario) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "idDestinatario ou cpfCnpjDestinatario e obrigatorio" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    // Busca token valido
    const token = await getToken();

    // Resolver IDs, idCidade e nomes - se nao tiver ID, busca pelo CNPJ
    let finalIdRemetente = idRemetente || 0;
    let finalIdCidadeRemetente = idCidadeRemetente || 0;
    let finalNomeRemetente = nomeRemetente || "";
    let finalIdDestinatario = idDestinatario || 0;
    let finalIdCidadeDestinatario = idCidadeDestinatario || 0;
    let finalNomeDestinatario = nomeDestinatario || "";

    if (!finalIdRemetente && cpfCnpjRemetente) {
      console.log("Buscando dados do remetente pelo CNPJ...");
      const remetenteDataApi = await fetchClienteData(cpfCnpjRemetente, token);
      finalIdRemetente = remetenteDataApi.idCliente;
      finalIdCidadeRemetente = remetenteDataApi.idCidade;
      // Usar o nome retornado pela API do DBFrete
      if (remetenteDataApi.nome) {
        finalNomeRemetente = remetenteDataApi.nome;
      }
      console.log(`Remetente encontrado: ID=${finalIdRemetente}, idCidade=${finalIdCidadeRemetente}, nome=${finalNomeRemetente}`);
    }

    if (!finalIdDestinatario && cpfCnpjDestinatario) {
      console.log("Buscando dados do destinatario pelo CNPJ...");
      const destinatarioDataApi = await fetchClienteData(cpfCnpjDestinatario, token);
      finalIdDestinatario = destinatarioDataApi.idCliente;
      finalIdCidadeDestinatario = destinatarioDataApi.idCidade;
      // Usar o nome retornado pela API do DBFrete
      if (destinatarioDataApi.nome) {
        finalNomeDestinatario = destinatarioDataApi.nome;
      }
      console.log(`Destinatario encontrado: ID=${finalIdDestinatario}, idCidade=${finalIdCidadeDestinatario}, nome=${finalNomeDestinatario}`);
    }

    // Monta payload da coleta com novos nomes de campos
    const coletaPayload = {
      idColeta: 0, // API retorna o ID gerado
      idEmpresa: 2,
      tipoRegistro,
      status,
      cidadeOrigem: cidadeOrigem || localColeta?.cidade || cidadeRemetente || "",
      ufOrigem: ufOrigem || localColeta?.uf || ufRemetente || "",
      idCidadeOrigem: idCidadeOrigem || localColeta?.idCidade || finalIdCidadeRemetente || 0,
      cidadeDestino: cidadeDestino || localEntrega?.cidade || cidadeDestinatario || "",
      ufDestino: ufDestino || localEntrega?.uf || ufDestinatario || "",
      idCidadeDestino: idCidadeDestino || localEntrega?.idCidade || finalIdCidadeDestinatario || 0,
      idRemetente: finalIdRemetente,
      nomeRemetente: finalNomeRemetente,
      cpfCnpjRemetente: cpfCnpjRemetente || "",
      cidadeRemetente: cidadeRemetente || "",
      ufRemetente: ufRemetente || "",
      bairroRemetente: bairroRemetente || "",
      idCidadeRemetente: finalIdCidadeRemetente,
      idDestinatario: finalIdDestinatario,
      nomeDestinatario: finalNomeDestinatario,
      cpfCnpjDestinatario: cpfCnpjDestinatario || "",
      cidadeDestinatario: cidadeDestinatario || "",
      ufDestinatario: ufDestinatario || "",
      bairroDestinatario: bairroDestinatario || "",
      idCidadeDestinatario: finalIdCidadeDestinatario,
      localColeta: {
        cep: localColeta?.cep?.replace(/\D/g, '') || "",
        endereco: localColeta?.endereco || "",
        bairro: localColeta?.bairro || "",
        cidade: localColeta?.cidade || "",
        uf: localColeta?.uf || "",
        idCidade: localColeta?.idCidade || finalIdCidadeRemetente || null,
      },
      localEntrega: {
        cep: localEntrega?.cep?.replace(/\D/g, '') || "",
        endereco: localEntrega?.endereco || "",
        bairro: localEntrega?.bairro || "",
        cidade: localEntrega?.cidade || "",
        uf: localEntrega?.uf || "",
        idCidade: localEntrega?.idCidade || finalIdCidadeDestinatario || null,
      },
      nomeSolicitante,
      dataColeta: dataColeta || new Date().toISOString().split('T')[0],
      dataPrevisaoEntrega: dataPrevisaoEntrega || null,
      horarioColeta: horarioColeta || "",
      horarioInicioAtendimento,
      horarioFimAtendimento,
      paraAlmoco,
      horarioInicioAlmoco,
      horarioFimAlmoco,
      observacoes,
      totPeso: totPeso || itens.reduce((acc: number, item: any) => acc + (item.peso || 0), 0),
      totVolume: totVolume || itens.reduce((acc: number, item: any) => acc + (item.volume || 0), 0),
      totM3: totM3 || itens.reduce((acc: number, item: any) => acc + (item.m3 || 0), 0),
      totValorMerc: totValorMerc || itens.reduce((acc: number, item: any) => acc + (item.valorMercadoria || 0), 0),
      totPesoCubado: totPesoCubado || itens.reduce((acc: number, item: any) => acc + (item.pesoCubado || 0), 0),
      itens: itens.map((item: any) => ({
        numeroNf: item.numeroNf || "",
        chaveAcessoNfe: item.chaveAcessoNfe || "",
        peso: item.peso || 0,
        valorMercadoria: item.valorMercadoria || 0,
        tipoMercadoria: item.tipoMercadoria || "",
        natureza: item.natureza || "",
        altura: item.altura || 0,
        largura: item.largura || 0,
        profundidade: item.profundidade || 0,
        volume: item.volume || 0,
        un: "kg",
        m3: item.m3 || 0,
        pesoCubado: item.pesoCubado || (item.m3 * 300) || 0,
        observacoes: item.observacoes || ""
      }))
    };
    console.log("Payload final da coleta:", JSON.stringify(coletaPayload, null, 2));
    
    // Envia coleta para DB Frete
    const coletaResp = await sendColeta(coletaPayload, token);

    console.log("Coleta criada com sucesso:", coletaResp);

    return new Response(JSON.stringify({
      success: true,
      data: coletaResp
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (err: any) {
    console.error("Erro na funcao dbfrete-coleta:", err);

    // Salva o erro na tabela erros com payload completo
    try {
      const body = await req.clone().json().catch(() => ({}));
      await supabase.from("erros").insert({
        titulo: "Erro na solicitacao de coleta",
        descricao: err.message || "Erro desconhecido",
        categoria: "coleta",
        pagina: "/area-cliente/solicitar-coleta",
        nivel: "error",
        tipo: "api",
        dados_extra: {
          payload: body,
          stack: err.stack || null,
          timestamp: new Date().toISOString()
        },
        resolvido: false,
        data_ocorrencia: new Date().toISOString()
      });
      console.log("Erro salvo na tabela erros");
    } catch (logErr) {
      console.error("Falha ao salvar erro na tabela:", logErr);
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: err.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
