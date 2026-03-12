import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SyncRequest {
  conta_id: string;
  pasta?: string;
  limite?: number;
  // Novos parâmetros para threading/paginação
  page?: number;
  threads_per_page?: number;
  include_sent_for_threading?: boolean;
}

// ================== THREADING TYPES ==================
interface EmailMessage {
  id: string;
  uid?: number;
  email_conta_id?: string;
  message_id?: string;
  de: string;
  de_nome?: string;
  para: string[];
  cc?: string[];
  assunto: string;
  preview: string;
  corpo?: string;
  data: string;
  lido: boolean;
  starred: boolean;
  pasta: string;
  references?: string[];
  in_reply_to?: string;
}

interface ThreadParticipant {
  name: string;
  email: string;
  isMe: boolean;
}

interface EmailThread {
  id: string;
  threadId: string;
  emails: EmailMessage[];
  participants: ThreadParticipant[];
  subject: string;
  preview: string;
  lastDate: string;
  unread: boolean;
  starred: boolean;
  hasAttachments: boolean;
  messageCount: number;
}

interface ThreadsResponse {
  success: boolean;
  threads: EmailThread[];
  pagination: {
    page: number;
    total_threads: number;
    total_pages: number;
    threads_per_page: number;
  };
  pasta: string;
  actualFolder?: string;
}

// ================== THREADING FUNCTIONS ==================

/**
 * Normaliza um Message-ID removendo < > e espaços
 */
function normalizeMessageId(id: string | null | undefined): string {
  if (!id) return '';
  return id.trim().replace(/[<>]/g, '').toLowerCase();
}

/**
 * Normaliza o assunto removendo prefixos RE:/FW:/Fwd:
 */
