import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AdvancedSearchParams {
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  not_contains?: string;
  has_attachment?: boolean;
  date_from?: string;
  date_to?: string;
}

interface SearchRequest {
  conta_id: string;
  pasta?: string;
  query?: string;
  criterio?: 'all' | 'from' | 'subject' | 'body' | 'to';
  limite?: number;
  advanced?: AdvancedSearchParams;
}

// Função para descriptografar senha
async function decryptPassword(encryptedPassword: string): Promise<string> {
  const encryptionKey = Deno.env.get('EMAIL_ENCRYPTION_KEY') || 'default-key-change-me-in-production';
  
  const combined = decode(encryptedPassword);
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    data
  );

  return new TextDecoder().decode(decrypted);
}

// Mapeamento de charsets alternativos
const CHARSET_ALIASES: Record<string, string> = {
  'iso-8859-1': 'iso-8859-1',
  'latin1': 'iso-8859-1',
  'latin-1': 'iso-8859-1',
  'windows-1252': 'windows-1252',
  'cp1252': 'windows-1252',
  'utf-8': 'utf-8',
  'utf8': 'utf-8',
  'us-ascii': 'utf-8',
  'ascii': 'utf-8',
};

function normalizeCharset(charset: string): string {
  const normalized = charset.toLowerCase().trim().replace(/['"]/g, '');
  return CHARSET_ALIASES[normalized] || 'utf-8';
}

// Decodificador MIME RFC 2047 com suporte a charset correto
function decodeMimeHeader(header: string): string {
  if (!header || typeof header !== 'string' || !header.includes('=?')) {
    return header || '';
  }

  let processed = header.replace(/(\?=)\s+(=\?)/g, '$1$2');
  const encodedWordPattern = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g;

  processed = processed.replace(encodedWordPattern, (match, charsetRaw, encoding, text) => {
    try {
      const charset = normalizeCharset(charsetRaw);
      
      if (encoding.toUpperCase() === 'B') {
        const decoded = atob(text);
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i);
        }
        try {
          return new TextDecoder(charset).decode(bytes);
        } catch {
          return new TextDecoder('utf-8').decode(bytes);
        }
      } else if (encoding.toUpperCase() === 'Q') {
        let decoded = text.replace(/_/g, ' ');
        decoded = decoded.replace(/=([0-9A-Fa-f]{2})/g, (_: string, hex: string) => {
          return String.fromCharCode(parseInt(hex, 16));
        });
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i);
        }
        try {
          return new TextDecoder(charset).decode(bytes);
        } catch {
          return new TextDecoder('utf-8').decode(bytes);
        }
      }
    } catch (e) {
      console.error('Erro ao decodificar MIME:', e);
    }
    return match;
  });

  return processed;
}

// Parser de headers
function parseEmailHeaders(headerText: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const lines = headerText.split('\r\n');
  let currentHeader = '';
  let currentValue = '';
  
  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      currentValue += ' ' + line.trim();
    } else if (line.includes(':')) {
      if (currentHeader) {
        headers[currentHeader.toLowerCase()] = currentValue;
      }
      const colonIndex = line.indexOf(':');
      currentHeader = line.substring(0, colonIndex);
      currentValue = line.substring(colonIndex + 1).trim();
    }
  }
  
  if (currentHeader) {
    headers[currentHeader.toLowerCase()] = currentValue;
  }
  
  return headers;
}

