// Flow Processor Main - CONSOLIDATED (sender + blocks + interactive inlined)
// Eliminates inter-function latency by processing everything in a single function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

declare const EdgeRuntime: { waitUntil: (promise: Promise<any>) => void; };

// ============================================
// 📦 TYPES
// ============================================
interface FlowBlock { id: string; type: string; order: number; data: any; }
interface FlowGroup { id: string; title: string; blocks: FlowBlock[]; }
interface FlowData { groups?: FlowGroup[]; nodes?: any[]; edges: any[]; }
interface Session {
  id: string; phone_number: string; contact_name: string; conexao_id: string;
  flow_id: string; current_group_id?: string; current_node_id?: string; current_block_index?: number;
  waiting_block_type?: string; status: string; variables: Record<string, any>;
  chatId?: number; chat_id?: number; processing_id?: string;
}

// ============================================
// 🔤 UTF-8 HELPERS
// ============================================
function fixUtf8Encoding(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let fixed = text;
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
  return fixed;
}

function normalizeUtf8(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let normalized = fixUtf8Encoding(text);
  normalized = normalized.replace(/\uFFFD/g, '');
  try { normalized = normalized.normalize('NFC'); } catch {}
  return normalized;
}

// ============================================
// 📦 GENERAL HELPERS
// ============================================
function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

function createProcessingId(): string {
  return `${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
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
    date: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    timestamp: new Date().toISOString(),
  };
  return result.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const value = allVariables[varName.trim()];
    return value !== undefined ? (typeof value === 'object' ? JSON.stringify(value) : String(value)) : match;
  });
}

async function resolveContactName(supabase: any, session: Session): Promise<string> {
  if (session.contact_name && session.contact_name.trim() !== '') return session.contact_name;
  try {
    const phoneDigits = (session.phone_number || '').replace(/\D/g, '');
    if (!phoneDigits) return '';
    let { data: contato } = await supabase.from('contatos_whatsapp').select('nome').eq('telefone', phoneDigits).maybeSingle();
    if (!contato && phoneDigits.length >= 8) {
      const last8 = phoneDigits.slice(-8);
      const { data: f } = await supabase.from('contatos_whatsapp').select('nome, telefone').like('telefone', `%${last8}`).limit(1).maybeSingle();
      contato = f;
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
// 📦 FLOW DATA HELPERS
// ============================================
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
    const startEdges = flowData.edges.filter((e: any) => startNodeIds.some(id => e.source === id || e.source?.toLowerCase() === id.toLowerCase()));
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
  return { id: node.id, title: node.data?.label || 'Grupo', blocks: [{ id: `block-${node.id}`, type: node.data?.type || 'text', order: 1, data: node.data || {} }] };
}

function findNextGroupId(flowData: FlowData, sourceGroupId: string): string | null {
  const edge = flowData.edges.find((e: any) => e.source === sourceGroupId && (!e.sourceHandle || e.sourceHandle === 'output' || e.sourceHandle === 'group-success-output'));
  return edge?.target || null;
}

function findEdge(flowData: FlowData, sourceId: string, sourceHandle?: string): any | null {
  return flowData.edges.find((e: any) => {
    if (e.source !== sourceId) return false;
    if (sourceHandle) return e.sourceHandle === sourceHandle;
    return true;
  }) || null;
}

// ============================================
// 🔒 SESSION LOCK
// ============================================
async function acquireSessionLock(supabase: any, sessionId: string, processingId: string): Promise<boolean> {
  const now = new Date();
  const lockTimeout = new Date(now.getTime() - 30000);
  const { data: updated } = await supabase.from('flow_sessions').update({ processing_id: processingId, updated_at: now.toISOString() }).eq('id', sessionId).is('processing_id', null).select('id').maybeSingle();
  if (updated) return true;
  const { data: session } = await supabase.from('flow_sessions').select('processing_id, updated_at').eq('id', sessionId).maybeSingle();
  if (!session) return false;
  if (session.processing_id === processingId) return true;
  const sessionUpdated = new Date(session.updated_at);
  if (sessionUpdated < lockTimeout) {
    const { data: forced } = await supabase.from('flow_sessions').update({ processing_id: processingId, updated_at: now.toISOString() }).eq('id', sessionId).eq('processing_id', session.processing_id).select('id').maybeSingle();
    if (forced) return true;
  }
  return false;
}

async function releaseSessionLock(supabase: any, sessionId: string) {
  await supabase.from('flow_sessions').update({ processing_id: null }).eq('id', sessionId);
}

// ============================================
// 🔒 CHAT OWNERSHIP VALIDATION
// ============================================
async function validateChatOwnership(supabase: any, chatId: number | undefined, phoneNumber: string, _conexaoId: string): Promise<{ valid: boolean; error?: string }> {
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

// ============================================
// 📤 WHATSAPP SENDER (INLINE - NO MORE EDGE FUNCTION HOP)
// ============================================
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') throw new Error(`Request timeout after ${timeoutMs}ms`);
    throw error;
  }
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 1, timeoutMs = 15000): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(url, options, timeoutMs);
    } catch (error: unknown) {
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('All retry attempts failed');
}

function getMetaApiUrl(phoneId: string): string {
  return `https://graph.facebook.com/v21.0/${phoneId}/messages`;
}

