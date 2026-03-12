// Flow Processor Blocks - Handles simple/logic blocks
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================
// ÃÂ­ÃÂ ÃÂ½ÃÂ­ÃÂ´ÃÂ§ TYPES
// ============================================
interface FlowBlock { id: string; type: string; order: number; data: any; }
interface FlowGroup { id: string; title: string; blocks: FlowBlock[]; }
interface FlowData { groups?: FlowGroup[]; nodes?: any[]; edges: any[]; }
interface Session {
  id: string; phone_number: string; contact_name: string; conexao_id: string;
  flow_id: string; current_group_id?: string; current_block_index?: number;
  status: string; variables: Record<string, any>; chatId?: number;
}

// ============================================
// ÃÂ­ÃÂ ÃÂ½ÃÂ­ÃÂ´ÃÂ§ HELPERS
// ============================================
function normalizeUtf8(text: string): string {
  if (!text || typeof text !== 'string') return text;
  try { return text.normalize('NFC'); } catch { return text; }
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

// Busca o nome do contato com fallback para contatos_whatsapp
async function resolveContactName(supabase: any, session: Session): Promise<string> {
  // 1. Se já tem contact_name na sessão, usar
  if (session.contact_name && session.contact_name.trim() !== '') {
    return session.contact_name;
  }
  
  // 2. Buscar na tabela de contatos pelo telefone
  try {
    const phoneDigits = (session.phone_number || '').replace(/\D/g, '');
    if (!phoneDigits) return '';
    
    // Tentar busca exata primeiro
    let { data: contato } = await supabase
      .from('contatos_whatsapp')
      .select('nome')
      .eq('telefone', phoneDigits)
      .maybeSingle();
    
    // Se não encontrou, tentar pelos últimos 8 dígitos (para lidar com variações de DDI)
    if (!contato && phoneDigits.length >= 8) {
      const last8 = phoneDigits.slice(-8);
      const { data: contatoFallback } = await supabase
        .from('contatos_whatsapp')
        .select('nome, telefone')
        .like('telefone', `%${last8}`)
        .limit(1)
        .maybeSingle();
      
      contato = contatoFallback;
    }
    
    if (contato?.nome) {
      console.log(`[Blocks] 📇 Nome encontrado via fallback contatos_whatsapp: ${contato.nome}`);
      
      // Atualizar a sessão para evitar nova busca nas próximas mensagens
      session.contact_name = contato.nome;
      await supabase.from('flow_sessions').update({
        contact_name: contato.nome,
        updated_at: new Date().toISOString()
      }).eq('id', session.id);
      
      return contato.nome;
    }
  } catch (error) {
    console.error('[Blocks] ⚠️ Erro ao buscar nome do contato:', error);
  }
  
  return '';
}

// Versão assíncrona que resolve o nome antes de substituir - usar apenas onde mensagens são enviadas
async function replaceVariablesWithContactFallback(supabase: any, text: string, variables: Record<string, any>, session: Session): Promise<string> {
  const contactName = await resolveContactName(supabase, session);
  return replaceVariables(text, variables, session, contactName);
}

function findEdge(flowData: FlowData, sourceId: string, sourceHandle?: string): any | null {
  return flowData.edges.find((e: any) => {
    if (e.source !== sourceId) return false;
    if (sourceHandle) return e.sourceHandle === sourceHandle;
    return true;
  }) || null;
}

function getGroupById(flowData: FlowData, groupId: string): FlowGroup | null {
  return flowData.groups?.find(g => g.id === groupId) || null;
}

function findNextGroupId(flowData: FlowData, sourceGroupId: string): string | null {
  const edge = flowData.edges.find((e: any) => e.source === sourceGroupId && (!e.sourceHandle || e.sourceHandle === 'output'));
  return edge?.target || null;
}

async function callSender(supabase: any, action: string, conexao: any, phoneNumber: string, chatId: number | undefined, params: any) {
  const { data, error } = await supabase.functions.invoke('flow-whatsapp-sender', {
    body: { action, conexao, phoneNumber, chatId, ...params }
  });
  if (error) console.error('[Blocks] Sender error:', error);
  return data;
}

// ============================================
// ÃÂ­ÃÂ ÃÂ½ÃÂ­ÃÂ´ÃÂ¥ BLOCK HANDLERS
// ============================================
async function handleTextBlock(supabase: any, session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock, blockIndex: number, conexao: any) {
  const rawMessage = block.data?.description || block.data?.text || block.data?.message || '';
  // Usar versão com fallback para buscar nome do contato se necessário
  const message = await replaceVariablesWithContactFallback(supabase, rawMessage, session.variables, session);
  
  if (message && message.trim() !== '') {
    await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message });
  }
  
  return { action: 'advance', blockIndex };
}

