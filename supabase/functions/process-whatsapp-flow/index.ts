// Force re-deploy: 2025-12-11T10:00:00 - Fix UTF-8 encoding properly
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// UTF-8 ENCODING HELPER (FIXED VERSION)
// ============================================
/**
 * Fix common UTF-8 encoding issues (mojibake)
 * Detects multiple layers of encoding corruption and fixes them
 */
function fixUtf8Encoding(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  let fixed = text;
  
  // Fix quadruple/triple encoding patterns (most severe corruption first)
  // Pattern like: Ã Â Ã Â Ã Â Ã Â¡
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*¡/g, '\u00E1'); // á
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*­/g, '\u00ED'); // í
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*ª/g, '\u00EA'); // ê
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*©/g, '\u00E9'); // é
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*³/g, '\u00F3'); // ó
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*º/g, '\u00FA'); // ú
  
  // Triple encoding patterns
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*¡/g, '\u00E1'); // á
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*­/g, '\u00ED'); // í
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*ª/g, '\u00EA'); // ê
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*©/g, '\u00E9'); // é
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*³/g, '\u00F3'); // ó
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*º/g, '\u00FA'); // ú
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*£/g, '\u00E3'); // ã
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*§/g, '\u00E7'); // ç
  
  // Double encoding patterns (ÃÂ¡ -> á)
  fixed = fixed.replace(/Ã\s*Â\s*¡/g, '\u00E1'); // á
  fixed = fixed.replace(/Ã\s*Â\s*à/g, '\u00E0'); // à
  fixed = fixed.replace(/Ã\s*Â\s*â/g, '\u00E2'); // â
  fixed = fixed.replace(/Ã\s*Â\s*¢/g, '\u00E2'); // â (alt)
  fixed = fixed.replace(/Ã\s*Â\s*£/g, '\u00E3'); // ã
  fixed = fixed.replace(/Ã\s*Â\s*ã/g, '\u00E3'); // ã (alt)
  fixed = fixed.replace(/Ã\s*Â\s*§/g, '\u00E7'); // ç
  fixed = fixed.replace(/Ã\s*Â\s*ç/g, '\u00E7'); // ç (alt)
  fixed = fixed.replace(/Ã\s*Â\s*©/g, '\u00E9'); // é
  fixed = fixed.replace(/Ã\s*Â\s*é/g, '\u00E9'); // é (alt)
  fixed = fixed.replace(/Ã\s*Â\s*ª/g, '\u00EA'); // ê
  fixed = fixed.replace(/Ã\s*Â\s*ê/g, '\u00EA'); // ê (alt)
  fixed = fixed.replace(/Ã\s*Â\s*¨/g, '\u00E8'); // è
  fixed = fixed.replace(/Ã\s*Â\s*­/g, '\u00ED'); // í
  fixed = fixed.replace(/Ã\s*Â\s*í/g, '\u00ED'); // í (alt)
  fixed = fixed.replace(/Ã\s*Â\s*®/g, '\u00EE'); // î
  fixed = fixed.replace(/Ã\s*Â\s*¬/g, '\u00EC'); // ì
  fixed = fixed.replace(/Ã\s*Â\s*³/g, '\u00F3'); // ó
  fixed = fixed.replace(/Ã\s*Â\s*ó/g, '\u00F3'); // ó (alt)
  fixed = fixed.replace(/Ã\s*Â\s*´/g, '\u00F4'); // ô
  fixed = fixed.replace(/Ã\s*Â\s*ô/g, '\u00F4'); // ô (alt)
  fixed = fixed.replace(/Ã\s*Â\s*µ/g, '\u00F5'); // õ
  fixed = fixed.replace(/Ã\s*Â\s*õ/g, '\u00F5'); // õ (alt)
  fixed = fixed.replace(/Ã\s*Â\s*²/g, '\u00F2'); // ò
  fixed = fixed.replace(/Ã\s*Â\s*º/g, '\u00FA'); // ú
  fixed = fixed.replace(/Ã\s*Â\s*ú/g, '\u00FA'); // ú (alt)
  fixed = fixed.replace(/Ã\s*Â\s*»/g, '\u00FB'); // û
  fixed = fixed.replace(/Ã\s*Â\s*¹/g, '\u00F9'); // ù
  fixed = fixed.replace(/Ã\s*Â\s*±/g, '\u00F1'); // ñ
  
  // Uppercase variants
  fixed = fixed.replace(/Ã\s*Â\s*Á/g, '\u00C1'); // Á
  fixed = fixed.replace(/Ã\s*Â\s*À/g, '\u00C0'); // À
  fixed = fixed.replace(/Ã\s*Â\s*Â/g, '\u00C2'); // Â
  fixed = fixed.replace(/Ã\s*Â\s*Ã/g, '\u00C3'); // Ã
  fixed = fixed.replace(/Ã\s*Â\s*Ç/g, '\u00C7'); // Ç
  fixed = fixed.replace(/Ã\s*Â\s*É/g, '\u00C9'); // É
  fixed = fixed.replace(/Ã\s*Â\s*Ê/g, '\u00CA'); // Ê
  fixed = fixed.replace(/Ã\s*Â\s*Í/g, '\u00CD'); // Í
  fixed = fixed.replace(/Ã\s*Â\s*Ó/g, '\u00D3'); // Ó
  fixed = fixed.replace(/Ã\s*Â\s*Ô/g, '\u00D4'); // Ô
  fixed = fixed.replace(/Ã\s*Â\s*Õ/g, '\u00D5'); // Õ
  fixed = fixed.replace(/Ã\s*Â\s*Ú/g, '\u00DA'); // Ú
  
  // Smart quotes and special chars
  fixed = fixed.replace(/[\u201C\u201D]/g, '"');
  fixed = fixed.replace(/[\u2018\u2019]/g, "'");
  fixed = fixed.replace(/\u2013/g, '-');
  fixed = fixed.replace(/\u2026/g, '...');
  
  return fixed;
}

/**
 * Validate and normalize text to proper UTF-8
 */
