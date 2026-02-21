// Flow Processor Interactive - Handles menu, buttons, question blocks
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlowBlock { id: string; type: string; order: number; data: any; }
interface FlowGroup { id: string; title: string; blocks: FlowBlock[]; }
interface FlowData { groups?: FlowGroup[]; nodes?: any[]; edges: any[]; }
interface Session {
  id: string; phone_number: string; contact_name: string; variables: Record<string, any>; chatId?: number;
}

function normalizeUtf8(text: string): string {
  if (!text || typeof text !== 'string') return text;
  try { return text.normalize('NFC'); } catch { return text; }
}

function replaceVariables(text: string, variables: Record<string, any>, session?: Session, contactName?: string): string {
  if (!text) return '';
  let result = normalizeUtf8(text);
  
  const resolvedName = contactName || session?.contact_name || '';
  
  // Combine all variables: user variables + session data + predefined system variables
  const allVariables: Record<string, any> = {
    ...variables,
    // Session-based variables
    telefone: session?.phone_number || '',
    phone: session?.phone_number || '',
    nome: resolvedName,
    name: resolvedName,
    // Date/time variables
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
      console.log(`[Interactive] 📇 Nome encontrado via fallback contatos_whatsapp: ${contato.nome}`);
      
      // Atualizar a sessão para evitar nova busca nas próximas mensagens
      session.contact_name = contato.nome;
      await supabase.from('flow_sessions').update({
        contact_name: contato.nome,
        updated_at: new Date().toISOString()
      }).eq('id', session.id);
      
      return contato.nome;
    }
  } catch (error) {
    console.error('[Interactive] ⚠️ Erro ao buscar nome do contato:', error);
  }
  
  return '';
}

// Versão assíncrona que resolve o nome antes de substituir - usar apenas onde mensagens são enviadas
async function replaceVariablesWithContactFallback(supabase: any, text: string, variables: Record<string, any>, session: Session): Promise<string> {
  const contactName = await resolveContactName(supabase, session);
  return replaceVariables(text, variables, session, contactName);
}

function findEdge(flowData: FlowData, sourceId: string, sourceHandle?: string): any | null {
  return flowData.edges.find((e: any) => e.source === sourceId && (!sourceHandle || e.sourceHandle === sourceHandle)) || null;
}

async function callSender(supabase: any, action: string, conexao: any, phoneNumber: string, chatId: number | undefined, params: any) {
  
  // Validar conexão antes de chamar
  if (!conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) {
    console.error('[Interactive] ❌ Missing credentials in conexao:', {
      hasToken: !!conexao?.whatsapp_token,
      hasPhoneId: !!conexao?.whatsapp_phone_id,
      conexaoId: conexao?.id
    });
    return { success: false, error: 'Missing WhatsApp credentials' };
  }
  
  const { data, error } = await supabase.functions.invoke('flow-whatsapp-sender', {
    body: { action, conexao, phoneNumber, chatId, ...params }
  });
  
  if (error) {
    console.error('[Interactive] ❌ Sender invocation error:', error);
    return { success: false, error: String(error) };
  }
  
  if (data && !data.success) {
    console.error('[Interactive] ❌ Sender returned error:', data.error);
  } else {
    console.log('[Interactive] ✅ Sender success:', data?.messageId);
  }
  
  return data;
}

// ============================================
// 🔥 MENU BLOCK
// ============================================
async function handleMenuBlock(supabase: any, session: Session, flowData: FlowData, group: FlowGroup, block: FlowBlock, blockIndex: number, conexao: any) {
  const menuData = block.data?.menuData;
  
  // Resolver o nome do contato uma vez para usar em todas as substituições
  const contactName = await resolveContactName(supabase, session);
  
  if (menuData) {
    const sections = menuData.sections?.map((section: any) => ({
      title: replaceVariables(section.title || 'Opções', session.variables, session, contactName),
      rows: section.rows?.map((row: any) => ({
        id: row.id,
        title: replaceVariables(row.title, session.variables, session, contactName).substring(0, 24),
        description: row.description ? replaceVariables(row.description, session.variables, session, contactName).substring(0, 72) : undefined
      })) || []
    })) || [];
    
    // Usar os campos corretos: body (não bodyText), header e footer
    const body = menuData.body || menuData.bodyText || block.data?.message || 'Escolha uma opção:';
    const header = menuData.header || '';
    const footer = menuData.footer || '';
    
    console.log(`[Interactive] 📋 Menu: header="${header}", body="${body.substring(0, 50)}..."`);
    
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
    // Legacy format
    const options = block.data?.arrayOption || block.data?.options || [];
    const message = replaceVariables(block.data?.message || 'Escolha uma opção:', session.variables, session, contactName);
    let menuText = message + '\n\n';
    options.forEach((opt: any) => { menuText += `${opt.number}. ${opt.value}\n`; });
    await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message: menuText });
  }
  
  return { action: 'wait_input', blockType: 'menu' };
}

