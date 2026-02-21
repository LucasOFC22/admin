import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const dbfreteLoginUrl = "https://dbfreteapi.dyndns-web.com/login";
const dbfreteTrackingUrl = "https://dbfreteapi.dyndns-web.com/ocorrencias/trackingNota";
const dbfreteClientesUrl = "https://dbfreteapi.dyndns-web.com/tms/clientes/cadastro";
const dbfreteColetaUrl = "https://dbfreteapi.dyndns-web.com/tms/coleta";

const supabase = createClient(supabaseUrl, supabaseKey);

async function registerError(data: any) {
  await supabase.from("erros").insert([{
    titulo: data.titulo || "Erro desconhecido",
    descricao: data.descricao || "",
    usuario_id: data.usuario_id || null,
    categoria: "Programador",
    pagina: data.pagina || "dbfrete-tracking",
    nivel: data.nivel || "critical",
    ip_usuario: data.ip_usuario || null,
    user_agent: data.user_agent || null,
    dados_extra: data.dados_extra || null,
  }]);
}

// --- Funcao para obter token com logging melhorado ---
async function getToken() {
  console.log(`[getToken] Buscando registro de token no banco`);
  
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").maybeSingle();
  
  if (error) {
    console.log(`[getToken] Erro ao buscar registro: ${error.message}`);
    throw new Error(`Erro ao buscar registro de token: ${error.message}`);
  }
  
  if (!registro) {
    console.log(`[getToken] Registro de token nao encontrado na tabela dbfrete_token`);
    throw new Error("Registro de token DB Frete nao encontrado na tabela dbfrete_token");
  }

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  if (!registro.token || (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000) {
    console.log(`[getToken] Token expirado ou inexistente. Renovando via ${dbfreteLoginUrl}`);
    
    let response: Response;
    try {
      response = await fetch(dbfreteLoginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: registro.usuario,
          senha: registro.senha,
          id_cliente: registro.id_cliente,
        }),
      });
    } catch (fetchError: any) {
      console.log(`[getToken] Erro de rede ao chamar login: ${fetchError.message}`);
      throw new Error(`Erro de rede ao renovar token: ${fetchError.message}`);
    }

    const text = await response.text();
    console.log(`[getToken] Status: ${response.status}, Body (preview): ${text.substring(0, 300)}`);

    if (!response.ok) {
      const errorMsg = text.trim() || `HTTP ${response.status} sem body`;
      throw new Error(`Erro ao renovar token: HTTP ${response.status} - ${errorMsg.substring(0, 200)}`);
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Resposta inesperada ao renovar token (nao e JSON): ${text.substring(0, 200)}`);
    }

    if (!data.token) {
      console.log(`[getToken] Resposta nao contem token: ${JSON.stringify(data).substring(0, 300)}`);
      throw new Error("Nao foi possivel renovar token DB Frete - resposta sem campo token");
    }

    await supabase
      .from("dbfrete_token")
      .update({ token: data.token, atualizado_em: new Date().toISOString() })
      .eq("id", registro.id);

    console.log(`[getToken] Token renovado com sucesso`);
    return data.token;
  }

  console.log(`[getToken] Token ainda valido, retornando do cache`);
  return registro.token;
}

// --- Funcao callTracking com logging melhorado ---
async function callTracking(cpfcnpj: string, nro_nf: string, token: string) {
  console.log(`[callTracking] Chamando ${dbfreteTrackingUrl} com cpfcnpj=${cpfcnpj}, nro_nf=${nro_nf}`);
  
  let resp: Response;
  try {
    resp = await fetch(dbfreteTrackingUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cpfcnpj, nro_nf }),
    });
  } catch (fetchError: any) {
    console.log(`[callTracking] Erro de rede: ${fetchError.message}`);
    throw new Error(`Erro de rede ao chamar tracking: ${fetchError.message}`);
  }

  const text = await resp.text();
  console.log(`[callTracking] Status: ${resp.status}, Body (preview): ${text.substring(0, 500)}`);

  // Se status não for OK, lançar erro com detalhes
  if (!resp.ok) {
    const errorMsg = text.trim() || `HTTP ${resp.status} sem body`;
    if (resp.status === 401) {
      throw new Error("Token expirado ou invalido");
    }
    throw new Error(`Erro DBFrete: ${resp.status} - ${errorMsg.substring(0, 200)}`);
  }

  // Tentar parsear JSON
  try {
    return JSON.parse(text);
  } catch {
    if (text.trim() === '') {
      throw new Error(`Resposta vazia do servidor DBFrete (status ${resp.status})`);
    }
    throw new Error(`Resposta nao e JSON valido: ${text.substring(0, 200)}`);
  }
}

// --- Buscar idCliente pelo CPF/CNPJ ---
async function getClienteId(cpfcnpj: string, token: string): Promise<string | null> {
  console.log(`[getClienteId] Buscando cliente por CPF/CNPJ: ${cpfcnpj}`);
  
  const cleanCpfCnpj = cpfcnpj.replace(/\D/g, '');
  const url = `${dbfreteClientesUrl}?cnpjcpf=${cleanCpfCnpj}`;
  
  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  } catch (fetchError: any) {
    console.log(`[getClienteId] Erro de rede: ${fetchError.message}`);
    return null;
  }

  const text = await resp.text();
  console.log(`[getClienteId] Resposta status: ${resp.status}, Body (preview): ${text.substring(0, 300)}`);

  try {
    const data = JSON.parse(text);
    
    if (Array.isArray(data) && data.length > 0) {
      const idCliente = data[0].idCliente || data[0].id_cliente || data[0].id;
      console.log(`[getClienteId] idCliente encontrado: ${idCliente}`);
      return idCliente?.toString() || null;
    }
    
    if (data.idCliente || data.id_cliente || data.id) {
      const idCliente = data.idCliente || data.id_cliente || data.id;
      console.log(`[getClienteId] idCliente encontrado: ${idCliente}`);
      return idCliente?.toString() || null;
    }
    
    console.log(`[getClienteId] Cliente nao encontrado`);
    return null;
  } catch {
    console.log(`[getClienteId] Erro ao parsear resposta`);
    return null;
  }
}

// --- Buscar coletas por idCliente (como remetente ou destinatario) ---
async function buscarColetasPorCliente(idCliente: string, token: string): Promise<any[]> {
  console.log(`[buscarColetasPorCliente] Buscando coletas para idCliente: ${idCliente}`);
  
  let remetenteResp: Response;
  let destinatarioResp: Response;
  
  try {
    [remetenteResp, destinatarioResp] = await Promise.all([
      fetch(`${dbfreteColetaUrl}?id_remetente=${idCliente}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      fetch(`${dbfreteColetaUrl}?id_destinatario=${idCliente}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
    ]);
  } catch (fetchError: any) {
    console.log(`[buscarColetasPorCliente] Erro de rede: ${fetchError.message}`);
    return [];
  }

  let coletasRemetente: any[] = [];
  let coletasDestinatario: any[] = [];

  try {
    const textRem = await remetenteResp.text();
    console.log(`[buscarColetasPorCliente] Remetente status: ${remetenteResp.status}`);
    const dataRem = JSON.parse(textRem);
    if (Array.isArray(dataRem)) {
      coletasRemetente = dataRem;
    } else if (dataRem.data && Array.isArray(dataRem.data)) {
      coletasRemetente = dataRem.data;
    }
    console.log(`[buscarColetasPorCliente] Coletas como remetente: ${coletasRemetente.length}`);
  } catch (e) {
    console.log(`[buscarColetasPorCliente] Erro ao buscar coletas como remetente: ${e}`);
  }

  try {
    const textDest = await destinatarioResp.text();
    console.log(`[buscarColetasPorCliente] Destinatario status: ${destinatarioResp.status}`);
    const dataDest = JSON.parse(textDest);
    if (Array.isArray(dataDest)) {
      coletasDestinatario = dataDest;
    } else if (dataDest.data && Array.isArray(dataDest.data)) {
      coletasDestinatario = dataDest.data;
    }
    console.log(`[buscarColetasPorCliente] Coletas como destinatario: ${coletasDestinatario.length}`);
  } catch (e) {
    console.log(`[buscarColetasPorCliente] Erro ao buscar coletas como destinatario: ${e}`);
  }

  // Combinar e remover duplicatas
  const todasColetas = [...coletasRemetente, ...coletasDestinatario];
  const coletasUnicas = todasColetas.reduce((acc: any[], coleta) => {
    const id = coleta.idColeta || coleta.id_coleta || coleta.id || coleta.nroColeta || coleta.nro_coleta;
    if (!acc.find(c => (c.idColeta || c.id_coleta || c.id || c.nroColeta || c.nro_coleta) === id)) {
      acc.push(coleta);
    }
    return acc;
  }, []);

  console.log(`[buscarColetasPorCliente] Total de coletas unicas: ${coletasUnicas.length}`);
  return coletasUnicas;
}

// --- Filtrar coletas por numero da NF ---
function filtrarColetasPorNF(coletas: any[], nro_nf: string): any[] {
  if (!nro_nf) return coletas;
  
  const nfBusca = nro_nf.replace(/\D/g, '');
  console.log(`[filtrarColetasPorNF] Filtrando por NF: ${nfBusca}`);
  
  return coletas.filter(coleta => {
    // Verificar no array de itens
    const itens = coleta.itens || coleta.Itens || [];
    const temNF = itens.some((item: any) => {
      const nfItem = (item.nroNf || item.nro_nf || item.numeroNf || item.numero_nf || '').toString().replace(/\D/g, '');
      return nfItem === nfBusca || nfItem.includes(nfBusca) || nfBusca.includes(nfItem);
    });
    
    // Verificar campos diretos da coleta
    const nfColeta = (coleta.nroNf || coleta.nro_nf || coleta.numeroNf || coleta.numero_nf || '').toString().replace(/\D/g, '');
    const temNFDireta = nfColeta === nfBusca || nfColeta.includes(nfBusca) || nfBusca.includes(nfColeta);
    
    return temNF || temNFDireta;
  });
}

// --- Transformar coleta para formato de tracking ---
function transformarColetaParaTracking(coleta: any, cpfcnpj: string): any {
  console.log(`[transformarColetaParaTracking] Transformando coleta: ${JSON.stringify(coleta).substring(0, 500)}`);
  
  const itens = coleta.itens || coleta.Itens || [];
  const primeiroItem = itens[0] || {};
  
  // Calcular total de volumes
  const totalVolumes = itens.reduce((acc: number, item: any) => {
    return acc + (parseInt(item.qtdeVolumes || item.qtde_volumes || item.volumes || 0) || 0);
  }, 0);

  // Extrair informações
  const nroNf = primeiroItem.nroNf || primeiroItem.nro_nf || primeiroItem.numeroNf || coleta.nroNf || '';
  const remetente = coleta.nomeRemetente || coleta.nome_remetente || coleta.remetente || '';
  const destinatario = coleta.nomeDestinatario || coleta.nome_destinatario || coleta.destinatario || '';
  const status = coleta.status || coleta.Status || coleta.descStatus || coleta.desc_status || 'Em processamento';
  const dataColeta = coleta.dataColeta || coleta.data_coleta || coleta.dtColeta || coleta.dt_coleta || '';
  
  // Montar objeto no formato esperado pelo frontend
  const tracking = {
    nroNf: nroNf.toString(),
    remetente: remetente,
    destinatario: destinatario,
    cnpjCpfDestinatario: cpfcnpj,
    ultimoStatus: status,
    dataUltimoStatus: dataColeta,
    volumes: totalVolumes || itens.length || 1,
    peso: itens.reduce((acc: number, item: any) => acc + (parseFloat(item.peso || item.pesoReal || 0) || 0), 0),
    ocorrencias: [{
      data: dataColeta,
      descricao: status,
      tipo: 'coleta'
    }],
    // Dados extras da coleta
    nroColeta: coleta.nroColeta || coleta.nro_coleta || coleta.idColeta || '',
    cidadeOrigem: coleta.cidadeOrigem || coleta.cidade_origem || coleta.cidadeRemetente || '',
    cidadeDestino: coleta.cidadeDestino || coleta.cidade_destino || coleta.cidadeDestinatario || '',
    ufOrigem: coleta.ufOrigem || coleta.uf_origem || coleta.ufRemetente || '',
    ufDestino: coleta.ufDestino || coleta.uf_destino || coleta.ufDestinatario || '',
    // Flag para indicar origem dos dados
    origem: 'coleta',
    coletaOriginal: coleta
  };

  console.log(`[transformarColetaParaTracking] Tracking gerado: ${JSON.stringify(tracking).substring(0, 500)}`);
  return tracking;
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }

  try {
    const { cpfcnpj, nro_nf } = body;

    if (!cpfcnpj || !nro_nf) {
      return new Response(JSON.stringify({ error: "CPF/CNPJ e NFe obrigatorios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    console.log(`[rastreamento] Iniciando rastreamento para cpfcnpj=${cpfcnpj}, nro_nf=${nro_nf}`);

    let token: string;
    try {
      token = await getToken();
    } catch (tokenErr: any) {
      console.log(`[rastreamento] Erro ao obter token: ${tokenErr.message}`);
      await registerError({
        titulo: "Erro ao obter token DB Frete",
        descricao: tokenErr.message,
        nivel: "error",
        dados_extra: { cpfcnpj, nro_nf },
        ip_usuario: req.headers.get("x-forwarded-for") || null,
        user_agent: req.headers.get("user-agent") || null,
      });
      
      return new Response(JSON.stringify({ 
        error: "Erro ao conectar com DB Frete",
        details: tokenErr.message,
        code: 503
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    let trackingData: any = null;
    let usouFallback = false;
    let trackingError: Error | null = null;

    // Tentar callTracking - não relançar erro para permitir fallback
    try {
      trackingData = await callTracking(cpfcnpj, nro_nf, token);
      console.log(`[rastreamento] Resposta do trackingNota: ${JSON.stringify(trackingData).substring(0, 500)}`);
    } catch (err: any) {
      console.log(`[rastreamento] Erro no callTracking: ${err.message}`);
      trackingError = err;
      
      // Tentar renovar token se expirado
      if (err.message.includes("Token expirado") || err.message.includes("401")) {
        console.log(`[rastreamento] Token expirado, tentando renovar...`);
        try {
          token = await getToken();
          trackingData = await callTracking(cpfcnpj, nro_nf, token);
          trackingError = null; // Reset error se funcionou
          console.log(`[rastreamento] Retry apos renovar token OK: ${JSON.stringify(trackingData).substring(0, 500)}`);
        } catch (retryErr: any) {
          console.log(`[rastreamento] Erro apos renovar token: ${retryErr.message}`);
          trackingError = retryErr;
        }
      }
      
      // Registrar erro para análise (mas não falhar ainda - vamos tentar fallback)
      if (trackingError) {
        await registerError({
          titulo: "Erro no tracking DB Frete",
          descricao: trackingError.message,
          nivel: "warning",
          dados_extra: { cpfcnpj, nro_nf, willTryFallback: true },
          ip_usuario: req.headers.get("x-forwarded-for") || null,
          user_agent: req.headers.get("user-agent") || null,
        });
      }
    }

    // Verificar se o tracking retornou dados validos OU se houve erro
    const trackingVazio = 
      trackingError ||
      !trackingData || 
      trackingData.code === 500 || 
      trackingData.error ||
      (Array.isArray(trackingData) && trackingData.length === 0) ||
      (trackingData.message && trackingData.message.toLowerCase().includes('não encontrad'));

    console.log(`[rastreamento] Tracking vazio/erro: ${trackingVazio}, trackingError: ${trackingError?.message || 'null'}`);

    // Fallback: buscar nas coletas se tracking não retornou dados
    if (trackingVazio) {
      console.log(`[rastreamento] Iniciando fallback para busca em coletas`);
      
      try {
        // Buscar idCliente pelo CPF/CNPJ
        const idCliente = await getClienteId(cpfcnpj, token);
        
        if (idCliente) {
          // Buscar coletas onde o cliente é remetente ou destinatário
          const coletas = await buscarColetasPorCliente(idCliente, token);
          
          // Filtrar por número da NF
          const coletasFiltradas = filtrarColetasPorNF(coletas, nro_nf);
          
          console.log(`[rastreamento] Coletas encontradas apos filtro: ${coletasFiltradas.length}`);
          
          if (coletasFiltradas.length > 0) {
            // Transformar a primeira coleta encontrada para formato de tracking
            trackingData = transformarColetaParaTracking(coletasFiltradas[0], cpfcnpj);
            usouFallback = true;
            trackingError = null; // Limpar erro já que fallback funcionou
            
            // Se houver mais coletas, adicionar informação
            if (coletasFiltradas.length > 1) {
              trackingData.totalColetasEncontradas = coletasFiltradas.length;
              trackingData.outrasColetas = coletasFiltradas.slice(1, 5).map((c: any) => ({
                nroColeta: c.nroColeta || c.nro_coleta || c.idColeta,
                status: c.status || c.Status || c.descStatus,
                dataColeta: c.dataColeta || c.data_coleta
              }));
            }
          } else {
            console.log(`[rastreamento] Nenhuma coleta encontrada para NF ${nro_nf}`);
          }
        } else {
          console.log(`[rastreamento] Cliente nao encontrado pelo CPF/CNPJ ${cpfcnpj}`);
        }
      } catch (fallbackErr: any) {
        console.log(`[rastreamento] Erro no fallback de coletas: ${fallbackErr.message}`);
        // Não falhar completamente, apenas logar o erro do fallback
        await registerError({
          titulo: "Erro no fallback de coletas",
          descricao: fallbackErr.message,
          nivel: "warning",
          dados_extra: { cpfcnpj, nro_nf },
          ip_usuario: req.headers.get("x-forwarded-for") || null,
          user_agent: req.headers.get("user-agent") || null,
        });
      }
    }

    // Adicionar flag de origem se usou fallback
    if (usouFallback && trackingData) {
      trackingData.origem = 'coleta';
    }

    // Se após tudo não houver dados, retornar resposta clara
    if (!trackingData || (trackingData.error && !usouFallback)) {
      console.log(`[rastreamento] Nenhum dado encontrado apos tracking e fallback`);
      return new Response(JSON.stringify({
        code: 404,
        error: "Mercadoria não encontrada",
        message: "Não foi possível localizar a mercadoria com os dados informados",
        consulta: { cpfcnpj, nro_nf },
        debugInfo: trackingError?.message || null
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    return new Response(JSON.stringify(trackingData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (err: any) {
    console.error(`[rastreamento] Erro geral: ${err.message}`, err);
    
    await registerError({
      titulo: "Erro geral na Edge Function",
      descricao: err.message || 'Erro desconhecido',
      dados_extra: body,
      ip_usuario: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    return new Response(JSON.stringify({ 
      error: err.message || 'Erro interno',
      code: 500
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }
});
