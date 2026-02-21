// Flow Processor Main - Orchestrator for flow processing
// Fix: Priorizar campanha_flow_id sobre sessões existentes
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// 📦 TYPES
// ============================================
interface FlowBlock { id: string; type: string; order: number; data: any; }
interface FlowGroup { id: string; title: string; blocks: FlowBlock[]; }
interface FlowData { groups?: FlowGroup[]; nodes?: any[]; edges: any[]; }
interface Session {
  id: string; phone_number: string; contact_name: string; conexao_id: string;
  flow_id: string; current_group_id?: string; current_block_index?: number;
  waiting_block_type?: string; status: string; variables: Record<string, any>;
  chatId?: number; chat_id?: number; processing_id?: string;
}

// ============================================
// 📦 HELPERS
// ============================================
function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// ============================================
// 🔒 VALIDAÇÃO DE PROPRIEDADE DO CHAT (Segurança contra vazamento)
// ============================================
async function validateChatOwnership(
  supabase: any, 
  chatId: number | undefined, 
  phoneNumber: string, 
  conexaoId: string
): Promise<{ valid: boolean; error?: string }> {
  if (!chatId) {
    return { valid: true };
  }
  
  try {
    const { data: chat, error } = await supabase
      .from('chats_whatsapp')
      .select('id, usuarioid, ativo')
      .eq('id', chatId)
      .maybeSingle();
    
    if (error) {
      console.error('[Main] 🔒 Erro ao validar propriedade do chat:', error);
      return { valid: false, error: 'Erro ao validar chat' };
    }
    
    if (!chat) {
      console.warn(`[Main] 🔒 Chat ${chatId} não encontrado`);
      return { valid: false, error: 'Chat não encontrado' };
    }
    
    if (chat.usuarioid) {
      const { data: contato } = await supabase
        .from('contatos_whatsapp')
        .select('id, telefone')
        .eq('id', chat.usuarioid)
        .maybeSingle();
      
      if (contato?.telefone) {
        const chatPhone = (contato.telefone || '').replace(/\D/g, '');
        const reqPhone = (phoneNumber || '').replace(/\D/g, '');
        
        const chatSuffix = chatPhone.slice(-8);
        const reqSuffix = reqPhone.slice(-8);
        
        if (chatSuffix && reqSuffix && chatSuffix !== reqSuffix) {
          console.error(`[Main] 🔒 VAZAMENTO DETECTADO! Chat ${chatId} pertence a ...${chatSuffix}, requisição de ...${reqSuffix}`);
          return { valid: false, error: 'Telefone não corresponde ao chat' };
        }
      }
    }
    
    return { valid: true };
  } catch (err) {
    console.error('[Main] 🔒 Erro na validação de propriedade:', err);
    return { valid: false, error: String(err) };
  }
}

