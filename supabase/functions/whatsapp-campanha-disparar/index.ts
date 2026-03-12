import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declarar EdgeRuntime para TypeScript
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<any>) => void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Delay entre envios (50ms para respeitar rate limit ~80 msgs/seg)
const DELAY_BETWEEN_SENDS = 50;
const BATCH_SIZE = 50;

interface Conexao {
  id: string;
  whatsapp_token: string;
  whatsapp_phone_id: string;
}

// Função para delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Processar variáveis substituindo placeholders por valores do contato
const processVariables = (variables: any[], contatoVars: Record<string, string>, nome: string | null): any[] => {
  if (!variables || !Array.isArray(variables)) return [];
  
  return variables.map((v, index) => {
    let value = v.value || '';
    
    if (value.includes('{{nome}}') && nome) {
      value = value.replace(/\{\{nome\}\}/g, nome);
    }
    
    Object.entries(contatoVars).forEach(([key, val]) => {
      value = value.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
    });
    
    return {
      name: v.name || `${index + 1}`,
      value: value || '-'
    };
  });
};

// Enviar mensagem template para um contato
async function sendTemplateMessage(
  conexao: Conexao,
  telefone: string,
  templateName: string,
  templateLanguage: string,
  headerVars: any[],
  bodyVars: any[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const cleanPhone = telefone.replace(/\D/g, '');
    
    const templatePayload: any = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage || 'pt_BR' }
      }
    };
    
    const components: any[] = [];
    
    if (headerVars && headerVars.length > 0) {
      components.push({
        type: 'header',
        parameters: headerVars.map(v => ({
          type: 'text',
          parameter_name: v.name,
          text: v.value
        }))
      });
    }
    
    if (bodyVars && bodyVars.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyVars.map(v => ({
          type: 'text',
          parameter_name: v.name,
          text: v.value
        }))
      });
    }
    
    if (components.length > 0) {
      templatePayload.template.components = components;
    }
    
    const metaUrl = `https://graph.facebook.com/v22.0/${conexao.whatsapp_phone_id}/messages`;
    
    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${conexao.whatsapp_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templatePayload)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Erro ao enviar para ${cleanPhone}:`, data);
      const errorMessage = data.error?.message || `Erro ${response.status}`;
      return { success: false, error: errorMessage };
    }
    
    const messageId = data.messages?.[0]?.id;
    console.log(`✅ Enviado para ${cleanPhone}: ${messageId}`);
    return { success: true, messageId };
    
  } catch (error) {
    console.error(`❌ Exceção ao enviar para ${telefone}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Atualizar contadores da campanha
async function updateCampanhaCounters(campanhaId: string) {
  const { data: contatos } = await supabase
    .from('campanhas_contatos')
    .select('status')
    .eq('campanha_id', campanhaId);
  
  if (!contatos) return;
  
  const counters = {
    enviados: contatos.filter(c => ['enviado', 'entregue', 'lido'].includes(c.status)).length,
    entregues: contatos.filter(c => ['entregue', 'lido'].includes(c.status)).length,
    lidos: contatos.filter(c => c.status === 'lido').length,
    erros: contatos.filter(c => ['erro', 'falha'].includes(c.status)).length,
  };
  
  await supabase
    .from('campanhas_whatsapp')
    .update(counters)
    .eq('id', campanhaId);
}

// ============================================
// 🆕 ENCERRAR CHATS/SESSÕES EXISTENTES DO CONTATO
// ============================================
async function encerrarChatsExistentes(telefone: string) {
  const cleanPhone = telefone.replace(/\D/g, '');
  
  // Buscar contato pelo telefone
  const { data: contato } = await supabase
    .from('contatos_whatsapp')
    .select('id')
    .eq('telefone', cleanPhone)
    .maybeSingle();
  
  if (!contato) {
    console.log(`[Campanha] 📞 Contato não encontrado para telefone ${cleanPhone} - nenhum chat para encerrar`);
    return;
  }
  
  // Encerrar todos os chats ativos do contato
  const { data: chatsAtivos, error: chatsError } = await supabase
    .from('chats_whatsapp')
    .update({
      ativo: false,
      resolvido: true,
      encerradoem: new Date().toISOString()
    })
    .eq('usuarioid', contato.id)
    .eq('ativo', true)
    .select('id');
  
  if (chatsAtivos && chatsAtivos.length > 0) {
    console.log(`[Campanha] 🔒 Encerrados ${chatsAtivos.length} chat(s) ativos do contato ${cleanPhone}`);
  }
  
  // Invalidar sessões de fluxo ativas para esse telefone
  const { data: sessoes, error: sessoesError } = await supabase
    .from('flow_sessions')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('phone_number', cleanPhone)
    .in('status', ['running', 'waiting_input'])
    .select('id');
  
  if (sessoes && sessoes.length > 0) {
    console.log(`[Campanha] 🔒 Invalidadas ${sessoes.length} sessão(ões) de fluxo do contato ${cleanPhone}`);
  }
}

