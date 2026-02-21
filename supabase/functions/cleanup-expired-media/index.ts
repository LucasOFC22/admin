// Edge Function: cleanup-expired-media
// Limpa mídias expiradas do WhatsApp (após 30 dias, se não for permanente)
// Pode ser chamada via pg_cron ou manualmente

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    console.log("[Cleanup] 🧹 Iniciando limpeza de mídias expiradas...");

    // Buscar mensagens com mídia expirada e não permanente
    const now = new Date().toISOString();
    const { data: expiredMessages, error: fetchError } = await supabase
      .from("mensagens_whatsapp")
      .select("id, message_id, message_type, message_data, metadata")
      .eq("media_permanent", false)
      .not("media_expires_at", "is", null)
      .lt("media_expires_at", now)
      .in("message_type", ["audio", "image", "video", "document", "sticker"]);

    if (fetchError) {
      console.error("[Cleanup] ❌ Erro ao buscar mensagens expiradas:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!expiredMessages || expiredMessages.length === 0) {
      console.log("[Cleanup] ✅ Nenhuma mídia expirada encontrada.");
      return new Response(
        JSON.stringify({ success: true, message: "Nenhuma mídia expirada", deleted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Cleanup] 📎 Encontradas ${expiredMessages.length} mídias expiradas`);

    let deletedFromStorage = 0;
    let deletedFromDb = 0;
    const errors: string[] = [];

    for (const message of expiredMessages) {
      try {
        const messageData = message.message_data || {};
        const metadata = message.metadata || {};
        const storageUrl = messageData.storageUrl || metadata.storageUrl;

        if (storageUrl) {
          // Path format: chatId/messageId.ext
          const urlParts = storageUrl.split('/whatsapp-media/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1]; // chatId/messageId.ext
            console.log(`[Cleanup] 🗑️ Deletando arquivo: ${filePath}`);

            const { error: deleteError } = await supabase.storage
              .from("whatsapp-media")
              .remove([filePath]);

            if (deleteError) {
              console.error(`[Cleanup] ⚠️ Erro ao deletar arquivo ${filePath}:`, deleteError);
              errors.push(`Storage: ${filePath} - ${deleteError.message}`);
            } else {
              deletedFromStorage++;
            }
          }
        }

        // Limpar referências de mídia da mensagem (não deleta a mensagem, apenas a mídia)
        const { error: updateError } = await supabase
          .from("mensagens_whatsapp")
          .update({
            message_data: {
              ...messageData,
              storageUrl: null,
              mediaDeleted: true,
              mediaDeletedAt: now
            },
            metadata: {
              ...metadata,
              storageUrl: null
            },
            media_expires_at: null
          })
          .eq("id", message.id);

        if (updateError) {
          console.error(`[Cleanup] ⚠️ Erro ao atualizar mensagem ${message.id}:`, updateError);
          errors.push(`DB: ${message.id} - ${updateError.message}`);
        } else {
          deletedFromDb++;
        }
      } catch (err) {
        console.error(`[Cleanup] ⚠️ Erro ao processar mensagem ${message.id}:`, err);
        errors.push(`Process: ${message.id} - ${err}`);
      }
    }

    console.log(`[Cleanup] ✅ Concluído: ${deletedFromStorage} arquivos removidos, ${deletedFromDb} registros atualizados`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Limpeza concluída",
        stats: {
          total: expiredMessages.length,
          deletedFromStorage,
          deletedFromDb,
          errors: errors.length
        },
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Cleanup] ❌ Erro geral:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