function getMetaHeaders(token: string): Record<string, string> {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' };
}

async function sendWhatsAppText(supabase: any, conexao: any, phoneNumber: string, message: string, chatId?: number) {
  if (!isValidPhoneNumber(phoneNumber) || !conexao.whatsapp_token || !conexao.whatsapp_phone_id) return { success: false, error: 'Invalid params' };
  const normalizedMessage = normalizeUtf8(message);
  try {
    const response = await fetchWithRetry(getMetaApiUrl(conexao.whatsapp_phone_id), {
      method: 'POST', headers: getMetaHeaders(conexao.whatsapp_token),
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: phoneNumber, type: 'text', text: { body: normalizedMessage } })
    });
    const data = await response.json();
    if (!response.ok) { console.error('[Sender] API Error:', response.status, JSON.stringify(data)); return { success: false, error: `API Error ${response.status}` }; }
    const messageId = data.messages?.[0]?.id || crypto.randomUUID();
    if (chatId) {
      await supabase.from('mensagens_whatsapp').insert({ message_id: messageId, chatId, message_type: 'text', message_text: normalizedMessage, send: 'flowbuilder', metadata: { conexaoId: conexao.id, phone_number: phoneNumber }, received_at: new Date().toISOString() });
    }
    return { success: true, messageId };
  } catch (error) { console.error('[Sender] Erro:', error); return { success: false, error: String(error) }; }
}

async function sendWhatsAppList(supabase: any, conexao: any, phoneNumber: string, listData: { body: string; buttonText: string; sections: any[]; header?: string; footer?: string }, chatId?: number) {
  if (!isValidPhoneNumber(phoneNumber) || !conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) return { success: false, error: 'Invalid params' };
  const interactive: any = {
    type: 'list', body: { text: normalizeUtf8(listData.body) },
    action: { button: normalizeUtf8(listData.buttonText), sections: listData.sections.map(s => ({ title: normalizeUtf8(s.title || 'Opcoes'), rows: s.rows.map((r: any) => ({ id: r.id, title: normalizeUtf8(r.title), description: r.description ? normalizeUtf8(r.description) : undefined })) })) }
  };
  if (listData.header) interactive.header = { type: 'text', text: normalizeUtf8(listData.header) };
  if (listData.footer) interactive.footer = { text: normalizeUtf8(listData.footer) };
  try {
    const response = await fetchWithRetry(getMetaApiUrl(conexao.whatsapp_phone_id), {
      method: 'POST', headers: getMetaHeaders(conexao.whatsapp_token),
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: phoneNumber, type: 'interactive', interactive })
    });
    const result = await response.json();
    if (!response.ok) { console.error('[Sender] API Error:', response.status, JSON.stringify(result)); return { success: false, error: `API Error ${response.status}` }; }
    const messageId = result.messages?.[0]?.id || crypto.randomUUID();
    if (chatId) {
      const messageText = listData.header ? `[Menu] ${listData.header}\n${listData.body}` : `[Menu] ${listData.body}`;
      await supabase.from('mensagens_whatsapp').insert({ message_id: messageId, chatId, message_type: 'interactive', message_text: normalizeUtf8(messageText), send: 'flowbuilder', metadata: { interactiveType: 'list', buttonText: listData.buttonText, sections: listData.sections, conexaoId: conexao?.id, phone_number: phoneNumber }, received_at: new Date().toISOString() });
    }
    return { success: true, messageId };
  } catch (error) { console.error('[Sender] Erro lista:', error); return { success: false, error: String(error) }; }
}

