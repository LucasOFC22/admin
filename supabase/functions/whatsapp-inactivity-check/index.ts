import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppConfig {
  inactivity_enabled: boolean;
  inactivity_timeout_minutes: number;
  inactivity_message: string;
  inactivity_use_template: boolean;
  inactivity_template_name: string;
  inactivity_template_language: string;
  inactivity_template_variables: any[];
}

interface InactiveChat {
  id: number;
  usuarioid: string;
  adminid: string | null;
  last_customer_message_at: string;
}

interface Contato {
  id: string;
  nome: string | null;
  telefone: string | null;
}

interface Conexao {
  id: string;
  whatsapp_token: string;
  whatsapp_phone_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Verificando chats inativos...');

    // 1. Buscar configuração de inatividade
    const configQuery = {
      tabela: 'config_whatsapp',
      campos: 'inactivity_enabled, inactivity_timeout_minutes, inactivity_message, inactivity_use_template, inactivity_template_name, inactivity_template_language, inactivity_template_variables',
      filtros: 'limit(1), maybeSingle()'
    };
    console.log('📊 [QUERY 1] Config:', JSON.stringify(configQuery));

    const { data: configData, error: configError } = await supabase
      .from('config_whatsapp')
      .select('inactivity_enabled, inactivity_timeout_minutes, inactivity_message, inactivity_use_template, inactivity_template_name, inactivity_template_language, inactivity_template_variables')
      .limit(1)
      .maybeSingle();

    console.log('📊 [RESULT 1] Config retornada:', JSON.stringify(configData));

