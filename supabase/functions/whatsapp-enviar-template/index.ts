import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Interface para variáveis com posição
interface TemplateVariable {
  name: string;
  value: string;
  position?: number;
  type?: 'header' | 'body';
}

// Interface para variáveis processadas (com name e value para parameter_name da Meta API)
interface ProcessedVariable {
  name: string;
  value: string;
}

// Função para processar variáveis - preserva name e value para enviar parameter_name à Meta API
const processVariables = (variables: any[] | undefined): ProcessedVariable[] => {
  if (!variables || !Array.isArray(variables) || variables.length === 0) {
    return [];
  }

  // Verifica se são objetos com name/value ou strings simples
  if (typeof variables[0] === 'object' && variables[0] !== null) {
    // Ordenar por position antes de extrair valores
    const sorted = [...variables].sort((a, b) => {
      const posA = a.position ?? 999;
      const posB = b.position ?? 999;
      return posA - posB;
    });
    
    console.log('📋 Variáveis ordenadas por position:', sorted.map(v => ({ name: v.name, position: v.position, value: v.value })));
    
    return sorted.map((v, index) => ({
      name: v.name || `${index + 1}`,
      value: sanitizeVariable(v.value)
    }));
  }

  // Array simples de strings - criar nomes numéricos
  return variables.map((v, index) => ({
    name: `${index + 1}`,
    value: sanitizeVariable(v)
  }));
};

// Função para validar e limpar variáveis - garante que nunca sejam vazias
const sanitizeVariable = (v: any): string => {
  if (v === null || v === undefined) return '-';
  const str = String(v).trim();
  return str.length > 0 ? str : '-';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conexaoId, telefone, templateName, templateLanguage, variables, headerVariables, bodyVariables } = await req.json();

    console.log('📨 Recebido pedido de envio de template:', {
      conexaoId,
      telefone,
      templateName,
      templateLanguage,
      headerVariables,
      bodyVariables,
      variables
    });

    // Validação dos campos obrigatórios
    if (!conexaoId) {
      return new Response(
        JSON.stringify({ error: 'conexaoId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!telefone) {
      return new Response(
        JSON.stringify({ error: 'telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!templateName) {
      return new Response(
        JSON.stringify({ error: 'templateName é obrigatório' }),
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
      .select('whatsapp_token, whatsapp_phone_id, nome')
      .eq('id', conexaoId)
      .single();

    if (conexaoError || !conexao) {
      console.error('Erro ao buscar conexão:', conexaoError);
      return new Response(
        JSON.stringify({ error: 'Conexão não encontrada', details: conexaoError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
      console.error('Credenciais WhatsApp não configuradas');
      return new Response(
        JSON.stringify({ error: 'Credenciais WhatsApp não configuradas para esta conexão' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar telefone
    const cleanPhone = telefone.replace(/\D/g, '');

    // Montar payload do template
    const templatePayload: any = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: templateLanguage || 'pt_BR'
        }
      }
    };

    // Adicionar componentes com variáveis se fornecidas
    const components: any[] = [];

    // Processar variáveis do header (ordenando por position se disponível)
    const processedHeaderVars = processVariables(headerVariables);
    if (processedHeaderVars.length > 0) {
      console.log('📋 Header variables processadas:', processedHeaderVars);
      components.push({
        type: 'header',
        parameters: processedHeaderVars.map((v: ProcessedVariable) => ({
          type: 'text',
          parameter_name: v.name,
          text: v.value
        }))
      });
    }

    // Processar variáveis do body (ordenando por position se disponível)
    let bodyVarsToProcess = bodyVariables;
    if (!bodyVarsToProcess || !Array.isArray(bodyVarsToProcess) || bodyVarsToProcess.length === 0) {
      // Fallback: usar 'variables' antigo para body (compatibilidade)
      bodyVarsToProcess = variables;
    }

    const processedBodyVars = processVariables(bodyVarsToProcess);
    if (processedBodyVars.length > 0) {
      console.log('📋 Body variables processadas:', processedBodyVars);
      components.push({
        type: 'body',
        parameters: processedBodyVars.map((v: ProcessedVariable) => ({
          type: 'text',
          parameter_name: v.name,
          text: v.value
        }))
      });
    }

    // Adicionar componentes ao payload se houver
    if (components.length > 0) {
      templatePayload.template.components = components;
    }
    
    console.log('📤 Payload final para Meta API:', JSON.stringify(templatePayload, null, 2));

    // Enviar template via API do Meta
    const metaUrl = `https://graph.facebook.com/v22.0/${conexao.whatsapp_phone_id}/messages`;
    
    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${conexao.whatsapp_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templatePayload)
    });

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('❌ Erro na API do Meta:', metaResponse.status, metaData);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao enviar template', 
          status: metaResponse.status,
          details: metaData 
        }),
        { status: metaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Template enviado com sucesso:', metaData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          messageId: metaData.messages?.[0]?.id
        },
        message: 'Template enviado com sucesso!'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    console.error('❌ Erro na função whatsapp-enviar-template:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