async function sendWhatsAppButtons(supabase: any, conexao: any, phoneNumber: string, btnData: { body: string; buttons: any[] }, chatId?: number) {
  if (!isValidPhoneNumber(phoneNumber) || !conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) return { success: false, error: 'Invalid params' };
  const payload = {
    messaging_product: 'whatsapp', recipient_type: 'individual', to: phoneNumber, type: 'interactive',
    interactive: { type: 'button', body: { text: normalizeUtf8(btnData.body) }, action: { buttons: btnData.buttons.slice(0, 3).map(b => ({ type: 'reply', reply: { id: b.id, title: normalizeUtf8(b.title).substring(0, 20) } })) } }
  };
  try {
    const response = await fetchWithRetry(getMetaApiUrl(conexao.whatsapp_phone_id), { method: 'POST', headers: getMetaHeaders(conexao.whatsapp_token), body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { console.error('[Sender] API Error:', response.status, JSON.stringify(result)); return { success: false, error: `API Error ${response.status}` }; }
    const messageId = result.messages?.[0]?.id || crypto.randomUUID();
    if (chatId) {
      const buttonLabels = btnData.buttons.map((b: any) => b.title).join(' | ');
      await supabase.from('mensagens_whatsapp').insert({ message_id: messageId, chatId, message_type: 'interactive', message_text: normalizeUtf8(`[Botoes] ${btnData.body}\nOpcoes: ${buttonLabels}`), send: 'flowbuilder', metadata: { interactiveType: 'buttons', buttons: btnData.buttons, conexaoId: conexao?.id, phone_number: phoneNumber }, received_at: new Date().toISOString() });
    }
    return { success: true, messageId };
  } catch (error) { console.error('[Sender] Erro botoes:', error); return { success: false, error: String(error) }; }
}

// Legacy callSender for external blocks that still use invoke
async function callSenderViaInvoke(supabase: any, action: string, conexao: any, phoneNumber: string, chatId: number | undefined, params: any) {
  const { data, error } = await supabase.functions.invoke('flow-whatsapp-sender', { body: { action, conexao, phoneNumber, chatId, ...params } });
  if (error) console.error('[Main] Sender invoke error:', error);
  return data;
}

// Inline sender dispatcher
async function callSender(supabase: any, action: string, conexao: any, phoneNumber: string, chatId: number | undefined, params: any) {
  switch (action) {
    case 'text': return await sendWhatsAppText(supabase, conexao, phoneNumber, params.message, chatId);
    case 'list': return await sendWhatsAppList(supabase, conexao, phoneNumber, params.data, chatId);
    case 'buttons': return await sendWhatsAppButtons(supabase, conexao, phoneNumber, params.data, chatId);
    // For media types, still use invoke (less common, complex logic)
    default: return await callSenderViaInvoke(supabase, action, conexao, phoneNumber, chatId, params);
  }
}

// ============================================
// 🧩 BLOCK HANDLERS (INLINE - NO MORE EDGE FUNCTION HOP)
// ============================================
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

async function handleTextBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number, conexao: any) {
  const rawMessage = block.data?.description || block.data?.text || block.data?.message || '';
  const message = await replaceVariablesWithContactFallback(supabase, rawMessage, session.variables, session);
  if (message && message.trim() !== '') {
    await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message });
  }
  return { action: 'advance', blockIndex };
}

async function handleIntervalBlock(block: FlowBlock, blockIndex: number) {
  const seconds = block.data?.sec || Math.floor((block.data?.delay || 1000) / 1000);
  const delayMs = Math.min(seconds * 1000, 10000);
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return { action: 'advance', blockIndex };
}

async function handleSetVariableBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number) {
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

async function handleConditionBlock(session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock) {
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
    matchedRuleIndex = (logicalOperator === 'or' ? results.some((r: boolean) => r) : results.every((r: boolean) => r)) ? 0 : -1;
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
    const handleFormats = [`${block.id}-rule-${matchedRuleIndex}`, `rule-${matchedRuleIndex}`, `condition-${matchedRuleIndex}`, `${block.id}-condition-${matchedRuleIndex}`, 'true', `${block.id}-true`, 'yes', `${block.id}-yes`];
    for (const handle of handleFormats) { edge = findEdge(flowData, group.id, handle); if (edge) break; }
    if (!edge) { for (const handle of handleFormats) { edge = findEdge(flowData, block.id, handle); if (edge) break; } }
  }
  if (!edge) {
    const elseHandles = ['else', `${block.id}-else`, 'false', `${block.id}-false`, 'no', `${block.id}-no`, 'default', `${block.id}-default`];
    for (const handle of elseHandles) { edge = findEdge(flowData, group.id, handle); if (edge) break; }
    if (!edge) { for (const handle of elseHandles) { edge = findEdge(flowData, block.id, handle); if (edge) break; } }
  }
  if (!edge) { edge = findEdge(flowData, group.id, undefined); }
  if (edge) return { action: 'navigate', targetGroupId: edge.target };
  return { action: 'complete', reason: `condition_no_edge_rule_${matchedRuleIndex}` };
}

async function handleRandomizerBlock(flowData: FlowData, group: FlowGroup, block: FlowBlock) {
  const random = Math.random() * 100;
  let selectedPath = 'b';
  if (block.data?.percent !== undefined) { selectedPath = random <= Number(block.data.percent) ? 'a' : 'b'; }
  else if (block.data?.options) {
    let accumulated = 0;
    for (const opt of block.data.options) { accumulated += opt.percentage || 0; if (random <= accumulated) { selectedPath = opt.value || opt.id; break; } }
  }
  const edge = findEdge(flowData, group.id, `${block.id}-${selectedPath}`) || findEdge(flowData, group.id, selectedPath);
  if (edge) return { action: 'navigate', targetGroupId: edge.target };
  return { action: 'complete', reason: 'randomizer_no_next' };
}

async function handleTagsBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number) {
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

async function handleTicketBlock(supabase: any, session: Session, block: FlowBlock, conexao: any) {
  const queueIds = block.data?.queueIds || [];
  const message = block.data?.message || block.data?.text;
  if (message) {
    const processedMessage = await replaceVariablesWithContactFallback(supabase, message, session.variables, session);
    await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message: processedMessage });
  }
  const { data: contato } = await supabase.from('contatos_whatsapp').select('id').eq('telefone', session.phone_number).maybeSingle();
  if (contato) {
    const { data: chat } = await supabase.from('chats_whatsapp').select('id, filas').eq('usuarioid', contato.id).eq('ativo', true).maybeSingle();
    if (chat) {
      const filasArray = queueIds.map((id: any) => String(id));
      await supabase.from('chats_whatsapp').update({ mododeatendimento: 'Atendimento Humano', atualizadoem: new Date().toISOString(), filas: filasArray }).eq('id', chat.id);
    }
  }
  await supabase.from('flow_sessions').update({ status: 'human' }).eq('id', session.id);
  return { action: 'complete', reason: 'ticket_created' };
}