    if (configError) {
      console.error('Erro ao buscar config:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar configuração' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = configData as WhatsAppConfig;

    // Se inatividade não está habilitada, retorna
    if (!config?.inactivity_enabled) {
      console.log('⏸️ Encerramento por inatividade está desabilitado');
      return new Response(
        JSON.stringify({ success: true, message: 'Inatividade desabilitada', closedChats: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timeoutMinutes = config.inactivity_timeout_minutes || 30;
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();

    console.log(`⏰ Buscando chats inativos há mais de ${timeoutMinutes} minutos (desde ${cutoffTime})`);

    // 2. Buscar todos os chats com resolvido = false
    console.log('📊 [QUERY 2] Buscando todos os chats com resolvido = false...');
    const { data: activeChats, error: chatsError } = await supabase
      .from('chats_whatsapp')
      .select('id, usuarioid, adminid, last_customer_message_at')
      .eq('resolvido', false);

    if (chatsError) {
      console.error('Erro ao buscar chats:', JSON.stringify(chatsError));
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar chats' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 [RESULT 2] Chats ativos encontrados: ${activeChats?.length || 0}`);

    if (!activeChats || activeChats.length === 0) {
      console.log('✅ Nenhum chat ativo encontrado');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum chat ativo', closedChats: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Para cada chat ativo, buscar a última mensagem em mensagens_whatsapp
    const chatsToClose: InactiveChat[] = [];

    for (const chat of activeChats) {
      const { data: lastMsg, error: msgError } = await supabase
        .from('mensagens_whatsapp')
        .select('id, send, created_at')
        .eq('chatId', chat.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (msgError) {
        console.error(`Erro ao buscar última mensagem do chat ${chat.id}:`, msgError.message);
        continue;
      }

      if (!lastMsg) {
        console.log(`⏭️ Chat ${chat.id}: sem mensagens, ignorando`);
        continue;
      }

      const lastMsgTime = new Date(lastMsg.created_at).getTime();
      const cutoffMs = new Date(cutoffTime).getTime();
      const isOld = lastMsgTime < cutoffMs;
      const isFromAttendant = lastMsg.send === 'atendente';

      console.log(`📊 Chat ${chat.id}: última msg de "${lastMsg.send}" em ${lastMsg.created_at} | antiga=${isOld} | do_atendente=${isFromAttendant}`);

      // Encerra se a última mensagem é antiga E foi do atendente (cliente não respondeu)
      if (isOld && isFromAttendant) {
        console.log(`🔴 Chat ${chat.id}: inativo - última msg do atendente há mais de ${timeoutMinutes} min`);
        chatsToClose.push(chat as InactiveChat);
      }
    }

    if (chatsToClose.length === 0) {
      console.log('✅ Nenhum chat inativo para encerrar');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum chat inativo', closedChats: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chats = chatsToClose;
    console.log(`📋 Encontrados ${chats.length} chats inativos para encerrar`);

    // 3. Buscar dados dos contatos para enviar mensagens
    const usuarioIds = [...new Set(chats.map(c => c.usuarioid).filter(Boolean))];
    const contatosMap: Record<string, Contato> = {};

    if (usuarioIds.length > 0) {
      console.log('📊 [QUERY 3] Contatos:', JSON.stringify({ tabela: 'contatos_whatsapp', campos: 'id, nome, telefone', filtro: `id IN (${usuarioIds.length} ids)` }));
      const { data: contatosData, error: contatosError } = await supabase
        .from('contatos_whatsapp')
        .select('id, nome, telefone')
        .in('id', usuarioIds);

      console.log('📊 [RESULT 3] Contatos encontrados:', contatosData?.length);
      if (!contatosError && contatosData) {
        contatosData.forEach((contato: Contato) => {
          contatosMap[contato.id] = contato;
        });
      }
    }

    // 4. Buscar conexão do WhatsApp para enviar mensagens
    console.log('📊 [QUERY 4] Conexão:', JSON.stringify({ tabela: 'conexoes', campos: 'id, whatsapp_token, whatsapp_phone_id', filtro: 'is_default = true' }));
    const { data: conexaoData, error: conexaoError } = await supabase
      .from('conexoes')
      .select('id, whatsapp_token, whatsapp_phone_id')
      .eq('is_default', true)
      .limit(1)
      .maybeSingle();
    console.log('📊 [RESULT 4] Conexão encontrada:', !!conexaoData);

    if (conexaoError || !conexaoData) {
      console.error('Erro ao buscar conexão:', conexaoError);
      return new Response(
        JSON.stringify({ success: false, error: 'Conexão WhatsApp não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const conexao = conexaoData as Conexao;
    let closedCount = 0;
    const errors: string[] = [];

    // 5. Processar cada chat inativo
    for (const chat of chats) {
      try {
        const contato = contatosMap[chat.usuarioid];
        const contatoNome = contato?.nome || 'Cliente';
        const contatoTelefone = contato?.telefone;

        console.log(`🔄 Processando chat ${chat.id} - ${contatoNome}`);

        // Enviar mensagem de encerramento se tiver telefone
        if (contatoTelefone) {
          const phoneNumber = contatoTelefone.replace(/\D/g, '');
          
          if (config.inactivity_use_template && config.inactivity_template_name) {
            // Enviar template
            await sendTemplateMessage(
              conexao,
              phoneNumber,
              config.inactivity_template_name,
              config.inactivity_template_language,
              config.inactivity_template_variables
            );
          } else if (config.inactivity_message) {
            // Enviar mensagem de texto
            await sendTextMessage(conexao, phoneNumber, config.inactivity_message);
          }
        }

        // Atualizar chat como fechado por inatividade
        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('chats_whatsapp')
          .update({
            ativo: false,
            resolvido: true,
            closed_by_inactivity: true,
            encerradoem: now,
            atualizadoem: now
          })
          .eq('id', chat.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar chat: ${updateError.message}`);
        }

        // Registrar mensagem do sistema no histórico (após envio ao WhatsApp)
        const messageContent = config.inactivity_use_template 
          ? `[Template: ${config.inactivity_template_name}] ${config.inactivity_message || 'Atendimento encerrado por inatividade.'}`
          : config.inactivity_message || 'Atendimento encerrado por inatividade.';

        const { error: msgInsertError } = await supabase.from('mensagens_whatsapp').insert({
          chatId: chat.id,
          message_type: 'text',
          message_text: messageContent,
          send: 'sistema',
          message_data: {
            type: 'inactivity_close',
            automatic: true,
            closed_at: now
          }
        });

        if (msgInsertError) {
          console.error(`Erro ao inserir mensagem do sistema no chat ${chat.id}:`, msgInsertError.message);
        }

        closedCount++;
        console.log(`✅ Chat ${chat.id} encerrado por inatividade`);

      } catch (error) {
        const errorMsg = `Erro ao processar chat ${chat.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`🏁 Processamento concluído: ${closedCount}/${chats.length} chats encerrados`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${closedCount} chats encerrados por inatividade`,
        closedChats: closedCount,
        totalChecked: chats.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendTextMessage(conexao: Conexao, to: string, message: string): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${conexao.whatsapp_phone_id}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${conexao.whatsapp_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message }
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro ao enviar mensagem: ${errorData}`);
  }

  await response.json();
}

async function sendTemplateMessage(
  conexao: Conexao,
  to: string,
  templateName: string,
  language: string,
  variables: any[]
): Promise<void> {
  const components: any[] = [];

  if (variables && Array.isArray(variables)) {
    // Adicionar variáveis de header se existirem
    const headerVars = variables.filter(v => v.type === 'header');
    if (headerVars.length > 0) {
      components.push({
        type: 'header',
        parameters: headerVars.map(v => ({
          type: 'text',
          text: v.value
        }))
      });
    }

    // Adicionar variáveis de body
    const bodyVars = variables.filter(v => v.type !== 'header');
    if (bodyVars.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyVars.map(v => ({
          type: 'text',
          text: v.value
        }))
      });
    }
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${conexao.whatsapp_phone_id}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${conexao.whatsapp_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language || 'pt_BR' },
          components: components.length > 0 ? components : undefined
        }
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro ao enviar template: ${errorData}`);
  }

  await response.json();
}