function normalizeSubject(subject: string): string {
  if (!subject) return '';
  return subject
    .replace(/^(re:|fw:|fwd:|enc:|res:|aw:|wg:)\s*/gi, '')
    .replace(/^(re:|fw:|fwd:|enc:|res:|aw:|wg:)\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai todos os Message-IDs de um email
 */
function getEmailMessageIds(email: EmailMessage): Set<string> {
  const ids = new Set<string>();
  
  const messageId = normalizeMessageId(email.message_id);
  if (messageId) ids.add(messageId);
  
  const inReplyTo = normalizeMessageId(email.in_reply_to);
  if (inReplyTo) ids.add(inReplyTo);
  
  if (email.references && Array.isArray(email.references)) {
    email.references.forEach(ref => {
      const normalizedRef = normalizeMessageId(ref);
      if (normalizedRef) ids.add(normalizedRef);
    });
  }
  
  return ids;
}

/**
 * Verifica se dois emails estão na mesma thread
 */
function areEmailsInSameThread(email1: EmailMessage, email2: EmailMessage): boolean {
  const msgId1 = normalizeMessageId(email1.message_id);
  const msgId2 = normalizeMessageId(email2.message_id);
  
  if (msgId1 && msgId2 && msgId1 === msgId2) return true;
  
  const inReplyTo1 = normalizeMessageId(email1.in_reply_to);
  if (msgId2 && inReplyTo1 === msgId2) return true;
  
  if (email1.references && Array.isArray(email1.references)) {
    for (const ref of email1.references) {
      if (normalizeMessageId(ref) === msgId2) return true;
    }
  }
  
  const inReplyTo2 = normalizeMessageId(email2.in_reply_to);
  if (msgId1 && inReplyTo2 === msgId1) return true;
  
  if (email2.references && Array.isArray(email2.references)) {
    for (const ref of email2.references) {
      if (normalizeMessageId(ref) === msgId1) return true;
    }
  }
  
  const ids1 = getEmailMessageIds(email1);
  const ids2 = getEmailMessageIds(email2);
  
  if (ids1.size === 0 && ids2.size === 0) return false;
  
  for (const id of ids1) {
    if (id && ids2.has(id)) return true;
  }
  
  return false;
}

/**
 * Gera uma chave única para um email
 */
function getEmailUniqueKey(email: EmailMessage): string {
  if (email.message_id && email.message_id.trim()) {
    return `mid:${normalizeMessageId(email.message_id)}`;
  }
  return `${email.pasta || 'unknown'}:${email.id}`;
}

/**
 * Encontra o email raiz de uma thread
 */
function findThreadRootMessageId(threadEmails: EmailMessage[]): string {
  if (threadEmails.length === 0) return '';
  
  const sorted = [...threadEmails].sort((a, b) => 
    new Date(a.data).getTime() - new Date(b.data).getTime()
  );
  
  const allReferencedIds = new Set<string>();
  const allMessageIds = new Set<string>();
  
  for (const email of sorted) {
    const msgId = normalizeMessageId(email.message_id);
    if (msgId) allMessageIds.add(msgId);
    
    if (email.references && email.references.length > 0) {
      const firstRef = normalizeMessageId(email.references[0]);
      if (firstRef) allReferencedIds.add(firstRef);
    }
  }
  
  for (const refId of allReferencedIds) {
    let count = 0;
    for (const email of sorted) {
      if (email.references && email.references.length > 0) {
        const firstRef = normalizeMessageId(email.references[0]);
        if (firstRef === refId) count++;
      }
    }
    if (count > 0) {
      return `thread:${refId}`;
    }
  }
  
  const oldest = sorted[0];
  const oldestMsgId = normalizeMessageId(oldest.message_id);
  if (oldestMsgId) {
    return `thread:${oldestMsgId}`;
  }
  
  const subjectKey = normalizeSubject(oldest.assunto).toLowerCase().slice(0, 50);
  return `subject:${subjectKey}:${new Date(oldest.data).getTime()}`;
}

/**
 * Agrupa emails em threads
 */
function groupEmailsIntoThreads(
  emails: EmailMessage[],
  accountEmail?: string
): EmailThread[] {
  if (!emails || emails.length === 0) return [];
  
  const normalizedAccountEmail = accountEmail?.toLowerCase() || '';
  
  const emailByKey = new Map<string, EmailMessage>();
  emails.forEach(e => emailByKey.set(getEmailUniqueKey(e), e));
  
  const assignedEmails = new Set<string>();
  const threads: EmailThread[] = [];
  
  const sortedEmails = [...emails].sort((a, b) => 
    new Date(a.data).getTime() - new Date(b.data).getTime()
  );
  
  for (const email of sortedEmails) {
    const emailKey = getEmailUniqueKey(email);
    
    if (assignedEmails.has(emailKey)) continue;
    
    const threadEmails = new Set<string>();
    threadEmails.add(emailKey);
    assignedEmails.add(emailKey);
    
    let foundNew = true;
    let iterations = 0;
    const maxIterations = 20;
    
    while (foundNew && iterations < maxIterations) {
      foundNew = false;
      iterations++;
      
      for (const candidate of sortedEmails) {
        const candidateKey = getEmailUniqueKey(candidate);
        
        if (threadEmails.has(candidateKey) || assignedEmails.has(candidateKey)) continue;
        
        for (const keyInThread of threadEmails) {
          const emailInThread = emailByKey.get(keyInThread);
          
          if (emailInThread && areEmailsInSameThread(candidate, emailInThread)) {
            threadEmails.add(candidateKey);
            assignedEmails.add(candidateKey);
            foundNew = true;
            break;
          }
        }
      }
    }
    
    // Fallback por assunto
    if (threadEmails.size === 1) {
      const assuntoNormalizado = normalizeSubject(email.assunto).toLowerCase();
      
      if (assuntoNormalizado.length >= 5) {
        for (const candidate of sortedEmails) {
          const candidateKey = getEmailUniqueKey(candidate);
          
          if (threadEmails.has(candidateKey) || assignedEmails.has(candidateKey)) continue;
          
          const candidateAssunto = normalizeSubject(candidate.assunto).toLowerCase();
          if (candidateAssunto === assuntoNormalizado) {
            threadEmails.add(candidateKey);
            assignedEmails.add(candidateKey);
          }
        }
      }
    }
    
    const threadEmailsList = Array.from(threadEmails)
      .map(key => emailByKey.get(key)!)
      .filter(Boolean)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    if (threadEmailsList.length === 0) continue;
    
    const stableThreadId = findThreadRootMessageId(threadEmailsList);
    
    // Extrair participantes
    const participantsMap = new Map<string, ThreadParticipant>();
    const participantsOrder: string[] = [];
    
    for (const e of threadEmailsList) {
      const senderEmail = e.de.toLowerCase();
      
      if (!participantsMap.has(senderEmail)) {
        participantsMap.set(senderEmail, {
          name: e.de_nome || e.de.split('@')[0],
          email: e.de,
          isMe: senderEmail === normalizedAccountEmail
        });
        participantsOrder.push(senderEmail);
      } else {
        const idx = participantsOrder.indexOf(senderEmail);
        if (idx !== -1) {
          participantsOrder.splice(idx, 1);
        }
        participantsOrder.push(senderEmail);
      }
    }
    
    const lastThreeEmails = participantsOrder.slice(-3);
    const participants = lastThreeEmails.map(email => participantsMap.get(email)!);
    
    const lastEmail = threadEmailsList[threadEmailsList.length - 1];
    
    threads.push({
      id: lastEmail.id,
      threadId: stableThreadId,
      emails: threadEmailsList,
      participants,
      subject: normalizeSubject(lastEmail.assunto) || '(Sem assunto)',
      preview: lastEmail.preview || '',
      lastDate: lastEmail.data,
      unread: threadEmailsList.some(e => !e.lido),
      starred: threadEmailsList.some(e => e.starred),
      hasAttachments: false, // Sem anexos no header fetch
      messageCount: threadEmailsList.length
    });
  }
  
  return threads.sort((a, b) => 
    new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
  );
}

// ================== ORIGINAL FUNCTIONS ==================

// Mapeamento de charsets alternativos para nomes aceitos pelo TextDecoder
const CHARSET_ALIASES: Record<string, string> = {
  'iso-8859-1': 'iso-8859-1',
  'latin1': 'iso-8859-1',
  'latin-1': 'iso-8859-1',
  'windows-1252': 'windows-1252',
  'cp1252': 'windows-1252',
  'iso-8859-15': 'iso-8859-15',
  'utf-8': 'utf-8',
  'utf8': 'utf-8',
  'us-ascii': 'utf-8',
  'ascii': 'utf-8',
  'iso-8859-2': 'iso-8859-2',
  'windows-1250': 'windows-1250',
  'iso-8859-9': 'iso-8859-9',
  'windows-1254': 'windows-1254',
};

function normalizeCharset(charset: string): string {
  const normalized = charset.toLowerCase().trim().replace(/['"]/g, '');
  return CHARSET_ALIASES[normalized] || 'utf-8';
}

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
      console.error('Erro ao decodificar MIME:', e, 'charset:', charsetRaw);
    }
    return match;
  });

  return processed;
}

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