async function handleJumpBlock(flowData: FlowData, block: FlowBlock, blockIndex: number) {
  const targetGroupId = block.data?.targetGroupId;
  if (!targetGroupId) return { action: 'advance', blockIndex };
  const targetGroup = flowData.groups?.find(g => g.id === targetGroupId);
  if (!targetGroup) return { action: 'advance', blockIndex };
  return { action: 'navigate', targetGroupId };
}

async function handleLoopBlock(supabase: any, session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock, blockIndex: number, conexao: any) {
  const sourceVariable = block.data?.sourceVariable || block.data?.arrayVariable || '';
  const itemVariable = block.data?.itemVariable || 'item';
  const indexVariable = block.data?.indexVariable || 'index';
  let varName = sourceVariable.replace(/^\{\{|\}\}$/g, '').trim();
  const sourceValue = session.variables[varName];
  let items: any[] = [];
  if (Array.isArray(sourceValue)) items = sourceValue;
  else if (typeof sourceValue === 'string') { try { const parsed = JSON.parse(sourceValue); if (Array.isArray(parsed)) items = parsed; } catch { items = sourceValue.split('\n').filter(s => s.trim()); } }
  if (items.length === 0) return { action: 'advance', blockIndex };
  const loopBodyEdge = findEdge(flowData, group.id, `${block.id}-loop_body`) || findEdge(flowData, block.id, 'loop_body');
  const loopCompleteEdge = findEdge(flowData, group.id, `${block.id}-loop_complete`) || findEdge(flowData, block.id, 'loop_complete');
  if (loopBodyEdge?.target) {
    const targetGroup = getGroupById(flowData, loopBodyEdge.target);
    if (targetGroup) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const updatedVariables: Record<string, any> = { ...session.variables, [itemVariable]: typeof item === 'object' ? JSON.stringify(item) : item, loop_index: i.toString(), loop_total: items.length.toString() };
        if (indexVariable) updatedVariables[indexVariable] = i.toString();
        await supabase.from('flow_sessions').update({ variables: updatedVariables }).eq('id', session.id);
        session.variables = updatedVariables;
        for (const targetBlock of [...targetGroup.blocks].sort((a, b) => (a.order || 0) - (b.order || 0))) {
          await executeBlockInLoop(supabase, session, targetBlock, conexao);
        }
        if (i < items.length - 1) await new Promise(r => setTimeout(r, 200));
      }
    }
  }
  if (loopCompleteEdge?.target) return { action: 'navigate', targetGroupId: loopCompleteEdge.target };
  return { action: 'advance', blockIndex };
}

async function executeBlockInLoop(supabase: any, session: Session, block: FlowBlock, conexao: any) {
  const blockType = (block.type || '').toLowerCase().trim();
  switch (blockType) {
    case 'text':
      const message = await replaceVariablesWithContactFallback(supabase, block.data?.description || block.data?.text || '', session.variables, session);
      if (message) await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message });
      break;
    case 'interval':
      const delay = Math.min((block.data?.delay || 1) * 1000, 10000);
      await new Promise(r => setTimeout(r, delay));
      break;
    case 'setvariable':
      const varName = block.data?.variableName || block.data?.variable;
      if (varName) {
        session.variables[varName] = replaceVariables(block.data?.variableValue || '', session.variables, session);
        await supabase.from('flow_sessions').update({ variables: session.variables }).eq('id', session.id);
      }
      break;
  }
}

// ============================================
// 🎛️ INTERACTIVE HANDLERS (INLINE)
// ============================================
async function handleMenuBlock(supabase: any, session: Session, _flowData: FlowData, _group: FlowGroup, block: FlowBlock, _blockIndex: number, conexao: any) {
  const menuData = block.data?.menuData;
  const contactName = await resolveContactName(supabase, session);
  if (menuData) {
    const sections = menuData.sections?.map((section: any) => ({
      title: replaceVariables(section.title || 'Opções', session.variables, session, contactName),
      rows: section.rows?.map((row: any) => ({ id: row.id, title: replaceVariables(row.title, session.variables, session, contactName).substring(0, 24), description: row.description ? replaceVariables(row.description, session.variables, session, contactName).substring(0, 72) : undefined })) || []
    })) || [];
    const body = menuData.body || menuData.bodyText || block.data?.message || 'Escolha uma opção:';
    const header = menuData.header || '';
    const footer = menuData.footer || '';
    await callSender(supabase, 'list', conexao, session.phone_number, session.chatId, {
      data: {
        header: header ? replaceVariables(header, session.variables, session, contactName) : undefined,
        body: replaceVariables(body, session.variables, session, contactName),
        footer: footer ? replaceVariables(footer, session.variables, session, contactName) : undefined,
        buttonText: replaceVariables(menuData.buttonText || 'Ver opções', session.variables, session, contactName),
        sections
      }
    });
  } else {
    const options = block.data?.arrayOption || block.data?.options || [];
    const message = replaceVariables(block.data?.message || 'Escolha uma opção:', session.variables, session, contactName);
    let menuText = message + '\n\n';
    options.forEach((opt: any) => { menuText += `${opt.number}. ${opt.value}\n`; });
    await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message: menuText });
  }
  return { action: 'wait_input', blockType: 'menu' };
}

