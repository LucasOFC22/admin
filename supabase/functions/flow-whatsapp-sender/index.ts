// Flow WhatsApp Sender - Microservice for sending WhatsApp messages
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================
// UTF-8 ENCODING HELPER (FIXED VERSION)
// ============================================
function fixUtf8Encoding(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  let fixed = text;
  
  // Fix quadruple/triple encoding (Ã Â Ã Â pattern)
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*¡/g, '\u00E1'); // á
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*­/g, '\u00ED'); // í
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*ª/g, '\u00EA'); // ê
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*Ã\s*Â\s*©/g, '\u00E9'); // é
  
  // Triple encoding
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*¡/g, '\u00E1'); // á
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*­/g, '\u00ED'); // í
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*ª/g, '\u00EA'); // ê
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*©/g, '\u00E9'); // é
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*³/g, '\u00F3'); // ó
  fixed = fixed.replace(/Ã\s*Â\s*Ã\s*Â\s*º/g, '\u00FA'); // ú
  
  // Double encoding (ÃÂ¡ -> á)
  fixed = fixed.replace(/Ã\s*Â\s*¡/g, '\u00E1'); // á
  fixed = fixed.replace(/Ã\s*Â\s*à/g, '\u00E0'); // à
  fixed = fixed.replace(/Ã\s*Â\s*¢/g, '\u00E2'); // â
  fixed = fixed.replace(/Ã\s*Â\s*£/g, '\u00E3'); // ã
  fixed = fixed.replace(/Ã\s*Â\s*§/g, '\u00E7'); // ç
  fixed = fixed.replace(/Ã\s*Â\s*©/g, '\u00E9'); // é
  fixed = fixed.replace(/Ã\s*Â\s*ª/g, '\u00EA'); // ê
  fixed = fixed.replace(/Ã\s*Â\s*­/g, '\u00ED'); // í
  fixed = fixed.replace(/Ã\s*Â\s*³/g, '\u00F3'); // ó
  fixed = fixed.replace(/Ã\s*Â\s*´/g, '\u00F4'); // ô
  fixed = fixed.replace(/Ã\s*Â\s*µ/g, '\u00F5'); // õ
  fixed = fixed.replace(/Ã\s*Â\s*º/g, '\u00FA'); // ú
  fixed = fixed.replace(/Ã\s*Â\s*Á/g, '\u00C1'); // Á
  fixed = fixed.replace(/Ã\s*Â\s*Ç/g, '\u00C7'); // Ç
  fixed = fixed.replace(/Ã\s*Â\s*É/g, '\u00C9'); // É
  fixed = fixed.replace(/Ã\s*Â\s*Ê/g, '\u00CA'); // Ê
  fixed = fixed.replace(/Ã\s*Â\s*Í/g, '\u00CD'); // Í
  fixed = fixed.replace(/Ã\s*Â\s*Ó/g, '\u00D3'); // Ó
  fixed = fixed.replace(/Ã\s*Â\s*Ú/g, '\u00DA'); // Ú
  
  // Smart quotes
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

function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false;
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// ============================================
// FETCH WITH TIMEOUT AND RETRY
// ============================================
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs = 20000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = 1,
  timeoutMs = 20000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Sender] Attempt ${attempt + 1} failed:`, errorMessage);
      
      if (attempt === retries) {
        throw error;
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  throw new Error('All retry attempts failed');
}

// ============================================
// WHATSAPP MESSAGE FUNCTIONS
// ============================================
async function sendWhatsAppMessage(
  supabase: any,
  conexao: any, 
  phoneNumber: string, 
  message: string,
  chatId?: number
) {
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Sender] SEND BLOCKED: Invalid phone: ${phoneNumber}`);
    return { success: false, error: 'Invalid phone number' };
  }
  
  if (!conexao.whatsapp_token || !conexao.whatsapp_phone_id) {
    console.error('[Sender] Credenciais WhatsApp nao configuradas');
    return { success: false, error: 'Missing credentials' };
  }
  const normalizedMessage = normalizeUtf8(message);
  
  try {
    const response = await fetchWithRetry(
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
    
    if (!response.ok) {
      console.error('[Sender] Facebook API Error:', response.status, JSON.stringify(data));
      return { success: false, error: `API Error ${response.status}: ${data.error?.message || JSON.stringify(data)}` };
    }
    
    const messageId = data.messages?.[0]?.id || crypto.randomUUID();
    
    if (chatId) {
      await supabase.from('mensagens_whatsapp').insert({
        message_id: messageId,
        chatId: chatId,
        message_type: 'text',
        message_text: normalizedMessage,
        send: 'flowbuilder',
        metadata: { conexaoId: conexao.id, phone_number: phoneNumber },
        received_at: new Date().toISOString()
      });
    }
    
    return { success: true, messageId };
  } catch (error) {
    console.error('[Sender] Erro ao enviar texto:', error);
    return { success: false, error: String(error) };
  }
}