function parseImapResponse(response: string): { tag: string; status: string; data: string[] } {
  const lines = response.split('\r\n').filter(l => l.length > 0);
  const data: string[] = [];
  let tag = '';
  let status = '';
  
  for (const line of lines) {
    if (line.startsWith('*')) {
      data.push(line.substring(2));
    } else if (line.match(/^[A-Z]\d+/)) {
      const parts = line.split(' ');
      tag = parts[0];
      status = parts[1];
    }
  }
  
  return { tag, status, data };
}

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

const FOLDER_ALIASES: Record<string, string[]> = {
  'INBOX': ['INBOX', 'Inbox'],
  'inbox': ['INBOX', 'Inbox'],
  'INBOX.Sent': ['INBOX.Sent', 'Sent', 'SENT', 'Sent Items', 'Sent Messages', 'Enviados', 'Itens Enviados', '[Gmail]/Sent Mail', '[Gmail]/Enviados'],
  'sent': ['INBOX.Sent', 'Sent', 'SENT', 'Sent Items', 'Sent Messages', 'Enviados', 'Itens Enviados', '[Gmail]/Sent Mail', '[Gmail]/Enviados'],
  'INBOX.Drafts': ['INBOX.Drafts', 'Drafts', 'DRAFTS', 'Draft', 'Rascunhos', '[Gmail]/Drafts', '[Gmail]/Rascunhos'],
  'drafts': ['INBOX.Drafts', 'Drafts', 'DRAFTS', 'Draft', 'Rascunhos', '[Gmail]/Drafts', '[Gmail]/Rascunhos'],
  'INBOX.Trash': ['INBOX.Trash', 'Trash', 'TRASH', 'Deleted', 'Deleted Items', 'Deleted Messages', 'Lixeira', '[Gmail]/Trash', '[Gmail]/Lixeira', '[Gmail]/Bin'],
  'trash': ['INBOX.Trash', 'Trash', 'TRASH', 'Deleted', 'Deleted Items', 'Deleted Messages', 'Lixeira', '[Gmail]/Trash', '[Gmail]/Lixeira', '[Gmail]/Bin'],
  'INBOX.spam': ['INBOX.spam', 'INBOX.Spam', 'INBOX.Junk', 'Junk', 'JUNK', 'Spam', 'SPAM', 'Junk E-mail', 'Bulk Mail', 'Bulk', 'Lixo Eletrônico', '[Gmail]/Spam', '[Gmail]/Lixo Eletrônico', 'Junk Email'],
  'spam': ['INBOX.spam', 'INBOX.Spam', 'INBOX.Junk', 'Junk', 'JUNK', 'Spam', 'SPAM', 'Junk E-mail', 'Bulk Mail', 'Bulk', 'Lixo Eletrônico', '[Gmail]/Spam', '[Gmail]/Lixo Eletrônico', 'Junk Email'],
  'Archive': ['Archive', 'ARCHIVE', 'Archived', 'Arquivados', 'All Mail', '[Gmail]/All Mail', '[Gmail]/Todos os e-mails', 'INBOX.Archive'],
  'archive': ['Archive', 'ARCHIVE', 'Archived', 'Arquivados', 'All Mail', '[Gmail]/All Mail', '[Gmail]/Todos os e-mails', 'INBOX.Archive']
};

