import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SnoozedEmail {
  id: string;
  email_conta_id: string;
  message_uid: string;
  message_id?: string;
  pasta_origem: string;
  snoozed_until: string;
  assunto?: string;
  de?: string;
  de_nome?: string;
  data_original?: string;
  created_at: string;
}

interface SnoozeRequest {
  action: 'list' | 'snooze' | 'unsnooze' | 'check_expired';
  conta_id: string;
  // Para snooze
  message_uid?: string;
  message_id?: string;
  pasta_origem?: string;
  snoozed_until?: string;
  assunto?: string;
  de?: string;
  de_nome?: string;
  data_original?: string;
  // Para unsnooze
  snooze_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("[email-snoozed] Erro de autenticação:", authError);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SnoozeRequest = await req.json();
    const { action, conta_id } = body;

    console.log(`[email-snoozed] Action: ${action}, Conta: ${conta_id}, User: ${user.id}`);

    if (!action || !conta_id) {
      return new Response(
        JSON.stringify({ error: "action e conta_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar o id do usuário na tabela usuarios usando supabase_id
    const { data: usuarioData, error: usuarioError } = await supabaseClient
      .from("usuarios")
      .select("id")
      .eq("supabase_id", user.id)
      .single();

    if (usuarioError || !usuarioData) {
      console.error("[email-snoozed] Usuário não encontrado na tabela usuarios:", usuarioError);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const usuarioId = usuarioData.id;

    // Verificar se o usuário tem acesso à conta
    const { data: acesso, error: acessoError } = await supabaseClient
      .from("email_conta_usuarios")
      .select("id")
      .eq("email_conta_id", conta_id)
      .eq("usuario_id", usuarioId)
      .single();

    if (acessoError || !acesso) {
      console.error("[email-snoozed] Usuário sem acesso à conta:", acessoError);
      return new Response(
        JSON.stringify({ error: "Acesso negado à conta de email" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case 'list': {
        console.log("[email-snoozed] Listando emails adiados...");
        
        const { data: snoozed, error: listError } = await supabaseClient
          .from("email_snoozed")
          .select("*")
          .eq("email_conta_id", conta_id)
          .order("snoozed_until", { ascending: true });

        if (listError) {
          console.error("[email-snoozed] Erro ao listar:", listError);
          throw listError;
        }

        console.log(`[email-snoozed] Encontrados ${snoozed?.length || 0} emails adiados`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            emails: snoozed || [],
            count: snoozed?.length || 0
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'snooze': {
        const { message_uid, message_id, pasta_origem, snoozed_until, assunto, de, de_nome, data_original } = body;

        if (!message_uid || !snoozed_until) {
          return new Response(
            JSON.stringify({ error: "message_uid e snoozed_until são obrigatórios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[email-snoozed] Adiando email UID: ${message_uid} até ${snoozed_until}`);

        // Inserir ou atualizar registro de snooze
        const { data: inserted, error: insertError } = await supabaseClient
          .from("email_snoozed")
          .upsert({
            email_conta_id: conta_id,
            message_uid,
            message_id,
            pasta_origem: pasta_origem || 'INBOX',
            snoozed_until,
            assunto,
            de,
            de_nome,
            data_original
          }, {
            onConflict: 'email_conta_id,message_uid'
          })
          .select()
          .single();

        if (insertError) {
          console.error("[email-snoozed] Erro ao inserir snooze:", insertError);
          throw insertError;
        }

        console.log("[email-snoozed] Email adiado com sucesso:", inserted.id);

        return new Response(
          JSON.stringify({ success: true, snoozed: inserted }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'unsnooze': {
        const { message_uid, snooze_id } = body;

        if (!message_uid && !snooze_id) {
          return new Response(
            JSON.stringify({ error: "message_uid ou snooze_id é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[email-snoozed] Removendo adiamento: UID=${message_uid}, ID=${snooze_id}`);

        let query = supabaseClient
          .from("email_snoozed")
          .delete()
          .eq("email_conta_id", conta_id);

        if (snooze_id) {
          query = query.eq("id", snooze_id);
        } else {
          query = query.eq("message_uid", message_uid);
        }

        const { error: deleteError } = await query;

        if (deleteError) {
          console.error("[email-snoozed] Erro ao remover snooze:", deleteError);
          throw deleteError;
        }

        console.log("[email-snoozed] Adiamento removido com sucesso");

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'check_expired': {
        console.log("[email-snoozed] Verificando emails expirados...");

        const now = new Date().toISOString();
        
        const { data: expired, error: expiredError } = await supabaseClient
          .from("email_snoozed")
          .select("*")
          .eq("email_conta_id", conta_id)
          .lte("snoozed_until", now);

        if (expiredError) {
          console.error("[email-snoozed] Erro ao buscar expirados:", expiredError);
          throw expiredError;
        }

        console.log(`[email-snoozed] ${expired?.length || 0} emails adiados expiraram`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            expired: expired || [],
            count: expired?.length || 0
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Action desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("[email-snoozed] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