async function handleIntervalBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number) {
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

async function handleConditionBlock(supabase: any, session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock) {
  let matchedRuleIndex = -1;

  // ========================================
  // FORMATO 1: conditions.rules (com comparisons) - NOVO FORMATO
  // ========================================
  if (block.data?.conditions?.rules && Array.isArray(block.data.conditions.rules)) {
    const rules = block.data.conditions.rules;
    
    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
      const rule = rules[ruleIndex];
      const comparisons = rule.comparisons || [];
      
      if (comparisons.length === 0) continue;
      
      const allComparisonsPass = comparisons.every((comp: any) => {
        const varValue = session.variables[comp.variable] ?? 
                         replaceVariables(`{{${comp.variable}}}`, session.variables, session);
        const compareValue = replaceVariables(String(comp.value ?? ''), session.variables, session);
        const result = evaluateComparison(varValue, comp.operator, compareValue);
        return result;
      });
      
      if (allComparisonsPass) {
        matchedRuleIndex = ruleIndex;
        break;
      }
    }
  }
  // ========================================
  // FORMATO 2: conditions.comparisons (direto)
  // ========================================
  else if (block.data?.conditions?.comparisons && Array.isArray(block.data.conditions.comparisons)) {
    const comparisons = block.data.conditions.comparisons;
    const logicalOperator = block.data.conditions.logicalOperator || 'and';
    
    const results = comparisons.map((comp: any) => {
      const varValue = session.variables[comp.variable] ?? '';
      const compareValue = replaceVariables(String(comp.value ?? ''), session.variables, session);
      const result = evaluateComparison(varValue, comp.operator, compareValue);
      return result;
    });
    
    if (logicalOperator === 'or') {
      matchedRuleIndex = results.some((r: boolean) => r) ? 0 : -1;
    } else {
      matchedRuleIndex = results.every((r: boolean) => r) ? 0 : -1;
    }
  }
  // ========================================
  // FORMATO 3: conditionRules ou rules (legado)
  // ========================================
  else if (block.data?.conditionRules || block.data?.rules) {
    const rules = block.data.conditionRules || block.data.rules || [];
    
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const varName = rule.variable || rule.variableName;
      const varValue = session.variables[varName] ?? '';
      const compareValue = replaceVariables(String(rule.value ?? ''), session.variables, session);
      const operator = rule.operator || rule.condition || 'equals';
      
      const result = evaluateComparison(varValue, operator, compareValue);
      
      if (result) {
        matchedRuleIndex = i;
        break;
      }
    }
  }
  // ========================================
  // FORMATO 4: variable simples
  // ========================================
  else if (block.data?.variable) {
    const varValue = session.variables[block.data.variable] ?? '';
    const compareValue = replaceVariables(String(block.data.value ?? ''), session.variables, session);
    const operator = block.data.condition || block.data.operator || 'equals';
    const result = evaluateComparison(varValue, operator, compareValue);
    matchedRuleIndex = result ? 0 : -1;
  } else {
    console.log(`[Blocks] ÃÂ¢ÃÂÃÂ ÃÂ¯ÃÂ¸ÃÂ Unknown condition format, block.data keys:`, Object.keys(block.data || {}));
  }
  
  // ========================================
  // BUSCA DE EDGE - TODOS OS FORMATOS POSSÃÂÃÂVEIS
  // ========================================
  let edge = null;
  
  if (matchedRuleIndex >= 0) {
    // Tentar todos os formatos possÃÂÃÂ­veis de handle para regra matched
    const handleFormats = [
      `${block.id}-rule-${matchedRuleIndex}`,
      `rule-${matchedRuleIndex}`,
      `condition-${matchedRuleIndex}`,
      `${block.id}-condition-${matchedRuleIndex}`,
      'true',
      `${block.id}-true`,
      'yes',
      `${block.id}-yes`,
    ];
    
    for (const handle of handleFormats) {
      edge = findEdge(flowData, group.id, handle);
      if (edge) {
        break;
      }
    }
    
    // TambÃÂÃÂ©m tentar buscar do block.id como source
    if (!edge) {
      for (const handle of handleFormats) {
        edge = findEdge(flowData, block.id, handle);
        if (edge) {
          break;
        }
      }
    }
  }
  
  // Fallback para else/false se nÃÂÃÂ£o encontrou edge ou nÃÂÃÂ£o matched
  if (!edge) {
    const elseHandles = [
      'else',
      `${block.id}-else`,
      'false',
      `${block.id}-false`,
      'no',
      `${block.id}-no`,
      'default',
      `${block.id}-default`,
    ];
    
    for (const handle of elseHandles) {
      edge = findEdge(flowData, group.id, handle);
      if (edge) {
        break;
      }
    }
    
    if (!edge) {
      for (const handle of elseHandles) {
        edge = findEdge(flowData, block.id, handle);
        if (edge) {
          break;
        }
      }
    }
  }
  
  // ÃÂÃÂltimo fallback: edge sem handle especÃÂÃÂ­fico (output padrÃÂÃÂ£o do grupo)
  if (!edge) {
    edge = findEdge(flowData, group.id, undefined);
    if (edge) {
      console.log(`[Blocks] ÃÂ­ÃÂ ÃÂ½ÃÂ­ÃÂ´ÃÂ Found default edge without handle -> ${edge.target}`);
    }
  }
  
  if (edge) {
    return { action: 'navigate', targetGroupId: edge.target };
  }
  
  console.log(`[Blocks] ÃÂ¢ÃÂÃÂ ÃÂ¯ÃÂ¸ÃÂ No edge found for condition, matched rule: ${matchedRuleIndex}`);
  return { action: 'complete', reason: `condition_no_edge_rule_${matchedRuleIndex}` };
}

