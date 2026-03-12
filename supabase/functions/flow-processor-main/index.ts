// Flow Processor Main - Orchestrator for flow processing
// OPTIMIZED: Simple blocks + WhatsApp sender inlined to eliminate HTTP round-trips
// Only interactive (menu/buttons/question) and external (httpRequest/openai/etc) use separate edge functions
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

function normalizeUtf8(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let fixed = text;
  // Fix double encoding patterns
  fixed = fixed.replace(/Ã\s*Â\s*¡/g, '\u00E1');
  fixed = fixed.replace(/Ã\s*Â\s*à/g, '\u00E0');
  fixed = fixed.replace(/Ã\s*Â\s*¢/g, '\u00E2');
  fixed = fixed.replace(/Ã\s*Â\s*£/g, '\u00E3');
  fixed = fixed.replace(/Ã\s*Â\s*§/g, '\u00E7');
  fixed = fixed.replace(/Ã\s*Â\s*©/g, '\u00E9');
  fixed = fixed.replace(/Ã\s*Â\s*ª/g, '\u00EA');
  fixed = fixed.replace(/Ã\s*Â\s*­/g, '\u00ED');
  fixed = fixed.replace(/Ã\s*Â\s*³/g, '\u00F3');
  fixed = fixed.replace(/Ã\s*Â\s*´/g, '\u00F4');
  fixed = fixed.replace(/Ã\s*Â\s*µ/g, '\u00F5');
  fixed = fixed.replace(/Ã\s*Â\s*º/g, '\u00FA');
  fixed = fixed.replace(/Ã\s*Â\s*Á/g, '\u00C1');
  fixed = fixed.replace(/Ã\s*Â\s*Ç/g, '\u00C7');
  fixed = fixed.replace(/Ã\s*Â\s*É/g, '\u00C9');
  fixed = fixed.replace(/Ã\s*Â\s*Ê/g, '\u00CA');
  fixed = fixed.replace(/Ã\s*Â\s*Í/g, '\u00CD');
  fixed = fixed.replace(/Ã\s*Â\s*Ó/g, '\u00D3');
  fixed = fixed.replace(/Ã\s*Â\s*Ú/g, '\u00DA');
  fixed = fixed.replace(/[\u201C\u201D]/g, '"');
  fixed = fixed.replace(/[\u2018\u2019]/g, "'");
  fixed = fixed.replace(/\uFFFD/g, '');
  try { fixed = fixed.normalize('NFC'); } catch {}
  return fixed;
}

function replaceVariables(text: string, variables: Record<string, any>, session?: Session, contactName?: string): string {
  if (!text) return '';
  let result = normalizeUtf8(text);
  const resolvedName = contactName || session?.contact_name || '';
  const allVariables: Record<string, any> = {
    ...variables,
    ...(session ? {
      telefone: session.phone_number, phone: session.phone_number,
      nome: resolvedName, name: resolvedName,
    } : {}),
    data: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const value = allVariables[varName.trim()];
    return value !== undefined ? String(value) : match;
  });
  return result;
}

async function resolveContactName(supabase: any, session: Session): Promise<string> {
  if (session.contact_name && session.contact_name.trim() !== '') return session.contact_name;
  try {
    const phoneDigits = (session.phone_number || '').replace(/\D/g, '');
    if (!phoneDigits) return '';
    let { data: contato } = await supabase.from('contatos_whatsapp').select('nome').eq('telefone', phoneDigits).maybeSingle();
    if (!contato && phoneDigits.length >= 8) {
      const last8 = phoneDigits.slice(-8);
      const { data: contatoFallback } = await supabase.from('contatos_whatsapp').select('nome, telefone').like('telefone', `%${last8}`).limit(1).maybeSingle();
      contato = contatoFallback;
    }
    if (contato?.nome) {
      session.contact_name = contato.nome;
      await supabase.from('flow_sessions').update({ contact_name: contato.nome, updated_at: new Date().toISOString() }).eq('id', session.id);
      return contato.nome;
    }
  } catch {}
  return '';
}

async function replaceVariablesWithContactFallback(supabase: any, text: string, variables: Record<string, any>, session: Session): Promise<string> {
  const contactName = await resolveContactName(supabase, session);
  return replaceVariables(text, variables, session, contactName);
}

