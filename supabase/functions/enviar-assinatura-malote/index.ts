import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, prefer, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { malote_id, telefone } = await req.json();

    if (!malote_id || !telefone) {
      return new Response(
        JSON.stringify({ success: false, error: 'malote_id e telefone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Gerar token único
    const token = crypto.randomUUID();
    const validade = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 horas

    console.log('Token gerado:', token, 'Válido até:', validade.toISOString());

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

    // 3. Buscar credenciais do WhatsApp
    const { data: conexao, error: conexaoError } = await supabase
      .from('conexoes')
      .select('whatsapp_token, whatsapp_phone_id')
      .limit(1)
      .single();

    if (conexaoError || !conexao) {
      console.error('Erro ao buscar conexão WhatsApp:', conexaoError);
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhuma conexão WhatsApp ativa encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { whatsapp_token, whatsapp_phone_id } = conexao;

    if (!whatsapp_token || !whatsapp_phone_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Credenciais WhatsApp não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Gerar link - template já tem URL base, enviar apenas o token
    const linkPath = token;
    const linkCompleto = `https://motorista.fptranscargas.com.br/assinar-malote?token=${token}`;

    // 5. Formatar número
    let numeroFormatado = telefone.replace(/\D/g, '');
    if (!numeroFormatado.startsWith('55')) {
      numeroFormatado = '55' + numeroFormatado;
    }

    console.log('Enviando template malote para:', numeroFormatado, 'link:', linkCompleto);

    // 6. Enviar via WhatsApp Cloud API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

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
    console.error('Erro na função enviar-assinatura-malote:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
