// Flow Processor External - Handles HTTP requests, webhooks, OpenAI, media blocks
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlowBlock { id: string; type: string; order: number; data: any; }
interface FlowGroup { id: string; title: string; blocks: FlowBlock[]; }
interface FlowData { groups?: FlowGroup[]; edges: any[]; }
interface Session {
  id: string; phone_number: string; contact_name: string; variables: Record<string, any>; chatId?: number; flow_id: string;
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
      console.log(`[External] 📇 Nome encontrado via fallback contatos_whatsapp: ${contato.nome}`);
      
      // Atualizar a sessão para evitar nova busca nas próximas mensagens
      session.contact_name = contato.nome;
      await supabase.from('flow_sessions').update({
        contact_name: contato.nome,
        updated_at: new Date().toISOString()
      }).eq('id', session.id);
      
      return contato.nome;
    }
  } catch (error) {
    console.error('[External] ⚠️ Erro ao buscar nome do contato:', error);
  }
  
  return '';
}

// Versão assíncrona que resolve o nome antes de substituir - usar apenas onde mensagens são enviadas
async function replaceVariablesWithContactFallback(supabase: any, text: string, variables: Record<string, any>, session: Session): Promise<string> {
  const contactName = await resolveContactName(supabase, session);
  return replaceVariables(text, variables, session, contactName);
}

