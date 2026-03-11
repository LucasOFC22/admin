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

    console.info("[whatsapp-business-info] Buscando dados da conexão", { conexaoId });

    const supabase = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: conexao, error: conexaoError } = await supabase
      .from("conexoes")
      .select("id, nome, status, telefone, is_default, whatsapp_token, whatsapp_phone_id, whatsapp_business_account_id")
      .eq("id", conexaoId)
      .maybeSingle();

    if (conexaoError) {
      console.error("[whatsapp-business-info] Erro ao buscar conexão", conexaoError);
      return jsonResponse({ error: "Erro ao buscar conexão", details: conexaoError.message }, 500);
    }

    if (!conexao) {
      return jsonResponse({ error: "Conexão não encontrada" }, 404);
    }

    const { whatsapp_token, whatsapp_phone_id, whatsapp_business_account_id } = conexao;

    if (!whatsapp_token || !whatsapp_phone_id) {
      return jsonResponse({ error: "Credenciais do WhatsApp não configuradas" }, 400);
    }

    const phoneInfoUrl = `https://graph.facebook.com/v21.0/${whatsapp_phone_id}?fields=verified_name,code_verification_status,display_phone_number,quality_rating,platform_type,throughput,is_official_business_account,name_status,messaging_limit_tier`;
    const { response: phoneInfoResponse, data: phoneInfoData } = await fetchWithTimeout(phoneInfoUrl, whatsapp_token);

    if (!phoneInfoResponse.ok) {
      console.error("[whatsapp-business-info] Falha ao buscar phone info", phoneInfoData);
      return jsonResponse(
        {
          error: "Erro ao consultar Meta Graph API",
          status: phoneInfoResponse.status,
          details: phoneInfoData,
        },
        phoneInfoResponse.status,
      );
    }

    const phoneInfo = (phoneInfoData ?? {}) as Record<string, any>;

    let profilePictureUrl: string | null = null;
    try {
      const profilePictureUrlApi = `https://graph.facebook.com/v21.0/${whatsapp_phone_id}/whatsapp_business_profile?fields=profile_picture_url`;
      const { response: profileResponse, data: profileData } = await fetchWithTimeout(profilePictureUrlApi, whatsapp_token);

      if (profileResponse.ok && profileData && typeof profileData === "object") {
        profilePictureUrl = (profileData as Record<string, any>)?.data?.[0]?.profile_picture_url ?? null;
      } else if (!profileResponse.ok) {
        console.warn("[whatsapp-business-info] Falha ao buscar foto do perfil", profileData);
      }
    } catch (error) {
      console.warn("[whatsapp-business-info] Erro ao buscar foto do perfil", error);
    }

    let accountInfo: Record<string, any> | null = null;
    const wabaId = whatsapp_business_account_id;

    if (wabaId) {
      try {
        const accountUrl = `https://graph.facebook.com/v21.0/${wabaId}?fields=id,name,currency,timezone_id,message_template_namespace,account_review_status,business_verification_status,ownership_type`;
        const { response: accountResponse, data: accountData } = await fetchWithTimeout(accountUrl, whatsapp_token);

        if (accountResponse.ok && accountData && typeof accountData === "object") {
          accountInfo = accountData as Record<string, any>;
        } else if (!accountResponse.ok) {
          console.warn("[whatsapp-business-info] Falha ao buscar WABA info", accountData);
        }
      } catch (error) {
        console.warn("[whatsapp-business-info] Erro ao buscar WABA info", error);
      }
    }

    const messagingLimits: Record<string, string> = {
      TIER_1K: "1.000 Conversas / 24 horas",
      TIER_10K: "10.000 Conversas / 24 horas",
      TIER_100K: "100.000 Conversas / 24 horas",
      TIER_UNLIMITED: "Ilimitado",
      LIMITED: "Limitado",
      STANDARD: "Padrão",
    };

    const result = {
      phone: {
        id: whatsapp_phone_id,
        display_phone_number: phoneInfo.display_phone_number || conexao.telefone,
        verified_name: phoneInfo.verified_name || conexao.nome,
        quality_rating: phoneInfo.quality_rating || "GREEN",
        platform_type: phoneInfo.platform_type || "CLOUD_API",
        name_status: phoneInfo.name_status || "APPROVED",
        code_verification_status: phoneInfo.code_verification_status || "NOT_VERIFIED",
        is_official_business_account: phoneInfo.is_official_business_account || false,
        messaging_limit_tier: phoneInfo.messaging_limit_tier || "TIER_1K",
        messaging_limit_display: messagingLimits[phoneInfo.messaging_limit_tier] || messagingLimits.TIER_1K,
        throughput: phoneInfo.throughput || { level: "STANDARD" },
      },
      profile_picture_url: profilePictureUrl,
      account: accountInfo
        ? {
            id: accountInfo.id,
            name: accountInfo.name,
            currency: accountInfo.currency || "BRL",
            timezone_id: accountInfo.timezone_id,
            account_review_status: accountInfo.account_review_status || "APPROVED",
            business_verification_status: accountInfo.business_verification_status || "verified",
            ownership_type: accountInfo.ownership_type || "OWNED_BY_BUSINESS",
            credit_line_status: "SHARED",
          }
        : null,
      connection: {
        id: conexao.id,
        nome: conexao.nome,
        status: conexao.status,
        telefone: conexao.telefone,
        is_default: conexao.is_default,
      },
    };

    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor";
    console.error("[whatsapp-business-info] Erro não tratado", error);
    return jsonResponse({ error: message }, 500);
  }
});