async function handleMenuResponse(supabase: any, session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock, blockIndex: number, messageText: string, messageType: string, conexao: any, interactiveId?: string) {
  let selectedOptionId: string | null = null;
  const menuData = block.data?.menuData;
  if (menuData) {
    if (messageType === 'interactive' && interactiveId) { selectedOptionId = interactiveId; }
    else { for (const section of menuData.sections || []) { const row = section.rows?.find((r: any) => r.title?.toLowerCase() === messageText.toLowerCase() || r.id === messageText); if (row) { selectedOptionId = row.id; break; } } }
    if (selectedOptionId) {
      let edge = findEdge(flowData, group.id, `${block.id}-${selectedOptionId}`) || findEdge(flowData, group.id, selectedOptionId) || findEdge(flowData, block.id, selectedOptionId);
      if (edge) return { action: 'navigate', targetGroupId: edge.target };
      const defaultEdge = findEdge(flowData, group.id, 'output') || findEdge(flowData, group.id);
      if (defaultEdge) return { action: 'navigate', targetGroupId: defaultEdge.target };
      return { action: 'advance', blockIndex };
    }
  } else {
    const options = block.data?.arrayOption || block.data?.options || [];
    const selectedOption = options.find((opt: any) => opt.value?.toLowerCase() === messageText.toLowerCase() || String(opt.number) === messageText);
    if (selectedOption) { const edge = findEdge(flowData, group.id, `option-${selectedOption.number}`); if (edge) return { action: 'navigate', targetGroupId: edge.target }; }
  }
  const fallbackEdge = findEdge(flowData, group.id, `${block.id}-fallback`) || findEdge(flowData, group.id, 'fallback');
  if (fallbackEdge) return { action: 'navigate', targetGroupId: fallbackEdge.target };
  await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message: 'Opção inválida. Por favor, escolha uma das opções do menu.' });
  return { action: 'wait_input', blockType: 'menu' };
}

async function handleButtonsBlock(supabase: any, session: Session, _group: FlowGroup, block: FlowBlock, blockIndex: number, conexao: any) {
  const buttonsData = block.data?.buttonsData;
  if (!buttonsData?.buttons) return { action: 'advance', blockIndex };
  const contactName = await resolveContactName(supabase, session);
  await callSender(supabase, 'buttons', conexao, session.phone_number, session.chatId, {
    data: { body: replaceVariables(buttonsData.body || buttonsData.bodyText || 'Escolha:', session.variables, session, contactName), buttons: buttonsData.buttons.map((b: any) => ({ id: b.id, title: replaceVariables(b.title, session.variables, session, contactName) })) }
  });
  return { action: 'wait_input', blockType: 'buttons' };
}

async function handleButtonsResponse(supabase: any, session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock, blockIndex: number, messageText: string, messageType: string, conexao: any, interactiveId?: string) {
  let selectedButtonId: string | null = null;
  const buttonsData = block.data?.buttonsData;
  if (messageType === 'interactive' && interactiveId) { selectedButtonId = interactiveId; }
  else { const btn = buttonsData?.buttons?.find((b: any) => b.title.toLowerCase().trim() === messageText.toLowerCase().trim()); selectedButtonId = btn?.id || null; }
  if (selectedButtonId) { const edge = findEdge(flowData, group.id, `${block.id}-${selectedButtonId}`) || findEdge(flowData, block.id, selectedButtonId); if (edge) return { action: 'navigate', targetGroupId: edge.target }; }
  const fallbackEdge = findEdge(flowData, group.id, `${block.id}-fallback`) || findEdge(flowData, block.id, 'fallback');
  if (fallbackEdge) return { action: 'navigate', targetGroupId: fallbackEdge.target };
  await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message: 'Opção inválida. Por favor, clique em um dos botões.' });
  return { action: 'wait_input', blockType: 'buttons' };
}

async function handleQuestionBlock(supabase: any, session: Session, block: FlowBlock, _blockIndex: number, conexao: any) {
  const rawMessage = block.data?.typebotIntegration?.message || block.data?.question || block.data?.text || block.data?.message || block.data?.description || 'Por favor, responda:';
  const message = await replaceVariablesWithContactFallback(supabase, rawMessage, session.variables, session);
  if (message && message.trim() !== '') { await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message }); }
  return { action: 'wait_input', blockType: 'question' };
}

function validateAnswerType(value: string, type: string): boolean {
  switch (type) {
    case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'phone': return /^[\d\s\-\+\(\)]{8,}$/.test(value);
    case 'number': return !isNaN(Number(value));
    case 'url': return /^https?:\/\/.+/.test(value);
    default: return true;
  }
}