// ============================================
// 🔒 VALIDAÇÃO DE PROPRIEDADE DO CHAT
// ============================================
async function validateChatOwnership(
  supabase: any, chatId: number | undefined, phoneNumber: string, conexaoId: string
): Promise<{ valid: boolean; error?: string }> {
  if (!chatId) return { valid: true };
  try {
    const { data: chat, error } = await supabase.from('chats_whatsapp').select('id, usuarioid, ativo').eq('id', chatId).maybeSingle();
    if (error) return { valid: false, error: 'Erro ao validar chat' };
    if (!chat) return { valid: false, error: 'Chat não encontrado' };
    if (chat.usuarioid) {
      const { data: contato } = await supabase.from('contatos_whatsapp').select('id, telefone').eq('id', chat.usuarioid).maybeSingle();
      if (contato?.telefone) {
        const chatSuffix = (contato.telefone || '').replace(/\D/g, '').slice(-8);
        const reqSuffix = (phoneNumber || '').replace(/\D/g, '').slice(-8);
        if (chatSuffix && reqSuffix && chatSuffix !== reqSuffix) {
          console.error(`[Main] 🔒 VAZAMENTO DETECTADO! Chat ${chatId} pertence a ...${chatSuffix}, requisição de ...${reqSuffix}`);
          return { valid: false, error: 'Telefone não corresponde ao chat' };
        }
      }
    }
    return { valid: true };
  } catch (err) {
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
    .eq('id', sessionId).is('processing_id', null).select('id').maybeSingle();
  if (updated) return true;
  const { data: session } = await supabase.from('flow_sessions')
    .select('processing_id, updated_at').eq('id', sessionId).maybeSingle();
  if (!session) return false;
  if (session.processing_id === processingId) return true;
  const sessionUpdated = new Date(session.updated_at);
  if (sessionUpdated < lockTimeout) {
    const { data: forced } = await supabase.from('flow_sessions')
      .update({ processing_id: processingId, updated_at: now.toISOString() })
      .eq('id', sessionId).eq('processing_id', session.processing_id).select('id').maybeSingle();
    if (forced) return true;
  }
  return false;
}

async function releaseSessionLock(supabase: any, sessionId: string) {
  await supabase.from('flow_sessions').update({ processing_id: null }).eq('id', sessionId);
}

// ============================================
// 📨 INLINE WHATSAPP SENDER (eliminates HTTP hop to flow-whatsapp-sender for text)
// ============================================
async function sendTextDirect(supabase: any, conexao: any, phoneNumber: string, chatId: number | undefined, message: string) {
  if (!message?.trim() || !conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) return null;
  if (!isValidPhoneNumber(phoneNumber)) return null;
  
  const normalizedMessage = normalizeUtf8(message);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp', recipient_type: 'individual',
          to: phoneNumber, type: 'text', text: { body: normalizedMessage }
        }),
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) {
      console.error('[Main] WhatsApp API Error:', response.status, JSON.stringify(data));
      return null;
    }
    const messageId = data.messages?.[0]?.id || crypto.randomUUID();
    if (chatId) {
      await supabase.from('mensagens_whatsapp').insert({
        message_id: messageId, chatId, message_type: 'text',
        message_text: normalizedMessage, send: 'flowbuilder',
        metadata: { conexaoId: conexao.id, phone_number: phoneNumber },
        received_at: new Date().toISOString()
      });
    }
    return { success: true, messageId };
  } catch (error) {
    console.error('[Main] Erro envio direto:', error);
    return null;
  }
}

// Fallback to edge function for complex sends (interactive, document, image, etc.)
async function callSender(supabase: any, action: string, conexao: any, phoneNumber: string, chatId: number | undefined, params: any) {
  // For text messages, use direct send
  if (action === 'text') {
    return await sendTextDirect(supabase, conexao, phoneNumber, chatId, params.message);
  }
  // For other types, use the sender edge function
  const { data, error } = await supabase.functions.invoke('flow-whatsapp-sender', {
    body: { action, conexao, phoneNumber, chatId, ...params }
  });
  if (error) console.error('[Main] Sender error:', error);
  return data;
}

