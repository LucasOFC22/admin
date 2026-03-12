// Flow Processor External - Handles HTTP requests, webhooks, OpenAI, media blocks
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  
  const allVariables: Record<string, any> = {
    ...variables,
    telefone: session?.phone_number || '',
    phone: session?.phone_number || '',
    nome: resolvedName,
    name: resolvedName,
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
  if (session.contact_name && session.contact_name.trim() !== '') {
    return session.contact_name;
  }
  
  try {
    const phoneDigits = (session.phone_number || '').replace(/\D/g, '');
    if (!phoneDigits) return '';
    
    let { data: contato } = await supabase
      .from('contatos_whatsapp')
      .select('nome')
      .eq('telefone', phoneDigits)
      .maybeSingle();
    
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
      console.log(`[External] Nome encontrado via fallback: ${contato.nome}`);
      session.contact_name = contato.nome;
      await supabase.from('flow_sessions').update({
        contact_name: contato.nome,
        updated_at: new Date().toISOString()
      }).eq('id', session.id);
      
      return contato.nome;
    }
  } catch (error) {
    console.error('[External] Erro ao buscar nome do contato:', error);
  }
  
  return '';
}

async function replaceVariablesWithContactFallback(supabase: any, text: string, variables: Record<string, any>, session: Session): Promise<string> {
  const contactName = await resolveContactName(supabase, session);
  return replaceVariables(text, variables, session, contactName);
}

function getNestedValue(obj: any, path: string): any {
  if (!path || path.trim() === '') return obj;
  if (!obj) return undefined;
  
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
    console.log(`[External] Expected array at path "${beforeWildcard}", got ${typeof arrayValue}`);
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

function extractBoletoIds(rawValue: unknown): string[] {
  const fromPrimitive = (value: unknown): string[] => {
    if (value === null || value === undefined) return [];
    const str = String(value).trim();
    if (!str) return [];
    return str
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  };

  const normalizeObject = (value: unknown): string[] => {
    if (!value || typeof value !== 'object') return fromPrimitive(value);

    if (Array.isArray(value)) {
      return value.flatMap((item) => normalizeObject(item));
    }

    const obj = value as Record<string, unknown>;
    const directId = obj.idBoleto ?? obj.idboleto ?? obj.id;
    if (directId !== undefined) {
      return fromPrimitive(directId);
    }

    return [];
  };

  if (Array.isArray(rawValue)) {
    return Array.from(new Set(rawValue.flatMap((item) => normalizeObject(item)).filter(Boolean)));
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (!trimmed) return [];

    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(trimmed);
        const parsedIds = normalizeObject(parsed);
        if (parsedIds.length > 0) {
          return Array.from(new Set(parsedIds));
        }
      } catch {
        // fallback abaixo para string CSV
      }
    }

    return Array.from(new Set(fromPrimitive(trimmed)));
  }

  return Array.from(new Set(normalizeObject(rawValue)));
}

function pickSingleBoletoId(rawValue: unknown): string {
  const ids = extractBoletoIds(rawValue);
  const valid = ids.find((id) => id !== '0' && id !== '0.0');
  return valid ?? '';
}

async function callSender(supabase: any, action: string, conexao: any, phoneNumber: string, chatId: number | undefined, params: any) {
  const { data, error } = await supabase.functions.invoke('flow-whatsapp-sender', {
    body: { action, conexao, phoneNumber, chatId, ...params }
  });
  if (error) console.error('[External] Sender error:', error);
  return data;
}