async function sendWhatsAppInteractiveList(
  supabase: any,
  conexao: any,
  phoneNumber: string,
  data: { body: string; buttonText: string; sections: any[]; header?: string; footer?: string },
  chatId?: number
) {
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Sender] LIST BLOCKED: Invalid phone: ${phoneNumber}`);
    return { success: false, error: 'Invalid phone number' };
  }
  
  if (!conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) {
    console.error('[Sender] LIST BLOCKED: Missing credentials', {
      hasToken: !!conexao?.whatsapp_token,
      hasPhoneId: !!conexao?.whatsapp_phone_id,
      conexaoId: conexao?.id
    });
    return { success: false, error: 'Missing WhatsApp credentials' };
  }
  
  const interactive: any = {
    type: 'list',
    body: { text: normalizeUtf8(data.body) },
    action: {
      button: normalizeUtf8(data.buttonText),
      sections: data.sections.map(s => ({
        title: normalizeUtf8(s.title || 'Opcoes'),
        rows: s.rows.map((r: any) => ({
          id: r.id,
          title: normalizeUtf8(r.title),
          description: r.description ? normalizeUtf8(r.description) : undefined
        }))
      }))
    }
  };
  
  if (data.header) {
    interactive.header = { type: 'text', text: normalizeUtf8(data.header) };
  }
  
  if (data.footer) {
    interactive.footer = { text: normalizeUtf8(data.footer) };
  }
  
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phoneNumber,
    type: 'interactive',
    interactive
  };
  
  try {
    const response = await fetchWithRetry(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[Sender] Facebook API Error:', response.status, JSON.stringify(result));
      return { success: false, error: `API Error ${response.status}: ${result.error?.message || JSON.stringify(result)}` };
    }
    
    const messageId = result.messages?.[0]?.id || crypto.randomUUID();
    
    if (chatId) {
      const messageText = data.header 
        ? `[Menu] ${data.header}\n${data.body}` 
        : `[Menu] ${data.body}`;
      
      await supabase.from('mensagens_whatsapp').insert({
        message_id: messageId,
        chatId: chatId,
        message_type: 'interactive',
        message_text: normalizeUtf8(messageText),
        send: 'flowbuilder',
        metadata: { 
          interactiveType: 'list',
          buttonText: data.buttonText,
          sections: data.sections,
          conexaoId: conexao?.id,
          phone_number: phoneNumber
        },
        received_at: new Date().toISOString()
      });
    }
    
    return { success: true, messageId };
  } catch (error) {
    console.error('[Sender] Erro ao enviar lista:', error);
    return { success: false, error: String(error) };
  }
}

async function sendWhatsAppInteractiveButtons(
  supabase: any,
  conexao: any,
  phoneNumber: string,
  data: { body: string; buttons: any[] },
  chatId?: number
) {
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Sender] BUTTONS BLOCKED: Invalid phone: ${phoneNumber}`);
    return { success: false, error: 'Invalid phone number' };
  }
  
  if (!conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) {
    console.error('[Sender] BUTTONS BLOCKED: Missing credentials', {
      hasToken: !!conexao?.whatsapp_token,
      hasPhoneId: !!conexao?.whatsapp_phone_id,
      conexaoId: conexao?.id
    });
    return { success: false, error: 'Missing WhatsApp credentials' };
  }
  
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phoneNumber,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: normalizeUtf8(data.body) },
      action: {
        buttons: data.buttons.slice(0, 3).map(b => ({
          type: 'reply',
          reply: { id: b.id, title: normalizeUtf8(b.title).substring(0, 20) }
        }))
      }
    }
  };
  
  try {
    const response = await fetchWithRetry(
      `https://graph.facebook.com/v21.0/${conexao.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${conexao.whatsapp_token}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(payload)
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[Sender] Facebook API Error:', response.status, JSON.stringify(result));
      return { success: false, error: `API Error ${response.status}: ${result.error?.message || JSON.stringify(result)}` };
    }
    
    const messageId = result.messages?.[0]?.id || crypto.randomUUID();
    
    if (chatId) {
      const buttonLabels = data.buttons.map((b: any) => b.title).join(' | ');
      const messageText = `[Botoes] ${data.body}\nOpcoes: ${buttonLabels}`;
      
      await supabase.from('mensagens_whatsapp').insert({
        message_id: messageId,
        chatId: chatId,
        message_type: 'interactive',
        message_text: normalizeUtf8(messageText),
        send: 'flowbuilder',
        metadata: { 
          interactiveType: 'buttons',
          buttons: data.buttons,
          conexaoId: conexao?.id,
          phone_number: phoneNumber
        },
        received_at: new Date().toISOString()
      });
    }
    
    return { success: true, messageId };
  } catch (error) {
    console.error('[Sender] Erro ao enviar botoes:', error);
    return { success: false, error: String(error) };
  }
}

async function sendWhatsAppDocument(
  supabase: any,
  conexao: any, 
  phoneNumber: string, 
  docData: { url?: string; mediaId?: string; filename: string; caption?: string },
  chatId?: number
) {
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Sender] DOCUMENT BLOCKED: Invalid phone: ${phoneNumber}`);
    return { success: false, error: 'Invalid phone number' };
  }
  
  if (!conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) {
    console.error('[Sender] DOCUMENT BLOCKED: Missing credentials');
    return { success: false, error: 'Missing WhatsApp credentials' };
  }
  
  try {
    const documentPayload: any = { filename: normalizeUtf8(docData.filename) };
    if (docData.mediaId) documentPayload.id = docData.mediaId;
    else if (docData.url) documentPayload.link = docData.url;
    else return { success: false, error: 'No media_id or URL' };
    
    if (docData.caption) documentPayload.caption = normalizeUtf8(docData.caption);
    
    const response = await fetchWithRetry(
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
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[Sender] Facebook API Error:', response.status, JSON.stringify(result));
      return { success: false, error: `API Error ${response.status}: ${result.error?.message || JSON.stringify(result)}` };
    }
    
    const messageId = result.messages?.[0]?.id || crypto.randomUUID();
    
    if (chatId) {
      await supabase.from('mensagens_whatsapp').insert({
        message_id: messageId,
        chatId,
        message_type: 'document',
        message_text: docData.url || `Documento: ${docData.filename}`,
        send: 'outgoing',
        message_data: {
          type: 'document',
          url: docData.url,
          fileName: docData.filename,
          caption: docData.caption
        },
        metadata: { conexaoId: conexao?.id, phone_number: phoneNumber },
        received_at: new Date().toISOString(),
        media_permanent: true
      });
    }
    
    return { success: true, messageId };
  } catch (error) {
    console.error('[Sender] Erro ao enviar documento:', error);
    return { success: false, error: String(error) };
  }
}

