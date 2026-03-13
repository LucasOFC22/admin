import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// --- Supabase ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- DBFrete ---
const DBFRETE = {
  FATURAS: "https://dbfreteapi.dyndns-web.com/tms/financeiro/fatura/",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

// --- Função para pegar token ---
async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").maybeSingle();
  if (error || !registro) throw new Error("Registro de token não encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

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
    if (!data.token) throw new Error("Não foi possível renovar token DBFrete");

    await supabase.from("dbfrete_token").update({
      token: data.token,
      atualizado_em: new Date().toISOString(),
    }).eq("id", registro.id);

    return data.token;
  }

  return registro.token;
}

// --- Converter ArrayBuffer para Base64 ---
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- Buscar uma fatura ---
async function fetchFatura(token: string, idTitulo: string): Promise<{
  id: string;
  success: boolean;
  base64?: string;
  contentType?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const response = await fetch(DBFRETE.FATURAS + idTitulo, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error(`[DBFrete] Erro ao buscar fatura ${idTitulo}: ${txt}`);
      return {
        id: idTitulo,
        success: false,
        error: txt || `HTTP ${response.status}`,
      };
    }

    const pdfArrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(pdfArrayBuffer);

    return {
      id: idTitulo,
      success: true,
      base64: base64,
      contentType: "application/pdf",
      filename: `fatura_${idTitulo}.pdf`,
    };
  } catch (err) {
    console.error(`[DBFrete] Exceção ao buscar fatura ${idTitulo}:`, err);
    return {
      id: idTitulo,
      success: false,
      error: (err as Error).message,
    };
  }
}

// --- Servidor ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let idsTitulos: string[] = [];

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const pathParts = url.pathname.split("/").filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];

      if (lastPart && lastPart !== 'pdf-fatura') {
        idsTitulos = lastPart.split(',').map(id => id.trim()).filter(Boolean);
      }

      const idsParam = url.searchParams.get('ids');
      if (idsParam) {
        idsTitulos = idsParam.split(',').map(id => id.trim()).filter(Boolean);
      }

      const idParam = url.searchParams.get('id');
      if (idParam && idsTitulos.length === 0) {
        idsTitulos = [idParam.trim()];
      }
    } else if (req.method === 'POST') {
      const body = await req.json();

      if (Array.isArray(body.ids)) {
        idsTitulos = body.ids.map((id: any) => String(id).trim()).filter(Boolean);
      } else if (body.id) {
        idsTitulos = String(body.id).split(',').map(id => id.trim()).filter(Boolean);
      } else if (body.idTitulo) {
        idsTitulos = String(body.idTitulo).split(',').map(id => id.trim()).filter(Boolean);
      } else if (Array.isArray(body)) {
        idsTitulos = body.map((id: any) => String(id).trim()).filter(Boolean);
      }
    }

    idsTitulos = [...new Set(idsTitulos)];

    if (idsTitulos.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Nenhum ID de título fornecido. Use GET /id ou POST com { ids: [...] }" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getToken();

    // Se for apenas 1 fatura e GET, retorna o PDF binário direto (compatibilidade)
    if (idsTitulos.length === 1 && req.method === 'GET') {
      const response = await fetch(DBFRETE.FATURAS + idsTitulos[0], {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!response.ok) {
        const txt = await response.text();
        return new Response(JSON.stringify({ error: txt }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const pdfArrayBuffer = await response.arrayBuffer();

      return new Response(pdfArrayBuffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename=Fatura_${idsTitulos[0]}.pdf`,
        },
      });
    }

    // Múltiplas faturas ou POST - retorna JSON com base64
    const resultados = await Promise.all(
      idsTitulos.map(id => fetchFatura(token, id))
    );

    if (idsTitulos.length === 1) {
      const resultado = resultados[0];
      if (!resultado.success) {
        return new Response(JSON.stringify({ 
          error: resultado.error, id: resultado.id 
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

    // Múltiplas faturas
    const sucessos = resultados.filter(r => r.success);
    const erros = resultados.filter(r => !r.success);

    return new Response(JSON.stringify({
      total: idsTitulos.length,
      sucessos: sucessos.length,
      erros: erros.length,
      faturas: resultados.map(r => ({
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