async function syncImapEmails(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  folder: string,
  limit: number | null
): Promise<{ success: boolean; emails: any[]; error?: string; actualFolder?: string }> {
  try {
    console.log(`Sincronizando IMAP ${host}:${port} pasta ${folder}`);
    
    let conn: Deno.Conn | Deno.TlsConn;
    
    if (ssl) {
      conn = await Deno.connectTls({
        hostname: host,
        port: port,
      });
    } else {
      conn = await Deno.connect({
        hostname: host,
        port: port,
        transport: "tcp",
      });
    }
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(1048576);
    
    let tagCounter = 1;
    const getTag = () => `A${String(tagCounter++).padStart(3, '0')}`;
    
    const readResponse = async (expectedTag: string, timeoutMs = 120000): Promise<string> => {
      let fullResponse = '';
      let complete = false;
      const startTime = Date.now();
      
      while (!complete) {
        if (Date.now() - startTime > timeoutMs) {
          console.log(`[IMAP] Timeout após ${timeoutMs}ms, retornando resposta parcial`);
          break;
        }
        
        const bytesRead = await conn.read(buffer);
        if (bytesRead) {
          const chunk = decoder.decode(buffer.subarray(0, bytesRead));
          fullResponse += chunk;
          
          if (fullResponse.includes(`${expectedTag} OK`) || 
              fullResponse.includes(`${expectedTag} NO`) || 
              fullResponse.includes(`${expectedTag} BAD`)) {
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
    
    await conn.read(buffer);
    
    let response = await sendCommand(`LOGIN "${email}" "${password}"`);
    if (!response.includes('OK')) {
      conn.close();
      return { success: false, emails: [], error: 'Falha na autenticação' };
    }

    const listResponse = await sendCommand('LIST "" "*"');
    const availableFolders: string[] = [];
    const listLines = listResponse.split('\r\n');
    for (const line of listLines) {
      const match = line.match(/\* LIST \([^)]*\) "[^"]+" "?([^"]+)"?/);
      if (match) {
        availableFolders.push(match[1]);
      }
    }
    console.log('Pastas disponíveis:', availableFolders);

    let actualFolder = folder;
    const aliases = FOLDER_ALIASES[folder] || [folder];
    
    let folderFound = false;
    for (const alias of aliases) {
      if (availableFolders.some(f => f.toLowerCase() === alias.toLowerCase())) {
        actualFolder = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase()) || alias;
        folderFound = true;
        break;
      }
    }

    if (!folderFound && folder !== 'INBOX') {
      if (folder === 'Junk' || folder === 'Spam') {
        console.log(`Pasta Spam/Junk não existe neste servidor. Retornando lista vazia.`);
        await sendCommand('LOGOUT');
        conn.close();
        return { success: true, emails: [], actualFolder: folder };
      }
      console.log(`Pasta ${folder} não encontrada, tentando INBOX`);
      actualFolder = 'INBOX';
    }
    
    response = await sendCommand(`SELECT "${actualFolder}"`);
    if (!response.includes('OK')) {
      conn.close();
      return { success: false, emails: [], error: `Pasta ${actualFolder} não encontrada` };
    }
    
    console.log(`Pasta selecionada: ${actualFolder}`);
    
    const existsMatch = response.match(/\* (\d+) EXISTS/);
    const totalMessages = existsMatch ? parseInt(existsMatch[1]) : 0;
    
    console.log(`Total de mensagens na pasta ${actualFolder}: ${totalMessages}`);
    
    if (totalMessages === 0) {
      console.log(`Pasta ${actualFolder} está vazia, retornando lista vazia`);
      await sendCommand('LOGOUT');
      conn.close();
      return { success: true, emails: [], actualFolder };
    }
    
    const start = limit !== null ? Math.max(1, totalMessages - limit + 1) : 1;
    const end = totalMessages;
    const totalToFetch = end - start + 1;
    
    console.log(`Buscando mensagens de ${start} a ${end} (total: ${totalMessages}, fetchando: ${totalToFetch}, limit: ${limit ?? 'ALL'})`);
    
    const emails: any[] = [];
    
    const CHUNK_SIZE = 500;
    
    for (let chunkStart = start; chunkStart <= end; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, end);
      
      console.log(`[IMAP] Buscando chunk ${chunkStart}-${chunkEnd}...`);
      
      response = await sendCommand(`FETCH ${chunkStart}:${chunkEnd} (UID FLAGS BODY.PEEK[HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID REFERENCES IN-REPLY-TO)])`);
      
      const messageParts = response.split(/\* \d+ FETCH/);
      
      for (let i = 1; i < messageParts.length; i++) {
        const part = messageParts[i];
        
        const uidMatch = part.match(/UID (\d+)/);
        if (!uidMatch) {
          continue;
        }
        const uid = uidMatch[1];
        
        const flagsMatch = part.match(/FLAGS \(([^)]*)\)/);
        const flags = flagsMatch ? flagsMatch[1] : '';
        
        const headerMatch = part.match(/BODY\[HEADER\.FIELDS[^\]]*\] \{(\d+)\}\r\n([\s\S]*?)\r\n\)/);
        if (headerMatch) {
          const headerText = headerMatch[2];
          const headers = parseEmailHeaders(headerText);
          
          emails.push({
            uid,
            seqNum: chunkStart + i - 1,
            messageId: headers['message-id'] || `${uid}@${host}`,
            from: headers['from'] || '',
            to: headers['to'] || '',
            cc: headers['cc'] || '',
            subject: headers['subject'] || '(Sem assunto)',
            date: headers['date'] || new Date().toISOString(),
            flags: flags.split(' ').filter(f => f),
            seen: flags.includes('\\Seen'),
            references: headers['references'] || '',
            inReplyTo: headers['in-reply-to'] || ''
          });
        } else {
          const headerStart = part.indexOf('}\r\n');
          if (headerStart !== -1) {
            const headerEnd = part.indexOf('\r\n)', headerStart);
            if (headerEnd !== -1) {
              const headerText = part.substring(headerStart + 3, headerEnd);
              const headers = parseEmailHeaders(headerText);
              
              emails.push({
                uid,
                seqNum: chunkStart + i - 1,
                messageId: headers['message-id'] || `${uid}@${host}`,
                from: headers['from'] || '',
                to: headers['to'] || '',
                cc: headers['cc'] || '',
                subject: headers['subject'] || '(Sem assunto)',
                date: headers['date'] || new Date().toISOString(),
                flags: flags.split(' ').filter(f => f),
                seen: flags.includes('\\Seen'),
                references: headers['references'] || '',
                inReplyTo: headers['in-reply-to'] || ''
              });
            }
          }
        }
      }
      
      console.log(`[IMAP] Chunk ${chunkStart}-${chunkEnd} processado. Total até agora: ${emails.length}`);
    }
    
    await sendCommand('LOGOUT');
    conn.close();
    
    console.log(`Sincronizados ${emails.length} emails da pasta ${actualFolder} (de ${totalMessages} totais)`);
    return { success: true, emails, actualFolder };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro IMAP sync:', errorMessage);
    return { success: false, emails: [], error: errorMessage };
  }
}