// Mapeamento de pastas
const FOLDER_ALIASES: Record<string, string[]> = {
  'INBOX': ['INBOX', 'Inbox'],
  'inbox': ['INBOX', 'Inbox'],
  'Sent': ['Sent', 'SENT', 'Sent Items', 'Sent Messages', 'INBOX.Sent', 'Enviados', '[Gmail]/Sent Mail'],
  'sent': ['Sent', 'SENT', 'Sent Items', 'Sent Messages', 'INBOX.Sent', 'Enviados', '[Gmail]/Sent Mail'],
  'Drafts': ['Drafts', 'DRAFTS', 'Draft', 'INBOX.Drafts', 'Rascunhos', '[Gmail]/Drafts'],
  'drafts': ['Drafts', 'DRAFTS', 'Draft', 'INBOX.Drafts', 'Rascunhos', '[Gmail]/Drafts'],
  'Trash': ['Trash', 'TRASH', 'Deleted', 'Deleted Items', 'INBOX.Trash', 'Lixeira', '[Gmail]/Trash'],
  'trash': ['Trash', 'TRASH', 'Deleted', 'Deleted Items', 'INBOX.Trash', 'Lixeira', '[Gmail]/Trash'],
  'Junk': ['INBOX.spam', 'INBOX.Junk', 'Junk', 'JUNK', 'Spam', 'SPAM', 'Junk E-mail', '[Gmail]/Spam'],
  'spam': ['INBOX.spam', 'INBOX.Junk', 'Junk', 'JUNK', 'Spam', 'SPAM', 'Junk E-mail', '[Gmail]/Spam'],
  'INBOX.spam': ['INBOX.spam', 'INBOX.Junk', 'Junk', 'Spam', '[Gmail]/Spam'],
  'INBOX.Junk': ['INBOX.Junk', 'INBOX.spam', 'Junk', 'Spam', '[Gmail]/Spam'],
};