function getNestedValue(obj: any, path: string): any {
  if (!path || path.trim() === '') return obj;
  if (!obj) return undefined;
  
  // Handle wildcard paths
  if (path.includes('[*]')) {
    return getNestedValueWithWildcard(obj, path);
  }
  
  // Normalize path: [0].json.field -> 0.json.field
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
    console.log(`[External] ÃÂ¢ÃÂÃÂ ÃÂ¯ÃÂ¸ÃÂ Expected array at path "${beforeWildcard}", got ${typeof arrayValue}`);
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

async function callSender(supabase: any, action: string, conexao: any, phoneNumber: string, chatId: number | undefined, params: any) {
  const { data, error } = await supabase.functions.invoke('flow-whatsapp-sender', {
    body: { action, conexao, phoneNumber, chatId, ...params }
  });
  if (error) console.error('[External] Sender error:', error);
  return data;
}

// ============================================
// ÃÂ­ÃÂ ÃÂ¼ÃÂ­ÃÂ¼ÃÂ HTTP REQUEST BLOCK
// ============================================
async function handleHttpRequestBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number) {
  const { url, method = 'GET', headers = [], body, outputMappings = [], responseFormat = 'json', waitForResponse = true, continueOnError = true } = block.data || {};
  
  // CRITICAL: Reload session variables from DB to ensure we have the latest
  const { data: freshSession } = await supabase
    .from('flow_sessions')
    .select('variables')
    .eq('id', session.id)
    .maybeSingle();
  
  if (freshSession?.variables) {
    session.variables = { ...session.variables, ...freshSession.variables };
  }
  
  if (!url) {
    console.warn('[External] ÃÂ¢ÃÂÃÂ ÃÂ¯ÃÂ¸ÃÂ HTTP Request: No URL provided');
    return { action: 'advance', blockIndex };
  }
  
  const processedUrl = replaceVariables(url, session.variables, session);
  
  const processedHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  for (const header of headers) {
    if (header.key && header.value) {
      processedHeaders[header.key] = replaceVariables(String(header.value), session.variables, session);
    }
  }
  
  try {
    const fetchOptions: RequestInit = { method, headers: processedHeaders };
    
    if (body && method !== 'GET') {
      const processedBody = replaceVariables(body, session.variables, session);
      fetchOptions.body = processedBody;
      
      // Check for unreplaced variables
      const unreplacedVars = processedBody.match(/\{\{([^}]+)\}\}/g);
      if (unreplacedVars) {
        console.warn(`[External] ÃÂ¢ÃÂÃÂ ÃÂ¯ÃÂ¸ÃÂ Unreplaced variables in body:`, unreplacedVars);
        console.log(`[External] ÃÂ¢ÃÂÃÂ ÃÂ¯ÃÂ¸ÃÂ Available vars for substitution:`, Object.keys(session.variables));
      }
    }
    
    // Fazer a requisiÃÂÃÂ§ÃÂÃÂ£o com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const response = await fetch(processedUrl, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    let responseData: any;
    
    if (responseFormat === 'base64' || responseFormat === 'binary') {
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      responseData = {
        base64: btoa(binary),
        contentType: response.headers.get('content-type') || 'application/octet-stream',
        size: bytes.length
      };
    } else {
      const text = await response.text();
      
      // Try to parse as JSON
      if (text && text.trim()) {
        try { 
          responseData = JSON.parse(text); 
        } catch { 
          responseData = text; 
        }
      } else {
        // Empty response
        responseData = null;
      }
    }
    
    // Debug: show structure of response
    if (Array.isArray(responseData)) {
      if (responseData.length > 0) {
        // Show sample of first element
        const sample = JSON.stringify(responseData[0]).substring(0, 300);
      }
    } else if (responseData && typeof responseData === 'object') {
    }
    
    // Salvar status da resposta
    session.variables['_http_status'] = String(response.status);
    session.variables['_http_ok'] = response.ok ? 'true' : 'false';
    
    // Auto-detect patterns
    if (responseData && typeof responseData === 'object') {
      session.variables['_http_response'] = JSON.stringify(responseData);
      
      
      if (responseData.boletos && Array.isArray(responseData.boletos)) {
        session.variables['_http_boletos_count'] = String(responseData.boletos.length);
        if (responseData.boletos.length > 0) {
          session.variables['_http_first_boleto'] = JSON.stringify(responseData.boletos[0]);
        }
        // Save ALL boletos for sendAllFiles functionality
        session.variables['_http_all_boletos'] = JSON.stringify(responseData.boletos);
      }
      
      if (responseData.base64 && responseData.contentType) {
        session.variables['_http_document'] = JSON.stringify(responseData);
      }
    } else if (typeof responseData === 'string') {
      session.variables['_http_response'] = responseData;
    } else {
      session.variables['_http_response'] = '';
    }
    
    // Process output mappings
    if (outputMappings && Array.isArray(outputMappings) && responseData) {
      for (const mapping of outputMappings) {
        if (mapping.variable && mapping.path) {
          const value = getNestedValue(responseData, mapping.path);
          if (value !== undefined) {
            session.variables[mapping.variable] = typeof value === 'object' ? JSON.stringify(value) : String(value);
          } else {
            // Log available paths for debugging
            if (typeof responseData === 'object' && responseData !== null) {
              if (Array.isArray(responseData) && responseData.length > 0) {
              }
            }
          }
        }
      }
    }
    
    await supabase.from('flow_sessions').update({ variables: session.variables }).eq('id', session.id);
    
    // Return success_edge action so main processor can navigate via success edge (group-success-output)
    // This handles httpRequest blocks that have both success and error edges
    return { 
      action: 'success_edge', 
      blockIndex, 
      blockId: block.id,
      handleId: 'group-success-output',
      updatedVariables: session.variables 
    };
    
  } catch (error) {
    console.error('[External] ÃÂ¢ÃÂÃÂ HTTP error:', error);
    session.variables['_http_error'] = String(error);
    session.variables['_http_status'] = '0';
    session.variables['_http_ok'] = 'false';
    await supabase.from('flow_sessions').update({ variables: session.variables }).eq('id', session.id);
    
    // Return error_edge action so main processor can navigate via error edge
    return { 
      action: 'error_edge', 
      blockIndex, 
      blockId: block.id,
      handleId: `${block.id}-error`,
      continueOnError,
      updatedVariables: session.variables 
    };
  }
}

