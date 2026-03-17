import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept, prefer, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatPhoneNumber(telefone: string): string {
  const cleanPhone = telefone.replace(/\D/g, "");
  return cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
}

async function persistMaloteMessage({
  supabase,
  conexaoId,
  maloteId,
  telefone,
  token,
  link,
  whatsappResult,
}: {
  supabase: any;
  conexaoId: string;
  maloteId: string;
  telefone: string;
  token: string;
  link: string;
  whatsappResult: any;
}) {
  const messageId = whatsappResult.messages?.[0]?.id || crypto.randomUUID();
  const messageStatus = whatsappResult.messages?.[0]?.message_status || "accepted";
  const timestamp = new Date().toISOString();

  const { data: contato } = await supabase
    .from("contatos_whatsapp")
    .select("id")
    .eq("telefone", telefone)
    .maybeSingle();

  let chatId: number | null = null;

  if (contato?.id) {
    const { data: chat } = await supabase
      .from("chats_whatsapp")
      .select("id")
      .eq("usuarioid", contato.id)
      .eq("ativo", true)
      .eq("resolvido", false)
      .order("atualizadoem", { ascending: false })
      .limit(1)
      .maybeSingle();

    chatId = chat?.id ?? null;
  }

  const { error: insertError } = await supabase.from("mensagens_whatsapp").insert({
    message_id: messageId,
    chatId,
    message_type: "template",
    message_text: `[Template malote] ${link}`,
    send: "sistema",
    message_data: {
      type: "malote_signature_request",
      template_name: "malote",
      malote_id: maloteId,
      token,
      link,
      latest_status: messageStatus,
      status_history: [
        {
          status: messageStatus,
          timestamp,
        },
      ],
      whatsapp_response: whatsappResult,
    },
    metadata: {
      conexaoId,
      phone_number: telefone,
      malote_id: maloteId,
      token,
      delivery_status: messageStatus,
      delivery_status_updated_at: timestamp,
    },
    received_at: timestamp,
  });

  if (insertError) {
    console.error("Erro ao persistir mensagem do malote:", insertError);
  }

  return { messageId, messageStatus };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { malote_id, telefone } = await req.json();

    if (!malote_id || !telefone) {
      return new Response(
        JSON.stringify({ success: false, error: "malote_id e telefone são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = crypto.randomUUID();
    const validade = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const numeroFormatado = formatPhoneNumber(telefone);
    const linkCompleto = `https://motorista.fptranscargas.com.br/assinar-malote?token=${token}`;

    console.log("Token gerado:", token, "Válido até:", validade.toISOString());

    const { data: malote, error: maloteError } = await supabase
      .from("malotes")
      .update({
        token_assinatura: token,
        token_valido_ate: validade.toISOString(),
        telefone_motorista: numeroFormatado,
        assinado: false,
        assinatura_data: null,
        assinatura_ip: null,
        assinatura_user_agent: null,
        assinatura_imagem: null,
      })
      .eq("id", malote_id)
      .select("id, motorista")
      .maybeSingle();

    if (maloteError || !malote) {
      console.error("Erro ao atualizar malote:", maloteError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao atualizar malote" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let { data: conexao, error: conexaoError } = await supabase
      .from("conexoes")
      .select("id, nome, whatsapp_token, whatsapp_phone_id, canal, status")
      .eq("canal", "whatsapp")
      .eq("status", "CONNECTED")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conexao) {
      const fallbackResult = await supabase
        .from("conexoes")
        .select("id, nome, whatsapp_token, whatsapp_phone_id, canal, status")
        .eq("canal", "whatsapp")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      conexao = fallbackResult.data;
      conexaoError = fallbackResult.error;
    }

    if (conexaoError || !conexao) {
      console.error("Erro ao buscar conexão WhatsApp:", conexaoError);
      return new Response(
        JSON.stringify({ success: false, error: "Nenhuma conexão WhatsApp ativa encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Credenciais WhatsApp não configuradas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Enviando template malote para:", numeroFormatado, "link:", linkCompleto);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v22.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${conexao.whatsapp_token}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: numeroFormatado,
          type: "template",
          template: {
            name: "malote",
            language: { code: "pt_BR" },
            components: [
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: token }],
              },
            ],
          },
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    const whatsappResult = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error("Erro ao enviar WhatsApp:", whatsappResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao enviar mensagem WhatsApp: ${whatsappResult.error?.message || JSON.stringify(whatsappResult)}`,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { messageId, messageStatus } = await persistMaloteMessage({
      supabase,
      conexaoId: conexao.id,
      maloteId: malote_id,
      telefone: numeroFormatado,
      token,
      link: linkCompleto,
      whatsappResult,
    });

    console.log("Mensagem enviada com sucesso:", whatsappResult);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        link: linkCompleto,
        message_id: messageId,
        message_status: messageStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na função enviar-assinatura-malote:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});