// Processar campanha em background
async function processarCampanha(campanhaId: string) {
  console.log(`🚀 Iniciando processamento da campanha ${campanhaId}`);
  
  // Buscar campanha
  const { data: campanha, error: campanhaError } = await supabase
    .from('campanhas_whatsapp')
    .select('*')
    .eq('id', campanhaId)
    .single();
  
  if (campanhaError || !campanha) {
    console.error('❌ Campanha não encontrada no background:', campanhaError);
    return;
  }
  
  console.log(`📋 Campanha: ${campanha.nome}, status: ${campanha.status}, contatos: ${campanha.total_contatos}, flow_id: ${campanha.flow_id || 'nenhum'}`);
  
  // Verificar se pode continuar
  if (!['agendada', 'em_andamento'].includes(campanha.status)) {
    console.log(`⚠️ Campanha com status ${campanha.status}, ignorando`);
    return;
  }
  
  // Buscar conexão
  const { data: conexao, error: conexaoError } = await supabase
    .from('conexoes')
    .select('id, whatsapp_token, whatsapp_phone_id')
    .eq('id', campanha.conexao_id)
    .single();
  
  if (conexaoError || !conexao) {
    console.error('❌ Conexão não encontrada:', conexaoError);
    await supabase
      .from('campanhas_whatsapp')
      .update({ status: 'cancelada' })
      .eq('id', campanhaId);
    return;
  }
  
  console.log(`🔗 Conexão encontrada: ${conexao.id}`);
  
  // Atualizar status para em_andamento
  await supabase
    .from('campanhas_whatsapp')
    .update({ 
      status: 'em_andamento',
      iniciado_em: new Date().toISOString()
    })
    .eq('id', campanhaId);
  
  let hasMore = true;
  let processedCount = 0;
  
  while (hasMore) {
    // Verificar se campanha foi pausada ou cancelada
    const { data: statusCheck } = await supabase
      .from('campanhas_whatsapp')
      .select('status')
      .eq('id', campanhaId)
      .single();
    
    if (statusCheck?.status === 'pausada' || statusCheck?.status === 'cancelada') {
      console.log(`⏸️ Campanha ${statusCheck.status}, parando processamento`);
      break;
    }
    
    // Buscar próximo lote de contatos pendentes
    const { data: contatos, error: contatosError } = await supabase
      .from('campanhas_contatos')
      .select('id, telefone, nome, status')
      .eq('campanha_id', campanhaId)
      .in('status', ['pendente', 'erro'])
      .limit(BATCH_SIZE);
    
    if (contatosError) {
      console.error('❌ Erro ao buscar contatos:', contatosError);
      break;
    }
    
    if (!contatos || contatos.length === 0) {
      hasMore = false;
      console.log('✅ Todos os contatos foram processados');
      break;
    }
    
    console.log(`📦 Processando lote de ${contatos.length} contatos`);
    
    // Processar cada contato
    for (const contato of contatos) {
      // 🆕 ENCERRAR CHATS/SESSÕES EXISTENTES ANTES DE ENVIAR
      await encerrarChatsExistentes(contato.telefone);
      
      // Marcar como enviando
      await supabase
        .from('campanhas_contatos')
        .update({ status: 'enviando' })
        .eq('id', contato.id);
      
      // Processar variáveis
      const headerVars = processVariables(campanha.header_variables, {}, contato.nome);
      const bodyVars = processVariables(campanha.body_variables, {}, contato.nome);
      
      // Enviar mensagem
      const result = await sendTemplateMessage(
        conexao,
        contato.telefone,
        campanha.template_name,
        campanha.template_language,
        headerVars,
        bodyVars
      );
      
      // Atualizar status do contato
      if (result.success) {
        await supabase
          .from('campanhas_contatos')
          .update({
            status: 'enviado',
            message_id: result.messageId,
            enviado_em: new Date().toISOString(),
            erro_detalhes: null
          })
          .eq('id', contato.id);
        
        // Se a campanha tem fluxo configurado, registrar envio pendente de resposta
        if (campanha.flow_id) {
          const cleanPhone = contato.telefone.replace(/\D/g, '');
          
          console.log(`[Campanha] 📝 Registrando envio pendente: telefone=${cleanPhone}, campanha=${campanhaId}, flow=${campanha.flow_id}`);
          
          const { error: upsertError } = await supabase
            .from('campanhas_envios_pendentes')
            .upsert({
              telefone: cleanPhone,
              campanha_id: campanhaId,
              flow_id: campanha.flow_id,
              status: 'pendente',
              enviado_em: new Date().toISOString()
            }, { onConflict: 'telefone,campanha_id' });
          
          if (upsertError) {
            console.error(`[Campanha] ❌ Erro ao registrar envio pendente:`, upsertError);
          } else {
            console.log(`[Campanha] ✅ Envio pendente registrado para ${cleanPhone}`);
          }
        }
      } else {
        await supabase
          .from('campanhas_contatos')
          .update({
            status: 'erro',
            erro_detalhes: result.error
          })
          .eq('id', contato.id);
      }
      
      processedCount++;
      
      // Atualizar contadores a cada 10 envios
      if (processedCount % 10 === 0) {
        await updateCampanhaCounters(campanhaId);
      }
      
      // Delay para respeitar rate limit
      await delay(DELAY_BETWEEN_SENDS);
    }
  }
  
  // Atualizar contadores finais
  await updateCampanhaCounters(campanhaId);
  
  // Verificar se todos foram processados
  const { data: remaining } = await supabase
    .from('campanhas_contatos')
    .select('id')
    .eq('campanha_id', campanhaId)
    .in('status', ['pendente', 'enviando'])
    .limit(1);
  
  if (!remaining || remaining.length === 0) {
    // Verificar status atual antes de marcar como concluída
    const { data: finalStatus } = await supabase
      .from('campanhas_whatsapp')
      .select('status')
      .eq('id', campanhaId)
      .single();
    
    if (finalStatus?.status === 'em_andamento') {
      await supabase
        .from('campanhas_whatsapp')
        .update({
          status: 'concluida',
          finalizado_em: new Date().toISOString()
        })
        .eq('id', campanhaId);
      console.log(`✅ Campanha ${campanhaId} concluída!`);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { campanhaId, acao } = body;
    
    console.log(`📨 Recebido: acao=${acao}, campanhaId=${campanhaId}`);
    console.log(`📦 Body completo:`, JSON.stringify(body));
    
    if (!campanhaId) {
      console.error('❌ campanhaId não fornecido');
      return new Response(
        JSON.stringify({ error: 'campanhaId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!acao) {
      console.error('❌ acao não fornecida');
      return new Response(
        JSON.stringify({ error: 'acao é obrigatória (iniciar, pausar, retomar, cancelar)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar campanha para validar
    console.log(`🔍 Buscando campanha: ${campanhaId}`);
    const { data: campanha, error: campanhaError } = await supabase
      .from('campanhas_whatsapp')
      .select('id, nome, status, total_contatos, conexao_id, agendado_para, flow_id')
      .eq('id', campanhaId)
      .single();
    
    if (campanhaError) {
      console.error('❌ Erro ao buscar campanha:', campanhaError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar campanha', 
          details: campanhaError.message,
          code: campanhaError.code 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!campanha) {
      console.error(`❌ Campanha não encontrada: ${campanhaId}`);
      return new Response(
        JSON.stringify({ error: 'Campanha não encontrada', campanhaId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ Campanha encontrada: ${campanha.nome} (status: ${campanha.status}, contatos: ${campanha.total_contatos}, flow_id: ${campanha.flow_id || 'nenhum'})`);
    
    switch (acao) {
      case 'iniciar':
        if (!['rascunho', 'agendada'].includes(campanha.status)) {
          return new Response(
            JSON.stringify({ error: `Não é possível iniciar campanha com status ${campanha.status}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (campanha.total_contatos === 0) {
          return new Response(
            JSON.stringify({ error: 'Campanha não tem contatos para disparar' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Verificar se tem agendamento futuro
        if (campanha.agendado_para) {
          const agendadoPara = new Date(campanha.agendado_para);
          const agora = new Date();
          
          if (agendadoPara > agora) {
            // Campanha agendada para o futuro - apenas garantir status
            await supabase
              .from('campanhas_whatsapp')
              .update({ status: 'agendada' })
              .eq('id', campanhaId);
            
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: `Campanha agendada para ${agendadoPara.toLocaleString('pt-BR')}`,
                agendado_para: campanha.agendado_para
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        
        // Atualizar status para agendada e processar em background
        await supabase
          .from('campanhas_whatsapp')
          .update({ status: 'agendada' })
          .eq('id', campanhaId);
        
        console.log(`🚀 Iniciando processamento em background para campanha ${campanhaId}`);
        
        // Processar em background
        EdgeRuntime.waitUntil(processarCampanha(campanhaId));
        
        return new Response(
          JSON.stringify({ success: true, message: 'Campanha iniciada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      case 'pausar':
        if (campanha.status !== 'em_andamento') {
          return new Response(
            JSON.stringify({ error: 'Só é possível pausar campanhas em andamento' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        await supabase
          .from('campanhas_whatsapp')
          .update({ status: 'pausada' })
          .eq('id', campanhaId);
        
        return new Response(
          JSON.stringify({ success: true, message: 'Campanha pausada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      case 'retomar':
        if (campanha.status !== 'pausada') {
          return new Response(
            JSON.stringify({ error: 'Só é possível retomar campanhas pausadas' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        await supabase
          .from('campanhas_whatsapp')
          .update({ status: 'agendada' })
          .eq('id', campanhaId);
        
        EdgeRuntime.waitUntil(processarCampanha(campanhaId));
        
        return new Response(
          JSON.stringify({ success: true, message: 'Campanha retomada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      case 'cancelar':
        await supabase
          .from('campanhas_whatsapp')
          .update({ status: 'cancelada' })
          .eq('id', campanhaId);
        
        return new Response(
          JSON.stringify({ success: true, message: 'Campanha cancelada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${acao}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('❌ Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