function createProcessingId(): string {
  return `${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
}

function getFlowData(flow: any): FlowData {
  if (!flow) return { groups: [], nodes: [], edges: [] };
  const fd = flow.flow_data || {};
  return { groups: fd.groups || [], nodes: fd.nodes || [], edges: fd.edges || [] };
}

function isNewFormat(flowData: FlowData): boolean {
  return !!(flowData.groups && flowData.groups.length > 0);
}

function getFirstGroupId(flowData: FlowData): string | null {
  const startNodeIds = ['start', 'start-node', 'startNode'];
  
  if (isNewFormat(flowData)) {
    const startEdges = flowData.edges.filter((e: any) => 
      startNodeIds.some(id => e.source === id || e.source?.toLowerCase() === id.toLowerCase())
    );
    for (const edge of startEdges) {
      if (flowData.groups?.some(g => g.id === edge.target)) return edge.target;
    }
    return flowData.groups?.[0]?.id || null;
  } else {
    const startNode = flowData.nodes?.find((n: any) => n.data?.type === 'start');
    if (startNode) {
      const edge = flowData.edges.find((e: any) => e.source === startNode.id);
      if (edge) return edge.target;
    }
    return flowData.nodes?.find((n: any) => n.data?.type !== 'start')?.id || null;
  }
}

function getGroupById(flowData: FlowData, groupId: string): FlowGroup | null {
  if (isNewFormat(flowData)) {
    let group = flowData.groups?.find(g => g.id === groupId);
    if (group) return group;
    group = flowData.groups?.find(g => g.blocks?.some(b => b.id === groupId));
    return group || null;
  }
  const node = flowData.nodes?.find((n: any) => n.id === groupId);
  if (!node) return null;
  return {
    id: node.id, title: node.data?.label || 'Grupo',
    blocks: [{ id: `block-${node.id}`, type: node.data?.type || 'text', order: 1, data: node.data || {} }]
  };
}

function findNextGroupId(flowData: FlowData, sourceGroupId: string): string | null {
  // Accept: no handle, 'output', or 'group-success-output' as valid exit handles
  const edge = flowData.edges.find((e: any) => 
    e.source === sourceGroupId && 
    (!e.sourceHandle || e.sourceHandle === 'output' || e.sourceHandle === 'group-success-output')
  );
  return edge?.target || null;
}

function findEdge(flowData: FlowData, sourceId: string, sourceHandle?: string): any | null {
  return flowData.edges.find((e: any) => {
    if (e.source !== sourceId) return false;
    if (sourceHandle) return e.sourceHandle === sourceHandle;
    return true;
  }) || null;
}

async function acquireSessionLock(supabase: any, sessionId: string, processingId: string): Promise<boolean> {
  const now = new Date();
  const lockTimeout = new Date(now.getTime() - 30000);
  
  const { data: updated } = await supabase.from('flow_sessions')
    .update({ processing_id: processingId, updated_at: now.toISOString() })
    .eq('id', sessionId)
    .is('processing_id', null)
    .select('id')
    .maybeSingle();
  
  if (updated) {
    return true;
  }
  
  const { data: session } = await supabase.from('flow_sessions')
    .select('processing_id, updated_at').eq('id', sessionId).maybeSingle();
  
  if (!session) return false;
  
  if (session.processing_id === processingId) return true;
  
  const sessionUpdated = new Date(session.updated_at);
  if (sessionUpdated < lockTimeout) {
    const { data: forced } = await supabase.from('flow_sessions')
      .update({ processing_id: processingId, updated_at: now.toISOString() })
      .eq('id', sessionId)
      .eq('processing_id', session.processing_id)
      .select('id')
      .maybeSingle();
    
    if (forced) {
      return true;
    }
  }
  
  return false;
}

async function releaseSessionLock(supabase: any, sessionId: string) {
  await supabase.from('flow_sessions').update({ processing_id: null }).eq('id', sessionId);
}

async function callSender(supabase: any, action: string, conexao: any, phoneNumber: string, chatId: number | undefined, params: any) {
  const { data, error } = await supabase.functions.invoke('flow-whatsapp-sender', {
    body: { action, conexao, phoneNumber, chatId, ...params }
  });
  if (error) console.error('[Main] Sender error:', error);
  return data;
}

// ============================================
// 🔄 BLOCK PROCESSOR DISPATCHER
// ============================================
function getProcessorForBlock(blockType: string): string {
  const simpleBlocks = ['start', 'text', 'interval', 'setvariable', 'condition', 'randomizer', 'tags', 'ticket', 'jump', 'loop', 'end', 'flow_end', 'javascript'];
  const interactiveBlocks = ['menu', 'buttons', 'question'];
  const externalBlocks = ['httprequest', 'webhook', 'openai', 'location', 'document', 'image', 'audio', 'video', 'typebot', 'convertbase64'];
  
  if (simpleBlocks.includes(blockType)) return 'flow-processor-blocks';
  if (interactiveBlocks.includes(blockType)) return 'flow-processor-interactive';
  if (externalBlocks.includes(blockType)) return 'flow-processor-external';
  return 'flow-processor-blocks';
}

async function processBlock(supabase: any, session: Session, flowData: FlowData, groupId: string, blockIndex: number, conexao: any) {
  const group = getGroupById(flowData, groupId);
  if (!group) {
    console.log('[Main] Grupo não encontrado:', groupId);
    return { action: 'complete', reason: 'group_not_found' };
  }
  
  const sortedBlocks = [...group.blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  if (blockIndex >= sortedBlocks.length) {
    const nextGroupId = findNextGroupId(flowData, groupId);
    if (nextGroupId) return { action: 'navigate', targetGroupId: nextGroupId };
    return { action: 'complete', reason: 'last_group' };
  }
  
  const block = sortedBlocks[blockIndex];
  const blockType = (block.type || block.data?.type || '').toLowerCase().trim();
  
  const { data: freshSession } = await supabase
    .from('flow_sessions')
    .select('variables')
    .eq('id', session.id)
    .maybeSingle();
  
  if (freshSession?.variables) {
    session.variables = freshSession.variables;
  }
  
  await supabase.from('flow_execution_logs').insert({
    session_id: session.id,
    node_id: block.id,
    node_type: blockType,
    node_data: block.data,
    result: 'processing'
  });
  
  await supabase.from('flow_sessions').update({
    current_group_id: groupId,
    current_block_index: blockIndex,
    current_node_id: groupId,
    updated_at: new Date().toISOString()
  }).eq('id', session.id);
  
  const processorName = getProcessorForBlock(blockType);
  
  if (['menu', 'buttons', 'question'].includes(blockType)) {
    const { data, error } = await supabase.functions.invoke('flow-processor-interactive', {
      body: { action: 'send', blockType, session, flowData, group, block, blockIndex, conexao }
    });
    
    if (error) {
      console.error(`[Main] Interactive error:`, error);
      return { action: 'advance', blockIndex };
    }
    
    if (data?.action === 'wait_input') {
      await supabase.from('flow_sessions').update({
        status: 'waiting_input',
        waiting_block_type: blockType,
        updated_at: new Date().toISOString()
      }).eq('id', session.id);
      return { action: 'wait_input', blockType };
    }
    
    if (data?.updatedVariables) {
      session.variables = data.updatedVariables;
    }
    
    return data;
  }
  
  const { data, error } = await supabase.functions.invoke(processorName, {
    body: { blockType, session, flowData, group, block, blockIndex, conexao }
  });
  
  if (error) {
    console.error(`[Main] Processor error for ${blockType}:`, error);
    return { action: 'advance', blockIndex };
  }
  
  if (data?.updatedVariables) {
    session.variables = data.updatedVariables;
  } else {
    const { data: freshSession } = await supabase
      .from('flow_sessions')
      .select('variables')
      .eq('id', session.id)
      .maybeSingle();
    
    if (freshSession?.variables) {
      session.variables = freshSession.variables;
    }
  }
  
  return data || { action: 'advance', blockIndex };
}

async function executeFlowLoop(supabase: any, session: Session, flowData: FlowData, groupId: string, blockIndex: number, conexao: any) {
  let currentGroupId = groupId;
  let currentBlockIndex = blockIndex;
  let iterations = 0;
  const maxIterations = 50;
  const startTime = Date.now();
  const maxExecutionTime = 25000;
  
  while (iterations < maxIterations) {
    iterations++;
    
    const elapsed = Date.now() - startTime;
    if (elapsed > maxExecutionTime) {
      console.warn(`[Main] ⏱️ Timeout interno atingido após ${elapsed}ms - salvando estado`);
      
      await supabase.from('flow_sessions').update({
        current_group_id: currentGroupId,
        current_block_index: currentBlockIndex,
        status: 'running',
        updated_at: new Date().toISOString()
      }).eq('id', session.id);
      
      return { 
        success: true, 
        partial: true, 
        message: 'Timeout interno - estado salvo',
        elapsed,
        iterations 
      };
    }
    
    const result = await processBlock(supabase, session, flowData, currentGroupId, currentBlockIndex, conexao);
    
    switch (result?.action) {
      case 'advance':
        currentBlockIndex = (result.blockIndex ?? currentBlockIndex) + 1;
        break;
        
      case 'navigate':
        currentGroupId = result.targetGroupId;
        currentBlockIndex = 0;
        break;
        
      case 'wait_input':
        return { success: true, waitingInput: true, blockType: result.blockType };
        
      case 'complete':
        await completeFlowSession(supabase, session, conexao, result.reason || 'flow_completed');
        return { success: true, completed: true };
        
      case 'error':
        console.error('[Main] Block error:', result.error);
        return { success: false, error: result.error };
        
      case 'error_edge':
        const errorEdge = findEdge(flowData, result.blockId, result.handleId);
        if (errorEdge) {
          console.log(`[Main] 🔴 Error edge found - navigating to: ${errorEdge.target}`);
          currentGroupId = errorEdge.target;
          currentBlockIndex = 0;
        } else if (result.continueOnError) {
          console.log(`[Main] ⚠️ No error edge - continuing to next block`);
          currentBlockIndex = (result.blockIndex ?? currentBlockIndex) + 1;
        } else {
          console.log(`[Main] ❌ No error edge and continueOnError=false - ending flow`);
          await completeFlowSession(supabase, session, conexao, 'http_request_error');
          return { success: true, completed: true };
        }
        break;
        
      case 'success_edge':
        // Handle httpRequest blocks with success/error edges
        const successEdge = findEdge(flowData, currentGroupId, result.handleId);
        if (successEdge) {
          console.log(`[Main] ✅ Success edge found (${result.handleId}) - navigating to: ${successEdge.target}`);
          currentGroupId = successEdge.target;
          currentBlockIndex = 0;
        } else {
          // Fallback: try default group exit
          const fallbackGroupId = findNextGroupId(flowData, currentGroupId);
          if (fallbackGroupId) {
            console.log(`[Main] ✅ No success handle edge, using group fallback: ${fallbackGroupId}`);
            currentGroupId = fallbackGroupId;
            currentBlockIndex = 0;
          } else {
            console.log(`[Main] ⚠️ No success edge found - advancing to next block`);
            currentBlockIndex = (result.blockIndex ?? currentBlockIndex) + 1;
          }
        }
        break;
        
      default:
        currentBlockIndex++;
    }
    
    session.current_group_id = currentGroupId;
    session.current_block_index = currentBlockIndex;
  }
  
  console.warn('[Main] ⚠️ Max iterations reached');
  return { success: false, error: 'Max iterations reached' };
}

async function completeFlowSession(supabase: any, session: Session, conexao: any, reason: string) {
  const chatId = session.chatId || session.chat_id;
  
  if (reason === 'ticket_created') {
    console.log(`[Main] 🎫 Chat ${chatId} transferido para atendimento humano - NÃO fechando chat`);
    
    await supabase.from('flow_sessions').update({
      status: 'human',
      updated_at: new Date().toISOString()
    }).eq('id', session.id);
    
    await supabase.from('flow_execution_logs').insert({
      session_id: session.id,
      node_id: 'flow_end',
      node_type: 'ticket_transfer',
      action: 'transferred_to_human',
      log_data: { reason },
      result: 'human'
    });
    
    return;
  }
  
  await supabase.from('flow_sessions').update({
    status: 'completed',
    updated_at: new Date().toISOString()
  }).eq('id', session.id);
  
  if (chatId) {
    await supabase.from('chats_whatsapp').update({
      ativo: false,
      encerradoem: new Date().toISOString(),
      resolvido: true,
      mododeatendimento: 'bot'
    }).eq('id', chatId);
    
    console.log(`[Main] ✅ Chat ${chatId} encerrado com ativo=false, resolvido=true`);
  }
  
  await supabase.from('flow_execution_logs').insert({
    session_id: session.id,
    node_id: 'flow_end',
    node_type: 'flow_end',
    action: 'flow_completed',
    log_data: { reason },
    result: 'completed'
  });
  
  if (conexao.farewellmessage?.trim()) {
    await callSender(supabase, 'text', conexao, session.phone_number, chatId, { message: conexao.farewellmessage });
  }
}

// ============================================
// 🔄 MAIN HANDLER
// ============================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();

    const { phoneNumber, messageText, messageType, conexaoId, contactName, chatId, interactiveId } = body;

    if (!phoneNumber || !conexaoId) {
      console.error(`[Main] ❌ [${requestId}] Parâmetros obrigatórios ausentes:`, { 
        phoneNumber: phoneNumber || 'MISSING', 
        conexaoId: conexaoId || 'MISSING',
        bodyKeys: Object.keys(body)
      });
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters',
        details: { phoneNumber: !!phoneNumber, conexaoId: !!conexaoId }
      }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const processingId = createProcessingId();

    if (!isValidPhoneNumber(phoneNumber)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (chatId) {
      const ownershipValidation = await validateChatOwnership(supabase, chatId, phoneNumber, conexaoId);
      if (!ownershipValidation.valid) {
        console.error(`[Main] 🔒 [${processingId}] BLOQUEADO: ${ownershipValidation.error}`);
        return new Response(JSON.stringify({ 
          error: 'Chat ownership validation failed',
          details: ownershipValidation.error
        }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Check human mode
    if (chatId) {
      const { data: chatData } = await supabase.from('chats_whatsapp')
        .select('mododeatendimento').eq('id', chatId).maybeSingle();
      
      if (chatData?.mododeatendimento?.toLowerCase().includes('humano')) {
        return new Response(JSON.stringify({ success: true, atendimentoHumano: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Check chatbot disabled
    const { data: contato } = await supabase.from('contatos_whatsapp')
      .select('chatbot_desabilitado').eq('telefone', phoneNumber).maybeSingle();
    
    if (contato?.chatbot_desabilitado) {
      return new Response(JSON.stringify({ success: true, chatbotDisabled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get conexao
    const { data: conexao, error: conexaoError } = await supabase.from('conexoes')
      .select('*')
      .eq('id', conexaoId).maybeSingle();
    
    if (conexaoError) {
      console.error('[Main] Erro ao buscar conexão:', conexaoError);
      return new Response(JSON.stringify({ error: 'Erro ao buscar conexão' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!conexao) {
      return new Response(JSON.stringify({ error: 'Conexão não encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // 🎯 NOVO: VERIFICAR CAMPANHA_FLOW_ID PRIMEIRO
    // Prioridade: campanha_flow_id > sessão existente > fluxo padrão
    // ============================================
    let campanhaFlowId: string | null = null;
    let origemCampanhaId: string | null = null;
    
    if (chatId) {
      const { data: chatData } = await supabase
        .from('chats_whatsapp')
        .select('campanha_flow_id, origem_campanha_id')
        .eq('id', chatId)
        .maybeSingle();
      
      if (chatData?.campanha_flow_id) {
        campanhaFlowId = chatData.campanha_flow_id;
        origemCampanhaId = chatData.origem_campanha_id;
        console.log(`[Main] 🎯 Chat ${chatId} veio de campanha ${origemCampanhaId}, flow_id: ${campanhaFlowId}`);
      }
    }

    // Check existing session
    let session = null;
    let existingSession = null;
    const { data: foundSession } = await supabase.from('flow_sessions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('conexao_id', conexaoId)
      .in('status', ['running', 'waiting_input'])
      .maybeSingle();

    existingSession = foundSession;

    // ============================================
    // 🔧 VALIDAÇÃO ROBUSTA: Invalidar sessão se necessário
    // NOVO: Se chat tem campanha_flow_id diferente do flow_id da sessão, invalidar
    // ============================================
    if (existingSession) {
      let shouldInvalidate = false;
      let invalidateReason = '';
      
      console.log(`[Main] 🔍 Verificando sessão existente: id=${existingSession.id}, chat_id=${existingSession.chat_id}, chatId_request=${chatId}, session_flow_id=${existingSession.flow_id}`);

      // CASO 0 (NOVO): Se chat tem campanha_flow_id e é diferente do flow_id da sessão
      if (campanhaFlowId && existingSession.flow_id !== campanhaFlowId) {
        shouldInvalidate = true;
        invalidateReason = `campanha_flow_id (${campanhaFlowId}) diferente do flow_id da sessão (${existingSession.flow_id})`;
      }

      // CASO 1: Se temos chatId na request e é diferente do chat_id da sessão
      if (!shouldInvalidate && chatId && existingSession.chat_id && existingSession.chat_id !== chatId) {
        shouldInvalidate = true;
        invalidateReason = `chatId diferente: sessão=${existingSession.chat_id}, request=${chatId}`;
      }
      
      // CASO 2: Se temos chatId na request mas sessão não tem chat_id (sessão órfã)
      if (!shouldInvalidate && chatId && !existingSession.chat_id) {
        shouldInvalidate = true;
        invalidateReason = `sessão sem chat_id mas request tem chatId=${chatId}`;
      }

      // CASO 3: Verificar se o chat da sessão ainda está ativo/não resolvido
      if (!shouldInvalidate && existingSession.chat_id) {
        const { data: sessionChat } = await supabase.from('chats_whatsapp')
          .select('id, resolvido, ativo')
          .eq('id', existingSession.chat_id)
          .maybeSingle();

        console.log(`[Main] 🔍 Chat da sessão ${existingSession.chat_id}:`, sessionChat);

        if (!sessionChat || sessionChat.resolvido === true || sessionChat.ativo === false) {
          shouldInvalidate = true;
          invalidateReason = sessionChat 
            ? `chat encerrado: resolvido=${sessionChat.resolvido}, ativo=${sessionChat.ativo}` 
            : 'chat não encontrado no banco';
        }
      }
      
      // CASO 4: Se sessão não tem chat_id e não temos chatId na request
      if (!shouldInvalidate && !existingSession.chat_id && !chatId) {
        const { data: contato } = await supabase.from('contatos_whatsapp')
          .select('id')
          .eq('telefone', phoneNumber)
          .maybeSingle();
        
        if (contato) {
          const { data: activeChat } = await supabase.from('chats_whatsapp')
            .select('id')
            .eq('usuarioid', contato.id)
            .eq('ativo', true)
            .eq('resolvido', false)
            .maybeSingle();
          
          if (activeChat && activeChat.id !== existingSession.chat_id) {
            shouldInvalidate = true;
            invalidateReason = `novo chat ativo encontrado: ${activeChat.id}`;
          }
        }
      }

      // Invalidar sessão se necessário
      if (shouldInvalidate) {
        console.log(`[Main] 🔄 Invalidando sessão antiga: ${existingSession.id} - Motivo: ${invalidateReason}`);
        await supabase.from('flow_sessions')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', existingSession.id);
        existingSession = null;
      } else {
        console.log(`[Main] ✅ Sessão válida: ${existingSession.id}`);
      }
    }

    if (existingSession) {
      session = existingSession;
      session.chatId = chatId || session.chat_id;
      
      if (!await acquireSessionLock(supabase, session.id, processingId)) {
        return new Response(JSON.stringify({ success: true, locked: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ============================================
    // 🎯 DETERMINAR FLOW A USAR - NOVA PRIORIDADE
    // 1. campanha_flow_id do chat (resposta de campanha)
    // 2. flow_id da sessão existente
    // 3. fluxo_boas_vindas_id da conexão
    // 4. fluxo_resposta_padrao_id da conexão
    // ============================================
    let flowIdToUse: string | null = null;
    
    // Prioridade 1: campanha_flow_id (SEMPRE tem precedência)
    if (campanhaFlowId) {
      flowIdToUse = campanhaFlowId;
      console.log(`[Main] 🎯 Usando fluxo da CAMPANHA: ${flowIdToUse}`);
    }
    // Prioridade 2: flow_id da sessão (se não tem campanha)
    else if (session?.flow_id) {
      flowIdToUse = session.flow_id;
      console.log(`[Main] 📦 Usando fluxo da SESSÃO existente: ${flowIdToUse}`);
    }
    // Prioridade 3 e 4: Fluxos padrão da conexão
    else {
      flowIdToUse = conexao.fluxo_boas_vindas_id || conexao.fluxo_resposta_padrao_id;
      console.log(`[Main] 🔧 Usando fluxo PADRÃO da conexão: ${flowIdToUse}`);
    }
    
    if (!flowIdToUse) {
      if (session) await releaseSessionLock(supabase, session.id);
      return new Response(JSON.stringify({ success: true, message: 'Sem fluxo configurado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: flow, error: flowError } = await supabase.from('flow_builders')
      .select('*')
      .eq('id', flowIdToUse)
      .maybeSingle();
    
    if (flowError) {
      console.error('[Main] Erro ao buscar flow:', flowError);
      if (session) await releaseSessionLock(supabase, session.id);
      return new Response(JSON.stringify({ error: 'Erro ao buscar flow' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!flow) {
      console.error(`[Main] ❌ Flow não encontrado: ${flowIdToUse}`);
      if (session) await releaseSessionLock(supabase, session.id);
      return new Response(JSON.stringify({ success: true, message: 'Flow não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Main] ✅ Flow carregado: ${flow.name} (${flow.id})`);

    const flowData = getFlowData(flow);

    // Handle existing session with waiting input
    if (session && session.status === 'waiting_input') {
      const groupId = session.current_group_id || session.current_node_id;
      const blockIndex = session.current_block_index || 0;
      const blockType = session.waiting_block_type;
      
      const group = getGroupById(flowData, groupId!);
      if (group) {
        const sortedBlocks = [...group.blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const block = sortedBlocks[blockIndex];
        
        const { data: responseResult } = await supabase.functions.invoke('flow-processor-interactive', {
          body: {
            action: 'response',
            blockType,
            session,
            flowData,
            group,
            block,
            blockIndex,
            conexao,
            messageText,
            messageType,
            interactiveId
          }
        });
        
        if (responseResult?.action === 'wait_input') {
          await releaseSessionLock(supabase, session.id);
          return new Response(JSON.stringify({ success: true, waitingInput: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        let nextGroupId = groupId!;
        let nextBlockIndex = blockIndex + 1;
        
        if (responseResult?.action === 'navigate') {
          nextGroupId = responseResult.targetGroupId;
          nextBlockIndex = 0;
        }
        
        await supabase.from('flow_sessions').update({
          status: 'running',
          waiting_block_type: null
        }).eq('id', session.id);
        
        const result = await executeFlowLoop(supabase, session, flowData, nextGroupId, nextBlockIndex, conexao);
        await releaseSessionLock(supabase, session.id);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Create new session
    if (!session) {
      const firstGroupId = getFirstGroupId(flowData);
      if (!firstGroupId) {
        return new Response(JSON.stringify({ error: 'Flow sem grupo inicial' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[Main] 🆕 Criando nova sessão com flow_id: ${flow.id}, firstGroupId: ${firstGroupId}`);

      const { data: newSession, error: sessionError } = await supabase.from('flow_sessions')
        .insert({
          phone_number: phoneNumber,
          contact_name: contactName,
          conexao_id: conexaoId,
          flow_id: flow.id,
          chat_id: chatId,
          current_group_id: firstGroupId,
          current_node_id: firstGroupId,
          current_block_index: 0,
          status: 'running',
          variables: {}
        })
        .select()
        .single();

      if (sessionError || !newSession) {
        console.error('[Main] Failed to create session:', sessionError);
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      session = newSession;
      session.chatId = chatId;

      await supabase.from('flow_execution_logs').insert({
        session_id: session.id,
        node_id: firstGroupId,
        node_type: 'session_start',
        action: 'session_start',
        log_data: { 
          phoneNumber, 
          contactName, 
          flowId: flow.id,
          flowName: flow.name,
          campanhaFlowId: campanhaFlowId,
          origemCampanhaId: origemCampanhaId
        },
        result: 'started'
      });

      if (!await acquireSessionLock(supabase, session.id, processingId)) {
        return new Response(JSON.stringify({ error: 'Failed to acquire lock' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Execute flow
    const groupId = session.current_group_id || session.current_node_id || getFirstGroupId(flowData);
    const blockIndex = session.current_block_index || 0;

    const result = await executeFlowLoop(supabase, session, flowData, groupId!, blockIndex, conexao);
    await releaseSessionLock(supabase, session.id);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Main] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