// Buscar emails no servidor IMAP usando comando SEARCH
async function searchImapEmails(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  folder: string,
  query: string,
  criterio: string,
  limit: number
): Promise<{ success: boolean; emails: any[]; error?: string }> {
  try {
    console.log(`[email-search] Buscando em ${host}:${port} pasta ${folder} query "${query}"`);
    
    let conn: Deno.Conn | Deno.TlsConn;
    
    if (ssl) {
      conn = await Deno.connectTls({ hostname: host, port });
    } else {
      conn = await Deno.connect({ hostname: host, port, transport: "tcp" });
    }
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(65536);
    
    let tagCounter = 1;
    const getTag = () => `A${String(tagCounter++).padStart(3, '0')}`;
    
    const readResponse = async (expectedTag: string): Promise<string> => {
      let fullResponse = '';
      let complete = false;
      
      while (!complete) {
        const bytesRead = await conn.read(buffer);
        if (bytesRead) {
          const chunk = decoder.decode(buffer.subarray(0, bytesRead));
          fullResponse += chunk;
          if (chunk.includes(`${expectedTag} OK`) || 
              chunk.includes(`${expectedTag} NO`) || 
              chunk.includes(`${expectedTag} BAD`)) {
            complete = true;
          }
        } else {
          break;
        }
      }
      return fullResponse;
    };
    
    const sendCommand = async (cmd: string): Promise<string> => {
      const tag = getTag();
      await conn.write(encoder.encode(`${tag} ${cmd}\r\n`));
      return await readResponse(tag);
    };
    
    // Ler greeting
    await conn.read(buffer);
    
    // Login
    let response = await sendCommand(`LOGIN "${email}" "${password}"`);
    if (!response.includes('OK')) {
      conn.close();
      return { success: false, emails: [], error: 'Falha na autenticação' };
    }

    // Listar pastas
    const listResponse = await sendCommand('LIST "" "*"');
    const availableFolders: string[] = [];
    const listLines = listResponse.split('\r\n');
    for (const line of listLines) {
      const match = line.match(/\* LIST \([^)]*\) "[^"]+" "?([^"]+)"?/);
      if (match) availableFolders.push(match[1]);
    }

    // Encontrar pasta correta
    let actualFolder = folder;
    const aliases = FOLDER_ALIASES[folder] || [folder];
    for (const alias of aliases) {
      if (availableFolders.some(f => f.toLowerCase() === alias.toLowerCase())) {
        actualFolder = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase()) || alias;
        break;
      }
    }
    
    // Selecionar pasta
    response = await sendCommand(`SELECT "${actualFolder}"`);
    if (!response.includes('OK')) {
      conn.close();
      return { success: false, emails: [], error: `Pasta ${actualFolder} não encontrada` };
    }

    // Montar critério de busca IMAP
    let searchCriteria = '';
    const searchQuery = query.replace(/"/g, '\\"');
    
    switch (criterio) {
      case 'from':
        searchCriteria = `FROM "${searchQuery}"`;
        break;
      case 'subject':
        searchCriteria = `SUBJECT "${searchQuery}"`;
        break;
      case 'to':
        searchCriteria = `TO "${searchQuery}"`;
        break;
      case 'body':
        searchCriteria = `BODY "${searchQuery}"`;
        break;
      case 'all':
      default:
        // Busca em múltiplos campos
        searchCriteria = `OR OR FROM "${searchQuery}" SUBJECT "${searchQuery}" TO "${searchQuery}"`;
    }

    console.log(`[email-search] Critério IMAP: ${searchCriteria}`);
    
    // Executar busca
    response = await sendCommand(`SEARCH ${searchCriteria}`);
    
    // Extrair UIDs dos resultados
    const searchMatch = response.match(/\* SEARCH([\d\s]*)/);
    const foundUids = searchMatch 
      ? searchMatch[1].trim().split(/\s+/).filter(u => u.length > 0).map(Number)
      : [];
    
    console.log(`[email-search] Encontrados ${foundUids.length} resultados`);
    
    if (foundUids.length === 0) {
      await sendCommand('LOGOUT');
      conn.close();
      return { success: true, emails: [] };
    }

    // Limitar resultados
    const uidsToFetch = foundUids.slice(-limit).reverse();
    const uidList = uidsToFetch.join(',');
    
    // Buscar headers dos emails encontrados (incluindo threading headers)
    response = await sendCommand(`FETCH ${uidList} (UID FLAGS BODY.PEEK[HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID REFERENCES IN-REPLY-TO)])`);
    
    const emails: any[] = [];
    const fetchRegex = /\* (\d+) FETCH \(UID (\d+) FLAGS \(([^)]*)\)/g;
    let match;
    
    while ((match = fetchRegex.exec(response)) !== null) {
      const seqNum = match[1];
      const uid = match[2];
      const flags = match[3];
      
      const headerStart = response.indexOf('BODY[HEADER.FIELDS', match.index);
      if (headerStart !== -1) {
        const headerDataStart = response.indexOf('}\r\n', headerStart);
        if (headerDataStart !== -1) {
          const headerEnd = response.indexOf('\r\n)', headerDataStart);
          if (headerEnd !== -1) {
            const headerText = response.substring(headerDataStart + 3, headerEnd);
            const headers = parseEmailHeaders(headerText);
            
            // Processar references (pode ser uma string com múltiplos message-ids)
            const referencesStr = headers['references'] || '';
            const referencesMatches = referencesStr.match(/<[^>]+>/g) || [];
            const references = referencesMatches.map((r: string) => r.trim()).filter((r: string) => r);
            
            // Processar in-reply-to
            const inReplyToStr = headers['in-reply-to'] || '';
            const inReplyToMatch = inReplyToStr.match(/<[^>]+>/);
            const inReplyTo = inReplyToMatch ? inReplyToMatch[0].trim() : '';
            
            emails.push({
              uid,
              seqNum: parseInt(seqNum),
              messageId: headers['message-id'] || `${uid}@${host}`,
              from: headers['from'] || '',
              to: headers['to'] || '',
              cc: headers['cc'] || '',
              subject: headers['subject'] || '(Sem assunto)',
              date: headers['date'] || new Date().toISOString(),
              flags: flags.split(' '),
              seen: flags.includes('\\Seen'),
              references,
              inReplyTo
            });
          }
        }
      }
    }
    
    await sendCommand('LOGOUT');
    conn.close();
    
    // Mapear para formato padrão
    const pastaMap: Record<string, string> = {
      'INBOX': 'inbox', 'Sent': 'sent', 'Drafts': 'drafts',
      'Trash': 'trash', 'Junk': 'spam', 'Spam': 'spam'
    };
    const pastaSistema = pastaMap[actualFolder] || 'inbox';

    const formattedEmails = emails.map(emailItem => {
      const decodedFrom = decodeMimeHeader(emailItem.from);
      let fromName = '';
      let fromEmail = decodedFrom;

      // Tentar extrair nome e email de formatos como "Nome <email@domain>" ou <email@domain>
      const fullMatch = decodedFrom.match(/^(?:"?([^"<]*)"?\s*)?<([^>]+)>$/);
      if (fullMatch) {
        fromName = fullMatch[1]?.trim() || '';
        fromEmail = fullMatch[2]?.trim();
      } else {
        // Se não tem <>, assumir que é só o email
        const emailOnly = decodedFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailOnly) {
          fromEmail = emailOnly[1];
          fromName = '';
        }
      }
      
      const decodedTo = decodeMimeHeader(emailItem.to);
      const toEmails = decodedTo.split(',').map((e: string) => e.trim()).filter((e: string) => e);
      
      return {
        id: emailItem.uid,
        uid: parseInt(emailItem.uid),
        message_id: emailItem.messageId,
        de: fromEmail,
        de_nome: decodeMimeHeader(fromName),
        para: toEmails,
        cc: emailItem.cc ? decodeMimeHeader(emailItem.cc).split(',').map((e: string) => e.trim()) : [],
        assunto: decodeMimeHeader(emailItem.subject),
        data: new Date(emailItem.date).toISOString(),
        lido: emailItem.seen,
        starred: false,
        pasta: pastaSistema,
        references: emailItem.references || [],
        in_reply_to: emailItem.inReplyTo || ''
      };
    });

    return { success: true, emails: formattedEmails };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-search] Erro:', errorMessage);
    return { success: false, emails: [], error: errorMessage };
  }
}

