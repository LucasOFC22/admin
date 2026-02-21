import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppBusinessInfo {
  phone_number: string;
  display_name: string;
  verified_name: string;
  quality_rating: string;
  platform_type: string;
  profile_picture_url: string;
  messaging_limit_tier: string;
  account_status: string;
  business_verification_status: string;
  code_verification_status: string;
  name_status: string;
}

interface WhatsAppBusinessAccountInfo {
  id: string;
  name: string;
  currency: string;
  timezone_id: string;
  message_template_namespace: string;
  account_review_status: string;
  business_verification_status: string;
  credit_line_status: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conexaoId } = await req.json();
    
    if (!conexaoId) {
      console.error("Missing conexaoId parameter");
      return new Response(
        JSON.stringify({ error: "conexaoId ÃÂÃÂ© obrigatÃÂÃÂ³rio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch connection data
    const { data: conexao, error: conexaoError } = await supabase
      .from("conexoes")
      .select("*")
      .eq("id", conexaoId)
      .single();

    if (conexaoError || !conexao) {
      console.error("Connection not found:", conexaoError);
      return new Response(
        JSON.stringify({ error: "ConexÃÂÃÂ£o nÃÂÃÂ£o encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { whatsapp_token, whatsapp_phone_id, whatsapp_business_account_id } = conexao;

    if (!whatsapp_token || !whatsapp_phone_id) {
      console.error("Missing WhatsApp credentials");
      return new Response(
        JSON.stringify({ error: "Credenciais do WhatsApp nÃÂÃÂ£o configuradas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch phone number info from WhatsApp Graph API
    const phoneInfoResponse = await fetch(
      `https://graph.facebook.com/v21.0/${whatsapp_phone_id}?fields=verified_name,code_verification_status,display_phone_number,quality_rating,platform_type,throughput,is_official_business_account,name_status,messaging_limit_tier`,
      {
        headers: {
          Authorization: `Bearer ${whatsapp_token}`,
        },
      }
    );

    let phoneInfo: any = null;
    if (phoneInfoResponse.ok) {
      phoneInfo = await phoneInfoResponse.json();
    } else {
      const errorData = await phoneInfoResponse.text();
      console.error("Failed to fetch phone info:", errorData);
    }

    // Fetch profile picture
    let profilePictureUrl: string | null = null;
    try {
      const profilePicResponse = await fetch(
        `https://graph.facebook.com/v21.0/${whatsapp_phone_id}/whatsapp_business_profile?fields=profile_picture_url`,
        {
          headers: {
            Authorization: `Bearer ${whatsapp_token}`,
          },
        }
      );

      if (profilePicResponse.ok) {
        const profilePicData = await profilePicResponse.json();
        profilePictureUrl = profilePicData.data?.[0]?.profile_picture_url || null;
      }
    } catch (picError) {
      console.error("Error fetching profile picture:", picError);
    }

    // Fetch WhatsApp Business Account info if available
    let accountInfo: any = null;
    const wabaId = whatsapp_business_account_id || phoneInfo?.whatsapp_business_account_id;
    
    if (wabaId) {
      try {
        const accountResponse = await fetch(
          `https://graph.facebook.com/v21.0/${wabaId}?fields=id,name,currency,timezone_id,message_template_namespace,account_review_status,business_verification_status,ownership_type`,
          {
            headers: {
              Authorization: `Bearer ${whatsapp_token}`,
            },
          }
        );

        if (accountResponse.ok) {
          accountInfo = await accountResponse.json();
        } else {
          const accountErrorData = await accountResponse.text();
          console.error("Failed to fetch WABA info:", accountErrorData);
        }
      } catch (accountError) {
        console.error("Error fetching WABA info:", accountError);
      }
    }

    // Calculate messaging limits based on tier
    const messagingLimits: Record<string, string> = {
      TIER_1K: "1.000 Conversas / 24 horas",
      TIER_10K: "10.000 Conversas / 24 horas", 
      TIER_100K: "100.000 Conversas / 24 horas",
      TIER_UNLIMITED: "Ilimitado",
      LIMITED: "Limitado",
      STANDARD: "PadrÃÂÃÂ£o",
    };

    const result = {
      phone: {
        id: whatsapp_phone_id,
        display_phone_number: phoneInfo?.display_phone_number || conexao.telefone,
        verified_name: phoneInfo?.verified_name || conexao.nome,
        quality_rating: phoneInfo?.quality_rating || "GREEN",
        platform_type: phoneInfo?.platform_type || "CLOUD_API",
        name_status: phoneInfo?.name_status || "APPROVED",
        code_verification_status: phoneInfo?.code_verification_status || "NOT_VERIFIED",
        is_official_business_account: phoneInfo?.is_official_business_account || false,
        messaging_limit_tier: phoneInfo?.messaging_limit_tier || "TIER_1K",
        messaging_limit_display: messagingLimits[phoneInfo?.messaging_limit_tier] || messagingLimits.TIER_1K,
        throughput: phoneInfo?.throughput || { level: "STANDARD" },
      },
      profile_picture_url: profilePictureUrl,
      account: accountInfo ? {
        id: accountInfo.id,
        name: accountInfo.name,
        currency: accountInfo.currency || "BRL",
        timezone_id: accountInfo.timezone_id,
        account_review_status: accountInfo.account_review_status || "APPROVED",
        business_verification_status: accountInfo.business_verification_status || "verified",
        ownership_type: accountInfo.ownership_type || "OWNED_BY_BUSINESS",
        credit_line_status: "SHARED", // Default value
      } : null,
      connection: {
        id: conexao.id,
        nome: conexao.nome,
        status: conexao.status,
        telefone: conexao.telefone,
        is_default: conexao.is_default,
      },
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in whatsapp-business-info:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