// ============================================
// 📦 INLINE BLOCK HANDLERS (eliminates HTTP hop to flow-processor-blocks)
// ============================================
async function handleTextBlockInline(supabase: any, session: Session, block: FlowBlock, blockIndex: number, conexao: any) {
  const rawMessage = block.data?.description || block.data?.text || block.data?.message || '';
  const message = await replaceVariablesWithContactFallback(supabase, rawMessage, session.variables, session);
  if (message && message.trim() !== '') {
    await sendTextDirect(supabase, conexao, session.phone_number, session.chatId, message);
  }
  return { action: 'advance', blockIndex };
}

async function handleIntervalBlockInline(block: FlowBlock, blockIndex: number) {
  const seconds = block.data?.sec || Math.floor((block.data?.delay || 1000) / 1000);
  const delayMs = Math.min(seconds * 1000, 10000);
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return { action: 'advance', blockIndex };
}

async function handleSetVariableBlockInline(supabase: any, session: Session, block: FlowBlock, blockIndex: number) {
  const variableName = block.data?.variableName || block.data?.variable || block.data?.key;
  const variableValue = block.data?.variableValue || block.data?.value;
  if (variableName) {
    const processedValue = replaceVariables(String(variableValue || ''), session.variables, session);
    const variables = { ...session.variables, [variableName]: processedValue };
    await supabase.from('flow_sessions').update({ variables }).eq('id', session.id);
    session.variables = variables;
  }
  return { action: 'advance', blockIndex };
}

function evaluateComparison(varValue: any, operator: string, compareValue: any): boolean {
  const strVar = String(varValue ?? '').toLowerCase().trim();
  const strCompare = String(compareValue ?? '').toLowerCase().trim();
  switch (operator) {
    case 'equals': case '==': case 'equal': case 'eq': return strVar === strCompare;
    case 'not_equals': case '!=': case 'notEqual': case 'neq': case 'not_equal': return strVar !== strCompare;
    case 'contains': case 'includes': return strVar.includes(strCompare);
    case 'not_contains': case 'notContains': case 'not_includes': return !strVar.includes(strCompare);
    case 'starts_with': case 'startsWith': return strVar.startsWith(strCompare);
    case 'ends_with': case 'endsWith': return strVar.endsWith(strCompare);
    case 'greater': case '>': case 'gt': return Number(varValue) > Number(compareValue);
    case 'greater_equal': case '>=': case 'gte': return Number(varValue) >= Number(compareValue);
    case 'less': case '<': case 'lt': return Number(varValue) < Number(compareValue);
    case 'less_equal': case '<=': case 'lte': return Number(varValue) <= Number(compareValue);
    case 'is_empty': case 'isEmpty': case 'empty': return !varValue || strVar === '';
    case 'is_not_empty': case 'isNotEmpty': case 'not_empty': case 'exists': return !!varValue && strVar !== '';
    case 'not_exists': case 'not_found': return !varValue || strVar === '';
    case 'matches': case 'regex': try { return new RegExp(compareValue, 'i').test(String(varValue)); } catch { return false; }
    default: return strVar === strCompare;
  }
}

