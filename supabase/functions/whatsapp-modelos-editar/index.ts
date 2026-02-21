import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para remover emojis e caracteres não permitidos no HEADER
function sanitizeHeaderText(text: string): string {
  return text
    // Remove emojis (unicode ranges)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    // Remove asteriscos e formatação
    .replace(/[*_~]/g, '')
    // Remove novas linhas
    .replace(/[\n\r]/g, ' ')
    // Remove espaços extras
    .replace(/\s+/g, ' ')
    .trim();
}

// Função para sanitizar componentes antes de enviar para a Meta API
function sanitizeComponents(components: any[]): any[] {
  return components.map(component => {
    if (component.type === 'HEADER' && component.format === 'TEXT' && component.text) {
      return {
        ...component,
        text: sanitizeHeaderText(component.text)
      };
    }
    return component;
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conexaoId, templateId, components } = await req.json();

    console.log('📝 Editando template WhatsApp:', { conexaoId, templateId });

    // Validação dos campos obrigatórios
    if (!conexaoId) {
      console.error('conexaoId não fornecido');
      return new Response(
        JSON.stringify({ error: 'conexaoId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!templateId) {
      console.error('templateId não fornecido');
      return new Response(
        JSON.stringify({ error: 'templateId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!components || !Array.isArray(components) || components.length === 0) {
      console.error('components inválidos');
      return new Response(
        JSON.stringify({ error: 'Componentes são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar credenciais da conexão
    const { data: conexao, error: conexaoError } = await supabase
      .from('conexoes')
      .select('whatsapp_token, whatsapp_business_account_id, nome')
      .eq('id', conexaoId)
      .single();

    if (conexaoError || !conexao) {
      console.error('Erro ao buscar conexão:', conexaoError);
      return new Response(
        JSON.stringify({ error: 'Conexão não encontrada', details: conexaoError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conexao.whatsapp_token) {
      console.error('Token WhatsApp não configurado');
      return new Response(
        JSON.stringify({ error: 'Token WhatsApp não configurado para esta conexão' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔗 Enviando para Meta Graph API, Template ID:', templateId);

    // Sanitizar componentes HEADER antes de enviar
    const sanitizedComponents = sanitizeComponents(components);

    // Editar template na API do Meta
    const metaUrl = `https://graph.facebook.com/v21.0/${templateId}`;
    
    const payload = {
      components: sanitizedComponents
    };

    console.log('📤 Payload para Meta:', JSON.stringify(payload, null, 2));

    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${conexao.whatsapp_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await metaResponse.text();
    console.log('📥 Resposta Meta (status:', metaResponse.status, '):', responseText);

    if (!metaResponse.ok) {
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = responseText;
      }

      console.error('❌ Erro na API do Meta:', metaResponse.status, errorDetails);
      
      // Extrair mensagem de erro amigável
      let userMessage = 'Erro ao editar template no WhatsApp';
      if (errorDetails?.error?.message) {
        userMessage = errorDetails.error.message;
      } else if (errorDetails?.error?.error_user_msg) {
        userMessage = errorDetails.error.error_user_msg;
      }

      return new Response(
        JSON.stringify({ 
          error: userMessage, 
          status: metaResponse.status,
          details: errorDetails 
        }),
        { status: metaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metaData = JSON.parse(responseText);
    console.log('✅ Template editado com sucesso:', metaData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: metaData,
        message: 'Template editado com sucesso!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('❌ Erro na função whatsapp-modelos-editar:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