// ============================================
// HTTP REQUEST BLOCK
// ============================================
async function handleHttpRequestBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number) {
  const { url, method = 'GET', headers = [], body, outputMappings = [], responseFormat = 'json', continueOnError = true, timeout = 30, fileVariable = '' } = block.data || {};

  const { data: freshSession } = await supabase
    .from('flow_sessions')
    .select('variables')
    .eq('id', session.id)
    .maybeSingle();

  if (freshSession?.variables) {
    session.variables = { ...session.variables, ...freshSession.variables };
  }

  if (!url) {
    return { action: 'advance', blockIndex };
  }

  const isFileLikeResponse = responseFormat === 'base64' || responseFormat === 'binary' || responseFormat === 'file';

  // Limpa caches transitórios para evitar reaproveitar dados de execução anterior
  delete session.variables['_http_document'];
  delete session.variables['_http_first_boleto'];
  delete session.variables['_http_all_boletos'];
  delete session.variables['_http_boletos_count'];

  if (isFileLikeResponse && fileVariable) {
    delete session.variables[fileVariable];
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

      const unreplacedVars = processedBody.match(/\{\{([^}]+)\}\}/g);
      if (unreplacedVars) {
        console.warn(`[External] Unreplaced variables in body:`, unreplacedVars);
      }
    }

    const timeoutSeconds = Number(timeout) > 0 ? Number(timeout) : 30;
    const timeoutMs = Math.min(Math.max(timeoutSeconds, 5), 300) * 1000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(processedUrl, {
      ...fetchOptions,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let responseData: any;
    const responseContentType = response.headers.get('content-type') || '';

    if (isFileLikeResponse) {
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);

      const normalizedContentType = responseContentType.toLowerCase();
      const isJsonLikeContent =
        normalizedContentType.includes('application/json') ||
        normalizedContentType.includes('text/json') ||
        normalizedContentType.startsWith('text/');

      if (isJsonLikeContent) {
        const text = new TextDecoder().decode(bytes);
        if (text && text.trim()) {
          try {
            responseData = JSON.parse(text);
          } catch {
            responseData = {
              base64: btoa(binary),
              contentType: responseContentType || 'application/octet-stream',
              size: bytes.length
            };
          }
        } else {
          responseData = null;
        }
      } else {
        responseData = {
          base64: btoa(binary),
          contentType: responseContentType || 'application/octet-stream',
          size: bytes.length
        };
      }
    } else {
      const text = await response.text();

      if (text && text.trim()) {
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = text;
        }
      } else {
        responseData = null;
      }
    }

    session.variables['_http_status'] = String(response.status);
    session.variables['_http_ok'] = response.ok ? 'true' : 'false';

    if (responseData && typeof responseData === 'object') {
      session.variables['_http_response'] = JSON.stringify(responseData);

      if ((responseData as any).boletos && Array.isArray((responseData as any).boletos)) {
        session.variables['_http_boletos_count'] = String((responseData as any).boletos.length);
        if ((responseData as any).boletos.length > 0) {
          session.variables['_http_first_boleto'] = JSON.stringify((responseData as any).boletos[0]);
        }
        session.variables['_http_all_boletos'] = JSON.stringify((responseData as any).boletos);
      }

      if (response.ok && (responseData as any).base64 && (responseData as any).contentType) {
        session.variables['_http_document'] = JSON.stringify(responseData);
      }
    } else if (typeof responseData === 'string') {
      session.variables['_http_response'] = responseData;
    } else {
      session.variables['_http_response'] = '';
    }

    if (isFileLikeResponse && fileVariable) {
      if (!response.ok || responseData === null || responseData === undefined) {
        delete session.variables[fileVariable];
      } else if (typeof responseData === 'object') {
        session.variables[fileVariable] = JSON.stringify(responseData);
      } else {
        session.variables[fileVariable] = String(responseData);
      }
    }

    if (outputMappings && Array.isArray(outputMappings) && responseData) {
      for (const mapping of outputMappings) {
        if (mapping.variable && mapping.path) {
          const value = getNestedValue(responseData, mapping.path);
          if (value !== undefined) {
            const variableName = String(mapping.variable).toLowerCase();

            if (variableName === 'idboleto') {
              const allIds = extractBoletoIds(value);
              const selectedId = pickSingleBoletoId(value);

              if (allIds.length > 1) {
                console.warn(`[External] ${allIds.length} IDs de boleto recebidos; usando apenas o primeiro válido (${selectedId || 'nenhum'}) para evitar spam.`);
                session.variables['_idboleto_all'] = allIds.join(', ');
                session.variables['_idboleto_count'] = String(allIds.length);
              } else {
                delete session.variables['_idboleto_all'];
                delete session.variables['_idboleto_count'];
              }

              session.variables[mapping.variable] = selectedId;
              continue;
            }

            const normalized = typeof value === 'object' ? JSON.stringify(value) : String(value);
            session.variables[mapping.variable] = normalized;
          }
        }
      }
    }

    if (!response.ok) {
      const responseErrorMessage =
        typeof responseData === 'object'
          ? responseData?.error?.message || responseData?.erro || responseData?.message || JSON.stringify(responseData)
          : typeof responseData === 'string'
            ? responseData
            : `HTTP ${response.status}`;

      session.variables['_http_error'] = String(responseErrorMessage);
      await supabase.from('flow_sessions').update({ variables: session.variables }).eq('id', session.id);

      return {
        action: 'error_edge',
        blockIndex,
        blockId: block.id,
        handleId: `${block.id}-error`,
        continueOnError,
        updatedVariables: session.variables
      };
    }

    delete session.variables['_http_error'];
    await supabase.from('flow_sessions').update({ variables: session.variables }).eq('id', session.id);

    return {
      action: 'success_edge',
      blockIndex,
      blockId: block.id,
      handleId: 'group-success-output',
      updatedVariables: session.variables
    };

  } catch (error) {
    console.error('[External] HTTP error:', error);
    session.variables['_http_error'] = String(error);
    session.variables['_http_status'] = '0';
    session.variables['_http_ok'] = 'false';
    await supabase.from('flow_sessions').update({ variables: session.variables }).eq('id', session.id);

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
// WEBHOOK BLOCK
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
// OPENAI BLOCK
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
// LOCATION BLOCK
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
// DOCUMENT BLOCK (with sendAllFiles support)
// ============================================

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
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const file = new File([bytes], filename, { type: contentType });
    const formData = new FormData();
    formData.append('file', file, filename);
    formData.append('messaging_product', 'whatsapp');
    
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
      console.log(`[External] Document sent successfully: ${filename}`);
      return true;
    } else {
      console.error(`[External] Media upload failed:`, mediaData);
      return false;
    }
  } catch (error) {
    console.error(`[External] Error uploading document:`, error);
    return false;
  }
}