async function handleMenuResponse(
  supabase: any, session: Session, flowData: FlowData, group: FlowGroup,
  block: FlowBlock, blockIndex: number, messageText: string, messageType: string,
  conexao: any, interactiveId?: string
) {
  let selectedOptionId: string | null = null;
  const menuData = block.data?.menuData;
  
  if (menuData) {
    if (messageType === 'interactive' && interactiveId) {
      selectedOptionId = interactiveId;
    } else {
      for (const section of menuData.sections || []) {
        const row = section.rows?.find((r: any) => 
          r.title?.toLowerCase() === messageText.toLowerCase() || r.id === messageText
        );
        if (row) { selectedOptionId = row.id; break; }
      }
    }
    
    if (selectedOptionId) {
      let edge = findEdge(flowData, group.id, `${block.id}-${selectedOptionId}`) ||
                 findEdge(flowData, group.id, selectedOptionId) || findEdge(flowData, block.id, selectedOptionId);
      
      if (edge) return { action: 'navigate', targetGroupId: edge.target };
      
      const defaultEdge = findEdge(flowData, group.id, 'output') || findEdge(flowData, group.id);
      if (defaultEdge) return { action: 'navigate', targetGroupId: defaultEdge.target };
      return { action: 'advance', blockIndex };
    }
  } else {
    const options = block.data?.arrayOption || block.data?.options || [];
    const selectedOption = options.find((opt: any) => 
      opt.value?.toLowerCase() === messageText.toLowerCase() || String(opt.number) === messageText
    );
    
    if (selectedOption) {
      const edge = findEdge(flowData, group.id, `option-${selectedOption.number}`);
      if (edge) return { action: 'navigate', targetGroupId: edge.target };
    }
  }
  
  // Fallback
  const fallbackEdge = findEdge(flowData, group.id, `${block.id}-fallback`) || findEdge(flowData, group.id, 'fallback');
  if (fallbackEdge) return { action: 'navigate', targetGroupId: fallbackEdge.target };
  
  await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, {
    message: 'Opção inválida. Por favor, escolha uma das opções do menu.'
  });
  return { action: 'wait_input', blockType: 'menu' };
}

// ============================================
// 🔥 BUTTONS BLOCK
// ============================================
async function handleButtonsBlock(supabase: any, session: Session, group: FlowGroup, block: FlowBlock, blockIndex: number, conexao: any) {
  const buttonsData = block.data?.buttonsData;
  if (!buttonsData?.buttons) return { action: 'advance', blockIndex };
  
  // Resolver o nome do contato uma vez para usar em todas as substituições
  const contactName = await resolveContactName(supabase, session);
  
  await callSender(supabase, 'buttons', conexao, session.phone_number, session.chatId, {
    data: {
      body: replaceVariables(buttonsData.body || buttonsData.bodyText || 'Escolha:', session.variables, session, contactName),
      buttons: buttonsData.buttons.map((b: any) => ({
        id: b.id,
        title: replaceVariables(b.title, session.variables, session, contactName)
      }))
    }
  });
  
  return { action: 'wait_input', blockType: 'buttons' };
}

async function handleButtonsResponse(
  supabase: any, session: Session, flowData: FlowData, group: FlowGroup,
  block: FlowBlock, blockIndex: number, messageText: string, messageType: string,
  conexao: any, interactiveId?: string
) {
  let selectedButtonId: string | null = null;
  const buttonsData = block.data?.buttonsData;
  
  if (messageType === 'interactive' && interactiveId) {
    selectedButtonId = interactiveId;
  } else {
    const btn = buttonsData?.buttons?.find((b: any) => b.title.toLowerCase().trim() === messageText.toLowerCase().trim());
    selectedButtonId = btn?.id || null;
  }
  
  if (selectedButtonId) {
    const edge = findEdge(flowData, group.id, `${block.id}-${selectedButtonId}`) || findEdge(flowData, block.id, selectedButtonId);
    if (edge) return { action: 'navigate', targetGroupId: edge.target };
  }
  
  const fallbackEdge = findEdge(flowData, group.id, `${block.id}-fallback`) || findEdge(flowData, block.id, 'fallback');
  if (fallbackEdge) return { action: 'navigate', targetGroupId: fallbackEdge.target };
  
  await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, {
    message: 'Opção inválida. Por favor, clique em um dos botões.'
  });
  return { action: 'wait_input', blockType: 'buttons' };
}

