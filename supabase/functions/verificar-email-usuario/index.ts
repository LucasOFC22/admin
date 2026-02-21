import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await req.json();
    const { supabase_id, supabase_ids } = body;

    console.log('Verificando email para:', { supabase_id, supabase_ids });

    // Determinar quais IDs processar
    const idsToProcess: string[] = [];
    
    if (supabase_id) {
      idsToProcess.push(supabase_id);
    }
    
    if (supabase_ids && Array.isArray(supabase_ids)) {
      idsToProcess.push(...supabase_ids);
    }

    if (idsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'É necessário fornecer supabase_id ou supabase_ids' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar informações de cada usuário
    const results = [];
    const errors = [];

    for (const userId of idsToProcess) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

        if (userError) {
          console.error(`Erro ao buscar usuário ${userId}:`, userError);
          errors.push({ id: userId, error: userError.message });
          continue;
        }

        if (userData?.user) {
          results.push({
            id: userData.user.id,
            email: userData.user.email,
            email_confirmed_at: userData.user.email_confirmed_at,
            email_verified: !!userData.user.email_confirmed_at,
            created_at: userData.user.created_at,
            last_sign_in_at: userData.user.last_sign_in_at
          });
        } else {
          errors.push({ id: userId, error: 'Usuário não encontrado' });
        }
      } catch (err) {
        console.error(`Erro ao processar usuário ${userId}:`, err);
        errors.push({ id: userId, error: String(err) });
      }
    }

    console.log(`Processados ${results.length} usuários, ${errors.length} erros`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: results,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Erro na função verificar-email-usuario:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
