// Edge Function: whatsapp-message-reply
// Ação: responder mensagem com contexto (quote/reply)
// Criado: 2025-01-09

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// UTF-8 ENCODING HELPER
// ============================================
function normalizeUtf8(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let fixed = text;
  try { fixed = fixed.normalize('NFC'); } catch {}
  return fixed.replace(/\uFFFD/g, '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json();
    const { chatId, phoneNumber, text, replyToMessageId, conexaoId } = body;

    console.log(`[MessageReply] Reply para: ${phoneNumber}, ReplyTo: ${replyToMessageId}`);

    // Validar campos obrigatórios
    if (!phoneNumber || !text || !replyToMessageId) {
      return new Response(
        JSON.stringify({ success: false, error: "Campos obrigatórios: phoneNumber, text, replyToMessageId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar conexão
    let conexao = null;
    if (conexaoId) {
      const { data } = await supabase
        .from("conexoes")
        .select("*, whatsapp_token, whatsapp_phone_id")
        .eq("id", conexaoId)
        .maybeSingle();
      conexao = data;
    }
    
    if (!conexao) {
      const { data } = await supabase
        .from("conexoes")
        .select("*, whatsapp_token, whatsapp_phone_id")
        .eq("is_default", true)
        .maybeSingle();
      conexao = data;
    }
    
    if (!conexao) {
      const { data } = await supabase
        .from("conexoes")
        .select("*, whatsapp_token, whatsapp_phone_id")
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();
      conexao = data;
    }

    if (!conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Credenciais WhatsApp não configuradas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar o message_id original da mensagem que está sendo respondida
    const { data: originalMsg } = await supabase
      .from("mensagens_whatsapp")
      .select("message_id")
      .eq("id", replyToMessageId)
      .maybeSingle();

    if (!originalMsg?.message_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Mensagem original não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enviar mensagem com contexto (reply)
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          context: {
            message_id: originalMsg.message_id
          },
          type: 'text',
          text: { body: normalizeUtf8(text) }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[MessageReply] Erro API Facebook:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error?.message || "Erro ao enviar" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newMessageId = data.messages?.[0]?.id || crypto.randomUUID();

    // Salvar mensagem no banco com referência à mensagem original
    await supabase.from('mensagens_whatsapp').insert({
      message_id: newMessageId,
      chatId: chatId,
      message_type: 'text',
      message_text: normalizeUtf8(text),
      send: 'atendente',
      reply_to_message_id: originalMsg.message_id,
      metadata: { 
        conexaoId: conexao.id, 
        phone_number: phoneNumber,
        replyTo: replyToMessageId
      },
      received_at: new Date().toISOString()
    });

    console.log(`[MessageReply] ✅ Resposta enviada: ${newMessageId}`);

    return new Response(
      JSON.stringify({ success: true, messageId: newMessageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[MessageReply] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