function normalizeUtf8(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  let normalized = fixUtf8Encoding(text);
  
  // Remove replacement characters
  normalized = normalized.replace(/\uFFFD/g, '');
  
  // Normalize to NFC form
  try {
    normalized = normalized.normalize('NFC');
  } catch (e) {
    console.warn('[Flow] UTF-8 normalize failed:', e);
  }
  
  return normalized;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================
// Ã°ÂÂÂ§ TYPES
// ============================================
interface FlowBlock {
  id: string;
  type: string;
  order: number;
  data: any;
}

interface FlowGroup {
  id: string;
  title: string;
  position: { x: number; y: number };
  blocks: FlowBlock[];
  color: string;
}

interface FlowData {
  groups?: FlowGroup[];
  nodes?: any[];
  edges: any[];
}

interface Session {
  id: string;
  phone_number: string;
  contact_name: string;
  conexao_id: string;
  flow_id: string;
  current_node_id?: string;
  current_group_id?: string;
  current_block_index?: number;
  waiting_block_type?: string;
  status: string;
  variables: Record<string, any>;
  chatId?: number;
  chat_id?: number;
  processing_id?: string;
}

// ============================================
// Ã°ÂÂÂ SESSION ISOLATION HELPERS
// ============================================
/**
 * Validate phone number format
 */
function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Create a unique processing ID for this request
 */
function createProcessingId(): string {
  return `${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
}

/**
 * Validate that chatId belongs to the correct phone number
 */
async function validateChatOwnership(
  supabase: any,
  chatId: number,
  phoneNumber: string
): Promise<boolean> {
  if (!chatId || !phoneNumber) return true; // Skip validation if no chatId
  
  const { data: chat } = await supabase
    .from('chats_whatsapp')
    .select('id, usuarioid')
    .eq('id', chatId)
    .maybeSingle();
  
  if (!chat) return false;
  
  const { data: contato } = await supabase
    .from('contatos_whatsapp')
    .select('telefone')
    .eq('id', chat.usuarioid)
    .maybeSingle();
  
  if (!contato) return false;
  
  const chatPhone = contato.telefone?.replace(/\D/g, '');
  const sessionPhone = phoneNumber.replace(/\D/g, '');
  
  if (chatPhone !== sessionPhone) {
    console.error(`[Flow] Ã¢ÂÂ CRITICAL: ChatId ${chatId} belongs to ${chatPhone}, not ${sessionPhone}`);
    return false;
  }
  
  return true;
}

/**
 * Acquire processing lock for session to prevent concurrent processing
 */
async function acquireSessionLock(
  supabase: any,
  sessionId: string,
  processingId: string
): Promise<boolean> {
  const lockTimeout = 30000; // 30 seconds
  const now = new Date();
  
  // First check if there's an active lock
  const { data: currentSession } = await supabase
    .from('flow_sessions')
    .select('processing_id, updated_at')
    .eq('id', sessionId)
    .maybeSingle();
  
  if (currentSession?.processing_id) {
    const lastUpdate = new Date(currentSession.updated_at);
    const elapsed = now.getTime() - lastUpdate.getTime();
    
    // If lock is still valid (not expired), reject
    if (elapsed < lockTimeout) {
      console.log(`[Flow] Ã¢ÂÂ³ Session ${sessionId} is being processed by ${currentSession.processing_id}, skipping...`);
      return false;
    }
    // Lock expired, we can take over
    console.log(`[Flow] Ã°ÂÂÂ Session ${sessionId} lock expired, taking over...`);
  }
  
  // Try to acquire lock
  const { data: lockResult, error: lockError } = await supabase
    .from('flow_sessions')
    .update({ 
      processing_id: processingId,
      updated_at: now.toISOString()
    })
    .eq('id', sessionId)
    .select()
    .maybeSingle();
  
  if (lockError || !lockResult) {
    console.error(`[Flow] Ã¢ÂÂ Failed to acquire lock for session ${sessionId}:`, lockError);
    return false;
  }
  
  console.log(`[Flow] Ã°ÂÂÂ Lock acquired for session ${sessionId} with processingId ${processingId}`);
  return true;
}

/**
 * Release processing lock for session
 */
async function releaseSessionLock(supabase: any, sessionId: string) {
  await supabase
    .from('flow_sessions')
    .update({ processing_id: null })
    .eq('id', sessionId);
  
  console.log(`[Flow] Ã°ÂÂÂ Lock released for session ${sessionId}`);
}

// ============================================
// Ã°ÂÂÂ§ HELPER: DETECT FORMAT AND GET BLOCKS
// ============================================
function getFlowData(flow: any): FlowData {
  if (!flow) return { groups: [], nodes: [], edges: [] };
  const fd = flow.flow_data || {};
  return {
    groups: fd.groups || [],
    nodes: fd.nodes || [],
    edges: fd.edges || []
  };
}

function isNewFormat(flowData: FlowData): boolean {
  return !!(flowData.groups && flowData.groups.length > 0);
}

function convertNodesToGroups(nodes: any[]): FlowGroup[] {
  return nodes
    .filter(n => n.data?.type !== 'start')
    .map(node => ({
      id: node.id,
      title: node.data?.label || 'Grupo',
      position: node.position || { x: 0, y: 0 },
      blocks: [{
        id: `block-${node.id}`,
        type: node.data?.type || 'text',
        order: 1,
        data: node.data || {}
      }],
      color: 'blue'
    }));
}

function getFirstGroupId(flowData: FlowData): string | null {
  const startNodeIds = ['start', 'start-node', 'startNode', 'start_node', 'inicio', 'initial'];
  
  console.log('[Flow] Ã°ÂÂÂ Buscando primeiro grupo...');
  
  const groupExists = (groupId: string): boolean => {
    if (isNewFormat(flowData)) {
      return flowData.groups?.some(g => g.id === groupId) || false;
    }
    return flowData.nodes?.some(n => n.id === groupId) || false;
  };
  
  if (isNewFormat(flowData)) {
    const startEdges = flowData.edges.filter((e: any) => {
      const sourceMatch = startNodeIds.some(id => 
        e.source === id || 
        e.source?.toLowerCase() === id.toLowerCase() ||
        e.sourceHandle === id
      );
      return sourceMatch;
    });
    
    for (const startEdge of startEdges) {
      if (groupExists(startEdge.target)) {
        console.log('[Flow] Ã¢ÂÂ Edge do start com grupo vÃÂ¡lido:', startEdge.source, '->', startEdge.target);
        return startEdge.target;
      }
    }
    
    const startGroup = flowData.groups?.find(g => 
      g.blocks?.some(b => b.type === 'start' || b.data?.type === 'start')
    );
    if (startGroup) {
      const startEdgeFromGroup = flowData.edges.find((e: any) => 
        e.source === startGroup.id && groupExists(e.target)
      );
      if (startEdgeFromGroup) {
        return startEdgeFromGroup.target;
      }
    }
    
    const firstNonStartGroup = flowData.groups?.find(g => 
      !startNodeIds.includes(g.id) && 
      !g.blocks?.some(b => b.type === 'start')
    );
    if (firstNonStartGroup) {
      return firstNonStartGroup.id;
    }
    
    return flowData.groups?.[0]?.id || null;
  } else {
    const startNode = flowData.nodes?.find((n: any) => 
      n.data?.type === 'start' || 
      startNodeIds.includes(n.id?.toLowerCase())
    );
    
    if (startNode) {
      const startEdge = flowData.edges.find((e: any) => e.source === startNode.id);
      if (startEdge) {
        return startEdge.target;
      }
    }
    
    const firstNode = flowData.nodes?.find((n: any) => 
      n.data?.type !== 'start' && 
      !startNodeIds.includes(n.id?.toLowerCase())
    );
    return firstNode?.id || null;
  }
}

function getGroupById(flowData: FlowData, groupId: string): FlowGroup | null {
  if (isNewFormat(flowData)) {
    let group = flowData.groups?.find(g => g.id === groupId);
    if (group) return group;
    
    group = flowData.groups?.find(g => 
      g.blocks?.some(b => b.id === groupId)
    );
    if (group) {
      console.log(`[Flow] Grupo encontrado via block ID: ${groupId} -> ${group.id}`);
      return group;
    }
    
    return null;
  } else {
    const node = flowData.nodes?.find((n: any) => n.id === groupId);
    if (!node) return null;
    return {
      id: node.id,
      title: node.data?.label || 'Grupo',
      position: node.position || { x: 0, y: 0 },
      blocks: [{
        id: `block-${node.id}`,
        type: node.data?.type || 'text',
        order: 1,
        data: node.data || {}
      }],
      color: 'blue'
    };
  }
}

function findNextGroupId(flowData: FlowData, sourceGroupId: string, sourceHandle?: string): string | null {
  const targetExists = (targetId: string): boolean => {
    if (isNewFormat(flowData)) {
      if (flowData.groups?.some(g => g.id === targetId)) return true;
      if (flowData.groups?.some(g => g.blocks?.some(b => b.id === targetId))) return true;
      return false;
    }
    return flowData.nodes?.some(n => n.id === targetId) || false;
  };
  
  const edge = flowData.edges.find((e: any) => {
    if (e.source !== sourceGroupId) return false;
    if (sourceHandle && e.sourceHandle !== sourceHandle) return false;
    if (!sourceHandle && e.sourceHandle && e.sourceHandle !== 'output') return false;
    return true;
  });
  
  if (!edge) return null;
  
  if (!targetExists(edge.target)) {
    console.log(`[Flow] Ã¢ÂÂ Ã¯Â¸Â Edge target nÃÂ£o existe: ${edge.target}`);
    return null;
  }
  
  return edge.target;
}

function findEdge(flowData: FlowData, sourceId: string, sourceHandle?: string): any | null {
  return flowData.edges.find((e: any) => {
    if (e.source !== sourceId) return false;
    if (sourceHandle) return e.sourceHandle === sourceHandle;
    return true;
  }) || null;
}

// ============================================
// Ã°ÂÂÂ¥ COMPLETE FLOW SESSION
// ============================================
async function completeFlowSession(
  supabase: any, 
  session: Session, 
  conexao: any,
  reason: string = 'flow_completed'
) {
  const now = new Date().toISOString();
  
  console.log(`[Flow] Ã°ÂÂÂ Encerrando sessÃÂ£o ${session.id} - Motivo: ${reason}`);
  
  await supabase
    .from('flow_sessions')
    .update({ 
      status: 'completed',
      updated_at: now
    })
    .eq('id', session.id);
  
  let chatIdToClose = session.chatId || session.chat_id;
  
  if (!chatIdToClose) {
    console.log(`[Flow] Ã¢ÂÂ Ã¯Â¸Â chat_id nÃÂ£o encontrado na sessÃÂ£o, buscando por telefone...`);
    const { data: chat } = await supabase
      .from('chats_whatsapp')
      .select('id')
      .eq('telefone', session.phone_number)
      .eq('ativo', true)
      .eq('resolvido', false)
      .maybeSingle();
    chatIdToClose = chat?.id;
  }
    
  if (chatIdToClose) {
    await supabase
      .from('chats_whatsapp')
      .update({
        ativo: false,
        encerradoem: now,
        resolvido: true,
        atualizadoem: now,
        mododeatendimento: 'bot'
      })
      .eq('id', chatIdToClose);
    console.log(`[Flow] Ã¢ÂÂ Chat ${chatIdToClose} encerrado com ativo=false, resolvido=true`);
  } else {
    console.log(`[Flow] Ã¢ÂÂ Ã¯Â¸Â Nenhum chat encontrado para encerrar`);
  }
  
  await supabase.from('flow_execution_logs').insert({
    session_id: session.id,
    node_id: session.current_group_id || session.current_node_id || 'flow_end',
    node_type: 'flow_end',
    action: 'flow_completed',
    log_data: { reason, completed_at: now, chat_id: chatIdToClose },
    result: 'completed'
  });
  
  if (conexao.farewellmessage && conexao.farewellmessage.trim() !== '') {
    await sendWhatsAppMessage(supabase, conexao, session.phone_number, conexao.farewellmessage, session.chatId || chatIdToClose);
  }
  
  console.log(`[Flow] Ã¢ÂÂ SessÃÂ£o ${session.id} finalizada`);
}

// ============================================
// Ã°ÂÂÂ¥ MAIN SERVE HANDLER
// ============================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { phoneNumber, messageText, messageType, conexaoId, contactName, chatId, interactiveId } = await req.json();
    const processingId = createProcessingId();
    console.log(`[Flow] Ã°ÂÂÂ© [${processingId}] Processando:`, { phoneNumber, messageText, messageType, conexaoId, chatId, interactiveId });

    // Validate phone number early
    if (!isValidPhoneNumber(phoneNumber)) {
      console.error(`[Flow] Ã¢ÂÂ [${processingId}] Invalid phone number: ${phoneNumber}`);
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if chat is in human mode
    if (chatId) {
      const { data: chatData } = await supabase
        .from('chats_whatsapp')
        .select('mododeatendimento')
        .eq('id', chatId)
        .maybeSingle();
      
      const modoDeAtendimento = (chatData?.mododeatendimento || 'bot').toLowerCase().trim();
      if (modoDeAtendimento === 'atendimento humano') {
        console.log('[Flow] Ã¢ÂÂ Ã¯Â¸Â Chat em Atendimento Humano - ignorando');
        return new Response(JSON.stringify({ success: true, atendimentoHumano: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Check if chatbot is disabled for contact
    const { data: contato } = await supabase
      .from('contatos_whatsapp')
      .select('chatbot_desabilitado')
      .eq('telefone', phoneNumber)
      .maybeSingle();
    
    if (contato?.chatbot_desabilitado) {
      console.log('[Flow] Chatbot desabilitado para:', phoneNumber);
      return new Response(JSON.stringify({ success: true, chatbotDisabled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get connection and flows
    const { data: conexao, error: conexaoError } = await supabase
      .from('conexoes')
      .select('*, fluxo_boas_vindas:fluxo_boas_vindas_id(*), fluxo_resposta_padrao:fluxo_resposta_padrao_id(*)')
      .eq('id', conexaoId)
      .single();

    if (conexaoError || !conexao) {
      console.error('[Flow] ConexÃÂ£o nÃÂ£o encontrada:', conexaoError);
      return new Response(JSON.stringify({ error: 'ConexÃÂ£o nÃÂ£o encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get or create session
    let { data: session } = await supabase
      .from('flow_sessions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('conexao_id', conexaoId)
      .in('status', ['running', 'waiting_input'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    console.log('[Flow] SessÃÂ£o:', session ? `ID: ${session.id}, Status: ${session.status}` : 'Nova');

    // Create new session if needed
    if (!session) {
      const flowToStart = conexao.fluxo_boas_vindas || conexao.fluxo_resposta_padrao;
      
      if (!flowToStart) {
        console.log('[Flow] Nenhum fluxo configurado');
        return new Response(JSON.stringify({ success: true, message: 'Sem fluxo' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const flowData = getFlowData(flowToStart);
      const hasContent = (flowData.groups && flowData.groups.length > 0) || 
                         (flowData.nodes && flowData.nodes.length > 0);
      
      if (!hasContent) {
        console.log('[Flow] Fluxo vazio');
        return new Response(JSON.stringify({ success: true, message: 'Fluxo vazio' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const firstGroupId = getFirstGroupId(flowData);
      
      const { data: newSession, error: createError } = await supabase
        .from('flow_sessions')
        .insert({
          phone_number: phoneNumber,
          contact_name: contactName,
          conexao_id: conexaoId,
          flow_id: flowToStart.id,
          current_group_id: firstGroupId,
          current_block_index: 0,
          current_node_id: firstGroupId,
          status: 'running',
          variables: {},
          chat_id: chatId
        })
        .select()
        .single();

      if (createError) {
        console.error('[Flow] Erro ao criar sessÃÂ£o:', createError);
        throw createError;
      }

      session = newSession;
      console.log('[Flow] Nova sessÃÂ£o criada:', session.id);
    }

    // Validate chatId ownership before assigning
    if (chatId) {
      const isValidOwnership = await validateChatOwnership(supabase, chatId, phoneNumber);
      if (!isValidOwnership) {
        console.error(`[Flow] Ã¢ÂÂ [${processingId}] ChatId ${chatId} does not belong to ${phoneNumber}, clearing chatId`);
        session.chatId = undefined;
      } else {
        session.chatId = chatId;
      }
    }

    // Acquire processing lock
    const lockAcquired = await acquireSessionLock(supabase, session.id, processingId);
    if (!lockAcquired) {
      console.log(`[Flow] Ã¢ÂÂ³ [${processingId}] Could not acquire lock, returning...`);
      return new Response(JSON.stringify({ success: true, message: 'Session being processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store processingId in session for tracking
    session.processing_id = processingId;

    // Get flow
    const flow = session.flow_id === conexao.fluxo_boas_vindas_id 
      ? conexao.fluxo_boas_vindas 
      : conexao.fluxo_resposta_padrao;
    
    const flowData = getFlowData(flow);

    // Handle waiting_input status (user response)
    try {
      if (session.status === 'waiting_input') {
        await handleUserResponse(supabase, session, flowData, messageText, messageType, conexao, interactiveId);
      } else {
        // Start/continue processing
        const groupId = session.current_group_id || session.current_node_id;
        const blockIndex = session.current_block_index || 0;
        
        if (groupId) {
          await processGroupBlock(supabase, session, flowData, groupId, blockIndex, conexao);
        }
      }
    } finally {
      // Always release lock
      await releaseSessionLock(supabase, session.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Flow] Erro:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// Ã°ÂÂÂ¥ HANDLE USER RESPONSE
// ============================================
async function handleUserResponse(
  supabase: any,
  session: Session,
  flowData: FlowData,
  messageText: string,
  messageType: string,
  conexao: any,
  interactiveId?: string
) {
  const groupId = session.current_group_id || session.current_node_id;
  const blockIndex = session.current_block_index || 0;
  
  if (!groupId) {
    await completeFlowSession(supabase, session, conexao, 'no_current_group');
    return;
  }

  const group = getGroupById(flowData, groupId);
  if (!group) {
    await completeFlowSession(supabase, session, conexao, 'group_not_found');
    return;
  }

  const block = group.blocks[blockIndex];
  if (!block) {
    await completeFlowSession(supabase, session, conexao, 'block_not_found');
    return;
  }

  const blockType = block.type || block.data?.type;
  console.log(`[Flow] Ã°ÂÂÂ Resposta para bloco ${blockType}:`, messageText);

  switch (blockType) {
    case 'menu':
      await handleMenuResponse(supabase, session, flowData, group, block, blockIndex, messageText, messageType, conexao, interactiveId);
      break;
    
    case 'buttons':
      await handleButtonsResponse(supabase, session, flowData, group, block, blockIndex, messageText, messageType, conexao, interactiveId);
      break;
    
    case 'question':
      await handleQuestionResponse(supabase, session, flowData, group, block, blockIndex, messageText, conexao);
      break;
    
    default:
      await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao);
  }
}

// ============================================
// Ã°ÂÂÂ¥ HANDLE MENU RESPONSE
// ============================================
async function handleMenuResponse(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  messageText: string,
  messageType: string,
  conexao: any,
  interactiveId?: string
) {
  let selectedOptionId: string | null = null;
  
  if (block.data?.menuData) {
    if (messageType === 'interactive' && interactiveId) {
      selectedOptionId = interactiveId;
      console.log(`[Flow] Ã¢ÂÂ Usando interactiveId: ${interactiveId}`);
    } else if (messageType === 'interactive') {
      for (const section of block.data.menuData.sections || []) {
        const row = section.rows?.find((r: any) => 
          r.title?.toLowerCase() === messageText.toLowerCase()
        );
        if (row) {
          selectedOptionId = row.id;
          break;
        }
      }
    } else {
      for (const section of block.data.menuData.sections || []) {
        const row = section.rows?.find((r: any) => 
          r.title?.toLowerCase() === messageText.toLowerCase() ||
          r.id === messageText
        );
        if (row) {
          selectedOptionId = row.id;
          break;
        }
      }
    }
    
    console.log(`[Flow] Menu (new): optionId=${selectedOptionId}`);
    
    if (selectedOptionId) {
      const edgeHandle = `${block.id}-${selectedOptionId}`;
      let edge = findEdge(flowData, group.id, edgeHandle);
      
      if (!edge) edge = findEdge(flowData, group.id, selectedOptionId);
      if (!edge) edge = findEdge(flowData, block.id, selectedOptionId);
      
      if (edge) {
        await navigateToGroup(supabase, session, flowData, edge.target, conexao);
      } else {
        if (blockIndex < group.blocks.length - 1) {
          await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao);
        } else {
          const defaultEdge = findEdge(flowData, group.id, 'output') || findEdge(flowData, group.id);
          if (defaultEdge) {
            await navigateToGroup(supabase, session, flowData, defaultEdge.target, conexao);
          } else {
            await completeFlowSession(supabase, session, conexao, 'menu_no_next');
          }
        }
      }
    } else {
      const fallbackEdge = findEdge(flowData, group.id, `${block.id}-fallback`) ||
                           findEdge(flowData, block.id, 'fallback') ||
                           findEdge(flowData, group.id, 'fallback');

      if (fallbackEdge) {
        console.log(`[Flow] Ã¢ÂÂ©Ã¯Â¸Â Menu fallback: navegando para ${fallbackEdge.target}`);
        await navigateToGroup(supabase, session, flowData, fallbackEdge.target, conexao);
      } else {
        await sendWhatsAppMessage(supabase, conexao, session.phone_number, 
          'OpÃÂ§ÃÂ£o invÃÂ¡lida. Por favor, escolha uma das opÃÂ§ÃÂµes do menu.', session.chatId);
      }
    }
  } 
  else {
    const options = block.data?.arrayOption || block.data?.options || [];
    
    if (messageType === 'interactive' && interactiveId) {
      selectedOptionId = interactiveId;
      console.log(`[Flow] Ã¢ÂÂ Menu legado usando interactiveId: ${interactiveId}`);
    } else if (messageType === 'interactive') {
      const selectedOption = options.find((opt: any) => 
        opt.value?.toLowerCase() === messageText.toLowerCase()
      );
      selectedOptionId = selectedOption ? `option-${selectedOption.number}` : null;
    } else {
      const selectedOption = options.find((opt: any) => 
        opt.value?.toLowerCase() === messageText.toLowerCase() || 
        String(opt.number) === messageText
      );
      selectedOptionId = selectedOption ? `option-${selectedOption.number}` : null;
    }

    if (selectedOptionId) {
      const edge = findEdge(flowData, group.id, selectedOptionId);
      if (edge) {
        await navigateToGroup(supabase, session, flowData, edge.target, conexao);
      } else {
        await completeFlowSession(supabase, session, conexao, 'menu_legacy_no_next');
      }
    } else {
      const fallbackEdge = findEdge(flowData, group.id, `${block.id}-fallback`) ||
                           findEdge(flowData, block.id, 'fallback') ||
                           findEdge(flowData, group.id, 'fallback');

      if (fallbackEdge) {
        console.log(`[Flow] Ã¢ÂÂ©Ã¯Â¸Â Menu fallback legado: navegando para ${fallbackEdge.target}`);
        await navigateToGroup(supabase, session, flowData, fallbackEdge.target, conexao);
      } else {
        await sendWhatsAppMessage(supabase, conexao, session.phone_number, 
          'OpÃÂ§ÃÂ£o invÃÂ¡lida. Por favor, escolha uma das opÃÂ§ÃÂµes do menu.', session.chatId);
      }
    }
  }
}

// ============================================
// Ã°ÂÂÂ¥ HANDLE BUTTONS RESPONSE
// ============================================
async function handleButtonsResponse(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  messageText: string,
  messageType: string,
  conexao: any,
  interactiveId?: string
) {
  let selectedButtonId: string | null = null;
  
  const buttonsData = block.data?.buttonsData;
  if (!buttonsData || !buttonsData.buttons) {
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao);
    return;
  }
  
  if (messageType === 'interactive' && interactiveId) {
    selectedButtonId = interactiveId;
    console.log(`[Flow] Ã°ÂÂÂ Button selected via interactive: ${selectedButtonId}`);
  } else {
    const buttons = buttonsData.buttons || [];
    const normalizedInput = messageText.toLowerCase().trim();
    
    for (const btn of buttons) {
      if (btn.title.toLowerCase().trim() === normalizedInput) {
        selectedButtonId = btn.id;
        break;
      }
    }
    
    console.log(`[Flow] Ã°ÂÂÂ Button matched by text: ${selectedButtonId}`);
  }
  
  if (selectedButtonId) {
    const handleId = `${block.id}-${selectedButtonId}`;
    let edge = findEdge(flowData, group.id, handleId);
    if (!edge) edge = findEdge(flowData, block.id, selectedButtonId);
    
    console.log(`[Flow] Ã°ÂÂÂ Looking for edge with handle: ${handleId}, found: ${!!edge}`);
    
    if (edge) {
      await navigateToGroup(supabase, session, flowData, edge.target, conexao);
    } else {
      const fallbackEdge = findEdge(flowData, group.id, `${block.id}-fallback`) ||
                           findEdge(flowData, block.id, 'fallback');
      
      if (fallbackEdge) {
        await navigateToGroup(supabase, session, flowData, fallbackEdge.target, conexao);
      } else {
        await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao);
      }
    }
  } else {
    const fallbackEdge = findEdge(flowData, group.id, `${block.id}-fallback`) ||
                         findEdge(flowData, block.id, 'fallback');
    
    if (fallbackEdge) {
      await navigateToGroup(supabase, session, flowData, fallbackEdge.target, conexao);
    } else {
      await sendWhatsAppMessage(supabase, conexao, session.phone_number, 
        'OpÃÂ§ÃÂ£o invÃÂ¡lida. Por favor, clique em um dos botÃÂµes.', session.chatId);
    }
  }
}

// ============================================
// Ã°ÂÂÂ¥ HANDLE QUESTION RESPONSE
// ============================================
async function handleQuestionResponse(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  messageText: string,
  conexao: any
) {
  const variableKey = block.data?.typebotIntegration?.answerKey || 
                      block.data?.variable || 
                      block.data?.answerKey ||
                      `question_${block.id}`;
  
  const answerType = block.data?.typebotIntegration?.answerType || block.data?.answerType || 'text';
  const isValid = validateAnswerType(messageText, answerType);
  
  if (!isValid) {
    const errorMessages: Record<string, string> = {
      email: 'Por favor, informe um email vÃÂ¡lido.',
      phone: 'Por favor, informe um telefone vÃÂ¡lido.',
      number: 'Por favor, informe um nÃÂºmero vÃÂ¡lido.',
      url: 'Por favor, informe uma URL vÃÂ¡lida.',
    };
    await sendWhatsAppMessage(supabase, conexao, session.phone_number, 
      errorMessages[answerType] || 'Resposta invÃÂ¡lida. Tente novamente.', session.chatId);
    return;
  }
  
  const variables = { ...session.variables, [variableKey]: messageText };
  await supabase
    .from('flow_sessions')
    .update({ variables })
    .eq('id', session.id);
  session.variables = variables;
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao);
}

function validateAnswerType(value: string, type: string): boolean {
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'phone':
      return /^[\d\s\-\+\(\)]{8,}$/.test(value);
    case 'number':
      return !isNaN(Number(value));
    case 'url':
      return /^https?:\/\/.+/.test(value);
    default:
      return true;
  }
}

// ============================================
// Ã°ÂÂÂ¥ PROCESS GROUP BLOCK
// ============================================
async function processGroupBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  groupId: string,
  blockIndex: number,
  conexao: any
) {
  const group = getGroupById(flowData, groupId);
  
  if (!group) {
    console.log('[Flow] Grupo nÃÂ£o encontrado:', groupId);
    await completeFlowSession(supabase, session, conexao, 'group_not_found');
    return;
  }

  const sortedBlocks = [...group.blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  if (blockIndex >= sortedBlocks.length) {
    const nextGroupId = findNextGroupId(flowData, groupId);
    if (nextGroupId) {
      await navigateToGroup(supabase, session, flowData, nextGroupId, conexao);
    } else {
      await completeFlowSession(supabase, session, conexao, 'last_group');
    }
    return;
  }

  const block = sortedBlocks[blockIndex];
  const rawBlockType = block.type || block.data?.type;
  const blockType = (typeof rawBlockType === 'string' ? rawBlockType.trim().toLowerCase() : rawBlockType);
  
  if (rawBlockType !== blockType) {
    console.log(`[Flow] Ã¢ÂÂ Ã¯Â¸Â blockType normalizado: "${rawBlockType}" -> "${blockType}"`);
  }

  await supabase.from('flow_execution_logs').insert({
    session_id: session.id,
    node_id: block.id,
    node_type: blockType,
    node_data: block.data,
    result: 'processing'
  });

  await supabase
    .from('flow_sessions')
    .update({ 
      current_group_id: groupId,
      current_block_index: blockIndex,
      current_node_id: groupId,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);

  switch (blockType) {
    case 'start':
      await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'text':
      await handleTextBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'menu':
      await handleMenuBlock(supabase, session, flowData, group, block, blockIndex, conexao);
      break;
    
    case 'buttons':
      await handleButtonsBlock(supabase, session, flowData, group, block, blockIndex, conexao);
      break;
    
    case 'question':
      await handleQuestionBlock(supabase, session, flowData, group, block, blockIndex, conexao);
      break;
    
    case 'condition':
      await handleConditionBlock(supabase, session, flowData, group, block, blockIndex, conexao);
      break;
    
    case 'interval':
      await handleIntervalBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'randomizer':
      await handleRandomizerBlock(supabase, session, flowData, group, block, blockIndex, conexao);
      break;
    
    case 'ticket':
      await handleTicketBlock(supabase, session, flowData, group, block, blockIndex, conexao);
      break;
    
    case 'tags':
      await handleTagsBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'setvariable':
      await handleSetVariableBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'httprequest':
      await handleHttpRequestBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'webhook':
      await handleWebhookBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'location':
      await handleLocationBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'openai':
      await handleOpenAIBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'typebot':
      await handleTypebotBlock(supabase, session, flowData, group, block, blockIndex, conexao);
      break;
    
    case 'document':
      await handleDocumentBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'image':
      await handleImageBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'audio':
      await handleAudioBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'video':
      await handleVideoBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'convertbase64':
      await handleConvertBase64Block(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'loop':
      await handleLoopBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'jump':
      await handleJumpBlock(supabase, session, flowData, group, block, blockIndex, conexao);
      break;
    
    case 'javascript':
      await handleJavaScriptBlock(supabase, session, flowData, group, block, blockIndex, conexao, sortedBlocks);
      break;
    
    case 'end':
    case 'flow_end':
      await completeFlowSession(supabase, session, conexao, 'end_block');
      break;
    
    default:
      console.log(`[Flow] Bloco nÃÂ£o suportado: ${blockType}`);
      await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
  }
}

// ============================================
// Ã°ÂÂÂ§ NAVIGATION HELPERS
// ============================================
async function navigateToGroup(
  supabase: any,
  session: Session,
  flowData: FlowData,
  targetGroupId: string,
  conexao: any
) {
  console.log(`[Flow] Ã°ÂÂÂ Navegando para grupo: ${targetGroupId}`);
  
  await supabase
    .from('flow_sessions')
    .update({
      current_group_id: targetGroupId,
      current_node_id: targetGroupId,
      current_block_index: 0,
      status: 'running',
      waiting_block_type: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);
  
  session.current_group_id = targetGroupId;
  session.current_node_id = targetGroupId;
  session.current_block_index = 0;
  session.status = 'running';
  
  await processGroupBlock(supabase, session, flowData, targetGroupId, 0, conexao);
}

async function advanceToNextBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  currentBlockIndex: number,
  conexao: any,
  sortedBlocks?: FlowBlock[]
) {
  const blocks = sortedBlocks || [...group.blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
  const nextIndex = currentBlockIndex + 1;
  
  if (nextIndex < blocks.length) {
    await processGroupBlock(supabase, session, flowData, group.id, nextIndex, conexao);
  } else {
    const nextGroupId = findNextGroupId(flowData, group.id);
    if (nextGroupId) {
      await navigateToGroup(supabase, session, flowData, nextGroupId, conexao);
    } else {
      await completeFlowSession(supabase, session, conexao, 'no_next_group');
    }
  }
}

async function setWaitingInput(supabase: any, session: Session, blockType: string) {
  await supabase
    .from('flow_sessions')
    .update({
      status: 'waiting_input',
      waiting_block_type: blockType,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);
  
  session.status = 'waiting_input';
  session.waiting_block_type = blockType;
  
  console.log(`[Flow] Ã¢ÂÂ³ Aguardando input do usuÃÂ¡rio (${blockType})`);
}

// ============================================
// Ã°ÂÂÂ¥ BLOCK HANDLERS
// ============================================
async function handleTextBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const rawMessage = block.data?.description || block.data?.text || block.data?.message || '';
  const message = replaceVariables(rawMessage, session.variables, session);
  
  if (message && message.trim() !== '') {
    await sendWhatsAppMessage(supabase, conexao, session.phone_number, message, session.chatId);
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleJumpBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any
) {
  const targetGroupId = block.data?.targetGroupId;
  
  if (!targetGroupId) {
    console.log(`[Flow] Ã¢ÂÂ Ã¯Â¸Â Bloco jump sem targetGroupId definido`);
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao);
    return;
  }
  
  // Verificar se o grupo de destino existe
  const targetGroup = flowData.groups?.find(g => g.id === targetGroupId);
  
  if (!targetGroup) {
    console.log(`[Flow] Ã¢ÂÂ Ã¯Â¸Â Grupo de destino nÃÂ£o encontrado: ${targetGroupId}`);
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao);
    return;
  }
  
  console.log(`[Flow] Ã¢ÂÂ­Ã¯Â¸Â Jump para grupo: ${targetGroup.title || targetGroupId}`);
  await navigateToGroup(supabase, session, flowData, targetGroupId, conexao);
}

async function handleJavaScriptBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  console.log(`[Flow] Ã°ÂÂÂ¨ Executando bloco JavaScript`);
  
  const code = block.data?.code || '';
  const outputVariables = block.data?.outputVariables || [];
  
  if (!code.trim()) {
    console.log(`[Flow] Ã¢ÂÂ Ã¯Â¸Â Bloco JavaScript sem cÃÂ³digo`);
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
    return;
  }
  
  try {
    // Preparar o contexto com as variÃÂ¡veis disponÃÂ­veis
    const variables = session.variables || {};
    const input = (session as any).last_input || (session.variables as any)?._last_message || '';
    const sessionId = session.id;
    
    // Criar uma funÃÂ§ÃÂ£o segura para executar o cÃÂ³digo
    // Usamos Function constructor para criar um escopo isolado
    const wrappedCode = `
      "use strict";
      const variables = ${JSON.stringify(variables)};
      const input = ${JSON.stringify(input)};
      const sessionId = ${JSON.stringify(sessionId)};
      
      // FunÃÂ§ÃÂµes utilitÃÂ¡rias disponÃÂ­veis
      const parseJSON = (str) => {
        try { return JSON.parse(str); } catch(e) { return null; }
      };
      const stringify = (obj) => JSON.stringify(obj);
      const formatDate = (date, format) => {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return format
          .replace('DD', day)
          .replace('MM', month)
          .replace('YYYY', year)
          .replace('HH', hours)
          .replace('mm', minutes);
      };
      
      ${code}
    `;
    
    // Executar o cÃÂ³digo
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction(wrappedCode);
    const result = await fn();
    
    console.log(`[Flow] Ã°ÂÂÂ¨ Resultado do JavaScript:`, JSON.stringify(result).substring(0, 200));
    
    // Salvar resultados nas variÃÂ¡veis de saÃÂ­da
    if (result !== undefined && result !== null) {
      const updatedVariables = { ...session.variables };
      
      for (const outputVar of outputVariables) {
        if (!outputVar.name) continue;
        
        let value = result;
        
        // Se tiver um path, navegar pelo objeto
        if (outputVar.path) {
          const pathParts = outputVar.path.replace(/\[(\d+)\]/g, '.$1').split('.');
          for (const part of pathParts) {
            if (value === null || value === undefined) break;
            value = value[part];
          }
        }
        
        // Converter para string se necessÃÂ¡rio
        if (typeof value === 'object') {
          updatedVariables[outputVar.name] = JSON.stringify(value);
        } else {
          updatedVariables[outputVar.name] = String(value ?? '');
        }
        
        console.log(`[Flow] Ã°ÂÂÂ¨ VariÃÂ¡vel salva: ${outputVar.name} = ${String(updatedVariables[outputVar.name]).substring(0, 100)}`);
      }
      
      // Se result for um objeto e nÃÂ£o tiver outputVariables definidas, salvar todas as propriedades
      if (typeof result === 'object' && outputVariables.length === 0) {
        for (const [key, value] of Object.entries(result)) {
          if (typeof value === 'object') {
            updatedVariables[key] = JSON.stringify(value);
          } else {
            updatedVariables[key] = String(value ?? '');
          }
          console.log(`[Flow] Ã°ÂÂÂ¨ VariÃÂ¡vel auto-salva: ${key} = ${String(updatedVariables[key]).substring(0, 100)}`);
        }
      }
      
      // Atualizar sessÃÂ£o
      await supabase
        .from('flow_sessions')
        .update({ variables: updatedVariables })
        .eq('id', session.id);
      
      session.variables = updatedVariables;
    }
    
  } catch (error: any) {
    console.error(`[Flow] Ã¢ÂÂ Erro ao executar JavaScript:`, error.message);
    
    // Salvar erro em variÃÂ¡vel para debugging
    const updatedVariables = { 
      ...session.variables, 
      _js_error: error.message,
      _js_error_time: new Date().toISOString()
    };
    
    await supabase
      .from('flow_sessions')
      .update({ variables: updatedVariables })
      .eq('id', session.id);
    
    session.variables = updatedVariables;
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleMenuBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any
) {
  if (block.data?.menuData) {
    const menuData = block.data.menuData;
    
    await sendWhatsAppInteractiveList(supabase, conexao, session.phone_number, {
      header: replaceVariables(menuData.header || 'Menu', session.variables, session),
      body: replaceVariables(menuData.body || 'Escolha uma opÃÂ§ÃÂ£o:', session.variables, session),
      footer: menuData.footer ? replaceVariables(menuData.footer, session.variables, session) : undefined,
      buttonText: replaceVariables(menuData.buttonText || 'Ver opÃÂ§ÃÂµes', session.variables, session),
      sections: (menuData.sections || []).map((section: any) => ({
        title: replaceVariables(section.title || 'OpÃÂ§ÃÂµes', session.variables, session),
        rows: (section.rows || []).map((row: any) => ({
          id: row.id,
          title: replaceVariables(row.title || 'OpÃÂ§ÃÂ£o', session.variables, session).substring(0, 24),
          description: row.description ? replaceVariables(row.description, session.variables, session).substring(0, 72) : undefined
        }))
      }))
    }, session.chatId);
  } else {
    const options = block.data?.arrayOption || block.data?.options || [];
    
    await sendWhatsAppInteractiveList(supabase, conexao, session.phone_number, {
      header: replaceVariables(block.data?.menuTitle || 'Menu', session.variables, session),
      body: replaceVariables(block.data?.description || 'Escolha uma opÃÂ§ÃÂ£o:', session.variables, session),
      buttonText: 'Ver opÃÂ§ÃÂµes',
      sections: [{
        title: 'OpÃÂ§ÃÂµes',
        rows: options.map((opt: any) => ({
          id: `option-${opt.number}`,
          title: replaceVariables((opt.value || opt.label || `OpÃÂ§ÃÂ£o ${opt.number}`), session.variables, session).substring(0, 24),
          description: opt.description ? replaceVariables(opt.description, session.variables, session).substring(0, 72) : undefined
        }))
      }]
    }, session.chatId);
  }
  
  await setWaitingInput(supabase, session, 'menu');
}

async function handleButtonsBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any
) {
  const buttonsData = block.data?.buttonsData;
  
  if (!buttonsData || !buttonsData.buttons || buttonsData.buttons.length === 0) {
    console.warn('[Flow] Buttons block sem botÃÂµes configurados');
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao);
    return;
  }
  
  const body = replaceVariables(buttonsData.body || 'Escolha uma opÃÂ§ÃÂ£o:', session.variables, session);
  const footer = buttonsData.footer ? replaceVariables(buttonsData.footer, session.variables, session) : undefined;
  
  const buttons = buttonsData.buttons.slice(0, 3).map((btn: any) => ({
    id: btn.id,
    title: replaceVariables(btn.title || 'BotÃÂ£o', session.variables, session).substring(0, 20)
  }));
  
  await sendWhatsAppInteractiveButtons(supabase, conexao, session.phone_number, {
    body,
    footer,
    buttons
  }, session.chatId);
  
  await setWaitingInput(supabase, session, 'buttons');
}

async function handleQuestionBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any
) {
  const rawMessage = block.data?.typebotIntegration?.message || 
    block.data?.question || 
    block.data?.text || 
    block.data?.message ||
    'Por favor, responda:';
  
  const message = replaceVariables(rawMessage, session.variables, session);
  
  await sendWhatsAppMessage(supabase, conexao, session.phone_number, message, session.chatId);
  await setWaitingInput(supabase, session, 'question');
}

async function handleConditionBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any
) {
  let matchedRuleIndex = -1;
  
  if (block.data?.conditions?.rules && Array.isArray(block.data.conditions.rules)) {
    const rules = block.data.conditions.rules;
    
    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
      const rule = rules[ruleIndex];
      const comparisons = rule.comparisons || [];
      
      if (comparisons.length === 0) continue;
      
      const allComparisonsPass = comparisons.every((comp: any, compIndex: number) => {
        const varValue = session.variables[comp.variable] || 
                         replaceVariables(`{{${comp.variable}}}`, session.variables, session);
        const compareValue = replaceVariables(String(comp.value || ''), session.variables, session);
        const result = evaluateComparison(varValue, comp.operator, compareValue);
        return result;
      });
      
      if (allComparisonsPass) {
        matchedRuleIndex = ruleIndex;
        break;
      }
    }
  }
  else if (block.data?.conditions?.comparisons) {
    const comparisons = block.data.conditions.comparisons;
    const logicalOperator = block.data.conditions.logicalOperator || 'and';
    
    const results: Array<{ index: number; result: boolean }> = comparisons.map((comp: any, idx: number) => {
      const varValue = session.variables[comp.variable] || 
                       replaceVariables(`{{${comp.variable}}}`, session.variables, session);
      const compareValue = replaceVariables(String(comp.value || ''), session.variables, session);
      const result = evaluateComparison(varValue, comp.operator, compareValue);
      return { index: idx, result };
    });
    
    if (logicalOperator === 'or') {
      const matched = results.find((r) => r.result);
      matchedRuleIndex = matched ? 0 : -1;
    } else {
      const allPassed = results.every((r) => r.result);
      matchedRuleIndex = allPassed ? 0 : -1;
    }
  }
  else if (block.data?.variable) {
    const variable = block.data.variable;
    const condition = block.data.condition || 'equals';
    const rawValue = block.data.value || '';
    const compareValue = replaceVariables(String(rawValue), session.variables, session);
    const varValue = session.variables[variable] || '';
    
    const conditionMet = evaluateComparison(varValue, condition, compareValue);
    matchedRuleIndex = conditionMet ? 0 : -1;
  }
  
  let edge = null;
  
  if (matchedRuleIndex >= 0) {
    edge = findEdge(flowData, group.id, `${block.id}-rule-${matchedRuleIndex}`);
    if (!edge) edge = findEdge(flowData, block.id, `rule-${matchedRuleIndex}`);
    if (!edge) edge = findEdge(flowData, group.id, `condition-${matchedRuleIndex}`);
    if (!edge) edge = findEdge(flowData, block.id, `condition-${matchedRuleIndex}`);
    if (!edge) edge = findEdge(flowData, group.id, `${block.id}-condition-${matchedRuleIndex}`);
    if (!edge) edge = findEdge(flowData, group.id, 'true');
    if (!edge) edge = findEdge(flowData, group.id, `${block.id}-true`);
    
    console.log(`[Flow] Ã¢ÂÂ Matched rule ${matchedRuleIndex}, edge found: ${!!edge}`);
  }
  
  if (!edge) {
    edge = findEdge(flowData, group.id, 'else');
    if (!edge) edge = findEdge(flowData, block.id, 'else');
    if (!edge) edge = findEdge(flowData, group.id, `${block.id}-else`);
    if (!edge) edge = findEdge(flowData, group.id, 'false');
    if (!edge) edge = findEdge(flowData, group.id, `${block.id}-false`);
  }
  
  if (edge) {
    await navigateToGroup(supabase, session, flowData, edge.target, conexao);
  } else {
    await completeFlowSession(supabase, session, conexao, `condition_no_edge_matched_rule_${matchedRuleIndex}`);
  }
}

function evaluateComparison(varValue: any, operator: string, compareValue: any): boolean {
  const strVar = String(varValue || '').toLowerCase();
  const strCompare = String(compareValue || '').toLowerCase();
  
  switch (operator) {
    case 'equals':
    case '==':
    case 'equal':
      return strVar === strCompare;
    case 'not_equals':
    case '!=':
    case 'notEqual':
      return strVar !== strCompare;
    case 'contains':
      return strVar.includes(strCompare);
    case 'not_contains':
    case 'notContains':
      return !strVar.includes(strCompare);
    case 'starts_with':
    case 'startsWith':
      return strVar.startsWith(strCompare);
    case 'ends_with':
    case 'endsWith':
      return strVar.endsWith(strCompare);
    case 'greater':
    case '>':
      return Number(varValue) > Number(compareValue);
    case 'less':
    case '<':
      return Number(varValue) < Number(compareValue);
    case 'greater_equal':
    case '>=':
      return Number(varValue) >= Number(compareValue);
    case 'less_equal':
    case '<=':
      return Number(varValue) <= Number(compareValue);
    case 'is_empty':
    case 'isEmpty':
      return !varValue || strVar === '';
    case 'is_not_empty':
    case 'isNotEmpty':
      return !!varValue && strVar !== '';
    case 'exists':
      return varValue !== undefined && varValue !== null && varValue !== '';
    case 'not_exists':
      return varValue === undefined || varValue === null || varValue === '';
    case 'not_found':
      return varValue === undefined || varValue === null || String(varValue).includes('{{');
    default:
      return strVar === strCompare;
  }
}

async function handleIntervalBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const seconds = block.data?.sec || Math.floor((block.data?.delay || 1000) / 1000);
  const delayMs = Math.min(seconds * 1000, 10000);
  await new Promise(resolve => setTimeout(resolve, delayMs));
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleRandomizerBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any
) {
  const random = Math.random() * 100;
  let selectedPath = 'b';
  let selectedHandle = '';
  
  if (block.data?.percent !== undefined) {
    const percent = Number(block.data.percent) || 50;
    selectedPath = random <= percent ? 'a' : 'b';
    selectedHandle = `${block.id}-${selectedPath}`;
  }
  else if (block.data?.options) {
    const options = block.data.options;
    let accumulated = 0;
    
    for (const opt of options) {
      accumulated += opt.percentage || 0;
      if (random <= accumulated) {
        selectedPath = opt.value || opt.id;
        break;
      }
    }
    selectedHandle = selectedPath;
  }
  
  let edge = findEdge(flowData, group.id, selectedHandle);
  if (!edge) edge = findEdge(flowData, group.id, selectedPath);
  if (!edge) edge = findEdge(flowData, block.id, selectedPath);
  
  if (edge) {
    await navigateToGroup(supabase, session, flowData, edge.target, conexao);
  } else {
    await completeFlowSession(supabase, session, conexao, 'randomizer_no_next');
  }
}

async function handleTicketBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any
) {
  console.log('[Flow] Ã°ÂÂÂ« Ticket block.data:', JSON.stringify(block.data));
  
  const queueIds = block.data?.queueIds || [];
  const department = block.data?.department || 'geral';
  const message = block.data?.message || block.data?.text;
  
  console.log(`[Flow] Ã°ÂÂÂ« Queue IDs recebidos: ${JSON.stringify(queueIds)}`);
  
  if (message) {
    await sendWhatsAppMessage(supabase, conexao, session.phone_number, 
      replaceVariables(message, session.variables, session), session.chatId);
  }

  const { data: existingContact, error: searchError } = await supabase
    .from("contatos_whatsapp")
    .select("*")
    .eq("telefone", session.phone_number)
    .maybeSingle();
  
  if (!existingContact) {
    console.warn(`[Flow] Ã¢ÂÂ Ã¯Â¸Â Contato nÃÂ£o encontrado para telefone: ${session.phone_number}`);
    return;
  }
  
  const { data: chat } = await supabase
    .from('chats_whatsapp')
    .select('id, filas')
    .eq("usuarioid", existingContact.id)
    .eq("ativo", true)
    .maybeSingle();
  
  if (chat) {
    const filasArray = queueIds.map((id: any) => String(id));
  
    console.log(`[Flow] Ã°ÂÂÂ Atualizando chat ${chat.id} com filas:`, filasArray);
  
    const { error: updateError } = await supabase
      .from('chats_whatsapp')
      .update({
        mododeatendimento: 'Atendimento Humano',
        atualizadoem: new Date().toISOString(),
        filas: filasArray
      })
      .eq('id', chat.id);
  
    if (updateError) {
      console.error(`[Flow] Ã¢ÂÂ Erro ao atualizar filas do chat: ${updateError.message}`);
    } else {
      console.log(`[Flow] Ã¢ÂÂ Chat ${chat.id} transferido com filas:`, filasArray);
    }
  } else {
    console.warn(`[Flow] Ã¢ÂÂ Ã¯Â¸Â Chat ativo nÃÂ£o encontrado para telefone: ${session.phone_number}`);
  }

  await supabase
    .from('flow_sessions')
    .update({ 
      status: 'human',
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);
  
  await supabase.from('flow_execution_logs').insert({
    session_id: session.id,
    node_id: block.id,
    node_type: 'ticket',
    action: 'transfer_to_human',
    log_data: { queueIds, department, filasApplied: queueIds.map((id: any) => String(id)) },
    result: 'completed'
  });
  
  console.log('[Flow] Ã°ÂÂÂ« Ticket criado - Atendimento Humano');
}

async function handleTagsBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  console.log('[Flow] Ã°ÂÂÂ·Ã¯Â¸Â Tags block.data:', JSON.stringify(block.data));
  
  const selectedTags = block.data?.selectedTags || block.data?.tags || block.data?.tagIds || [];
  
  const tagIds = selectedTags.map((t: any) => {
    if (typeof t === 'object' && t !== null) {
      return String(t.id);
    }
    return String(t);
  });
  
  console.log(`[Flow] Ã°ÂÂÂ·Ã¯Â¸Â Tag IDs extraÃÂ­dos: ${JSON.stringify(tagIds)}`);
  
  if (tagIds.length > 0) {
    const { data: chat } = await supabase
      .from('chats_whatsapp')
      .select('id, tags')
      .eq('telefone', session.phone_number)
      .eq('ativo', true)
      .maybeSingle();
    
    if (chat) {
      let existingTags: string[] = [];
      if (chat.tags) {
        try {
          existingTags = JSON.parse(chat.tags);
          if (!Array.isArray(existingTags)) {
            existingTags = [];
          }
        } catch (e) {
          console.warn('[Flow] Ã¢ÂÂ Ã¯Â¸Â Erro ao parsear tags existentes:', e);
          existingTags = [];
        }
      }
      
      const mergedTags = [...new Set([...existingTags, ...tagIds])];
      const tagsJson = JSON.stringify(mergedTags);
      
      console.log(`[Flow] Ã°ÂÂÂ·Ã¯Â¸Â Atualizando chat ${chat.id} com tags: ${tagsJson}`);
      
      const { error: updateError } = await supabase
        .from('chats_whatsapp')
        .update({ 
          tags: tagsJson,
          atualizadoem: new Date().toISOString()
        })
        .eq('id', chat.id);
      
      if (updateError) {
        console.error(`[Flow] Ã¢ÂÂ Erro ao atualizar tags do chat: ${updateError.message}`);
      } else {
        console.log(`[Flow] Ã¢ÂÂ Tags aplicadas ao chat ${chat.id}: ${tagsJson}`);
      }
    } else {
      console.warn(`[Flow] Ã¢ÂÂ Ã¯Â¸Â Chat ativo nÃÂ£o encontrado para telefone: ${session.phone_number}`);
    }
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleSetVariableBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const variableName = block.data?.variableName || block.data?.variable || block.data?.key;
  const variableValue = block.data?.variableValue || block.data?.value;
  
  if (variableName) {
    const processedValue = replaceVariables(String(variableValue || ''), session.variables, session);
    const variables = { ...session.variables, [variableName]: processedValue };
    
    await supabase
      .from('flow_sessions')
      .update({ variables })
      .eq('id', session.id);
    
    session.variables = variables;
    console.log(`[Flow] Ã°ÂÂÂ Variable set: ${variableName} = ${processedValue}`);
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleHttpRequestBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const { url, method = 'GET', headers = [], body, outputMappings = [], continueOnError = true, responseFormat = 'json' } = block.data || {};
  
  if (!url) {
    console.warn('[Flow] HTTP Request sem URL');
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
    return;
  }
  
  const processedUrl = replaceVariables(url, session.variables, session);
  console.log(`[Flow] Ã°ÂÂÂ HTTP ${method}: ${processedUrl}`);
  
  const processedHeaders: Record<string, string> = {};
  if (Array.isArray(headers)) {
    for (const header of headers) {
      if (header.key && header.value) {
        processedHeaders[header.key] = replaceVariables(String(header.value), session.variables, session);
      }
    }
  }
  
  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...processedHeaders
      }
    };
    
    if (body && method !== 'GET') {
      const processedBody = replaceVariables(body, session.variables, session);
      fetchOptions.body = processedBody;
    }
    
    const response = await fetch(processedUrl, fetchOptions);
    
    let responseData: any;
    
    if (responseFormat === 'base64' || responseFormat === 'binary') {
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = response.headers.get('content-disposition') || '';
      let filename = 'file';
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
      
      responseData = {
        base64,
        contentType,
        filename,
        size: bytes.length
      };
      
      console.log(`[Flow] Ã°ÂÂÂ HTTP Response (base64): ${bytes.length} bytes, type: ${contentType}`);
    } else {
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = text;
      }
    }
    
    console.log(`[Flow] Ã°ÂÂÂ HTTP Response status: ${response.status}`);
    console.log(`[Flow] Ã°ÂÂÂ HTTP Response type: ${typeof responseData}`);
    if (typeof responseData === 'object' && responseData !== null) {
      console.log(`[Flow] Ã°ÂÂÂ HTTP Response keys: ${JSON.stringify(Object.keys(responseData))}`);
    }
    
    // Auto-detect boletos array format and create helper variables
    if (responseData && typeof responseData === 'object') {
      // Always save full response as _http_response
      session.variables['_http_response'] = JSON.stringify(responseData);
      
      // Detect boletos array format (common pattern from pdf-boleto)
      if (responseData.boletos && Array.isArray(responseData.boletos)) {
        console.log(`[Flow] Ã°ÂÂÂ Detected boletos array with ${responseData.boletos.length} items`);
        session.variables['_http_boletos_count'] = String(responseData.boletos.length);
        
        // Save first boleto as JSON string for document block
        if (responseData.boletos.length > 0) {
          const firstBoleto = responseData.boletos[0];
          session.variables['_http_first_boleto'] = JSON.stringify({
            base64: firstBoleto.base64,
            contentType: firstBoleto.contentType || 'application/pdf',
            filename: firstBoleto.filename || 'boleto.pdf'
          });
          console.log(`[Flow] Ã°ÂÂÂ Auto-saved _http_first_boleto (${firstBoleto.base64?.length || 0} chars base64)`);
        }
        
        // Save all boletos
        session.variables['_http_all_boletos'] = JSON.stringify(responseData.boletos);
      }
      
      // Detect single base64 response format
      if (responseData.base64 && responseData.contentType) {
        console.log(`[Flow] Ã°ÂÂÂ Detected single base64 document response`);
        session.variables['_http_document'] = JSON.stringify({
          base64: responseData.base64,
          contentType: responseData.contentType,
          filename: responseData.filename || 'document'
        });
      }
    }
    
    // Process output mappings
    if (outputMappings && Array.isArray(outputMappings)) {
      for (const mapping of outputMappings) {
        if (mapping.variable && mapping.path) {
          const value = getNestedValue(responseData, mapping.path);
          if (value !== undefined) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            session.variables[mapping.variable] = stringValue;
            console.log(`[Flow] Ã°ÂÂÂ Mapped ${mapping.path} -> ${mapping.variable}: ${stringValue.substring(0, 100)}`);
          } else {
            console.warn(`[Flow] Ã¢ÂÂ Ã¯Â¸Â Mapping failed: path "${mapping.path}" not found in response`);
            if (typeof responseData === 'object' && responseData !== null) {
              console.log(`[Flow] Ã°ÂÂÂ Available top-level keys: ${JSON.stringify(Object.keys(responseData))}`);
              // If boletos array exists, show available keys in first item
              if (responseData.boletos && Array.isArray(responseData.boletos) && responseData.boletos.length > 0) {
                console.log(`[Flow] Ã°ÂÂÂ Keys in boletos[0]: ${JSON.stringify(Object.keys(responseData.boletos[0]))}`);
              }
            }
          }
        }
      }
      
      await supabase
        .from('flow_sessions')
        .update({ variables: session.variables })
        .eq('id', session.id);
    } else {
      // Even without mappings, save auto-detected variables
      await supabase
        .from('flow_sessions')
        .update({ variables: session.variables })
        .eq('id', session.id);
    }
    
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
    
  } catch (error) {
    console.error('[Flow] HTTP Request error:', error);
    
    if (continueOnError) {
      await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
    } else {
      await completeFlowSession(supabase, session, conexao, 'http_request_error');
    }
  }
}

function getNestedValue(obj: any, path: string): any {
  if (!path || !obj) return undefined;
  
  console.log(`[Flow] Ã°ÂÂÂ getNestedValue: path="${path}"`);
  
  if (path.includes('[*]')) {
    return getNestedValueWithWildcard(obj, path);
  }
  
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(k => k !== '');
  
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

function getNestedValueWithWildcard(obj: any, path: string): any {
  console.log(`[Flow] Ã°ÂÂÂ getNestedValueWithWildcard: path="${path}"`);
  
  const wildcardIndex = path.indexOf('[*]');
  const beforeWildcard = path.substring(0, wildcardIndex);
  const afterWildcard = path.substring(wildcardIndex + 3);
  
  let arrayValue: any;
  if (beforeWildcard) {
    arrayValue = getNestedValue(obj, beforeWildcard);
  } else {
    arrayValue = obj;
  }
  
  if (!Array.isArray(arrayValue)) {
    console.log(`[Flow] Ã¢ÂÂ Ã¯Â¸Â Expected array at path "${beforeWildcard}", got ${typeof arrayValue}`);
    return undefined;
  }
  
  if (!afterWildcard || afterWildcard === '') {
    return arrayValue;
  }
  
  const remainingPath = afterWildcard.startsWith('.') ? afterWildcard.substring(1) : afterWildcard;
  
  const results: any[] = [];
  for (let i = 0; i < arrayValue.length; i++) {
    const item = arrayValue[i];
    const value = getNestedValue(item, remainingPath);
    if (value !== undefined) {
      if (Array.isArray(value)) {
        results.push(...value);
      } else {
        results.push(value);
      }
    }
  }
  
  if (results.length === 0) return undefined;
  if (results.length === 1) return results[0];
  
  return results;
}

async function handleWebhookBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const { url, method, headers, body } = block.data || {};
  
  if (url) {
    const processedUrl = replaceVariables(url, session.variables, session);
    
    const processedHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (headers) {
      if (Array.isArray(headers)) {
        for (const header of headers) {
          if (header.key && header.value) {
            processedHeaders[header.key] = replaceVariables(String(header.value), session.variables, session);
          }
        }
      } else if (typeof headers === 'object') {
        for (const [key, value] of Object.entries(headers)) {
          processedHeaders[key] = replaceVariables(String(value || ''), session.variables, session);
        }
      }
    }
    
    try {
      await fetch(processedUrl, {
        method: method || 'POST',
        headers: processedHeaders,
        body: JSON.stringify({
          ...body,
          session_id: session.id,
          phone_number: session.phone_number,
          contact_name: session.contact_name,
          variables: session.variables
        })
      });
      console.log(`[Flow] Ã°ÂÂÂ Webhook sent: ${processedUrl}`);
    } catch (error) {
      console.error('[Flow] Webhook error:', error);
    }
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleLocationBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const locationData = block.data?.location || block.data;
  
  if (locationData?.latitude && locationData?.longitude) {
    await sendWhatsAppLocation(supabase, conexao, session.phone_number, {
      latitude: replaceVariables(String(locationData.latitude), session.variables, session),
      longitude: replaceVariables(String(locationData.longitude), session.variables, session),
      name: locationData.name ? replaceVariables(locationData.name, session.variables, session) : undefined,
      address: locationData.address ? replaceVariables(locationData.address, session.variables, session) : undefined
    }, session.chatId);
    console.log('[Flow] Ã°ÂÂÂ Location sent');
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleOpenAIBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiKey) {
    console.log('[Flow] OpenAI API Key nÃÂ£o configurada');
    await sendWhatsAppMessage(supabase, conexao, session.phone_number, 'ServiÃÂ§o temporariamente indisponÃÂ­vel.', session.chatId);
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
    return;
  }
  
  const prompt = replaceVariables(block.data?.prompt || '', session.variables, session);
  const model = block.data?.model || 'gpt-4o-mini';
  const systemPrompt = block.data?.systemPrompt || '';
  
  try {
    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: replaceVariables(systemPrompt, session.variables, session) });
    }
    messages.push({ role: 'user', content: prompt });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages })
    });
    
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Sem resposta';
    
    const saveVariable = block.data?.saveVariable || block.data?.outputVariable;
    if (saveVariable) {
      const variables = { ...session.variables, [saveVariable]: aiResponse };
      await supabase.from('flow_sessions').update({ variables }).eq('id', session.id);
      session.variables = variables;
    }
    
    if (block.data?.sendResponse !== false) {
      await sendWhatsAppMessage(supabase, conexao, session.phone_number, aiResponse, session.chatId);
    }
    
    console.log('[Flow] Ã°ÂÂ¤Â OpenAI response sent');
    
  } catch (error) {
    console.error('[Flow] OpenAI error:', error);
    await sendWhatsAppMessage(supabase, conexao, session.phone_number, 'Erro ao processar sua solicitaÃÂ§ÃÂ£o.', session.chatId);
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleTypebotBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any
) {
  const typebotUrl = block.data?.url || block.data?.typebotUrl || '';
  
  if (typebotUrl) {
    await sendWhatsAppMessage(supabase, conexao, session.phone_number, 
      `Continue a conversa aqui: ${typebotUrl}`, session.chatId);
  }
  
  await completeFlowSession(supabase, session, conexao, 'typebot_redirect');
}

async function handleDocumentBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const { documentUrl, filename, caption, sendAllFiles } = block.data || {};
  
  if (!documentUrl) {
    console.warn('[Flow] Document block sem URL');
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
    return;
  }
  
  let processedUrl = replaceVariables(documentUrl, session.variables, session);
  let processedFilename = replaceVariables(filename || 'document', session.variables, session);
  const processedCaption = caption ? replaceVariables(caption, session.variables, session) : undefined;
  
  // Check if variable was not replaced (still contains {{variable}})
  const unreplacedVarMatch = processedUrl.match(/\{\{([^}]+)\}\}/);
  if (unreplacedVarMatch) {
    const varName = unreplacedVarMatch[1];
    console.log(`[Flow] Ã°ÂÂÂ Variable {{${varName}}} not directly available, checking auto-detected documents...`);
    console.log('[Flow] Available variables:', Object.keys(session.variables || {}));
    
    // Try to use auto-detected document from HTTP response
    // If sendAllFiles is active and we have multiple boletos, use the full array
    let autoDocument: string | undefined;
    if (sendAllFiles && session.variables['_http_all_boletos']) {
      try {
        const allBoletos = JSON.parse(session.variables['_http_all_boletos']);
        if (Array.isArray(allBoletos) && allBoletos.length > 0) {
          autoDocument = JSON.stringify({ boletos: allBoletos });
          console.log(`[Flow] Ã¢ÂÂ Using _http_all_boletos with ${allBoletos.length} items for sendAllFiles`);
        }
      } catch (e) {
        console.error('[Flow] Ã¢ÂÂ Failed to parse _http_all_boletos:', e);
      }
    }
    // Fallback to first boleto or single document
    if (!autoDocument) {
      autoDocument = session.variables['_http_first_boleto'] || session.variables['_http_document'];
      if (autoDocument) {
        console.log('[Flow] Ã¢ÂÂ Using auto-detected single document');
      }
    }
    
    if (autoDocument) {
      processedUrl = autoDocument;
    } else {
      console.error(`[Flow] Ã¢ÂÂ No auto-detected document available for {{${varName}}}`);
      await sendWhatsAppMessage(supabase, conexao, session.phone_number, 
        `Desculpe, nÃÂ£o consegui localizar o documento solicitado. Por favor, tente novamente.`, session.chatId);
      await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
      return;
    }
  }
  
  // Check if processedUrl is a JSON string with base64 document data
  let documentFromJson: { base64: string; contentType: string; filename?: string } | null = null;
  if (processedUrl.startsWith('{')) {
    try {
      const parsed = JSON.parse(processedUrl);
      if (parsed.base64 && parsed.contentType) {
        documentFromJson = parsed;
        console.log(`[Flow] Ã°ÂÂÂ Detected embedded JSON document (${parsed.base64.length} chars base64)`);
      }
    } catch (e) {
      console.log(`[Flow] Ã°ÂÂÂ URL starts with { but is not valid JSON, treating as URL`);
    }
  }
  
  console.log(`[Flow] Ã°ÂÂÂ Sending document: ${documentFromJson ? 'embedded JSON' : processedUrl.substring(0, 200)} as ${processedFilename}`);
  
  const uploadAndSendSingleDocument = async (
    fileData: { base64: string; contentType: string; filename: string },
    docCaption?: string
  ) => {
    const base64Content = fileData.base64;
    
    if (!base64Content || base64Content.length < 100) {
      console.error(`[Flow] Ã¢ÂÂ base64 content is empty or too small: ${base64Content?.length || 0} chars`);
      throw new Error('Invalid base64 content');
    }
    
    let base64Data = base64Content;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const contentType = fileData.contentType || 'application/pdf';
    const uploadFilename = fileData.filename || `document_${Date.now()}.pdf`;
    
    console.log(`[Flow] Ã°ÂÂÂ¤ Uploading to WhatsApp Media API: ${uploadFilename} (${contentType}, ${bytes.length} bytes)`);
    
    const file = new File([bytes], uploadFilename, { type: contentType });
    
    const formData = new FormData();
    formData.append('file', file, uploadFilename);
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', contentType);
    
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
        },
        body: formData
      }
    );
    
    const mediaData = await mediaResponse.json();
    
    if (mediaData.id) {
      console.log(`[Flow] Ã¢ÂÂ Media uploaded to WhatsApp, media_id: ${mediaData.id}`);
      await sendWhatsAppDocument(supabase, conexao, session.phone_number, {
        mediaId: mediaData.id,
        filename: uploadFilename,
        caption: docCaption
      }, session.chatId);
    } else {
      console.error('[Flow] Ã¢ÂÂ WhatsApp Media upload failed:', mediaData);
      throw new Error(`WhatsApp Media upload failed: ${JSON.stringify(mediaData)}`);
    }
  };
  
  try {
    // Use pre-parsed JSON if available, otherwise try to parse
    const fileData = documentFromJson || JSON.parse(processedUrl);
    
    let effectiveFileData = fileData;
    
    // Handle boletos array directly (from auto-detected HTTP response)
    if (fileData && fileData.boletos && Array.isArray(fileData.boletos)) {
      const successfulBoletos = fileData.boletos.filter((b: any) => b.base64);
      console.log(`[Flow] Ã°ÂÂÂ Processing boletos array with ${successfulBoletos.length} valid items`);
      
      if (successfulBoletos.length === 0) {
        throw new Error('No boleto with base64 in response');
      }
      
      if (sendAllFiles && successfulBoletos.length > 1) {
        for (let i = 0; i < successfulBoletos.length; i++) {
          const boleto = successfulBoletos[i];
          await uploadAndSendSingleDocument({
            base64: boleto.base64,
            contentType: boleto.contentType || 'application/pdf',
            filename: boleto.filename || `boleto_${boleto.id || i + 1}.pdf`
          }, processedCaption);
          
          if (i < successfulBoletos.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
        return;
      } else {
        effectiveFileData = {
          base64: successfulBoletos[0].base64,
          contentType: successfulBoletos[0].contentType || 'application/pdf',
          filename: successfulBoletos[0].filename || `boleto_${successfulBoletos[0].id || 1}.pdf`
        };
      }
    }
    
    // Handle wrapped JSON (base64 containing JSON with boletos)
    if (fileData && fileData.base64 && (fileData.contentType === 'application/json' || !fileData.contentType)) {
      try {
        const decodedContent = atob(fileData.base64);
        const innerJson = JSON.parse(decodedContent);
        
        if (innerJson.boletos && Array.isArray(innerJson.boletos)) {
          const successfulBoletos = innerJson.boletos.filter((b: any) => b.success && b.base64);
          
          if (successfulBoletos.length === 0) {
            throw new Error('No successful boleto in response');
          }
          
          if (sendAllFiles && successfulBoletos.length > 1) {
            for (let i = 0; i < successfulBoletos.length; i++) {
              const boleto = successfulBoletos[i];
              await uploadAndSendSingleDocument({
                base64: boleto.base64,
                contentType: boleto.contentType || 'application/pdf',
                filename: boleto.filename || `boleto_${boleto.id}.pdf`
              }, processedCaption);
              
              if (i < successfulBoletos.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
            
            await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
            return;
          } else {
            effectiveFileData = {
              base64: successfulBoletos[0].base64,
              contentType: successfulBoletos[0].contentType || 'application/pdf',
              filename: successfulBoletos[0].filename || `boleto_${successfulBoletos[0].id}.pdf`
            };
          }
        }
      } catch (innerParseError) {
        // Not a wrapped JSON
      }
    }
    
    if (effectiveFileData && (effectiveFileData.base64 || effectiveFileData.content)) {
      await uploadAndSendSingleDocument({
        base64: effectiveFileData.base64 || effectiveFileData.content,
        contentType: effectiveFileData.contentType || 'application/pdf',
        filename: effectiveFileData.filename || processedFilename
      }, processedCaption);
    } else {
      console.error('[Flow] Ã¢ÂÂ No valid base64 content found in document data');
    }
  } catch (e) {
    // Not JSON, try as URL
    if (processedUrl.startsWith('http')) {
      await sendWhatsAppDocument(supabase, conexao, session.phone_number, {
        url: processedUrl,
        filename: processedFilename,
        caption: processedCaption
      }, session.chatId);
    } else {
      console.error('[Flow] Ã¢ÂÂ Invalid document data - not JSON and not HTTP URL');
      console.log('[Flow] Ã°ÂÂÂ processedUrl preview:', processedUrl.substring(0, 200));
    }
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleImageBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const imageUrl = block.data?.imageUrl || block.data?.url;
  const caption = block.data?.caption;
  
  if (imageUrl) {
    const processedUrl = replaceVariables(imageUrl, session.variables, session);
    const processedCaption = caption ? replaceVariables(caption, session.variables, session) : undefined;
    
    await sendWhatsAppImage(supabase, conexao, session.phone_number, {
      url: processedUrl,
      caption: processedCaption
    }, session.chatId);
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleAudioBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const audioUrl = block.data?.audioUrl || block.data?.url;
  
  if (audioUrl) {
    const processedUrl = replaceVariables(audioUrl, session.variables, session);
    await sendWhatsAppAudio(supabase, conexao, session.phone_number, processedUrl, session.chatId);
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleVideoBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const videoUrl = block.data?.videoUrl || block.data?.url;
  const caption = block.data?.caption;
  
  if (videoUrl) {
    const processedUrl = replaceVariables(videoUrl, session.variables, session);
    const processedCaption = caption ? replaceVariables(caption, session.variables, session) : undefined;
    await sendWhatsAppVideo(supabase, conexao, session.phone_number, processedUrl, processedCaption, session.chatId);
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleConvertBase64Block(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const sourceVariable = block.data?.sourceVariable || '';
  const outputVariable = block.data?.outputVariable || '';
  const outputFormat = block.data?.outputFormat || 'base64';
  
  if (sourceVariable && outputVariable) {
    let varName = sourceVariable;
    if (varName.startsWith('{{') && varName.endsWith('}}')) {
      varName = varName.slice(2, -2).trim();
    }
    
    const sourceValue = session.variables[varName];
    
    if (sourceValue) {
      let result: any = sourceValue;
      
      try {
        if (outputFormat === 'base64' && typeof sourceValue === 'string' && sourceValue.startsWith('http')) {
          const response = await fetch(sourceValue);
          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          result = btoa(binary);
        }
        
        session.variables[outputVariable] = typeof result === 'object' ? JSON.stringify(result) : result;
        await supabase
          .from('flow_sessions')
          .update({ variables: session.variables })
          .eq('id', session.id);
        
        console.log(`[Flow] Ã°ÂÂÂ ConvertBase64: ${varName} -> ${outputVariable}`);
      } catch (error) {
        console.error('[Flow] ConvertBase64 error:', error);
      }
    }
  }
  
  await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
}

async function handleLoopBlock(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  blockIndex: number,
  conexao: any,
  sortedBlocks: FlowBlock[]
) {
  const sourceVariable = block.data?.sourceVariable || block.data?.arrayVariable || '';
  const itemVariable = block.data?.itemVariable || 'item';
  const indexVariable = block.data?.indexVariable || 'index';
  
  let varName = sourceVariable;
  if (varName.startsWith('{{') && varName.endsWith('}}')) {
    varName = varName.slice(2, -2).trim();
  }
  
  const sourceValue = session.variables[varName];
  
  let items: any[] = [];
  if (sourceValue) {
    if (Array.isArray(sourceValue)) {
      items = sourceValue;
    } else if (typeof sourceValue === 'string') {
      try {
        const parsed = JSON.parse(sourceValue);
        if (Array.isArray(parsed)) {
          items = parsed;
        }
      } catch {
        items = sourceValue.split('\n').filter(s => s.trim());
      }
    }
  }
  
  console.log(`[Flow] Ã°ÂÂÂ Loop: ${items.length} items from variable "${varName}"`);
  
  if (items.length === 0) {
    console.log('[Flow] Ã°ÂÂÂ Loop: array vazio, pulando');
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
    return;
  }
  
  const loopBodyEdge = findEdge(flowData, group.id, `${block.id}-loop_body`) ||
                       findEdge(flowData, block.id, 'loop_body');
  const loopCompleteEdge = findEdge(flowData, group.id, `${block.id}-loop_complete`) ||
                           findEdge(flowData, block.id, 'loop_complete');
  
  if (loopBodyEdge?.target) {
    const targetGroup = getGroupById(flowData, loopBodyEdge.target);
    
    if (targetGroup) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`[Flow] Ã°ÂÂÂ Loop iteraÃÂ§ÃÂ£o ${i + 1}/${items.length}`);
        
        const updatedVariables: Record<string, any> = {
          ...session.variables,
          [itemVariable]: typeof item === 'object' ? JSON.stringify(item) : item,
          [`${itemVariable}_object`]: typeof item === 'object' ? item : null,
          loop_index: i.toString(),
          loop_total: items.length.toString(),
          loop_is_first: (i === 0).toString(),
          loop_is_last: (i === items.length - 1).toString()
        };
        
        if (indexVariable) {
          updatedVariables[indexVariable] = i.toString();
        }
        
        await supabase
          .from('flow_sessions')
          .update({ variables: updatedVariables })
          .eq('id', session.id);
        
        session.variables = updatedVariables;
        
        const targetBlocks = [...targetGroup.blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        for (const targetBlock of targetBlocks) {
          await executeBlockInLoop(supabase, session, flowData, targetGroup, targetBlock, conexao);
        }
        
        if (i < items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
  } else {
    const lastItem = items[items.length - 1];
    const updatedVariables: Record<string, any> = {
      ...session.variables,
      [itemVariable]: typeof lastItem === 'object' ? JSON.stringify(lastItem) : lastItem,
      loop_total: items.length.toString()
    };
    
    if (indexVariable) {
      updatedVariables[indexVariable] = (items.length - 1).toString();
    }
    
    await supabase
      .from('flow_sessions')
      .update({ variables: updatedVariables })
      .eq('id', session.id);
    
    session.variables = updatedVariables;
  }
  
  if (loopCompleteEdge?.target) {
    await navigateToGroup(supabase, session, flowData, loopCompleteEdge.target, conexao);
  } else {
    await advanceToNextBlock(supabase, session, flowData, group, blockIndex, conexao, sortedBlocks);
  }
}

async function executeBlockInLoop(
  supabase: any,
  session: Session,
  flowData: FlowData,
  group: FlowGroup,
  block: FlowBlock,
  conexao: any
) {
  const blockType = (block.type || '').toLowerCase().trim();
  
  switch (blockType) {
    case 'text':
      const rawMessage = block.data?.description || block.data?.text || block.data?.message || '';
      const message = replaceVariables(rawMessage, session.variables, session);
      if (message && message.trim() !== '') {
        await sendWhatsAppMessage(supabase, conexao, session.phone_number, message, session.chatId);
      }
      break;
      
    case 'interval':
      const delay = block.data?.delay || block.data?.seconds || 1;
      const delayMs = (typeof delay === 'number' ? delay : parseInt(delay) || 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 10000)));
      break;
      
    case 'setvariable':
      const varName = block.data?.variableName || block.data?.variable;
      const varValue = block.data?.variableValue || block.data?.value || '';
      if (varName) {
        const processedValue = replaceVariables(varValue, session.variables, session);
        session.variables[varName] = processedValue;
        await supabase
          .from('flow_sessions')
          .update({ variables: session.variables })
          .eq('id', session.id);
      }
      break;
      
    default:
      console.log(`[Flow] Ã°ÂÂÂ Loop: bloco tipo "${blockType}" nÃÂ£o suportado dentro do loop`);
  }
}

// ============================================
// Ã°ÂÂÂ¤ WHATSAPP MESSAGE FUNCTIONS
// ============================================
async function sendWhatsAppMessage(
  supabase: any,
  conexao: any, 
  phoneNumber: string, 
  message: string,
  chatId?: number
) {
  // CRITICAL: Validate phone number before sending
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Flow] Ã¢ÂÂ SEND BLOCKED: Invalid phone number: ${phoneNumber}`);
    return;
  }
  
  if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
    console.error('[Flow] Credenciais WhatsApp nÃÂ£o configuradas');
    return;
  }
  
  console.log(`[Flow] Ã°ÂÂÂ¤ SENDING to ${phoneNumber} (chatId: ${chatId})`);
  const normalizedMessage = normalizeUtf8(message);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: { body: normalizedMessage }
        })
      }
    );
    
    const data = await response.json();
    const messageId = data.messages?.[0]?.id || crypto.randomUUID();
    console.log('[Flow] Ã°ÂÂÂ¤ Mensagem enviada:', messageId);
    
    if (chatId) {
      const { error: insertError } = await supabase
        .from('mensagens_whatsapp')
        .insert({
          message_id: messageId,
          chatId: chatId,
          message_type: 'text',
          message_text: normalizedMessage,
          send: 'flowbuilder',
          metadata: { 
            conexaoId: conexao.id,
            phone_number: phoneNumber,
            sent_by: 'process-whatsapp-flow'
          },
          received_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('[Flow] Ã¢ÂÂ Erro ao salvar mensagem flowbuilder:', insertError);
      } else {
        console.log('[Flow] Ã°ÂÂÂ¾ Mensagem flowbuilder salva no DB');
      }
    }
    
  } catch (error) {
    console.error('[Flow] Erro ao enviar mensagem:', error);
  }
}