async function handleConditionBlockInline(session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock) {
  let matchedRuleIndex = -1;

  if (block.data?.conditions?.rules && Array.isArray(block.data.conditions.rules)) {
    const rules = block.data.conditions.rules;
    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
      const rule = rules[ruleIndex];
      const comparisons = rule.comparisons || [];
      if (comparisons.length === 0) continue;
      const allComparisonsPass = comparisons.every((comp: any) => {
        const varValue = session.variables[comp.variable] ?? replaceVariables(`{{${comp.variable}}}`, session.variables, session);
        const compareValue = replaceVariables(String(comp.value ?? ''), session.variables, session);
        return evaluateComparison(varValue, comp.operator, compareValue);
      });
      if (allComparisonsPass) { matchedRuleIndex = ruleIndex; break; }
    }
  } else if (block.data?.conditions?.comparisons && Array.isArray(block.data.conditions.comparisons)) {
    const comparisons = block.data.conditions.comparisons;
    const logicalOperator = block.data.conditions.logicalOperator || 'and';
    const results = comparisons.map((comp: any) => {
      const varValue = session.variables[comp.variable] ?? '';
      const compareValue = replaceVariables(String(comp.value ?? ''), session.variables, session);
      return evaluateComparison(varValue, comp.operator, compareValue);
    });
    if (logicalOperator === 'or') matchedRuleIndex = results.some((r: boolean) => r) ? 0 : -1;
    else matchedRuleIndex = results.every((r: boolean) => r) ? 0 : -1;
  } else if (block.data?.conditionRules || block.data?.rules) {
    const rules = block.data.conditionRules || block.data.rules || [];
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const varName = rule.variable || rule.variableName;
      const varValue = session.variables[varName] ?? '';
      const compareValue = replaceVariables(String(rule.value ?? ''), session.variables, session);
      const operator = rule.operator || rule.condition || 'equals';
      if (evaluateComparison(varValue, operator, compareValue)) { matchedRuleIndex = i; break; }
    }
  } else if (block.data?.variable) {
    const varValue = session.variables[block.data.variable] ?? '';
    const compareValue = replaceVariables(String(block.data.value ?? ''), session.variables, session);
    const operator = block.data.condition || block.data.operator || 'equals';
    matchedRuleIndex = evaluateComparison(varValue, operator, compareValue) ? 0 : -1;
  }

  let edge = null;
  if (matchedRuleIndex >= 0) {
    const handleFormats = [
      `${block.id}-rule-${matchedRuleIndex}`, `rule-${matchedRuleIndex}`,
      `condition-${matchedRuleIndex}`, `${block.id}-condition-${matchedRuleIndex}`,
      'true', `${block.id}-true`, 'yes', `${block.id}-yes`,
    ];
    for (const handle of handleFormats) {
      edge = findEdge(flowData, group.id, handle);
      if (edge) break;
    }
    if (!edge) {
      for (const handle of handleFormats) {
        edge = findEdge(flowData, block.id, handle);
        if (edge) break;
      }
    }
  }
  if (!edge) {
    const elseHandles = ['else', `${block.id}-else`, 'false', `${block.id}-false`, 'no', `${block.id}-no`, 'default', `${block.id}-default`];
    for (const handle of elseHandles) {
      edge = findEdge(flowData, group.id, handle);
      if (edge) break;
    }
    if (!edge) {
      for (const handle of elseHandles) {
        edge = findEdge(flowData, block.id, handle);
        if (edge) break;
      }
    }
  }
  if (!edge) edge = findEdge(flowData, group.id, undefined);
  if (edge) return { action: 'navigate', targetGroupId: edge.target };
  return { action: 'complete', reason: `condition_no_edge_rule_${matchedRuleIndex}` };
}

async function handleRandomizerBlockInline(session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock) {
  const random = Math.random() * 100;
  let selectedPath = 'b';
  if (block.data?.percent !== undefined) {
    selectedPath = random <= Number(block.data.percent) ? 'a' : 'b';
  } else if (block.data?.options) {
    let accumulated = 0;
    for (const opt of block.data.options) {
      accumulated += opt.percentage || 0;
      if (random <= accumulated) { selectedPath = opt.value || opt.id; break; }
    }
  }
  const edge = findEdge(flowData, group.id, `${block.id}-${selectedPath}`) || findEdge(flowData, group.id, selectedPath);
  if (edge) return { action: 'navigate', targetGroupId: edge.target };
  return { action: 'complete', reason: 'randomizer_no_next' };
}

async function handleTagsBlockInline(supabase: any, session: Session, block: FlowBlock, blockIndex: number) {
  const selectedTags = block.data?.selectedTags || block.data?.tags || block.data?.tagIds || [];
  const tagIds = selectedTags.map((t: any) => typeof t === 'object' ? String(t.id) : String(t));
  if (tagIds.length > 0) {
    const { data: contato } = await supabase.from('contatos_whatsapp').select('id').eq('telefone', session.phone_number).maybeSingle();
    if (contato) {
      const { data: chat } = await supabase.from('chats_whatsapp').select('id, tags').eq('usuarioid', contato.id).eq('ativo', true).maybeSingle();
      if (chat) {
        let existingTags: string[] = [];
        try { existingTags = chat.tags ? JSON.parse(chat.tags) : []; if (!Array.isArray(existingTags)) existingTags = []; } catch { existingTags = []; }
        const mergedTags = [...new Set([...existingTags, ...tagIds])];
        await supabase.from('chats_whatsapp').update({ tags: JSON.stringify(mergedTags), atualizadoem: new Date().toISOString() }).eq('id', chat.id);
      }
    }
  }
  return { action: 'advance', blockIndex };
}