// ============================================
// ÃÂ­ÃÂ ÃÂ½ÃÂ­ÃÂ´ÃÂ WEBHOOK BLOCK
// ============================================
async function handleWebhookBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number) {
  const webhookUrl = block.data?.url || block.data?.webhookUrl;
  if (!webhookUrl) return { action: 'advance', blockIndex };
  
  const processedUrl = replaceVariables(webhookUrl, session.variables, session);
  
  try {
    const payload = {
      sessionId: session.id,
      phoneNumber: session.phone_number,
      contactName: session.contact_name,
      variables: session.variables,
      timestamp: new Date().toISOString()
    };
    
    await fetch(processedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return { action: 'advance', blockIndex };
  } catch (error) {
    console.error('[External] Webhook error:', error);
    return { action: 'advance', blockIndex };
  }
}

// ============================================
// ÃÂ­ÃÂ ÃÂ¾ÃÂ­ÃÂ´ÃÂ OPENAI BLOCK
// ============================================
async function handleOpenAIBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number, conexao: any) {
  const prompt = block.data?.prompt || block.data?.message || '';
  const outputVariable = block.data?.outputVariable || block.data?.responseVariable || 'openai_response';
  const model = block.data?.model || 'gpt-3.5-turbo';
  
  if (!prompt) return { action: 'advance', blockIndex };
  
  const processedPrompt = replaceVariables(prompt, session.variables, session);
  
  try {
    const { data: connection } = await supabase.from('conexoes').select('openai_api_key').eq('id', conexao.id).maybeSingle();
    const apiKey = connection?.openai_api_key || Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      console.error('[External] OpenAI API key not found');
      return { action: 'advance', blockIndex };
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: processedPrompt }],
        max_tokens: block.data?.maxTokens || 500
      })
    });
    
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    session.variables[outputVariable] = aiResponse;
    await supabase.from('flow_sessions').update({ variables: session.variables }).eq('id', session.id);
    
    if (block.data?.sendResponse !== false && aiResponse) {
      await callSender(supabase, 'text', conexao, session.phone_number, session.chatId, { message: aiResponse });
    }
    
    return { action: 'advance', blockIndex, updatedVariables: session.variables };
  } catch (error) {
    console.error('[External] OpenAI error:', error);
    return { action: 'advance', blockIndex };
  }
}

// ============================================
// ÃÂ­ÃÂ ÃÂ½ÃÂ­ÃÂ³ÃÂ LOCATION BLOCK
// ============================================
async function handleLocationBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number, conexao: any) {
  const lat = block.data?.latitude || block.data?.lat;
  const lng = block.data?.longitude || block.data?.lng;
  
  if (lat && lng) {
    await callSender(supabase, 'location', conexao, session.phone_number, session.chatId, {
      locationData: {
        latitude: Number(replaceVariables(String(lat), session.variables, session)),
        longitude: Number(replaceVariables(String(lng), session.variables, session)),
        name: block.data?.name ? replaceVariables(block.data.name, session.variables, session) : undefined,
        address: block.data?.address ? replaceVariables(block.data.address, session.variables, session) : undefined
      }
    });
  }
  
  return { action: 'advance', blockIndex };
}

// ============================================
// ÃÂ­ÃÂ ÃÂ½ÃÂ­ÃÂ³ÃÂ DOCUMENT BLOCK (with sendAllFiles support)
// ============================================

// Helper: Upload base64 to WhatsApp Media API and send document
async function uploadAndSendSingleDocument(
  supabase: any, 
  conexao: any, 
  phoneNumber: string, 
  chatId: number | undefined,
  base64Data: string, 
  filename: string, 
  caption: string | undefined,
  contentType: string = 'application/pdf'
): Promise<boolean> {
  try {
    // Clean base64 if needed
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    // Convert to binary
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create file and form data
    const file = new File([bytes], filename, { type: contentType });
    const formData = new FormData();
    formData.append('file', file, filename);
    formData.append('messaging_product', 'whatsapp');
    
    // Upload to WhatsApp Media API
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/media`,
      { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${conexao.whatsapp_token}` }, 
        body: formData 
      }
    );
    
    const mediaData = await mediaResponse.json();
    
    if (mediaData.id) {
      await callSender(supabase, 'document', conexao, phoneNumber, chatId, {
        docData: { mediaId: mediaData.id, filename, caption }
      });
      return true;
    } else {
      console.error(`[External] ÃÂ¢ÃÂÃÂ Media upload failed:`, mediaData);
      return false;
    }
  } catch (error) {
    console.error(`[External] ÃÂ¢ÃÂÃÂ Error uploading document:`, error);
    return false;
  }
}