function evaluateComparison(varValue: any, operator: string, compareValue: any): boolean {
  const strVar = String(varValue ?? '').toLowerCase().trim();
  const strCompare = String(compareValue ?? '').toLowerCase().trim();
  
  switch (operator) {
    case 'equals': case '==': case 'equal': case 'eq': 
      return strVar === strCompare;
    case 'not_equals': case '!=': case 'notEqual': case 'neq': case 'not_equal':
      return strVar !== strCompare;
    case 'contains': case 'includes':
      return strVar.includes(strCompare);
    case 'not_contains': case 'notContains': case 'not_includes':
      return !strVar.includes(strCompare);
    case 'starts_with': case 'startsWith':
      return strVar.startsWith(strCompare);
    case 'ends_with': case 'endsWith':
      return strVar.endsWith(strCompare);
    case 'greater': case '>': case 'gt':
      return Number(varValue) > Number(compareValue);
    case 'greater_equal': case '>=': case 'gte':
      return Number(varValue) >= Number(compareValue);
    case 'less': case '<': case 'lt':
      return Number(varValue) < Number(compareValue);
    case 'less_equal': case '<=': case 'lte':
      return Number(varValue) <= Number(compareValue);
    case 'is_empty': case 'isEmpty': case 'empty':
      return !varValue || strVar === '';
    case 'is_not_empty': case 'isNotEmpty': case 'not_empty': case 'exists':
      return !!varValue && strVar !== '';
    case 'not_exists': case 'not_found':
      return !varValue || strVar === '';
    case 'matches': case 'regex':
      try { return new RegExp(compareValue, 'i').test(String(varValue)); } catch { return false; }
    default: 
      return strVar === strCompare;
  }
}

async function handleRandomizerBlock(supabase: any, session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock) {
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
  
  const edge = findEdge(flowData, group.id, `${block.id}-${selectedPath}`) ||
               findEdge(flowData, group.id, selectedPath);
  
  if (edge) return { action: 'navigate', targetGroupId: edge.target };
  return { action: 'complete', reason: 'randomizer_no_next' };
}

async function handleTagsBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number) {
  const selectedTags = block.data?.selectedTags || block.data?.tags || block.data?.tagIds || [];
  const tagIds = selectedTags.map((t: any) => typeof t === 'object' ? String(t.id) : String(t));
  
  console.log(`[Blocks] 🏷️ Tag IDs extraídos: ${JSON.stringify(tagIds)}`);
  
  if (tagIds.length > 0) {
    // 1. Buscar o contato primeiro pelo telefone
    const { data: contato } = await supabase.from('contatos_whatsapp')
      .select('id').eq('telefone', session.phone_number).maybeSingle();
    
    if (contato) {
      // 2. Buscar o chat pelo usuarioid (não por telefone!)
      const { data: chat } = await supabase.from('chats_whatsapp')
        .select('id, tags').eq('usuarioid', contato.id).eq('ativo', true).maybeSingle();
      
      if (chat) {
        let existingTags: string[] = [];
        try { 
          existingTags = chat.tags ? JSON.parse(chat.tags) : []; 
          if (!Array.isArray(existingTags)) existingTags = [];
        } catch { existingTags = []; }
        
        const mergedTags = [...new Set([...existingTags, ...tagIds])];
        
        await supabase.from('chats_whatsapp')
          .update({ tags: JSON.stringify(mergedTags), atualizadoem: new Date().toISOString() })
          .eq('id', chat.id);
        
        console.log(`[Blocks] ✅ Tags aplicadas ao chat ${chat.id}: ${JSON.stringify(mergedTags)}`);
      } else {
        console.warn(`[Blocks] ⚠️ Chat ativo não encontrado para contato: ${contato.id}`);
      }
    } else {
      console.warn(`[Blocks] ⚠️ Contato não encontrado para telefone: ${session.phone_number}`);
    }
  }
  
  return { action: 'advance', blockIndex };
}

