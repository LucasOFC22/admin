import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, assinatura_imagem } = await req.json();

    console.log('Recebendo assinatura para token:', token);

    if (!token || !assinatura_imagem) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token e assinatura são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar malote pelo token
    const { data: malote, error: fetchError } = await supabase
      .from('malotes')
      .select('id, motorista, telefone_motorista, assinado, token_valido_ate')
      .eq('token_assinatura', token)
      .maybeSingle();

    if (fetchError) {
      console.error('Erro ao buscar malote:', fetchError);
      throw fetchError;
    }

    if (!malote) {
      return new Response(
        JSON.stringify({ success: false, error: 'Malote não encontrado ou token inválido' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se token expirou
    if (malote.token_valido_ate && new Date(malote.token_valido_ate) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já foi assinado
    if (malote.assinado) {
      return new Response(
        JSON.stringify({ success: false, error: 'Malote já foi assinado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Capturar metadados
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Atualizar malote com assinatura
    const { error: updateError } = await supabase
      .from('malotes')
      .update({
        assinado: true,
        assinatura_data: new Date().toISOString(),
        assinatura_ip: clientIp,
        assinatura_user_agent: userAgent,
        assinatura_imagem: assinatura_imagem,
        token_valido_ate: new Date().toISOString() // Invalidar token
      })
      .eq('id', malote.id);

    if (updateError) {
      console.error('Erro ao atualizar malote:', updateError);
      throw updateError;
    }

    console.log('Malote assinado com sucesso:', malote.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Malote assinado com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro na função assinar-malote:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