async function handleTicketBlockInline(supabase: any, session: Session, block: FlowBlock, conexao: any) {
  const queueIds = block.data?.queueIds || [];
  const message = block.data?.message || block.data?.text;
  if (message) {
    const processedMessage = await replaceVariablesWithContactFallback(supabase, message, session.variables, session);
    await sendTextDirect(supabase, conexao, session.phone_number, session.chatId, processedMessage);
  }
  const { data: contato } = await supabase.from('contatos_whatsapp').select('id').eq('telefone', session.phone_number).maybeSingle();
  if (contato) {
    const { data: chat } = await supabase.from('chats_whatsapp').select('id, filas').eq('usuarioid', contato.id).eq('ativo', true).maybeSingle();
    if (chat) {
      const filasArray = queueIds.map((id: any) => String(id));
      await supabase.from('chats_whatsapp').update({
        mododeatendimento: 'Atendimento Humano', atualizadoem: new Date().toISOString(), filas: filasArray
      }).eq('id', chat.id);
    }
  }
  await supabase.from('flow_sessions').update({ status: 'human' }).eq('id', session.id);
  return { action: 'complete', reason: 'ticket_created' };
}

async function handleJumpBlockInline(flowData: FlowData, block: FlowBlock, blockIndex: number) {
  const targetGroupId = block.data?.targetGroupId;
  if (!targetGroupId) return { action: 'advance', blockIndex };
  const targetGroup = flowData.groups?.find(g => g.id === targetGroupId);
  if (!targetGroup) return { action: 'advance', blockIndex };
  return { action: 'navigate', targetGroupId };
}

async function handleLoopBlockInline(supabase: any, session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock, blockIndex: number, conexao: any) {
  const sourceVariable = block.data?.sourceVariable || block.data?.arrayVariable || '';
  const itemVariable = block.data?.itemVariable || 'item';
  const indexVariable = block.data?.indexVariable || 'index';
  let varName = sourceVariable.replace(/^\{\{|\}\}$/g, '').trim();
  const sourceValue = session.variables[varName];
  let items: any[] = [];
  if (Array.isArray(sourceValue)) items = sourceValue;
  else if (typeof sourceValue === 'string') {
    try { const parsed = JSON.parse(sourceValue); if (Array.isArray(parsed)) items = parsed; }
    catch { items = sourceValue.split('\n').filter(s => s.trim()); }
  }
  if (items.length === 0) return { action: 'advance', blockIndex };
  
  const loopBodyEdge = findEdge(flowData, group.id, `${block.id}-loop_body`) || findEdge(flowData, block.id, 'loop_body');
  const loopCompleteEdge = findEdge(flowData, group.id, `${block.id}-loop_complete`) || findEdge(flowData, block.id, 'loop_complete');
  
  if (loopBodyEdge?.target) {
    const targetGroup = getGroupById(flowData, loopBodyEdge.target);
    if (targetGroup) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const updatedVariables: Record<string, any> = {
          ...session.variables,
          [itemVariable]: typeof item === 'object' ? JSON.stringify(item) : item,
          loop_index: i.toString(), loop_total: items.length.toString(),
        };
        if (indexVariable) updatedVariables[indexVariable] = i.toString();
        await supabase.from('flow_sessions').update({ variables: updatedVariables }).eq('id', session.id);
        session.variables = updatedVariables;
        for (const targetBlock of [...targetGroup.blocks].sort((a, b) => (a.order || 0) - (b.order || 0))) {
          const bt = (targetBlock.type || '').toLowerCase().trim();
          if (bt === 'text') {
            const msg = await replaceVariablesWithContactFallback(supabase, targetBlock.data?.description || targetBlock.data?.text || '', session.variables, session);
            if (msg) await sendTextDirect(supabase, conexao, session.phone_number, session.chatId, msg);
          } else if (bt === 'interval') {
            const delay = Math.min((targetBlock.data?.delay || 1) * 1000, 10000);
            await new Promise(r => setTimeout(r, delay));
          } else if (bt === 'setvariable') {
            const vn = targetBlock.data?.variableName || targetBlock.data?.variable;
            if (vn) {
              session.variables[vn] = replaceVariables(targetBlock.data?.variableValue || '', session.variables, session);
              await supabase.from('flow_sessions').update({ variables: session.variables }).eq('id', session.id);
            }
          }
        }
        if (i < items.length - 1) await new Promise(r => setTimeout(r, 200));
      }
    }
  }
  if (loopCompleteEdge?.target) return { action: 'navigate', targetGroupId: loopCompleteEdge.target };
  return { action: 'advance', blockIndex };
}