async function handleDocumentBlock(supabase: any, session: Session, block: FlowBlock, blockIndex: number, conexao: any) {
  const documentUrl = block.data?.documentUrl || block.data?.url || '';
  const filename = block.data?.filename || 'document.pdf';
  const caption = block.data?.caption;
  const sendAllFiles = block.data?.sendAllFiles === true;
  
  console.log(`[External] Document block: sendAllFiles=${sendAllFiles}, url=${documentUrl?.substring(0, 100)}`);
  
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
  
  console.log(`[External] Document processedUrl: ${processedUrl?.substring(0, 200)}`);
  
  // Check if sendAllFiles is enabled and we have multiple boletos
  if (sendAllFiles) {
    let boletosArray: any[] = [];
    
    if (session.variables['_http_all_boletos']) {
      try {
        boletosArray = JSON.parse(session.variables['_http_all_boletos']);
      } catch (e) {
        console.error(`[External] Error parsing _http_all_boletos:`, e);
      }
    }
    
    if (boletosArray.length === 0 && processedUrl.startsWith('[')) {
      try {
        boletosArray = JSON.parse(processedUrl);
      } catch {}
    }
    
    if (boletosArray.length === 0 && processedUrl.includes('{{')) {
      if (session.variables['_http_all_boletos']) {
        try {
          boletosArray = JSON.parse(session.variables['_http_all_boletos']);
        } catch {}
      }
    }
    
    if (boletosArray.length > 0) {
      const uniqueBoletos: any[] = [];
      const seenKeys = new Set<string>();

      for (const boleto of boletosArray) {
        if (!boleto || boleto.success === false) {
          uniqueBoletos.push(boleto);
          continue;
        }

        const key = `${boleto.id ?? ''}|${boleto.filename ?? ''}|${(boleto.base64 ?? '').slice(0, 120)}`;
        if (seenKeys.has(key)) continue;

        seenKeys.add(key);
        uniqueBoletos.push(boleto);
      }

      console.log(`[External] Processing ${uniqueBoletos.length} documents (sendAllFiles)`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < uniqueBoletos.length; i++) {
        const boleto = uniqueBoletos[i];
        
        if (boleto.success === false) {
          errorCount++;
          continue;
        }
        
        const base64 = boleto.base64;
        if (!base64) {
          console.warn(`[External] Boleto ${i} has no base64 data`);
          errorCount++;
          continue;
        }
        
        const docFilename = processedFilename;
        const docCaption = processedCaption;
        
        const success = await uploadAndSendSingleDocument(
          supabase, conexao, session.phone_number, session.chatId,
          base64, docFilename, docCaption,
          boleto.contentType || 'application/pdf'
        );
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        if (i < uniqueBoletos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`[External] sendAllFiles result: ${successCount} sent, ${errorCount} errors`);
      
      session.variables['_docs_sent'] = String(successCount);
      session.variables['_docs_errors'] = String(errorCount);
      await supabase.from('flow_sessions').update({ variables: session.variables }).eq('id', session.id);
      
      return { action: 'advance', blockIndex, updatedVariables: session.variables };
    }
  }
  
  // Single document processing
  
  // Check if URL is JSON with base64 (single document)
  try {
    if (processedUrl.startsWith('{')) {
      const fileData = JSON.parse(processedUrl);
      if (fileData.base64) {
        console.log(`[External] Sending single document from JSON base64`);
        await uploadAndSendSingleDocument(
          supabase, conexao, session.phone_number, session.chatId,
          fileData.base64, processedFilename, processedCaption,
          fileData.contentType || 'application/pdf'
        );
        return { action: 'advance', blockIndex };
      }
    }
  } catch {}
  
  // Check _http_document (auto-detected single document from HTTP response)
  if (session.variables['_http_document']) {
    try {
      const docData = JSON.parse(session.variables['_http_document']);
      if (docData.base64) {
        console.log(`[External] Sending document from _http_document`);
        await uploadAndSendSingleDocument(
          supabase, conexao, session.phone_number, session.chatId,
          docData.base64, processedFilename, processedCaption,
          docData.contentType || 'application/pdf'
        );
        return { action: 'advance', blockIndex };
      }
    } catch {}
  }
  
  // Check if we have _http_first_boleto when URL has unreplaced variable
  if (processedUrl.includes('{{') && session.variables['_http_first_boleto']) {
    try {
      const firstBoleto = JSON.parse(session.variables['_http_first_boleto']);
      if (firstBoleto.base64) {
        console.log(`[External] Sending document from _http_first_boleto`);
        await uploadAndSendSingleDocument(
          supabase, conexao, session.phone_number, session.chatId,
          firstBoleto.base64, processedFilename, processedCaption,
          firstBoleto.contentType || 'application/pdf'
        );
        return { action: 'advance', blockIndex };
      }
    } catch {}
  }
  
  // Check _http_response for base64 data (n8n format: array with json.base64)
  if (session.variables['_http_response']) {
    try {
      const httpResponse = JSON.parse(session.variables['_http_response']);
      
      // n8n format: [{"json": {"base64": "...", "contentType": "..."}}]
      if (Array.isArray(httpResponse)) {
        for (const item of httpResponse) {
          const jsonData = item?.json || item;
          if (jsonData?.base64) {
            console.log(`[External] Sending document from _http_response array item`);
            await uploadAndSendSingleDocument(
              supabase, conexao, session.phone_number, session.chatId,
              jsonData.base64, processedFilename, processedCaption,
              jsonData.contentType || 'application/pdf'
            );
            return { action: 'advance', blockIndex };
          }
        }
      } else if (httpResponse?.base64) {
        console.log(`[External] Sending document from _http_response object`);
        await uploadAndSendSingleDocument(
          supabase, conexao, session.phone_number, session.chatId,
          httpResponse.base64, processedFilename, processedCaption,
          httpResponse.contentType || 'application/pdf'
        );
        return { action: 'advance', blockIndex };
      }
    } catch {}
  }
  
  // URL-based document
  if (processedUrl.startsWith('http')) {
    console.log(`[External] Sending document via URL: ${processedUrl.substring(0, 120)}`);
    await callSender(supabase, 'document', conexao, session.phone_number, session.chatId, {
      docData: { url: processedUrl, filename: processedFilename, caption: processedCaption }
    });
  } else {
    console.warn(`[External] Document block: no valid document source found. processedUrl=${processedUrl?.substring(0, 100)}`);
    console.log(`[External] Available vars: ${Object.keys(session.variables).filter(k => k.startsWith('_http')).join(', ')}`);
  }
  
  return { action: 'advance', blockIndex };
}

// ============================================
// IMAGE BLOCK
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
// AUDIO BLOCK
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
// VIDEO BLOCK
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
// MAIN HANDLER
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
    console.log(`[External] Processing blockType=${blockType} blockId=${block?.id} session=${session?.id}`);
    
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
    
    console.log(`[External] Result: action=${result?.action}`);
    
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