async function sendWhatsAppInteractiveList(
  supabase: any,
  conexao: any, 
  phoneNumber: string, 
  listData: {
    header: string;
    body: string;
    footer?: string;
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  },
  chatId?: number
) {
  // CRITICAL: Validate phone number before sending
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Flow] Ã¢ÂÂ SEND LIST BLOCKED: Invalid phone number: ${phoneNumber}`);
    return;
  }
  
  if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
    console.error('[Flow] Credenciais WhatsApp nÃÂ£o configuradas');
    return;
  }
  
  console.log(`[Flow] Ã°ÂÂÂ SENDING LIST to ${phoneNumber} (chatId: ${chatId})`);
  
  const normalizedHeader = normalizeUtf8(listData.header);
  const normalizedBody = normalizeUtf8(listData.body);
  const normalizedFooter = listData.footer ? normalizeUtf8(listData.footer) : undefined;
  const normalizedButtonText = normalizeUtf8(listData.buttonText);
  const normalizedSections = listData.sections.map(section => ({
    title: normalizeUtf8(section.title),
    rows: section.rows.map(row => ({
      id: row.id,
      title: normalizeUtf8(row.title),
      description: row.description ? normalizeUtf8(row.description) : undefined
    }))
  }));
  
  try {
    const interactivePayload: any = {
      type: 'list',
      header: { type: 'text', text: normalizedHeader },
      body: { text: normalizedBody },
      action: {
        button: normalizedButtonText,
        sections: normalizedSections.map(section => ({
          title: section.title,
          rows: section.rows.map(row => ({
            id: row.id,
            title: row.title.substring(0, 24),
            description: row.description ? row.description.substring(0, 72) : undefined
          }))
        }))
      }
    };

    if (normalizedFooter) {
      interactivePayload.footer = { text: normalizedFooter };
    }

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'interactive',
          interactive: interactivePayload
        })
      }
    );
    
    const data = await response.json();
    const messageId = data.messages?.[0]?.id || crypto.randomUUID();
    console.log('[Flow] Ã°ÂÂÂ Lista interativa enviada:', messageId);
    
    if (chatId) {
      const menuText = `${normalizedHeader}\n\n${normalizedBody}`;
      
      const { error: insertError } = await supabase
        .from('mensagens_whatsapp')
        .insert({
          message_id: messageId,
          chatId: chatId,
          message_type: 'interactive',
          message_text: menuText,
          send: 'flowbuilder',
          message_data: { interactive: interactivePayload },
          metadata: { 
            conexaoId: conexao.id,
            phone_number: phoneNumber,
            sent_by: 'process-whatsapp-flow',
            interactive_type: 'list'
          },
          received_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('[Flow] Ã¢ÂÂ Erro ao salvar mensagem interactive flowbuilder:', insertError);
      } else {
        console.log('[Flow] Ã°ÂÂÂ¾ Mensagem interactive flowbuilder salva no DB');
      }
    }
    
  } catch (error) {
    console.error('[Flow] Erro ao enviar lista:', error);
  }
}

async function sendWhatsAppInteractiveButtons(
  supabase: any,
  conexao: any, 
  phoneNumber: string, 
  buttonData: {
    body: string;
    footer?: string;
    buttons: Array<{ id: string; title: string }>;
  },
  chatId?: number
) {
  // CRITICAL: Validate phone number before sending
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Flow] Ã¢ÂÂ SEND BUTTONS BLOCKED: Invalid phone number: ${phoneNumber}`);
    return;
  }
  
  if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
    console.error('[Flow] Credenciais WhatsApp nÃÂ£o configuradas');
    return;
  }
  
  console.log(`[Flow] Ã°ÂÂÂ SENDING BUTTONS to ${phoneNumber} (chatId: ${chatId})`);
  
  const normalizedBody = normalizeUtf8(buttonData.body);
  const normalizedFooter = buttonData.footer ? normalizeUtf8(buttonData.footer) : undefined;
  const normalizedButtons = buttonData.buttons.map(btn => ({
    id: btn.id,
    title: normalizeUtf8(btn.title).substring(0, 20)
  }));
  
  try {
    const interactivePayload: any = {
      type: 'button',
      body: { text: normalizedBody },
      action: {
        buttons: normalizedButtons.map(btn => ({
          type: 'reply',
          reply: {
            id: btn.id,
            title: btn.title
          }
        }))
      }
    };

    if (normalizedFooter) {
      interactivePayload.footer = { text: normalizedFooter.substring(0, 60) };
    }

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'interactive',
          interactive: interactivePayload
        })
      }
    );
    
    const data = await response.json();
    const messageId = data.messages?.[0]?.id || crypto.randomUUID();
    
    if (chatId) {
      const buttonsList = normalizedButtons.map(b => `Ã¢ÂÂ¢ ${b.title}`).join('\n');
      const buttonsText = `${normalizedBody}\n\nBotÃÂµes:\n${buttonsList}`;
      
      const { error: insertError } = await supabase
        .from('mensagens_whatsapp')
        .insert({
          message_id: messageId,
          chatId: chatId,
          message_type: 'interactive',
          message_text: buttonsText,
          send: 'flowbuilder',
          message_data: { interactive: interactivePayload },
          metadata: { 
            conexaoId: conexao.id,
            phone_number: phoneNumber,
            sent_by: 'process-whatsapp-flow',
            interactive_type: 'button'
          },
          received_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('[Flow] Ã¢ÂÂ Erro ao salvar mensagem buttons flowbuilder:', insertError);
      } else {
        console.log('[Flow] Ã°ÂÂÂ¾ Mensagem buttons flowbuilder salva no DB');
      }
    }
    
  } catch (error) {
    console.error('[Flow] Erro ao enviar botÃÂµes:', error);
  }
}