async function handleDocumentBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number, conexao: any) {
  const documentUrl = block.data?.documentUrl || block.data?.url || '';
  const filename = block.data?.filename || 'document.pdf';
  const caption = block.data?.caption;
  const sendAllFiles = block.data?.sendAllFiles === true;
  
  
  // Reload session variables from DB
  const { data: freshSession } = await supabase
    .from('flow_sessions')
    .select('variables')
    .eq('id', session.id)
    .maybeSingle();
  
  if (freshSession?.variables) {
    session.variables = { ...session.variables, ...freshSession.variables };
  }
  
  const processedUrl = replaceVariables(documentUrl, session.variables, session);
  const processedFilename = replaceVariables(filename, session.variables, session);
  const processedCaption = caption ? replaceVariables(caption, session.variables, session) : undefined;
  
  // Check if sendAllFiles is enabled and we have multiple boletos
  if (sendAllFiles) {
    
    // Check for _http_all_boletos first (auto-detected from HTTP response)
    let boletosArray: any[] = [];
    
    if (session.variables['_http_all_boletos']) {
      try {
        boletosArray = JSON.parse(session.variables['_http_all_boletos']);
      } catch (e) {
        console.error(`[External] ÃÂ¢ÃÂÃÂ Error parsing _http_all_boletos:`, e);
      }
    }
    
    // Also check if the processed URL contains a JSON array
    if (boletosArray.length === 0 && processedUrl.startsWith('[')) {
      try {
        boletosArray = JSON.parse(processedUrl);
      } catch {}
    }
    
    // Check if URL still has unreplaced variable (fallback to auto-detected)
    if (boletosArray.length === 0 && processedUrl.includes('{{')) {
      if (session.variables['_http_all_boletos']) {
        try {
          boletosArray = JSON.parse(session.variables['_http_all_boletos']);
        } catch {}
      }
    }
    
    // Process array of boletos
    if (boletosArray.length > 0) {
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < boletosArray.length; i++) {
        const boleto = boletosArray[i];
        const boletoId = boleto.id || `doc_${i + 1}`;
        
        // Skip failed boletos
        if (boleto.success === false) {
          errorCount++;
          continue;
        }
        
        const base64 = boleto.base64;
        if (!base64) {
          errorCount++;
          continue;
        }
        
        // ALWAYS use configured filename from block, ignore any filename from n8n response
        const docFilename = processedFilename;
        const docCaption = processedCaption;
        
        const success = await uploadAndSendSingleDocument(
          supabase,
          conexao,
          session.phone_number,
          session.chatId,
          base64,
          docFilename,
          docCaption,
          boleto.contentType || 'application/pdf'
        );
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Delay between sends to avoid rate limiting
        if (i < boletosArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      
      // Save results to variables
      session.variables['_docs_sent'] = String(successCount);
      session.variables['_docs_errors'] = String(errorCount);
      await supabase.from('flow_sessions').update({ variables: session.variables }).eq('id', session.id);
      
      return { action: 'advance', blockIndex, updatedVariables: session.variables };
    }
  }
  
  // Single document processing (original logic)
  
  // Check if URL is JSON with base64 (single document)
  try {
    if (processedUrl.startsWith('{')) {
      const fileData = JSON.parse(processedUrl);
      if (fileData.base64) {
        const success = await uploadAndSendSingleDocument(
          supabase,
          conexao,
          session.phone_number,
          session.chatId,
          fileData.base64,
          processedFilename,
          processedCaption,
          fileData.contentType || 'application/pdf'
        );
        return { action: 'advance', blockIndex };
      }
    }
  } catch {}
  
  // Check if we have _http_first_boleto when URL has unreplaced variable
  if (processedUrl.includes('{{') && session.variables['_http_first_boleto']) {
    try {
      const firstBoleto = JSON.parse(session.variables['_http_first_boleto']);
      if (firstBoleto.base64) {
        const success = await uploadAndSendSingleDocument(
          supabase,
          conexao,
          session.phone_number,
          session.chatId,
          firstBoleto.base64,
          processedFilename,
          processedCaption,
          firstBoleto.contentType || 'application/pdf'
        );
        return { action: 'advance', blockIndex };
      }
    } catch {}
  }
  
  // URL-based document
  if (processedUrl.startsWith('http')) {
    await callSender(supabase, 'document', conexao, session.phone_number, session.chatId, {
      docData: { url: processedUrl, filename: processedFilename, caption: processedCaption }
    });
  }
  
  return { action: 'advance', blockIndex };
}

// ============================================
// ÃÂ­ÃÂ ÃÂ½ÃÂ­ÃÂ¶ÃÂ¼ÃÂ¯ÃÂ¸ÃÂ IMAGE BLOCK
// ============================================
async function handleImageBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number, conexao: any) {
  const imageUrl = block.data?.imageUrl || block.data?.url;
  const caption = block.data?.caption;
  
  if (imageUrl) {
    await callSender(supabase, 'image', conexao, session.phone_number, session.chatId, {
      imageData: {
        url: replaceVariables(imageUrl, session.variables, session),
        caption: caption ? replaceVariables(caption, session.variables, session) : undefined
      }
    });
  }
  
  return { action: 'advance', blockIndex };
}