async function handleQuestionResponse(supabase: any, session: Session, block: FlowBlock, blockIndex: number, messageText: string, conexao: any) {
  const variableKey = block.data?.typebotIntegration?.answerKey || block.data?.variable || block.data?.answerKey || `question_${block.id}`;
  const answerType = block.data?.typebotIntegration?.answerType || block.data?.answerType || 'text';
  if (!validateAnswerType(messageText, answerType)) {
    const errorMessages: Record<string, string> = { email: 'Por favor, informe um email válido.', phone: 'Por favor, informe um telefone válido.', number: 'Por favor, informe um número válido.', url: 'Por favor, informe uma URL válida.' };
    await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message: errorMessages[answerType] || 'Resposta inválida. Tente novamente.' });
    return { action: 'wait_input', blockType: 'question' };
  }
  const variables = { ...session.variables, [variableKey]: messageText };
  await supabase.from('flow_sessions').update({ variables }).eq('id', session.id);
  session.variables = variables;
  return { action: 'advance', blockIndex, updatedVariables: variables };
}

// ============================================
// 🔄 BLOCK PROCESSOR DISPATCHER (NOW INLINE)
// ============================================
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

  // Refresh variables from DB
  const { data: freshSession } = await supabase.from('flow_sessions').select('variables').eq('id', session.id).maybeSingle();
  if (freshSession?.variables) session.variables = freshSession.variables;

  // Log execution
  await supabase.from('flow_execution_logs').insert({ session_id: session.id, node_id: block.id, node_type: blockType, node_data: block.data, result: 'processing' });

  // Update session state
  await supabase.from('flow_sessions').update({ current_group_id: groupId, current_block_index: blockIndex, current_node_id: groupId, updated_at: new Date().toISOString() }).eq('id', session.id);

  // ============================================
  // INTERACTIVE BLOCKS (inline)
  // ============================================
  if (['menu', 'buttons', 'question'].includes(blockType)) {
    let result;
    switch (blockType) {
      case 'menu': result = await handleMenuBlock(supabase, session, flowData, group, block, blockIndex, conexao); break;
      case 'buttons': result = await handleButtonsBlock(supabase, session, group, block, blockIndex, conexao); break;
      case 'question': result = await handleQuestionBlock(supabase, session, block, blockIndex, conexao); break;
      default: result = { action: 'advance', blockIndex };
    }
    if (result?.action === 'wait_input') {
      await supabase.from('flow_sessions').update({ status: 'waiting_input', waiting_block_type: blockType, updated_at: new Date().toISOString() }).eq('id', session.id);
      return { action: 'wait_input', blockType };
    }
    if (result?.updatedVariables) session.variables = result.updatedVariables;
    return result;
  }

  // ============================================
  // SIMPLE/LOGIC BLOCKS (inline)
  // ============================================
  const simpleBlocks = ['start', 'text', 'interval', 'setvariable', 'condition', 'randomizer', 'tags', 'ticket', 'jump', 'loop', 'end', 'flow_end', 'javascript'];
  if (simpleBlocks.includes(blockType)) {
    let result;
    switch (blockType) {
      case 'start': result = { action: 'advance', blockIndex }; break;
      case 'text': result = await handleTextBlock(supabase, session, block, blockIndex, conexao); break;
      case 'interval': result = await handleIntervalBlock(block, blockIndex); break;
      case 'setvariable': result = await handleSetVariableBlock(supabase, session, block, blockIndex); break;
      case 'condition': result = await handleConditionBlock(session, flowData, group, block); break;
      case 'randomizer': result = await handleRandomizerBlock(flowData, group, block); break;
      case 'tags': result = await handleTagsBlock(supabase, session, block, blockIndex); break;
      case 'ticket': result = await handleTicketBlock(supabase, session, block, conexao); break;
      case 'jump': result = await handleJumpBlock(flowData, block, blockIndex); break;
      case 'loop': result = await handleLoopBlock(supabase, session, flowData, group, block, blockIndex, conexao); break;
      case 'end': case 'flow_end': result = { action: 'complete', reason: 'end_block' }; break;
      case 'javascript': result = { action: 'advance', blockIndex }; break;
      default: result = { action: 'advance', blockIndex };
    }
    if (result?.updatedVariables) session.variables = result.updatedVariables;
    return result;
  }

  // ============================================
  // EXTERNAL BLOCKS (still via invoke - less common)
  // ============================================
  const { data, error } = await supabase.functions.invoke('flow-processor-external', {
    body: { blockType, session, flowData, group, block, blockIndex, conexao }
  });
  if (error) {
    console.error(`[Main] External processor error for ${blockType}:`, error);
    return { action: 'advance', blockIndex };
  }
  if (data?.updatedVariables) {
    session.variables = data.updatedVariables;
  } else {
    const { data: fs2 } = await supabase.from('flow_sessions').select('variables').eq('id', session.id).maybeSingle();
    if (fs2?.variables) session.variables = fs2.variables;
  }
  return data || { action: 'advance', blockIndex };
}