async function sendWhatsAppLocation(
  supabase: any,
  conexao: any, 
  phoneNumber: string, 
  locationData: {
    latitude: string;
    longitude: string;
    name?: string;
    address?: string;
  },
  chatId?: number
) {
  // CRITICAL: Validate phone number before sending
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Flow] Ã¢ÂÂ SEND LOCATION BLOCKED: Invalid phone number: ${phoneNumber}`);
    return;
  }
  
  if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
    console.error('[Flow] Credenciais WhatsApp nÃÂ£o configuradas');
    return;
  }
  
  console.log(`[Flow] Ã°ÂÂÂ SENDING LOCATION to ${phoneNumber} (chatId: ${chatId})`);
  
  const normalizedName = locationData.name ? normalizeUtf8(locationData.name) : undefined;
  const normalizedAddress = locationData.address ? normalizeUtf8(locationData.address) : undefined;
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'location',
          location: {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            name: normalizedName,
            address: normalizedAddress
          }
        })
      }
    );
    
    const data = await response.json();
    const messageId = data.messages?.[0]?.id || crypto.randomUUID();
    
    if (chatId) {
      const locationText = `LocalizaÃÂ§ÃÂ£o: ${normalizedName || 'Local'}\n${normalizedAddress || `${locationData.latitude}, ${locationData.longitude}`}`;
      
      const { error: insertError } = await supabase
        .from('mensagens_whatsapp')
        .insert({
          message_id: messageId,
          chatId: chatId,
          message_type: 'location',
          message_text: locationText,
          send: 'flowbuilder',
          message_data: { location: locationData },
          metadata: { 
            conexaoId: conexao.id,
            phone_number: phoneNumber,
            sent_by: 'process-whatsapp-flow'
          },
          received_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('[Flow] Ã¢ÂÂ Erro ao salvar mensagem location flowbuilder:', insertError);
      } else {
        console.log('[Flow] Ã°ÂÂÂ¾ Mensagem location flowbuilder salva no DB');
      }
    }
    
  } catch (error) {
    console.error('[Flow] Erro ao enviar localizaÃÂ§ÃÂ£o:', error);
  }
}

async function sendWhatsAppDocument(
  supabase: any,
  conexao: any, 
  phoneNumber: string, 
  docData: {
    url?: string;
    mediaId?: string;
    filename: string;
    caption?: string;
  },
  chatId?: number
) {
  // CRITICAL: Validate phone number before sending
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Flow] Ã¢ÂÂ SEND DOCUMENT BLOCKED: Invalid phone number: ${phoneNumber}`);
    return;
  }
  
  if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
    console.error('[Flow] Credenciais WhatsApp nÃÂ£o configuradas');
    return;
  }
  
  console.log(`[Flow] Ã°ÂÂÂ SENDING DOCUMENT to ${phoneNumber} (chatId: ${chatId})`);
  
  const normalizedFilename = normalizeUtf8(docData.filename);
  const normalizedCaption = docData.caption ? normalizeUtf8(docData.caption) : undefined;
  
  try {
    const documentPayload: any = {
      filename: normalizedFilename
    };
    
    if (docData.mediaId) {
      documentPayload.id = docData.mediaId;
      console.log(`[Flow] Ã°ÂÂÂ Using WhatsApp media_id: ${docData.mediaId}`);
    } else if (docData.url) {
      documentPayload.link = docData.url;
      console.log(`[Flow] Ã°ÂÂÂ Using document URL: ${docData.url.substring(0, 100)}`);
    } else {
      console.error('[Flow] Ã¢ÂÂ No media_id or URL provided for document');
      return;
    }
    
    if (normalizedCaption) {
      documentPayload.caption = normalizedCaption;
    }
    
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'document',
          document: documentPayload
        })
      }
    );
    
    const data = await response.json();
    const messageId = data.messages?.[0]?.id || crypto.randomUUID();
    console.log('[Flow] Ã°ÂÂÂ Documento enviado:', messageId);
    
    if (chatId) {
      const documentText = `Documento: ${normalizedFilename}${normalizedCaption ? `\n${normalizedCaption}` : ''}`;
      
      const { error: insertError } = await supabase
        .from('mensagens_whatsapp')
        .insert({
          message_id: messageId,
          chatId: chatId,
          message_type: 'document',
          message_text: documentText,
          send: 'flowbuilder',
          message_data: { document: documentPayload },
          metadata: { 
            conexaoId: conexao.id,
            phone_number: phoneNumber,
            sent_by: 'process-whatsapp-flow',
            document_url: docData.url,
            media_id: docData.mediaId
          },
          received_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('[Flow] Ã¢ÂÂ Erro ao salvar mensagem document flowbuilder:', insertError);
      } else {
        console.log('[Flow] Ã°ÂÂÂ¾ Mensagem document flowbuilder salva no DB');
      }
    }
    
  } catch (error) {
    console.error('[Flow] Erro ao enviar documento:', error);
  }
}