async function sendWhatsAppImage(
  supabase: any,
  conexao: any,
  phoneNumber: string,
  imageData: { url: string; caption?: string },
  chatId?: number
) {
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Sender] IMAGE BLOCKED: Invalid phone: ${phoneNumber}`);
    return { success: false, error: 'Invalid phone number' };
  }
  
  if (!conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) {
    console.error('[Sender] IMAGE BLOCKED: Missing credentials');
    return { success: false, error: 'Missing WhatsApp credentials' };
  }
  
  try {
    const response = await fetchWithRetry(
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
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[Sender] Facebook API Error:', response.status, JSON.stringify(result));
      return { success: false, error: `API Error ${response.status}: ${result.error?.message || JSON.stringify(result)}` };
    }
    
    const messageId = result.messages?.[0]?.id || crypto.randomUUID();
    
    // Salvar mensagem de imagem no banco
    if (chatId) {
      await supabase.from('mensagens_whatsapp').insert({
        message_id: messageId,
        chatId: chatId,
        message_type: 'image',
        message_text: imageData.url,
        send: 'outgoing',
        message_data: {
          type: 'image',
          url: imageData.url,
          caption: imageData.caption
        },
        metadata: { conexaoId: conexao?.id, phone_number: phoneNumber },
        received_at: new Date().toISOString(),
        media_permanent: true
      });
    }
    
    return { success: true, messageId };
  } catch (error) {
    console.error('[Sender] Erro ao enviar imagem:', error);
    return { success: false, error: String(error) };
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
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Sender] VIDEO BLOCKED: Invalid phone: ${phoneNumber}`);
    return { success: false, error: 'Invalid phone number' };
  }
  
  if (!conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) {
    console.error('[Sender] VIDEO BLOCKED: Missing credentials');
    return { success: false, error: 'Missing WhatsApp credentials' };
  }
  
  try {
    const response = await fetchWithRetry(
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
          video: { link: videoUrl, caption: caption ? normalizeUtf8(caption) : undefined }
        })
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[Sender] Facebook API Error:', response.status, JSON.stringify(result));
      return { success: false, error: `API Error ${response.status}: ${result.error?.message || JSON.stringify(result)}` };
    }
    
    const messageId = result.messages?.[0]?.id || crypto.randomUUID();
    
    // Salvar mensagem de video no banco
    if (chatId) {
      await supabase.from('mensagens_whatsapp').insert({
        message_id: messageId,
        chatId: chatId,
        message_type: 'video',
        message_text: videoUrl,
        send: 'outgoing',
        message_data: {
          type: 'video',
          url: videoUrl,
          caption: caption
        },
        metadata: { conexaoId: conexao?.id, phone_number: phoneNumber },
        received_at: new Date().toISOString(),
        media_permanent: true
      });
    }
    
    return { success: true, messageId };
  } catch (error) {
    console.error('[Sender] Erro ao enviar video:', error);
    return { success: false, error: String(error) };
  }
}

