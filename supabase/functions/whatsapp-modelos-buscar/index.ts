import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const fetchWithTimeout = async (url: string, token: string, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    const raw = await response.text();
    let parsed: unknown = null;

    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }
    }

    return { response, data: parsed };
  } finally {
    clearTimeout(timeoutId);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    let payload: { conexaoId?: string };

    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: "Body JSON inválido" }, 400);
    }

    const conexaoId = payload?.conexaoId?.trim();

    if (!conexaoId) {
      return jsonResponse({ error: "conexaoId é obrigatório" }, 400);
    }

    console.info("[whatsapp-modelos-buscar] Buscando templates", { conexaoId });

    const supabase = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: conexao, error: conexaoError } = await supabase
      .from("conexoes")
      .select("id, nome, whatsapp_token, whatsapp_business_account_id")
      .eq("id", conexaoId)
      .maybeSingle();

    if (conexaoError) {
      console.error("[whatsapp-modelos-buscar] Erro ao buscar conexão", conexaoError);
      return jsonResponse({ error: "Erro ao buscar conexão", details: conexaoError.message }, 500);
    }

    if (!conexao) {
      return jsonResponse({ error: "Conexão não encontrada" }, 404);
    }

    if (!conexao.whatsapp_token) {
      return jsonResponse({ error: "Token WhatsApp não configurado para esta conexão" }, 400);
    }

    if (!conexao.whatsapp_business_account_id) {
      return jsonResponse({ error: "WhatsApp Business Account ID não configurado" }, 400);
    }

    const metaUrl = `https://graph.facebook.com/v21.0/${conexao.whatsapp_business_account_id}/message_templates?limit=100&fields=id,name,category,language,status,components,quality_score,rejected_reason`;
    const { response: metaResponse, data: metaData } = await fetchWithTimeout(metaUrl, conexao.whatsapp_token);

    if (!metaResponse.ok) {
      console.error("[whatsapp-modelos-buscar] Erro na API do Meta", {
        status: metaResponse.status,
        details: metaData,
      });

      return jsonResponse(
        {
          error: "Erro ao buscar templates do WhatsApp",
          status: metaResponse.status,
          details: metaData,
        },
        metaResponse.status,
      );
    }

    const templates = (((metaData as Record<string, any> | null)?.data ?? []) as any[]).map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category || "UTILITY",
      language: template.language || "pt_BR",
      status: template.status?.toLowerCase() || "pending",
      components: template.components || [],
      quality_score: template.quality_score,
      rejected_reason: template.rejected_reason,
    }));

    return jsonResponse({
      success: true,
      data: templates,
      total: templates.length,
      conexao: conexao.nome,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor";
    console.error("[whatsapp-modelos-buscar] Erro não tratado", error);
    return jsonResponse({ error: message }, 500);
  }
});