// ============================================
// 🔥 QUESTION BLOCK
// ============================================
async function handleQuestionBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number, conexao: any) {
  // Usar a mesma lógica do arquivo antigo que funciona (process-whatsapp-flow)
  const rawMessage = block.data?.typebotIntegration?.message || 
    block.data?.question || 
    block.data?.text || 
    block.data?.message ||
    block.data?.description ||
    'Por favor, responda:';
  
  // Usar versão com fallback para buscar nome do contato se necessário
  const message = await replaceVariablesWithContactFallback(supabase, rawMessage, session.variables, session);
  
  console.log(`[Interactive] 📝 Question block data:`, JSON.stringify(block.data).substring(0, 300));
  console.log(`[Interactive] 📝 Question message: "${message.substring(0, 100)}..."`);
  
  if (message && message.trim() !== '') {
    const result = await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message });
    
    // Verificar se o envio foi bem sucedido
    if (!result?.success) {
      console.error('[Interactive] ❌ Failed to send question message:', result?.error);
    } else {
      console.log('[Interactive] ✅ Question message sent:', result?.messageId);
    }
  } else {
    console.warn('[Interactive] ⚠️ Question block has no message to send');
  }
  
  return { action: 'wait_input', blockType: 'question' };
}

async function handleQuestionResponse(supabase: any, session: Session, block: FlowBlock, blockIndex: number, messageText: string, conexao: any) {
  const variableKey = block.data?.typebotIntegration?.answerKey || block.data?.variable || block.data?.answerKey || `question_${block.id}`;
  const answerType = block.data?.typebotIntegration?.answerType || block.data?.answerType || 'text';
  
  if (!validateAnswerType(messageText, answerType)) {
    const errorMessages: Record<string, string> = {
      email: 'Por favor, informe um email válido.',
      phone: 'Por favor, informe um telefone válido.',
      number: 'Por favor, informe um número válido.',
      url: 'Por favor, informe uma URL válida.',
    };
    await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, {
      message: errorMessages[answerType] || 'Resposta inválida. Tente novamente.'
    });
    return { action: 'wait_input', blockType: 'question' };
  }
  
  const variables = { ...session.variables, [variableKey]: messageText };
  await supabase.from('flow_sessions').update({ variables }).eq('id', session.id);
  
  return { action: 'advance', blockIndex };
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

// ============================================
// 🔥 MAIN HANDLER
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

    const { action, blockType, session, flowData, group, block, blockIndex, conexao, messageText, messageType, interactiveId } = await req.json();
    
    console.log(`[Interactive] Action: ${action}, BlockType: ${blockType}`);
    
    let result;
    
    if (action === 'send') {
      switch (blockType) {
        case 'menu':
          result = await handleMenuBlock(supabase, session, flowData, group, block, blockIndex, conexao);
          break;
        case 'buttons':
          result = await handleButtonsBlock(supabase, session, group, block, blockIndex, conexao);
          break;
        case 'question':
          result = await handleQuestionBlock(supabase, session, block, blockIndex, conexao);
          break;
        default:
          result = { action: 'advance', blockIndex };
      }
    } else if (action === 'response') {
      switch (blockType) {
        case 'menu':
          result = await handleMenuResponse(supabase, session, flowData, group, block, blockIndex, messageText, messageType, conexao, interactiveId);
          break;
        case 'buttons':
          result = await handleButtonsResponse(supabase, session, flowData, group, block, blockIndex, messageText, messageType, conexao, interactiveId);
          break;
        case 'question':
          result = await handleQuestionResponse(supabase, session, block, blockIndex, messageText, conexao);
          break;
        default:
          result = { action: 'advance', blockIndex };
      }
    } else {
      result = { action: 'error', error: 'Unknown action' };
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Interactive] Error:', error);
    return new Response(JSON.stringify({ action: 'error', error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