async function sendWhatsAppImage(
  supabase: any,
  conexao: any,
  phoneNumber: string,
  imageData: { url: string; caption?: string },
  chatId?: number
) {
  // CRITICAL: Validate phone number before sending
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Flow] Ã¢ÂÂ SEND IMAGE BLOCKED: Invalid phone number: ${phoneNumber}`);
    return;
  }
  
  if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
    console.error('[Flow] Credenciais WhatsApp nÃÂ£o configuradas');
    return;
  }
  
  console.log(`[Flow] Ã°ÂÂÂ¼Ã¯Â¸Â SENDING IMAGE to ${phoneNumber} (chatId: ${chatId})`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'image',
          image: {
            link: imageData.url,
            caption: imageData.caption ? normalizeUtf8(imageData.caption) : undefined
          }
        })
      }
    );
    
    const data = await response.json();
    console.log('[Flow] Ã°ÂÂÂ¼Ã¯Â¸Â Imagem enviada:', data.messages?.[0]?.id);
    
  } catch (error) {
    console.error('[Flow] Erro ao enviar imagem:', error);
  }
}

async function sendWhatsAppAudio(
  supabase: any,
  conexao: any,
  phoneNumber: string,
  audioUrl: string,
  chatId?: number
) {
  // CRITICAL: Validate phone number before sending
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Flow] Ã¢ÂÂ SEND AUDIO BLOCKED: Invalid phone number: ${phoneNumber}`);
    return;
  }
  
  if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
    console.error('[Flow] Credenciais WhatsApp nÃÂ£o configuradas');
    return;
  }
  
  console.log(`[Flow] Ã°ÂÂÂ SENDING AUDIO to ${phoneNumber} (chatId: ${chatId})`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'audio',
          audio: { link: audioUrl }
        })
      }
    );
    
    const data = await response.json();
    console.log('[Flow] Ã°ÂÂÂ ÃÂudio enviado:', data.messages?.[0]?.id);
    
  } catch (error) {
    console.error('[Flow] Erro ao enviar ÃÂ¡udio:', error);
  }
}

