import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[Cron] 🔄 Iniciando atualização de fotos de perfil...");

    // Buscar contatos sem foto de perfil
    const { data: contatos, error: contatosError } = await supabase
      .from("contatos_whatsapp")
      .select("id, telefone, perfil")
      .or("perfil.is.null,perfil.eq.");

    if (contatosError) {
      console.error("[Cron] ❌ Erro ao buscar contatos:", contatosError);
      throw contatosError;
    }

    if (!contatos || contatos.length === 0) {
      console.log("[Cron] ✅ Todos os contatos já possuem foto de perfil");
      return new Response(
        JSON.stringify({ success: true, message: "Nenhum contato sem foto", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Cron] 📋 Encontrados ${contatos.length} contatos sem foto`);

    // Buscar conexões do WhatsApp ativas para obter tokens
    const { data: conexoes, error: conexoesError } = await supabase
      .from("conexoes_whatsapp")
      .select("id, whatsapp_token, whatsapp_phone_id")
      .eq("status", "connected")
      .not("whatsapp_token", "is", null);

    if (conexoesError || !conexoes || conexoes.length === 0) {
      console.error("[Cron] ❌ Nenhuma conexão WhatsApp ativa encontrada");
      return new Response(
        JSON.stringify({ success: false, message: "Nenhuma conexão WhatsApp ativa" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Usar o token da primeira conexão ativa
    const token = conexoes[0].whatsapp_token;
    let updatedCount = 0;
    let errorCount = 0;

    // Processar contatos em lotes de 10 para evitar rate limiting
    const batchSize = 10;
    const delayBetweenBatches = 2000; // 2 segundos entre lotes

    for (let i = 0; i < contatos.length; i += batchSize) {
      const batch = contatos.slice(i, i + batchSize);
      
      console.log(`[Cron] 📦 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(contatos.length / batchSize)}`);

      const promises = batch.map(async (contato) => {
        try {
          // Buscar foto de perfil via Meta Graph API
          const profileResponse = await fetch(
            `https://graph.facebook.com/v21.0/${contato.telefone}?fields=profile_pic`,
            {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            }
          );

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            
            if (profileData.profile_pic) {
              const { error: updateError } = await supabase
                .from("contatos_whatsapp")
                .update({ perfil: profileData.profile_pic })
                .eq("id", contato.id);

              if (updateError) {
                console.error(`[Cron] ❌ Erro ao atualizar contato ${contato.id}:`, updateError);
                return { success: false, id: contato.id };
              }

              console.log(`[Cron] ✅ Foto atualizada para contato ${contato.id}`);
              return { success: true, id: contato.id };
            } else {
              console.log(`[Cron] ⚠️ Contato ${contato.telefone} não tem foto disponível`);
              return { success: false, id: contato.id, reason: "no_photo" };
            }
          } else {
            const errorText = await profileResponse.text();
            console.log(`[Cron] ⚠️ API retornou erro para ${contato.telefone}: ${errorText}`);
            return { success: false, id: contato.id, reason: "api_error" };
          }
        } catch (err) {
          console.error(`[Cron] ❌ Erro ao processar contato ${contato.id}:`, err);
          return { success: false, id: contato.id, reason: "exception" };
        }
      });

      const results = await Promise.all(promises);
      updatedCount += results.filter((r) => r.success).length;
      errorCount += results.filter((r) => !r.success).length;

      // Aguardar entre lotes (exceto no último)
      if (i + batchSize < contatos.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    console.log(`[Cron] 🏁 Finalizado! Atualizados: ${updatedCount}, Erros: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Atualização concluída",
        total: contatos.length,
        updated: updatedCount,
        errors: errorCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Cron] ❌ Erro geral:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