// ============================================
// 🔄 FLOW EXECUTION LOOP
// ============================================
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
      await supabase.from('flow_sessions').update({ current_group_id: currentGroupId, current_block_index: currentBlockIndex, status: 'running', updated_at: new Date().toISOString() }).eq('id', session.id);
      return { success: true, partial: true, message: 'Timeout interno - estado salvo', elapsed, iterations };
    }

    const result = await processBlock(supabase, session, flowData, currentGroupId, currentBlockIndex, conexao);

    switch (result?.action) {
      case 'advance': currentBlockIndex = (result.blockIndex ?? currentBlockIndex) + 1; break;
      case 'navigate': currentGroupId = result.targetGroupId; currentBlockIndex = 0; break;
      case 'wait_input': return { success: true, waitingInput: true, blockType: result.blockType };
      case 'complete': await completeFlowSession(supabase, session, conexao, result.reason || 'flow_completed'); return { success: true, completed: true };
      case 'error': console.error('[Main] Block error:', result.error); return { success: false, error: result.error };
      case 'error_edge':
        const errorEdge = findEdge(flowData, result.blockId, result.handleId);
        if (errorEdge) { currentGroupId = errorEdge.target; currentBlockIndex = 0; }
        else if (result.continueOnError) { currentBlockIndex = (result.blockIndex ?? currentBlockIndex) + 1; }
        else { await completeFlowSession(supabase, session, conexao, 'http_request_error'); return { success: true, completed: true }; }
        break;
      case 'success_edge':
        const successEdge = findEdge(flowData, currentGroupId, result.handleId);
        if (successEdge) { currentGroupId = successEdge.target; currentBlockIndex = 0; }
        else {
          const fallbackGroupId = findNextGroupId(flowData, currentGroupId);
          if (fallbackGroupId) { currentGroupId = fallbackGroupId; currentBlockIndex = 0; }
          else { currentBlockIndex = (result.blockIndex ?? currentBlockIndex) + 1; }
        }
        break;
      default: currentBlockIndex++;
    }
    session.current_group_id = currentGroupId;
    session.current_block_index = currentBlockIndex;
  }
  return { success: false, error: 'Max iterations reached' };
}

// ============================================
// ✅ COMPLETE FLOW SESSION
// ============================================
async function completeFlowSession(supabase: any, session: Session, conexao: any, reason: string) {
  const chatId = session.chatId || session.chat_id;
  if (reason === 'ticket_created') {
    await supabase.from('flow_sessions').update({ status: 'human', updated_at: new Date().toISOString() }).eq('id', session.id);
    await supabase.from('flow_execution_logs').insert({ session_id: session.id, node_id: 'flow_end', node_type: 'ticket_transfer', action: 'transferred_to_human', log_data: { reason }, result: 'human' });
    return;
  }
  await supabase.from('flow_sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', session.id);
  if (chatId) {
    await supabase.from('chats_whatsapp').update({ ativo: false, encerradoem: new Date().toISOString(), resolvido: true, mododeatendimento: 'bot' }).eq('id', chatId);
  }
  await supabase.from('flow_execution_logs').insert({ session_id: session.id, node_id: 'flow_end', node_type: 'flow_end', action: 'flow_completed', log_data: { reason }, result: 'completed' });
  if (conexao.farewellmessage?.trim()) {
    await callSender(supabase, 'text', conexao, session.phone_number, chatId, { message: conexao.farewellmessage });
  }
}

