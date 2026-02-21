import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- DBFrete ---
const DBFRETE = {
  BOLETOS: "https://dbfreteapi.dyndns-web.com/tms/financeiro/boleto/",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- FunÃÂÃÂ§ÃÂÃÂ£o para pegar token ---
async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").maybeSingle();
  if (error || !registro) throw new Error("Registro de token nÃÂÃÂ£o encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  // Se token estiver vazio ou expirado (>1h)
  if (!registro.token || (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000) {
    const res = await fetch(DBFRETE.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: registro.usuario,
        senha: registro.senha,
        id_cliente: registro.id_cliente,
      }),
    });
    const data = await res.json();
    if (!data.token) throw new Error("NÃÂÃÂ£o foi possÃÂÃÂ­vel renovar token DBFrete");

    await supabase.from("dbfrete_token").update({
      token: data.token,
      atualizado_em: new Date().toISOString(),
    }).eq("id", registro.id);
    return data.token;
  }

  return registro.token;
}

// --- FunÃÂÃÂ§ÃÂÃÂ£o para converter ArrayBuffer para Base64 ---
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- FunÃÂÃÂ§ÃÂÃÂ£o para buscar um boleto ---
async function fetchBoleto(token: string, idBoleto: string): Promise<{
  id: string;
  success: boolean;
  base64?: string;
  contentType?: string;
  filename?: string;
  error?: string;
}> {
  try {
    
    const response = await fetch(DBFRETE.BOLETOS + idBoleto, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error(`[DBFrete] Erro ao buscar boleto ${idBoleto}: ${txt}`);
      return {
        id: idBoleto,
        success: false,
        error: txt || `HTTP ${response.status}`,
      };
    }

    const pdfArrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(pdfArrayBuffer);
    
    return {
      id: idBoleto,
      success: true,
      base64: base64,
      contentType: "application/pdf",
      filename: `boleto_${idBoleto}.pdf`,
    };
  } catch (err) {
    console.error(`[DBFrete] ExceÃÂÃÂ§ÃÂÃÂ£o ao buscar boleto ${idBoleto}:`, err);
    return {
      id: idBoleto,
      success: false,
      error: (err as Error).message,
    };
  }
}

// --- Servidor ---
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let idsBoletos: string[] = [];
    
    // Suporta GET com query params ou POST com body JSON
    if (req.method === 'GET') {
      const url = new URL(req.url);
      
      // Tenta pegar do path primeiro
      const pathParts = url.pathname.split("/").filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      
      // Se o ÃÂÃÂºltimo part nÃÂÃÂ£o for o nome da funÃÂÃÂ§ÃÂÃÂ£o, usa como ID
      if (lastPart && lastPart !== 'dbfrete-boletos') {
        // Suporta mÃÂÃÂºltiplos IDs separados por vÃÂÃÂ­rgula no path
        idsBoletos = lastPart.split(',').map(id => id.trim()).filter(Boolean);
      }
      
      // Ou pega do query param 'ids'
      const idsParam = url.searchParams.get('ids');
      if (idsParam) {
        idsBoletos = idsParam.split(',').map(id => id.trim()).filter(Boolean);
      }
      
      // Ou pega do query param 'id' (singular)
      const idParam = url.searchParams.get('id');
      if (idParam && idsBoletos.length === 0) {
        idsBoletos = [idParam.trim()];
      }
    } else if (req.method === 'POST') {
      const body = await req.json();
      
      // Suporta { ids: ["123", "456"] } ou { id: "123" ou "123, 456" } ou { idBoleto: "123" }
      if (Array.isArray(body.ids)) {
        idsBoletos = body.ids.map((id: any) => String(id).trim()).filter(Boolean);
      } else if (body.id) {
        // Suporta ID ÃÂÃÂºnico ou mÃÂÃÂºltiplos separados por vÃÂÃÂ­rgula
        idsBoletos = String(body.id).split(',').map(id => id.trim()).filter(Boolean);
      } else if (body.idBoleto) {
        idsBoletos = String(body.idBoleto).split(',').map(id => id.trim()).filter(Boolean);
      } else if (body.idboleto) {
        idsBoletos = String(body.idboleto).split(',').map(id => id.trim()).filter(Boolean);
      } else if (Array.isArray(body)) {
        // Array direto de IDs
        idsBoletos = body.map((id: any) => String(id).trim()).filter(Boolean);
      }
    }

    if (idsBoletos.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Nenhum ID de boleto fornecido. Use GET /id ou POST com { ids: [...] }" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getToken();

    // Busca todos os boletos em paralelo
    const resultados = await Promise.all(
      idsBoletos.map(id => fetchBoleto(token, id))
    );

    // Se for apenas 1 boleto, retorna no formato simples para o flow
    if (idsBoletos.length === 1) {
      const resultado = resultados[0];
      
      if (!resultado.success) {
        return new Response(JSON.stringify({ 
          error: resultado.error,
          id: resultado.id 
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Formato compatÃÂÃÂ­vel com o flow document block
      return new Response(JSON.stringify({
        base64: resultado.base64,
        contentType: resultado.contentType,
        filename: resultado.filename,
        id: resultado.id,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // MÃÂÃÂºltiplos boletos - retorna array
    const sucessos = resultados.filter(r => r.success);
    const erros = resultados.filter(r => !r.success);

    return new Response(JSON.stringify({
      total: idsBoletos.length,
      sucessos: sucessos.length,
      erros: erros.length,
      boletos: resultados.map(r => ({
        id: r.id,
        success: r.success,
        base64: r.base64,
        contentType: r.contentType,
        filename: r.filename,
        error: r.error,
      })),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error('[DBFrete] Erro geral:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