async function sendWhatsAppVideo(
  supabase: any,
  conexao: any,
  phoneNumber: string,
  videoUrl: string,
  caption?: string,
  chatId?: number
) {
  // CRITICAL: Validate phone number before sending
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Flow] Ã¢ÂÂ SEND VIDEO BLOCKED: Invalid phone number: ${phoneNumber}`);
    return;
  }
  
  if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
    console.error('[Flow] Credenciais WhatsApp nÃÂ£o configuradas');
    return;
  }
  
  console.log(`[Flow] Ã°ÂÂÂ¬ SENDING VIDEO to ${phoneNumber} (chatId: ${chatId})`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'video',
          video: {
            link: videoUrl,
            caption: caption ? normalizeUtf8(caption) : undefined
          }
        })
      }
    );
    
    const data = await response.json();
    console.log('[Flow] Ã°ÂÂÂ¬ VÃÂ­deo enviado:', data.messages?.[0]?.id);
    
  } catch (error) {
    console.error('[Flow] Erro ao enviar vÃÂ­deo:', error);
  }
}

// ============================================
// Ã°ÂÂÂ§ UTILITY FUNCTIONS
// ============================================
function replaceVariables(text: string, variables: Record<string, any>, session?: Session): string {
  if (!text) return '';
  
  let result = normalizeUtf8(text);
  
  const allVariables: Record<string, any> = {
    ...variables,
    ...(session ? {
      telefone: session.phone_number,
      phone: session.phone_number,
      phone_number: session.phone_number,
      nome: session.contact_name || '',
      name: session.contact_name || '',
      contact_name: session.contact_name || '',
      session_id: session.id,
      flow_id: session.flow_id,
    } : {}),
    data: new Date().toLocaleDateString('pt-BR'),
    date: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString(),
  };
  
  const valueToString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) {
      if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
        return value.join('\n');
      }
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };
  
  const doublePattern = /\{\{([^}]+)\}\}/g;
  result = result.replace(doublePattern, (match, varName) => {
    const trimmedName = varName.trim();
    const value = allVariables[trimmedName];
    const strValue = valueToString(value);
    console.log(`[Flow] Ã°ÂÂÂ§ Replace {{${trimmedName}}} -> ${strValue?.substring(0, 100) || '(not found)'}`);
    return value !== undefined ? strValue : match;
  });
  
  const singlePattern = /\{([^{}]+)\}/g;
  result = result.replace(singlePattern, (match, varName) => {
    const trimmedName = varName.trim();
    const value = allVariables[trimmedName];
    return value !== undefined ? valueToString(value) : match;
  });
  
  result = normalizeUtf8(result);
  
  console.log('[Flow] Ã°ÂÂÂ§ replaceVariables - Output:', result.substring(0, 50));
  
  return result;
}
