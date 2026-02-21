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
    const { conexaoId } = await req.json();

    if (!conexaoId) {
      console.error('conexaoId nÃÂÃÂ£o fornecido');
      return new Response(
        JSON.stringify({ error: 'conexaoId ÃÂÃÂ© obrigatÃÂÃÂ³rio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar credenciais da conexÃÂÃÂ£o
    const { data: conexao, error: conexaoError } = await supabase
      .from('conexoes')
      .select('whatsapp_token, whatsapp_business_account_id, nome')
      .eq('id', conexaoId)
      .single();

    if (conexaoError || !conexao) {
      console.error('Erro ao buscar conexÃÂÃÂ£o:', conexaoError);
      return new Response(
        JSON.stringify({ error: 'ConexÃÂÃÂ£o nÃÂÃÂ£o encontrada', details: conexaoError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conexao.whatsapp_token) {
      console.error('Token WhatsApp nÃÂÃÂ£o configurado');
      return new Response(
        JSON.stringify({ error: 'Token WhatsApp nÃÂÃÂ£o configurado para esta conexÃÂÃÂ£o' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conexao.whatsapp_business_account_id) {
      console.error('WABA ID nÃÂÃÂ£o configurado');
      return new Response(
        JSON.stringify({ error: 'WhatsApp Business Account ID nÃÂÃÂ£o configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar templates da API do Meta
    const metaUrl = `https://graph.facebook.com/v21.0/${conexao.whatsapp_business_account_id}/message_templates?limit=100`;
    
    const metaResponse = await fetch(metaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${conexao.whatsapp_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!metaResponse.ok) {
      const errorData = await metaResponse.text();
      console.error('Erro na API do Meta:', metaResponse.status, errorData);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar templates do WhatsApp', 
          status: metaResponse.status,
          details: errorData 
        }),
        { status: metaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metaData = await metaResponse.json();

    // Mapear templates para formato padronizado
    const templates = (metaData.data || []).map((template: any) => ({
      id: template.id,
      name: template.name,
      category: template.category || 'UTILITY',
      language: template.language || 'pt_BR',
      status: template.status?.toLowerCase() || 'pending',
      components: template.components || [],
      quality_score: template.quality_score,
      rejected_reason: template.rejected_reason,
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: templates,
        total: templates.length,
        conexao: conexao.nome
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('Erro na funÃÂÃÂ§ÃÂÃÂ£o whatsapp-modelos-buscar:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