async function sendWhatsAppLocation(
  supabase: any,
  conexao: any,
  phoneNumber: string,
  locationData: { latitude: number; longitude: number; name?: string; address?: string },
  chatId?: number
) {
  if (!isValidPhoneNumber(phoneNumber)) {
    console.error(`[Sender] LOCATION BLOCKED: Invalid phone: ${phoneNumber}`);
    return { success: false, error: 'Invalid phone number' };
  }
  
  if (!conexao?.whatsapp_token || !conexao?.whatsapp_phone_id) {
    console.error('[Sender] LOCATION BLOCKED: Missing credentials');
    return { success: false, error: 'Missing WhatsApp credentials' };
  }
  
  try {
    const response = await fetchWithRetry(
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
            name: locationData.name ? normalizeUtf8(locationData.name) : undefined,
            address: locationData.address ? normalizeUtf8(locationData.address) : undefined
          }
        })
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('[Sender] Facebook API Error:', response.status, JSON.stringify(result));
      return { success: false, error: `API Error ${response.status}: ${result.error?.message || JSON.stringify(result)}` };
    }
    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (error) {
    console.error('[Sender] Erro ao enviar localizacao:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// FETCH CONEXAO FROM DATABASE (SECURE)
// ============================================
async function fetchConexao(supabase: any, conexaoId?: string) {
  let query = supabase
    .from('conexoes')
    .select('id, whatsapp_token, whatsapp_phone_id');
  
  if (conexaoId) {
    query = query.eq('id', conexaoId);
  }
  
  const { data, error } = await query.limit(1).single();
  
  if (error || !data) {
    console.error('[Sender] Erro ao buscar conexao:', error?.message);
    return null;
  }
  
  return data;
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

    const { action, conexao, conexaoId, phoneNumber, chatId, ...params } = await req.json();
    
    // SEGURANÇA: Buscar credenciais do banco, NUNCA confiar no frontend
    // Suporte a conexaoId (novo) ou conexao.id (legado para compatibilidade)
    const effectiveConexaoId = conexaoId || conexao?.id;
    const fetchedConexao = await fetchConexao(supabase, effectiveConexaoId);
    
    if (!fetchedConexao) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Conexão não encontrada ou não configurada' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!fetchedConexao.whatsapp_token || !fetchedConexao.whatsapp_phone_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Credenciais WhatsApp não configuradas' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    let result;
    
    switch (action) {
      case 'text':
        result = await sendWhatsAppMessage(supabase, fetchedConexao, phoneNumber, params.message, chatId);
        break;
      case 'list':
        result = await sendWhatsAppInteractiveList(supabase, fetchedConexao, phoneNumber, params.data, chatId);
        break;
      case 'buttons':
        result = await sendWhatsAppInteractiveButtons(supabase, fetchedConexao, phoneNumber, params.data, chatId);
        break;
      case 'document':
        result = await sendWhatsAppDocument(supabase, fetchedConexao, phoneNumber, params.docData, chatId);
        break;
      case 'image':
        result = await sendWhatsAppImage(supabase, fetchedConexao, phoneNumber, params.imageData, chatId);
        break;
      case 'video':
        result = await sendWhatsAppVideo(supabase, fetchedConexao, phoneNumber, params.videoUrl, params.caption, chatId);
        break;
      case 'location':
        result = await sendWhatsAppLocation(supabase, fetchedConexao, phoneNumber, params.locationData, chatId);
        break;
      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Sender] Error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