// Busca avançada com múltiplos critérios
async function searchImapEmailsAdvanced(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  folder: string,
  params: AdvancedSearchParams,
  limit: number
): Promise<{ success: boolean; emails: any[]; error?: string }> {
  try {
    console.log(`[email-search] Busca avançada em ${host}:${port} pasta ${folder}`);
    
    let conn: Deno.Conn | Deno.TlsConn;
    
    if (ssl) {
      conn = await Deno.connectTls({ hostname: host, port });
    } else {
      conn = await Deno.connect({ hostname: host, port, transport: "tcp" });
    }
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(65536);
    
    let tagCounter = 1;
    const getTag = () => `A${String(tagCounter++).padStart(3, '0')}`;
    
    const readResponse = async (expectedTag: string): Promise<string> => {
      let fullResponse = '';
      let complete = false;
      
      while (!complete) {
        const bytesRead = await conn.read(buffer);
        if (bytesRead) {
          const chunk = decoder.decode(buffer.subarray(0, bytesRead));
          fullResponse += chunk;
          if (chunk.includes(`${expectedTag} OK`) || 
              chunk.includes(`${expectedTag} NO`) || 
              chunk.includes(`${expectedTag} BAD`)) {
            complete = true;
          }
        } else {
          break;
        }
      }
      return fullResponse;
    };
    
    const sendCommand = async (cmd: string): Promise<string> => {
      const tag = getTag();
      await conn.write(encoder.encode(`${tag} ${cmd}\r\n`));
      return await readResponse(tag);
    };
    
    // Ler greeting
    await conn.read(buffer);
    
    // Login
    let response = await sendCommand(`LOGIN "${email}" "${password}"`);
    if (!response.includes('OK')) {
      conn.close();
      return { success: false, emails: [], error: 'Falha na autenticação' };
    }

    // Listar pastas
    const listResponse = await sendCommand('LIST "" "*"');
    const availableFolders: string[] = [];
    const listLines = listResponse.split('\r\n');
    for (const line of listLines) {
      const match = line.match(/\* LIST \([^)]*\) "[^"]+" "?([^"]+)"?/);
      if (match) availableFolders.push(match[1]);
    }

    // Encontrar pasta correta
    let actualFolder = folder;
    const aliases = FOLDER_ALIASES[folder] || [folder];
    for (const alias of aliases) {
      if (availableFolders.some(f => f.toLowerCase() === alias.toLowerCase())) {
        actualFolder = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase()) || alias;
        break;
      }
    }
    
    // Selecionar pasta
    response = await sendCommand(`SELECT "${actualFolder}"`);
    if (!response.includes('OK')) {
      conn.close();
      return { success: false, emails: [], error: `Pasta ${actualFolder} não encontrada` };
    }

    // Montar critérios de busca IMAP baseados nos parâmetros avançados
    const criteria: string[] = [];
    
    if (params.from) {
      criteria.push(`FROM "${params.from.replace(/"/g, '\\"')}"`);
    }
    if (params.to) {
      criteria.push(`TO "${params.to.replace(/"/g, '\\"')}"`);
    }
    if (params.subject) {
      criteria.push(`SUBJECT "${params.subject.replace(/"/g, '\\"')}"`);
    }
    if (params.body) {
      criteria.push(`BODY "${params.body.replace(/"/g, '\\"')}"`);
    }
    if (params.has_attachment) {
      // IMAP não tem critério direto para anexos, mas podemos usar header
      criteria.push('HEADER Content-Type "multipart"');
    }
    if (params.date_from) {
      const dateFrom = new Date(params.date_from);
      const formattedDate = `${dateFrom.getDate()}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dateFrom.getMonth()]}-${dateFrom.getFullYear()}`;
      criteria.push(`SINCE ${formattedDate}`);
    }
    if (params.date_to) {
      const dateTo = new Date(params.date_to);
      const formattedDate = `${dateTo.getDate()}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dateTo.getMonth()]}-${dateTo.getFullYear()}`;
      criteria.push(`BEFORE ${formattedDate}`);
    }

    const searchCriteria = criteria.length > 0 ? criteria.join(' ') : 'ALL';
    console.log(`[email-search] Critério IMAP avançado: ${searchCriteria}`);
    
    // Executar busca
    response = await sendCommand(`SEARCH ${searchCriteria}`);
    
    // Extrair UIDs dos resultados
    const searchMatch = response.match(/\* SEARCH([\d\s]*)/);
    const foundUids = searchMatch 
      ? searchMatch[1].trim().split(/\s+/).filter(u => u.length > 0).map(Number)
      : [];
    
    console.log(`[email-search] Encontrados ${foundUids.length} resultados avançados`);
    
    if (foundUids.length === 0) {
      await sendCommand('LOGOUT');
      conn.close();
      return { success: true, emails: [] };
    }

    // Limitar resultados
    const uidsToFetch = foundUids.slice(-limit).reverse();
    const uidList = uidsToFetch.join(',');
    
    // Buscar headers dos emails encontrados
    response = await sendCommand(`FETCH ${uidList} (UID FLAGS BODY.PEEK[HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID REFERENCES IN-REPLY-TO)])`);
    
    const emails: any[] = [];
    const fetchRegex = /\* (\d+) FETCH \(UID (\d+) FLAGS \(([^)]*)\)/g;
    let match;
    
    while ((match = fetchRegex.exec(response)) !== null) {
      const seqNum = match[1];
      const uid = match[2];
      const flags = match[3];
      
      const headerStart = response.indexOf('BODY[HEADER.FIELDS', match.index);
      if (headerStart !== -1) {
        const headerDataStart = response.indexOf('}\r\n', headerStart);
        if (headerDataStart !== -1) {
          const headerEnd = response.indexOf('\r\n)', headerDataStart);
          if (headerEnd !== -1) {
            const headerText = response.substring(headerDataStart + 3, headerEnd);
            const headers = parseEmailHeaders(headerText);
            
            const referencesStr = headers['references'] || '';
            const referencesMatches = referencesStr.match(/<[^>]+>/g) || [];
            const references = referencesMatches.map((r: string) => r.trim()).filter((r: string) => r);
            
            const inReplyToStr = headers['in-reply-to'] || '';
            const inReplyToMatch = inReplyToStr.match(/<[^>]+>/);
            const inReplyTo = inReplyToMatch ? inReplyToMatch[0].trim() : '';
            
            emails.push({
              uid,
              seqNum: parseInt(seqNum),
              messageId: headers['message-id'] || `${uid}@${host}`,
              from: headers['from'] || '',
              to: headers['to'] || '',
              cc: headers['cc'] || '',
              subject: headers['subject'] || '(Sem assunto)',
              date: headers['date'] || new Date().toISOString(),
              flags: flags.split(' '),
              seen: flags.includes('\\Seen'),
              references,
              inReplyTo
            });
          }
        }
      }
    }
    
    await sendCommand('LOGOUT');
    conn.close();
    
    // Mapear para formato padrão
    const pastaMap: Record<string, string> = {
      'INBOX': 'inbox', 'Sent': 'sent', 'Drafts': 'drafts',
      'Trash': 'trash', 'Junk': 'spam', 'Spam': 'spam'
    };
    const pastaSistema = pastaMap[actualFolder] || 'inbox';

    // Filtrar por not_contains se especificado
    let filteredEmails = emails;
    if (params.not_contains) {
      const notContainsLower = params.not_contains.toLowerCase();
      filteredEmails = emails.filter(emailItem => {
        const subject = decodeMimeHeader(emailItem.subject).toLowerCase();
        const from = decodeMimeHeader(emailItem.from).toLowerCase();
        return !subject.includes(notContainsLower) && !from.includes(notContainsLower);
      });
    }

    const formattedEmails = filteredEmails.map(emailItem => {
      const decodedFrom = decodeMimeHeader(emailItem.from);
      let fromName = '';
      let fromEmail = decodedFrom;

      const fullMatch = decodedFrom.match(/^(?:"?([^"<]*)"?\s*)?<([^>]+)>$/);
      if (fullMatch) {
        fromName = fullMatch[1]?.trim() || '';
        fromEmail = fullMatch[2]?.trim();
      } else {
        const emailOnly = decodedFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailOnly) {
          fromEmail = emailOnly[1];
          fromName = '';
        }
      }
      
      const decodedTo = decodeMimeHeader(emailItem.to);
      const toEmails = decodedTo.split(',').map((e: string) => e.trim()).filter((e: string) => e);
      
      return {
        id: emailItem.uid,
        uid: parseInt(emailItem.uid),
        message_id: emailItem.messageId,
        de: fromEmail,
        de_nome: decodeMimeHeader(fromName),
        para: toEmails,
        cc: emailItem.cc ? decodeMimeHeader(emailItem.cc).split(',').map((e: string) => e.trim()) : [],
        assunto: decodeMimeHeader(emailItem.subject),
        data: new Date(emailItem.date).toISOString(),
        lido: emailItem.seen,
        starred: false,
        pasta: pastaSistema,
        references: emailItem.references || [],
        in_reply_to: emailItem.inReplyTo || ''
      };
    });

    return { success: true, emails: formattedEmails };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-search] Erro busca avançada:', errorMessage);
    return { success: false, emails: [], error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const data: SearchRequest = await req.json();
    
    // Verificar se tem query simples ou busca avançada
    const hasSimpleQuery = data.query && data.query.trim().length >= 2;
    const hasAdvancedSearch = data.advanced && Object.values(data.advanced).some(v => 
      v !== undefined && v !== '' && v !== false
    );

    if (!hasSimpleQuery && !hasAdvancedSearch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query deve ter pelo menos 2 caracteres ou filtros avançados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const pasta = data.pasta || 'INBOX';
    const criterio = data.criterio || 'all';
    const limite = data.limite || 50;
    
    console.log('[email-search] Requisição:', { 
      conta_id: data.conta_id, 
      pasta, 
      query: data.query, 
      criterio,
      advanced: hasAdvancedSearch 
    });

    // Buscar conta
    const { data: conta, error: contaError } = await supabaseClient
      .from('email_contas')
      .select('*')
      .eq('id', data.conta_id)
      .single();

    if (contaError || !conta) {
      throw new Error('Conta de email não encontrada');
    }

    if (!conta.ativo) {
      throw new Error('Conta de email está inativa');
    }

    const senha = await decryptPassword(conta.senha_criptografada);

    let result;
    
    if (hasAdvancedSearch && data.advanced) {
      // Busca avançada
      result = await searchImapEmailsAdvanced(
        conta.imap_host,
        conta.imap_port,
        conta.imap_ssl,
        conta.email,
        senha,
        pasta,
        data.advanced,
        limite
      );
    } else {
      // Busca simples
      result = await searchImapEmails(
        conta.imap_host,
        conta.imap_port,
        conta.imap_ssl,
        conta.email,
        senha,
        pasta,
        data.query!,
        criterio,
        limite
      );
    }

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar emails');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emails: result.emails,
        total: result.emails.length,
        query: data.query,
        pasta
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-search] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
