import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();

    // Desestrutura os dados da requisiÃÂÃÂ§ÃÂÃÂ£o
    const { malote_id, telefone } = requestBody;
    if (!malote_id || !telefone) {
      console.error('ParÃÂÃÂ¢metros invÃÂÃÂ¡lidos:', { malote_id, telefone });
      return new Response(
        JSON.stringify({ success: false, error: 'malote_id e telefone sÃÂÃÂ£o obrigatÃÂÃÂ³rios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Gerar token ÃÂÃÂºnico
    const token = crypto.randomUUID();
    const validade = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 horas

    console.log('Token gerado:', token, 'VÃÂÃÂ¡lido atÃÂÃÂ©:', validade.toISOString());

    // 2. Atualizar malote com token e resetar assinatura anterior
    const { error: updateError } = await supabase
      .from('malotes')
      .update({
        token_assinatura: token,
        token_valido_ate: validade.toISOString(),
        telefone_motorista: telefone,
        assinado: false,
        assinatura_data: null,
        assinatura_ip: null,
        assinatura_user_agent: null,
        assinatura_imagem: null
      })
      .eq('id', malote_id);

    if (updateError) {
      console.error('Erro ao atualizar malote:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao atualizar malote: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar credenciais do WhatsApp da tabela conexoes
    const { data: conexao, error: conexaoError } = await supabase
      .from('conexoes')
      .select('whatsapp_token, whatsapp_phone_id')
      .limit(1)
      .single();

    if (conexaoError || !conexao) {
      console.error('Erro ao buscar conexÃÂÃÂ£o WhatsApp:', conexaoError);
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhuma conexÃÂÃÂ£o WhatsApp ativa encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { whatsapp_token, whatsapp_phone_id } = conexao;

    if (!whatsapp_token || !whatsapp_phone_id) {
      console.error('Credenciais WhatsApp incompletas:', { hasToken: !!whatsapp_token, hasPhoneId: !!whatsapp_phone_id });
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais WhatsApp nÃÂÃÂ£o configuradas na conexÃÂÃÂ£o' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Gerar path de assinatura (template jÃÂÃÂ¡ tem URL base)
    const linkPath = `assinar-malote/${token}`;
    const linkCompleto = `https://motorista.fptranscargas.com.br/${linkPath}`;

    // 5. Formatar nÃÂÃÂºmero
    let numeroFormatado = telefone.replace(/\D/g, '');
    if (!numeroFormatado.startsWith('55')) {
      numeroFormatado = '55' + numeroFormatado;
    }

    console.log('Enviando template malote para:', numeroFormatado, 'com path:', linkPath);

    // 6. Enviar via WhatsApp Cloud API usando template "malote"
    // O template tem um botÃÂÃÂ£o URL com variÃÂÃÂ¡vel para o link
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsapp_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: numeroFormatado,
          type: 'template',
          template: {
            name: 'malote',
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [
                  { type: 'text', text: linkPath }
                ]
              }
            ]
          }
        }),
      }
    );

    const whatsappResult = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error('Erro ao enviar WhatsApp:', whatsappResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao enviar mensagem WhatsApp: ' + (whatsappResult.error?.message || JSON.stringify(whatsappResult))
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Mensagem enviada com sucesso:', whatsappResult);

    return new Response(
      JSON.stringify({ 
      success: true, 
      token,
      link: linkCompleto,
        message_id: whatsappResult.messages?.[0]?.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na funÃÂÃÂ§ÃÂÃÂ£o enviar-assinatura-malote:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