// ============================================
// 🔄 BLOCK PROCESSOR - INLINE FOR SIMPLE, EDGE FUNCTION FOR COMPLEX
// ============================================
const INLINE_BLOCKS = new Set(['start', 'text', 'interval', 'setvariable', 'condition', 'randomizer', 'tags', 'ticket', 'jump', 'loop', 'end', 'flow_end', 'javascript']);
const INTERACTIVE_BLOCKS = new Set(['menu', 'buttons', 'question']);

async function processBlock(supabase: any, session: Session, flowData: FlowData, groupId: string, blockIndex: number, conexao: any) {
  const group = getGroupById(flowData, groupId);
  if (!group) return { action: 'complete', reason: 'group_not_found' };
  
  const sortedBlocks = [...group.blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
  if (blockIndex >= sortedBlocks.length) {
    const nextGroupId = findNextGroupId(flowData, groupId);
    if (nextGroupId) return { action: 'navigate', targetGroupId: nextGroupId };
    return { action: 'complete', reason: 'last_group' };
  }
  
  const block = sortedBlocks[blockIndex];
  const blockType = (block.type || block.data?.type || '').toLowerCase().trim();
  
  // ============================================
  // INLINE PROCESSING - No HTTP round-trips!
  // ============================================
  if (INLINE_BLOCKS.has(blockType)) {
    switch (blockType) {
      case 'start': return { action: 'advance', blockIndex };
      case 'text': return await handleTextBlockInline(supabase, session, block, blockIndex, conexao);
      case 'interval': return await handleIntervalBlockInline(block, blockIndex);
      case 'setvariable': return await handleSetVariableBlockInline(supabase, session, block, blockIndex);
      case 'condition': return await handleConditionBlockInline(session, flowData, group, block);
      case 'randomizer': return await handleRandomizerBlockInline(session, flowData, group, block);
      case 'tags': return await handleTagsBlockInline(supabase, session, block, blockIndex);
      case 'ticket': return await handleTicketBlockInline(supabase, session, block, conexao);
      case 'jump': return await handleJumpBlockInline(flowData, block, blockIndex);
      case 'loop': return await handleLoopBlockInline(supabase, session, flowData, group, block, blockIndex, conexao);
      case 'end': case 'flow_end': return { action: 'complete', reason: 'end_block' };
      case 'javascript': return { action: 'advance', blockIndex };
      default: return { action: 'advance', blockIndex };
    }
  }
  
  // ============================================
  // INTERACTIVE BLOCKS - Still use edge function (needs complex list/button rendering)
  // ============================================
  if (INTERACTIVE_BLOCKS.has(blockType)) {
    const { data, error } = await supabase.functions.invoke('flow-processor-interactive', {
      body: { action: 'send', blockType, session, flowData, group, block, blockIndex, conexao }
    });
    if (error) {
      console.error(`[Main] Interactive error:`, error);
      return { action: 'advance', blockIndex };
    }
    if (data?.action === 'wait_input') {
      await supabase.from('flow_sessions').update({
        status: 'waiting_input', waiting_block_type: blockType, updated_at: new Date().toISOString()
      }).eq('id', session.id);
      return { action: 'wait_input', blockType };
    }
    if (data?.updatedVariables) session.variables = data.updatedVariables;
    return data;
  }
  
  // ============================================
  // EXTERNAL BLOCKS - Use edge function (httpRequest, openai, etc.)
  // ============================================
  const processorName = 'flow-processor-external';
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
    const { data: fs } = await supabase.from('flow_sessions').select('variables').eq('id', session.id).maybeSingle();
    if (fs?.variables) session.variables = fs.variables;
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
      console.warn(`[Main] ⏱️ Timeout interno após ${elapsed}ms - salvando estado`);
      await supabase.from('flow_sessions').update({
        current_group_id: currentGroupId, current_block_index: currentBlockIndex,
        status: 'running', updated_at: new Date().toISOString()
      }).eq('id', session.id);
      return { success: true, partial: true, message: 'Timeout interno - estado salvo', elapsed, iterations };
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
          currentGroupId = errorEdge.target; currentBlockIndex = 0;
        } else if (result.continueOnError) {
          currentBlockIndex = (result.blockIndex ?? currentBlockIndex) + 1;
        } else {
          await completeFlowSession(supabase, session, conexao, 'http_request_error');
          return { success: true, completed: true };
        }
        break;
      case 'success_edge':
        const successEdge = findEdge(flowData, currentGroupId, result.handleId);
        if (successEdge) {
          currentGroupId = successEdge.target; currentBlockIndex = 0;
        } else {
          const fallbackGroupId = findNextGroupId(flowData, currentGroupId);
          if (fallbackGroupId) {
            currentGroupId = fallbackGroupId; currentBlockIndex = 0;
          } else {
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
    await supabase.from('flow_sessions').update({ status: 'human', updated_at: new Date().toISOString() }).eq('id', session.id);
    await supabase.from('flow_execution_logs').insert({
      session_id: session.id, node_id: 'flow_end', node_type: 'ticket_transfer',
      action: 'transferred_to_human', log_data: { reason }, result: 'human'
    });
    return;
  }
  await supabase.from('flow_sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', session.id);
  if (chatId) {
    await supabase.from('chats_whatsapp').update({
      ativo: false, encerradoem: new Date().toISOString(), resolvido: true, mododeatendimento: 'bot'
    }).eq('id', chatId);
  }
  await supabase.from('flow_execution_logs').insert({
    session_id: session.id, node_id: 'flow_end', node_type: 'flow_end',
    action: 'flow_completed', log_data: { reason }, result: 'completed'
  });
  if (conexao.farewellmessage?.trim()) {
    await sendTextDirect(supabase, conexao, session.phone_number, chatId, conexao.farewellmessage);
  }
}

// ============================================
// 🔄 MAIN HANDLER
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

    const body = await req.json();
    const { phoneNumber, messageText, messageType, conexaoId, contactName, chatId, interactiveId } = body;

    if (!phoneNumber || !conexaoId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        return new Response(JSON.stringify({ error: 'Chat ownership validation failed', details: ownershipValidation.error }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Check human mode
    if (chatId) {
      const { data: chatData } = await supabase.from('chats_whatsapp').select('mododeatendimento').eq('id', chatId).maybeSingle();
      if (chatData?.mododeatendimento?.toLowerCase().includes('humano')) {
        return new Response(JSON.stringify({ success: true, atendimentoHumano: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Check chatbot disabled
    const { data: contato } = await supabase.from('contatos_whatsapp').select('chatbot_desabilitado').eq('telefone', phoneNumber).maybeSingle();
    if (contato?.chatbot_desabilitado) {
      return new Response(JSON.stringify({ success: true, chatbotDisabled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get conexao
    const { data: conexao, error: conexaoError } = await supabase.from('conexoes').select('*').eq('id', conexaoId).maybeSingle();
    if (conexaoError || !conexao) {
      return new Response(JSON.stringify({ error: conexaoError ? 'Erro ao buscar conexão' : 'Conexão não encontrada' }), {
        status: conexaoError ? 500 : 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check campanha_flow_id
    let campanhaFlowId: string | null = null;
    let origemCampanhaId: string | null = null;
    if (chatId) {
      const { data: chatData } = await supabase.from('chats_whatsapp').select('campanha_flow_id, origem_campanha_id').eq('id', chatId).maybeSingle();
      if (chatData?.campanha_flow_id) {
        campanhaFlowId = chatData.campanha_flow_id;
        origemCampanhaId = chatData.origem_campanha_id;
      }
    }

    // Check existing session
    let session = null;
    let existingSession = null;
    const { data: foundSession } = await supabase.from('flow_sessions').select('*')
      .eq('phone_number', phoneNumber).eq('conexao_id', conexaoId)
      .in('status', ['running', 'waiting_input']).maybeSingle();
    existingSession = foundSession;

    // Validate session
    if (existingSession) {
      let shouldInvalidate = false;
      let invalidateReason = '';

      if (campanhaFlowId && existingSession.flow_id !== campanhaFlowId) {
        shouldInvalidate = true;
        invalidateReason = `campanha_flow_id diferente`;
      }
      if (!shouldInvalidate && chatId && existingSession.chat_id && existingSession.chat_id !== chatId) {
        shouldInvalidate = true;
        invalidateReason = `chatId diferente: sessão=${existingSession.chat_id}, request=${chatId}`;
      }
      if (!shouldInvalidate && chatId && !existingSession.chat_id) {
        shouldInvalidate = true;
        invalidateReason = `sessão sem chat_id mas request tem chatId=${chatId}`;
      }
      if (!shouldInvalidate && existingSession.chat_id) {
        const { data: sessionChat } = await supabase.from('chats_whatsapp').select('id, resolvido, ativo').eq('id', existingSession.chat_id).maybeSingle();
        if (!sessionChat || sessionChat.resolvido === true || sessionChat.ativo === false) {
          shouldInvalidate = true;
          invalidateReason = sessionChat ? `chat encerrado` : 'chat não encontrado';
        }
      }
      if (!shouldInvalidate && !existingSession.chat_id && !chatId) {
        const { data: ct } = await supabase.from('contatos_whatsapp').select('id').eq('telefone', phoneNumber).maybeSingle();
        if (ct) {
          const { data: activeChat } = await supabase.from('chats_whatsapp').select('id').eq('usuarioid', ct.id).eq('ativo', true).eq('resolvido', false).maybeSingle();
          if (activeChat && activeChat.id !== existingSession.chat_id) {
            shouldInvalidate = true;
            invalidateReason = `novo chat ativo: ${activeChat.id}`;
          }
        }
      }

      if (shouldInvalidate) {
        await supabase.from('flow_sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', existingSession.id);
        existingSession = null;
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

    // Determine flow to use
    let flowIdToUse: string | null = null;
    if (campanhaFlowId) flowIdToUse = campanhaFlowId;
    else if (session?.flow_id) flowIdToUse = session.flow_id;
    else flowIdToUse = conexao.fluxo_boas_vindas_id || conexao.fluxo_resposta_padrao_id;
    
    if (!flowIdToUse) {
      if (session) await releaseSessionLock(supabase, session.id);
      return new Response(JSON.stringify({ success: true, message: 'Sem fluxo configurado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: flow, error: flowError } = await supabase.from('flow_builders').select('*').eq('id', flowIdToUse).maybeSingle();
    if (flowError || !flow) {
      if (session) await releaseSessionLock(supabase, session.id);
      return new Response(JSON.stringify({ error: flowError ? 'Erro ao buscar flow' : 'Flow não encontrado' }), {
        status: flowError ? 500 : 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const flowData = getFlowData(flow);

    // Handle waiting input
    if (session && session.status === 'waiting_input') {
      const groupId = session.current_group_id || session.current_node_id;
      const blockIndex = session.current_block_index || 0;
      const blockType = session.waiting_block_type;
      const group = getGroupById(flowData, groupId!);
      if (group) {
        const sortedBlocks = [...group.blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const block = sortedBlocks[blockIndex];
        const { data: responseResult } = await supabase.functions.invoke('flow-processor-interactive', {
          body: { action: 'response', blockType, session, flowData, group, block, blockIndex, conexao, messageText, messageType, interactiveId }
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
        await supabase.from('flow_sessions').update({ status: 'running', waiting_block_type: null }).eq('id', session.id);
        const result = await executeFlowLoop(supabase, session, flowData, nextGroupId, nextBlockIndex, conexao);
        await releaseSessionLock(supabase, session.id);
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      const { data: newSession, error: sessionError } = await supabase.from('flow_sessions').insert({
        phone_number: phoneNumber, contact_name: contactName, conexao_id: conexaoId,
        flow_id: flow.id, chat_id: chatId, current_group_id: firstGroupId,
        current_node_id: firstGroupId, current_block_index: 0, status: 'running', variables: {}
      }).select().single();
      if (sessionError || !newSession) {
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      session = newSession;
      session.chatId = chatId;
      await supabase.from('flow_execution_logs').insert({
        session_id: session.id, node_id: firstGroupId, node_type: 'session_start',
        action: 'session_start', log_data: { phoneNumber, contactName, flowId: flow.id, flowName: flow.name, campanhaFlowId, origemCampanhaId }, result: 'started'
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
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[Main] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