// ============================================
// ÃÂ­ÃÂ ÃÂ½ÃÂ­ÃÂ´ÃÂ AUDIO BLOCK
// ============================================
async function handleAudioBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number, conexao: any) {
  const audioUrl = block.data?.audioUrl || block.data?.url;
  if (audioUrl) {
    await callSender(supabase, 'audio', conexao, session.phone_number, session.chatId, {
      audioUrl: replaceVariables(audioUrl, session.variables, session)
    });
  }
  return { action: 'advance', blockIndex };
}

// ============================================
// ÃÂ­ÃÂ ÃÂ¼ÃÂ­ÃÂ¾ÃÂ¬ VIDEO BLOCK
// ============================================
async function handleVideoBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number, conexao: any) {
  const videoUrl = block.data?.videoUrl || block.data?.url;
  const caption = block.data?.caption;
  if (videoUrl) {
    await callSender(supabase, 'video', conexao, session.phone_number, session.chatId, {
      videoUrl: replaceVariables(videoUrl, session.variables, session),
      caption: caption ? replaceVariables(caption, session.variables, session) : undefined
    });
  }
  return { action: 'advance', blockIndex };
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
      case 'httprequest':
        result = await handleHttpRequestBlock(supabase, session, block, blockIndex);
        break;
      case 'webhook':
        result = await handleWebhookBlock(supabase, session, block, blockIndex);
        break;
      case 'openai':
        result = await handleOpenAIBlock(supabase, session, block, blockIndex, conexao);
        break;
      case 'location':
        result = await handleLocationBlock(supabase, session, block, blockIndex, conexao);
        break;
      case 'document':
        result = await handleDocumentBlock(supabase, session, block, blockIndex, conexao);
        break;
      case 'image':
        result = await handleImageBlock(supabase, session, block, blockIndex, conexao);
        break;
      case 'audio':
        result = await handleAudioBlock(supabase, session, block, blockIndex, conexao);
        break;
      case 'video':
        result = await handleVideoBlock(supabase, session, block, blockIndex, conexao);
        break;
      default:
        result = { action: 'advance', blockIndex };
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[External] Error:', error);
    return new Response(JSON.stringify({ action: 'error', error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