/**
 * Formata emails raw do IMAP para o formato EmailMessage
 */
function formatRawEmails(
  rawEmails: any[],
  pastaSistema: string,
  host: string
): EmailMessage[] {
  return rawEmails.map(email => {
    const decodedFrom = decodeMimeHeader(email.from);
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
    
    const decodedTo = decodeMimeHeader(email.to);
    const toEmails = decodedTo.split(',').map((e: string) => e.trim()).filter((e: string) => e);
    
    const decodedCc = email.cc ? decodeMimeHeader(email.cc) : '';
    const decodedSubject = decodeMimeHeader(email.subject);
    
    const referencesStr = email.references ? decodeMimeHeader(email.references) : '';
    const referencesMatches = referencesStr.match(/<[^>]+>/g) || [];
    const references = referencesMatches
      .map((r: string) => r.trim())
      .filter((r: string) => {
        if (!r) return false;
        const inner = r.slice(1, -1);
        if (!inner.includes('@') || inner.length > 248) return false;
        const atIndex = inner.indexOf('@');
        const localPart = inner.substring(0, atIndex);
        if (/[^a-zA-Z0-9._+-]/.test(localPart)) {
          console.log(`[SYNC] Filtrado Message-ID inválido: ${r.substring(0, 50)}...`);
          return false;
        }
        return true;
      });
    
    const inReplyToStr = email.inReplyTo ? decodeMimeHeader(email.inReplyTo).trim() : '';
    const inReplyToMatch = inReplyToStr.match(/<[^>]+>/);
    let inReplyTo = '';
    if (inReplyToMatch) {
      const candidate = inReplyToMatch[0].trim();
      const inner = candidate.slice(1, -1);
      const atIndex = inner.indexOf('@');
      if (atIndex > 0) {
        const localPart = inner.substring(0, atIndex);
        if (!/[^a-zA-Z0-9._+-]/.test(localPart)) {
          inReplyTo = candidate;
        } else {
          console.log(`[SYNC] Filtrado In-Reply-To inválido: ${candidate.substring(0, 50)}...`);
        }
      }
    }
    
    return {
      id: String(email.uid),
      uid: parseInt(email.uid),
      message_id: email.messageId,
      de: fromEmail,
      de_nome: fromName,
      para: toEmails,
      cc: decodedCc ? decodedCc.split(',').map((e: string) => e.trim()) : [],
      assunto: decodedSubject,
      preview: '',
      data: new Date(email.date).toISOString(),
      lido: email.seen,
      starred: email.flags?.includes('\\Flagged') || false,
      pasta: pastaSistema,
      references,
      in_reply_to: inReplyTo
    };
  }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

/**
 * Auto-cadastra remetentes como contatos no CardDAV
 * Executa em background, não bloqueia a resposta
 */
async function autoSaveContactsFromEmails(
  supabaseClient: any,
  contaId: string,
  emails: EmailMessage[],
  accountEmail: string
): Promise<void> {
  try {
    // Filtrar emails que não são meus (não cadastrar a mim mesmo)
    const emailsToSave = emails.filter(e => 
      e.de.toLowerCase() !== accountEmail.toLowerCase()
    );

    if (emailsToSave.length === 0) {
      console.log('[AutoSave] Nenhum remetente para cadastrar');
      return;
    }

    // Extrair remetentes únicos (por email)
    const uniqueSenders = new Map<string, { email: string; nome: string }>();
    for (const email of emailsToSave) {
      const senderEmail = email.de.toLowerCase();
      if (!uniqueSenders.has(senderEmail)) {
        uniqueSenders.set(senderEmail, {
          email: senderEmail,
          nome: email.de_nome || email.de.split('@')[0]
        });
      }
    }

    console.log(`[AutoSave] ${uniqueSenders.size} remetentes únicos para verificar/cadastrar`);

    // Para cada remetente, verificar se já existe e cadastrar se não
    for (const [senderEmail, sender] of uniqueSenders) {
      try {
        // Verificar se contato já existe
        const searchResult = await supabaseClient.functions.invoke('carddav-contacts', {
          body: {
            conta_id: contaId,
            action: 'search',
            query: senderEmail
          }
        });

        const exists = searchResult.data?.contacts?.some((c: any) =>
          c.email?.toLowerCase() === senderEmail ||
          c.emailSecundario?.toLowerCase() === senderEmail
        );

        if (exists) {
          console.log(`[AutoSave] Contato já existe: ${senderEmail}`);
          continue;
        }

        // Criar contato
        const createResult = await supabaseClient.functions.invoke('carddav-contacts', {
          body: {
            conta_id: contaId,
            action: 'create',
            contact: {
              nome: sender.nome,
              email: sender.email
            }
          }
        });

        if (createResult.data?.success) {
          console.log(`[AutoSave] Contato criado: ${sender.nome} <${senderEmail}>`);
        } else {
          console.warn(`[AutoSave] Falha ao criar contato: ${senderEmail}`, createResult.data?.error);
        }
      } catch (err) {
        console.warn(`[AutoSave] Erro ao processar ${senderEmail}:`, err);
      }
    }

    console.log('[AutoSave] Processamento concluído');
  } catch (err) {
    console.error('[AutoSave] Erro geral:', err);
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

    const data: SyncRequest = await req.json();
    const pasta = data.pasta || 'INBOX';
    const limite = data.limite !== undefined ? data.limite : null;
    const page = data.page || 1;
    const threadsPerPage = data.threads_per_page || 20;
    const includeSentForThreading = data.include_sent_for_threading !== false; // default true para inbox
    
    console.log('Sincronizando emails:', { 
      conta_id: data.conta_id, 
      pasta, 
      limite: limite ?? 'ALL',
      page,
      threadsPerPage,
      includeSentForThreading
    });

    // Buscar conta de email
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

    // Descriptografar senha
    const senha = await decryptPassword(conta.senha_criptografada);

    // Sincronizar emails da pasta principal
    const result = await syncImapEmails(
      conta.imap_host,
      conta.imap_port,
      conta.imap_ssl,
      conta.email,
      senha,
      pasta,
      limite
    );

    if (!result.success) {
      throw new Error(result.error || 'Erro ao sincronizar emails');
    }

    // Mapear pasta IMAP para pasta do sistema
    const pastaMap: Record<string, string> = {
      'INBOX': 'inbox',
      'INBOX.Sent': 'sent',
      'Sent': 'sent',
      'SENT': 'sent',
      'Sent Items': 'sent',
      'INBOX.Drafts': 'drafts',
      'Drafts': 'drafts',
      'DRAFTS': 'drafts',
      'INBOX.Trash': 'trash',
      'Trash': 'trash',
      'TRASH': 'trash',
      'Deleted': 'trash',
      'Deleted Items': 'trash',
      'INBOX.spam': 'spam',
      'INBOX.Spam': 'spam',
      'INBOX.Junk': 'spam',
      'Junk': 'spam',
      'JUNK': 'spam',
      'Spam': 'spam',
      'SPAM': 'spam'
    };
    const pastaSistema = pastaMap[result.actualFolder || pasta] || 'inbox';

    // Formatar emails da pasta principal
    let formattedEmails = formatRawEmails(result.emails, pastaSistema, conta.imap_host);
    
    // Se for inbox e threading automático está ativado, buscar também os enviados
    const isInbox = pastaSistema === 'inbox';
    let sentEmails: EmailMessage[] = [];
    
    if (isInbox && includeSentForThreading) {
      console.log('[Threading] Buscando emails enviados para threading completo...');
      
      const sentResult = await syncImapEmails(
        conta.imap_host,
        conta.imap_port,
        conta.imap_ssl,
        conta.email,
        senha,
        'INBOX.Sent',
        50 // Últimos 50 enviados para threading
      );
      
      if (sentResult.success && sentResult.emails.length > 0) {
        sentEmails = formatRawEmails(sentResult.emails, 'sent', conta.imap_host);
        console.log(`[Threading] ${sentEmails.length} emails enviados carregados`);
      }
    }
    
    // Combinar emails para threading (inbox + sent)
    const allEmailsForThreading = isInbox && includeSentForThreading 
      ? [...formattedEmails, ...sentEmails]
      : formattedEmails;
    
    // Agrupar em threads
    const allThreads = groupEmailsIntoThreads(allEmailsForThreading, conta.email);
    
    // Filtrar threads que pertencem à pasta atual
    const filteredThreads = allThreads.filter(thread => 
      thread.emails.some(e => {
        if (pastaSistema === 'inbox') return e.pasta === 'inbox' || !e.pasta;
        if (pastaSistema === 'sent') return e.pasta === 'sent';
        return e.pasta === pastaSistema;
      })
    );
    
    // Aplicar paginação
    const totalThreads = filteredThreads.length;
    const totalPages = Math.ceil(totalThreads / threadsPerPage);
    const startIndex = (page - 1) * threadsPerPage;
    const endIndex = startIndex + threadsPerPage;
    const paginatedThreads = filteredThreads.slice(startIndex, endIndex);
    
    console.log(`[Threading] ${totalThreads} threads totais, página ${page}/${totalPages}, retornando ${paginatedThreads.length} threads`);

    // Atualizar última sincronização
    await supabaseClient
      .from('email_contas')
      .update({ 
        ultima_sincronizacao: new Date().toISOString(),
        verificado: true
      })
      .eq('id', data.conta_id);

    // Auto-cadastrar remetentes como contatos (executa em background)
    // Só executa para inbox e na primeira página para evitar processamento duplicado
    if (pastaSistema === 'inbox' && page === 1 && formattedEmails.length > 0) {
      // Fire and forget - não bloqueia a resposta
      autoSaveContactsFromEmails(supabaseClient, data.conta_id, formattedEmails, conta.email)
        .catch(err => console.error('[AutoSave] Erro em background:', err));
    }

    const response: ThreadsResponse = {
      success: true,
      threads: paginatedThreads,
      pagination: {
        page,
        total_threads: totalThreads,
        total_pages: totalPages,
        threads_per_page: threadsPerPage
      },
      pasta: pastaSistema,
      actualFolder: result.actualFolder
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro ao sincronizar:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