// ============================================
// 🔄 MAIN HANDLER
// ============================================
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const body = await req.json();
    const { phoneNumber, messageText, messageType, conexaoId, contactName, chatId, interactiveId } = body;

    if (!phoneNumber || !conexaoId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const processingId = createProcessingId();
    if (!isValidPhoneNumber(phoneNumber)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (chatId) {
      const ownershipValidation = await validateChatOwnership(supabase, chatId, phoneNumber, conexaoId);
      if (!ownershipValidation.valid) {
        return new Response(JSON.stringify({ error: 'Chat ownership validation failed', details: ownershipValidation.error }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Check human mode
    if (chatId) {
      const { data: chatData } = await supabase.from('chats_whatsapp').select('mododeatendimento').eq('id', chatId).maybeSingle();
      if (chatData?.mododeatendimento?.toLowerCase().includes('humano')) {
        return new Response(JSON.stringify({ success: true, atendimentoHumano: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Check chatbot disabled
    const { data: contato } = await supabase.from('contatos_whatsapp').select('chatbot_desabilitado').eq('telefone', phoneNumber).maybeSingle();
    if (contato?.chatbot_desabilitado) {
      return new Response(JSON.stringify({ success: true, chatbotDisabled: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get conexao
    const { data: conexao, error: conexaoError } = await supabase.from('conexoes').select('*').eq('id', conexaoId).maybeSingle();
    if (conexaoError || !conexao) {
      return new Response(JSON.stringify({ error: 'Conexão não encontrada' }), { status: conexaoError ? 500 : 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check campanha_flow_id
    let campanhaFlowId: string | null = null;
    let origemCampanhaId: string | null = null;
    if (chatId) {
      const { data: chatData } = await supabase.from('chats_whatsapp').select('campanha_flow_id, origem_campanha_id').eq('id', chatId).maybeSingle();
      if (chatData?.campanha_flow_id) { campanhaFlowId = chatData.campanha_flow_id; origemCampanhaId = chatData.origem_campanha_id; }
    }

    // Check existing session
    let session: Session | null = null;
    let existingSession = null;
    const { data: foundSession } = await supabase.from('flow_sessions').select('*').eq('phone_number', phoneNumber).eq('conexao_id', conexaoId).in('status', ['running', 'waiting_input']).maybeSingle();
    existingSession = foundSession;

    // Validate existing session
    if (existingSession) {
      let shouldInvalidate = false;
      let invalidateReason = '';

      if (campanhaFlowId && existingSession.flow_id !== campanhaFlowId) { shouldInvalidate = true; invalidateReason = `campanha_flow_id diferente`; }
      if (!shouldInvalidate && chatId && existingSession.chat_id && existingSession.chat_id !== chatId) { shouldInvalidate = true; invalidateReason = `chatId diferente`; }
      if (!shouldInvalidate && chatId && !existingSession.chat_id) { shouldInvalidate = true; invalidateReason = `sessão sem chat_id`; }
      if (!shouldInvalidate && existingSession.chat_id) {
        const { data: sessionChat } = await supabase.from('chats_whatsapp').select('id, resolvido, ativo').eq('id', existingSession.chat_id).maybeSingle();
        if (!sessionChat || sessionChat.resolvido === true || sessionChat.ativo === false) { shouldInvalidate = true; invalidateReason = 'chat encerrado'; }
      }
      if (!shouldInvalidate && !existingSession.chat_id && !chatId) {
        const { data: ct } = await supabase.from('contatos_whatsapp').select('id').eq('telefone', phoneNumber).maybeSingle();
        if (ct) {
          const { data: activeChat } = await supabase.from('chats_whatsapp').select('id').eq('usuarioid', ct.id).eq('ativo', true).eq('resolvido', false).maybeSingle();
          if (activeChat && activeChat.id !== existingSession.chat_id) { shouldInvalidate = true; invalidateReason = `novo chat ativo`; }
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
        return new Response(JSON.stringify({ success: true, locked: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Determine flow to use
    let flowIdToUse: string | null = null;
    if (campanhaFlowId) flowIdToUse = campanhaFlowId;
    else if (session?.flow_id) flowIdToUse = session.flow_id;
    else flowIdToUse = conexao.fluxo_boas_vindas_id || conexao.fluxo_resposta_padrao_id;

    if (!flowIdToUse) {
      if (session) await releaseSessionLock(supabase, session.id);
      return new Response(JSON.stringify({ success: true, message: 'Sem fluxo configurado' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: flow, error: flowError } = await supabase.from('flow_builders').select('*').eq('id', flowIdToUse).maybeSingle();
    if (flowError || !flow) {
      if (session) await releaseSessionLock(supabase, session.id);
      return new Response(JSON.stringify({ error: flowError ? 'Erro ao buscar flow' : 'Flow não encontrado' }), { status: flowError ? 500 : 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const flowData = getFlowData(flow);

    // Handle existing session with waiting input
    if (session && session.status === 'waiting_input') {
      const groupId = session.current_group_id || session.current_node_id;
      const bIndex = session.current_block_index || 0;
      const blockType = session.waiting_block_type;
      const group = getGroupById(flowData, groupId!);
      if (group) {
        const sortedBlocks = [...group.blocks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const block = sortedBlocks[bIndex];

        // Handle response INLINE
        let responseResult;
        switch (blockType) {
          case 'menu': responseResult = await handleMenuResponse(supabase, session, flowData, group, block, bIndex, messageText, messageType, conexao, interactiveId); break;
          case 'buttons': responseResult = await handleButtonsResponse(supabase, session, flowData, group, block, bIndex, messageText, messageType, conexao, interactiveId); break;
          case 'question': responseResult = await handleQuestionResponse(supabase, session, block, bIndex, messageText, conexao); break;
          default: responseResult = { action: 'advance', blockIndex: bIndex };
        }

        if (responseResult?.action === 'wait_input') {
          await releaseSessionLock(supabase, session.id);
          return new Response(JSON.stringify({ success: true, waitingInput: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (responseResult?.updatedVariables) session.variables = responseResult.updatedVariables;

        let nextGroupId = groupId!;
        let nextBlockIndex = bIndex + 1;
        if (responseResult?.action === 'navigate') { nextGroupId = responseResult.targetGroupId; nextBlockIndex = 0; }

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
        return new Response(JSON.stringify({ error: 'Flow sem grupo inicial' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: newSession, error: sessionError } = await supabase.from('flow_sessions').insert({
        phone_number: phoneNumber, contact_name: contactName, conexao_id: conexaoId, flow_id: flow.id,
        chat_id: chatId, current_group_id: firstGroupId, current_node_id: firstGroupId, current_block_index: 0, status: 'running', variables: {}
      }).select().single();

      if (sessionError || !newSession) {
        return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      session = newSession;
      session.chatId = chatId;

      await supabase.from('flow_execution_logs').insert({
        session_id: session.id, node_id: firstGroupId, node_type: 'session_start', action: 'session_start',
        log_data: { phoneNumber, contactName, flowId: flow.id, flowName: flow.name, campanhaFlowId, origemCampanhaId }, result: 'started'
      });

      if (!await acquireSessionLock(supabase, session.id, processingId)) {
        return new Response(JSON.stringify({ error: 'Failed to acquire lock' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