async function handleTicketBlock(supabase: any, session: Session, block: FlowBlock, conexao: any) {
  const queueIds = block.data?.queueIds || [];
  const message = block.data?.message || block.data?.text;
  
  console.log(`[Blocks] 🎫 Queue IDs recebidos: ${JSON.stringify(queueIds)}`);
  
  if (message) {
    // Usar versão com fallback para buscar nome do contato se necessário
    const processedMessage = await replaceVariablesWithContactFallback(supabase, message, session.variables, session);
    await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, {
      message: processedMessage
    });
  }

  // 1. Buscar o contato primeiro pelo telefone
  const { data: contato } = await supabase.from('contatos_whatsapp')
    .select('id').eq('telefone', session.phone_number).maybeSingle();
  
  if (contato) {
    // 2. Buscar o chat pelo usuarioid
    const { data: chat } = await supabase.from('chats_whatsapp')
      .select('id, filas').eq('usuarioid', contato.id).eq('ativo', true).maybeSingle();
    
    if (chat) {
      const filasArray = queueIds.map((id: any) => String(id));
      
      await supabase.from('chats_whatsapp').update({
        mododeatendimento: 'Atendimento Humano',
        atualizadoem: new Date().toISOString(),
        filas: filasArray
      }).eq('id', chat.id);
      
      console.log(`[Blocks] ✅ Chat ${chat.id} transferido para Atendimento Humano com filas: ${JSON.stringify(filasArray)}`);
    } else {
      console.warn(`[Blocks] ⚠️ Chat ativo não encontrado para contato: ${contato.id}`);
    }
  } else {
    console.warn(`[Blocks] ⚠️ Contato não encontrado para telefone: ${session.phone_number}`);
  }

  await supabase.from('flow_sessions').update({ status: 'human' }).eq('id', session.id);
  return { action: 'complete', reason: 'ticket_created' };
}

async function handleJumpBlock(supabase: any, session: Session, flowData: FlowData, block: FlowBlock, blockIndex: number) {
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
          loop_index: i.toString(),
          loop_total: items.length.toString(),
        };
        if (indexVariable) updatedVariables[indexVariable] = i.toString();
        
        await supabase.from('flow_sessions').update({ variables: updatedVariables }).eq('id', session.id);
        session.variables = updatedVariables;
        
        // Execute blocks in loop body
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
      // Usar versão com fallback para buscar nome do contato se necessário
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
// ÃÂ­ÃÂ ÃÂ½ÃÂ­ÃÂ´ÃÂ¥ MAIN HANDLER
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

    const { blockType, session, flowData, group, block, blockIndex, conexao } = await req.json();
    
    let result;
    
    switch (blockType) {
      case 'start':
        result = { action: 'advance', blockIndex };
        break;
      case 'text':
        result = await handleTextBlock(supabase, session, flowData, group, block, blockIndex, conexao);
        break;
      case 'interval':
        result = await handleIntervalBlock(supabase, session, block, blockIndex);
        break;
      case 'setvariable':
        result = await handleSetVariableBlock(supabase, session, block, blockIndex);
        break;
      case 'condition':
        result = await handleConditionBlock(supabase, session, flowData, group, block);
        break;
      case 'randomizer':
        result = await handleRandomizerBlock(supabase, session, flowData, group, block);
        break;
      case 'tags':
        result = await handleTagsBlock(supabase, session, block, blockIndex);
        break;
      case 'ticket':
        result = await handleTicketBlock(supabase, session, block, conexao);
        break;
      case 'jump':
        result = await handleJumpBlock(supabase, session, flowData, block, blockIndex);
        break;
      case 'loop':
        result = await handleLoopBlock(supabase, session, flowData, group, block, blockIndex, conexao);
        break;
      case 'end':
      case 'flow_end':
        result = { action: 'complete', reason: 'end_block' };
        break;
      default:
        result = { action: 'advance', blockIndex };
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Blocks] Error:', error);
    return new Response(JSON.stringify({ action: 'error', error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
