import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode, encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { processEmailBody } from "./emailHtmlWrapper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Attachment {
  name: string;
  type: string;
  data: string; // base64
}

interface SmtpOverrideConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  password: string;
  from_name?: string;
  from_email?: string;
}

// Interface para o formato PT (nativo)
interface SendEmailRequestPT {
  conta_id?: string;
  conta_email?: string;
  para: string[];
  cc?: string[];
  cco?: string[];
  assunto: string;
  corpo: string;
  html?: boolean;
  anexos?: Attachment[];
  in_reply_to?: string;
  references?: string[];
  smtp_override?: SmtpOverrideConfig;
}

// Interface para o formato EN (legado/compatibilidade)
interface SendEmailRequestEN {
  conta_id?: string;
  conta_email?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  replyTo?: string;
  in_reply_to?: string;
  references?: string[];
  smtp_override?: SmtpOverrideConfig;
}

// Interface unificada interna
interface NormalizedEmailRequest {
  conta_id?: string;
  conta_email?: string;
  para: string[];
  cc: string[];
  cco: string[];
  assunto: string;
  corpo: string;
  html: boolean;
  anexos: Attachment[];
  in_reply_to?: string;
  references?: string[];
  smtp_override?: SmtpOverrideConfig;
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

// Normalizar anexos (aceitar formatos PT e EN)
function normalizeAttachments(rawAttachments: any[]): Attachment[] {
  if (!rawAttachments || !Array.isArray(rawAttachments)) {
    return [];
  }
  
  return rawAttachments.map((att, index) => {
    // Formato PT: { nome, tipo, conteudo, tamanho }
    // Formato EN: { name, type, data }
    const name = att.name || att.nome || `attachment_${index}`;
    const type = att.type || att.tipo || 'application/octet-stream';
    let data = att.data || att.conteudo || '';
    
    // Remover prefixo data:...;base64, se houver
    if (typeof data === 'string' && data.includes(',')) {
      data = data.split(',')[1];
    }
    
    return { name, type, data };
  }).filter(att => att.data && att.data.length > 0);
}

// Normalizar request (aceitar ambos formatos)
function normalizeRequest(data: any): NormalizedEmailRequest {
  const isEnglishFormat = 'to' in data && Array.isArray(data.to);
  
  // Pegar anexos de qualquer campo
  const rawAttachments = data.anexos || data.attachments || [];
  const anexos = normalizeAttachments(rawAttachments);
  
  if (isEnglishFormat) {
    const enData = data as SendEmailRequestEN;
    return {
      conta_id: enData.conta_id,
      conta_email: enData.conta_email,
      para: enData.to,
      cc: enData.cc || [],
      cco: enData.bcc || [],
      assunto: enData.subject,
      corpo: enData.html,
      html: true,
      anexos,
      in_reply_to: enData.in_reply_to,
      references: enData.references,
      smtp_override: enData.smtp_override,
    };
  } else {
    const ptData = data as SendEmailRequestPT;
    return {
      conta_id: ptData.conta_id,
      conta_email: ptData.conta_email,
      para: ptData.para,
      cc: ptData.cc || [],
      cco: ptData.cco || [],
      assunto: ptData.assunto,
      corpo: ptData.corpo,
      html: ptData.html ?? true,
      anexos,
      in_reply_to: ptData.in_reply_to,
      references: ptData.references,
      smtp_override: ptData.smtp_override,
    };
  }
}

// Pasta Sent fixa - sem descoberta dinâmica para evitar overhead
const FIXED_SENT_FOLDER = 'INBOX.Sent';

// Gerar Message-ID único
function generateMessageId(domain: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  return `<${timestamp}.${random}@${domain}>`;
}

// Extrair domínio do email
function extractDomain(email: string): string {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : 'localhost';
}

// Formatar data RFC 2822
function formatRFC2822Date(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} +0000`;
}

// Codificar texto para MIME (RFC 2047) - suporta acentos
function encodeMimeHeader(text: string): string {
  // Verificar se precisa de encoding (contém caracteres não-ASCII)
  if (!/[^\x00-\x7F]/.test(text)) {
    return text;
  }
  
  // Usar Base64 encoding para UTF-8 de forma segura
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  // Converter Uint8Array para string base64 de forma segura (sem spread operator)
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `=?UTF-8?B?${base64}?=`;
}

// Codificar bytes para base64 de forma segura (sem limite de argumentos do spread)
function safeBase64Encode(bytes: Uint8Array): string {
  // Usar chunks para evitar "Maximum call stack size exceeded" com arrays grandes
  const CHUNK_SIZE = 0x8000; // 32KB chunks
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

// Header folding RFC 5322: quebra header longo em múltiplas linhas (max 78 chars idealmente, <998 obrigatório)
function foldHeader(name: string, value: string, maxLineLength: number = 78): string {
  const firstLine = `${name}: `;
  const indent = ' '; // Linhas subsequentes começam com espaço
  
  // Se couber em uma linha, retornar diretamente
  if (firstLine.length + value.length <= maxLineLength) {
    return `${name}: ${value}`;
  }
  
  const lines: string[] = [];
  let currentLine = firstLine;
  
  // Quebrar por espaços (ideal para References que tem message-ids separados por espaço)
  const parts = value.split(/(\s+)/);
  
  for (const part of parts) {
    if (currentLine.length + part.length <= maxLineLength) {
      currentLine += part;
    } else {
      // Linha atual está cheia, começar nova linha
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      // Nova linha começa com indent
      currentLine = indent + part.trimStart();
    }
  }
  
  // Adicionar última linha
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  return lines.join('\r\n');
}

// ========== RFC 5322 Message-ID Validation ==========
// Subconjunto seguro de caracteres para Message-ID (dot-atom-text)
// Permitidos: letras, números, ., -, _, +
// Bloqueados: $, espaço, <, >, quebras de linha, caracteres não-ASCII

/**
 * Verifica se um Message-ID é válido segundo RFC 5322 (subconjunto seguro)
 * Formato esperado: <local-part@domain>
 * 
 * @param messageId - O Message-ID completo incluindo < e >
 * @returns true se válido, false se inválido
 */
function isValidMessageId(messageId: string): boolean {
  if (!messageId || typeof messageId !== 'string') return false;
  
  // Deve ter formato <...>
  if (!messageId.startsWith('<') || !messageId.endsWith('>')) return false;
  
  // Remover < e >
  const inner = messageId.slice(1, -1);
  
  // Tamanho razoável (max 250 caracteres)
  if (inner.length === 0 || inner.length > 248) return false;
  
  // Deve ter exatamente um @
  const atIndex = inner.indexOf('@');
  if (atIndex === -1 || inner.indexOf('@', atIndex + 1) !== -1) return false;
  
  const localPart = inner.substring(0, atIndex);
  const domain = inner.substring(atIndex + 1);
  
  // Local part e domain não podem estar vazios
  if (!localPart || !domain) return false;
  
  // Subconjunto seguro para local-part: letras, números, ., -, _, +, =
  // O caractere = é permitido pelo RFC 5322 e usado pelo Gmail em Message-IDs
  // BLOQUEADO: $ (causa erro em cPanel/Dovecot), espaços, <, >, caracteres especiais
  const safeLocalPartRegex = /^[a-zA-Z0-9._+=-]+$/;
  if (!safeLocalPartRegex.test(localPart)) {
    return false;
  }
  
  // Domain: letras, números, ., -
  const safeDomainRegex = /^[a-zA-Z0-9.-]+$/;
  if (!safeDomainRegex.test(domain)) {
    return false;
  }
  
  // Não pode começar ou terminar com . ou -
  if (localPart.startsWith('.') || localPart.endsWith('.') ||
      domain.startsWith('.') || domain.endsWith('.') ||
      domain.startsWith('-') || domain.endsWith('-')) {
    return false;
  }
  
  return true;
}

/**
 * Sanitiza um Message-ID para torná-lo compatível com RFC 5322
 * Tenta corrigir IDs com caracteres inválidos substituindo-os
 * 
 * @param messageId - O Message-ID a sanitizar
 * @returns O Message-ID sanitizado ou null se não for possível recuperar
 */
function sanitizeMessageId(messageId: string): string | null {
  if (!messageId || typeof messageId !== 'string') return null;
  
  // Normalizar: garantir formato <...>
  let normalized = messageId.trim();
  if (!normalized.startsWith('<')) normalized = '<' + normalized;
  if (!normalized.endsWith('>')) normalized = normalized + '>';
  
  // Se já é válido, retornar como está
  if (isValidMessageId(normalized)) {
    return normalized;
  }
  
  // Tentar sanitizar
  const inner = normalized.slice(1, -1);
  const atIndex = inner.indexOf('@');
  
  // Sem @ não dá para salvar
  if (atIndex === -1) return null;
  
  let localPart = inner.substring(0, atIndex);
  let domain = inner.substring(atIndex + 1);
  
  // Substituir caracteres problemáticos no local-part
  // $ -> _ (caso específico do bug reportado)
  // Preservar = que é válido no RFC 5322 e usado pelo Gmail
  // Outros caracteres especiais -> _
  localPart = localPart.replace(/[^a-zA-Z0-9._+=-]/g, '_');
  
  // Remover pontos duplicados
  localPart = localPart.replace(/\.{2,}/g, '.');
  
  // Remover . do início e fim
  localPart = localPart.replace(/^\.+|\.+$/g, '');
  
  // Limpar domain
  domain = domain.replace(/[^a-zA-Z0-9.-]/g, '');
  domain = domain.replace(/^[.-]+|[.-]+$/g, '');
  
  // Se ficou muito curto ou vazio, não dá
  if (!localPart || !domain || localPart.length < 1 || domain.length < 3) {
    return null;
  }
  
  const sanitized = `<${localPart}@${domain}>`;
  
  // Verificar se agora é válido
  if (isValidMessageId(sanitized)) {
    return sanitized;
  }
  
  return null;
}

// Sanitizar e limitar References para evitar headers gigantes
// REGRA: Máximo 2 IDs (primeiro da conversa + último)
function sanitizeReferences(refs: string[] | undefined, maxRefs: number = 2): string[] {
  if (!refs || refs.length === 0) return [];
  
  // Deduplicate
  const seen = new Set<string>();
  const unique: string[] = [];
  let removedCount = 0;
  const removedIds: string[] = [];
  
  for (const ref of refs) {
    const cleaned = ref.trim();
    if (!cleaned) continue;
    
    // Normalizar para formato <...>
    let normalized = cleaned;
    if (!normalized.startsWith('<')) normalized = '<' + normalized;
    if (!normalized.endsWith('>')) normalized = normalized + '>';
    
    // Tentar sanitizar o Message-ID
    const sanitized = sanitizeMessageId(normalized);
    
    if (!sanitized) {
      removedCount++;
      removedIds.push(normalized.substring(0, 60));
      continue;
    }
    
    if (!seen.has(sanitized)) {
      seen.add(sanitized);
      unique.push(sanitized);
    }
  }
  
  // Log detalhado para debug
  if (removedCount > 0) {
    console.log(`[SMTP] Filtrados ${removedCount} Message-IDs inválidos:`);
    removedIds.forEach(id => console.log(`  - ${id}...`));
  }
  
  // REGRA: Manter apenas primeiro + último (máx 2)
  if (unique.length > 2) {
    console.log(`[SMTP] Truncando References: mantendo primeiro e último de ${unique.length}`);
    return [unique[0], unique[unique.length - 1]];
  }
  
  console.log(`[SMTP] References válidos: ${unique.length}`);
  return unique;
}

// Normalizar line endings para CRLF
function normalizeCRLF(text: string): string {
  // Primeiro converter \r\n para placeholder, depois \r e \n soltos para \r\n
  return text
    .replace(/\r\n/g, '\n')  // Normalizar para \n
    .replace(/\r/g, '\n')     // Converter \r soltos
    .replace(/\n/g, '\r\n');  // Converter tudo para \r\n
}

// Dot-stuffing RFC 5321 seção 4.5.2 (versão robusta com regex)
function applyDotStuffing(msg: string): string {
  // Linhas que começam com "." precisam de "." extra
  // Usar regex para capturar início de linha (após CRLF ou início da string)
  return msg.replace(/(^|\r\n)\./g, '$1..');
}

// Escrita completa no socket (writeAll) - evita partial writes em mensagens grandes
async function writeAll(conn: Deno.Conn, data: Uint8Array): Promise<void> {
  let written = 0;
  while (written < data.length) {
    const n = await conn.write(data.subarray(written));
    if (n === null || n === 0) {
      throw new Error('Conexão fechada durante escrita');
    }
    written += n;
  }
}

// Construir mensagem MIME completa para IMAP APPEND (agora com suporte a anexos)
function buildMimeMessage(
  from: string,
  to: string[],
  cc: string[],
  subject: string,
  body: string,
  isHtml: boolean,
  messageId: string,
  inReplyTo?: string,
  references?: string[],
  date?: Date,
  attachments?: Attachment[]
): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const dateStr = formatRFC2822Date(date || new Date());
  const hasAttachments = attachments && attachments.length > 0;
  
  // IMPORTANTE: Processar corpo HTML para garantir compatibilidade com Gmail/Outlook
  const processedBody = isHtml ? processEmailBody(body, true) : body;
  
  let headers = '';
  headers += `Message-ID: ${messageId}\r\n`;
  headers += `Date: ${dateStr}\r\n`;
  headers += `From: <${from}>\r\n`;
  headers += `To: ${to.join(', ')}\r\n`;
  
  if (cc.length > 0) {
    headers += `Cc: ${cc.join(', ')}\r\n`;
  }
  
  headers += `Subject: ${encodeMimeHeader(subject)}\r\n`;
  headers += `MIME-Version: 1.0\r\n`;
  
  // Headers de threading - com validação RFC 5322
  if (inReplyTo) {
    const sanitizedInReplyTo = sanitizeMessageId(inReplyTo);
    if (sanitizedInReplyTo) {
      headers += `In-Reply-To: ${sanitizedInReplyTo}\r\n`;
    } else {
      console.log(`[SMTP] In-Reply-To inválido removido: ${inReplyTo.substring(0, 60)}...`);
    }
  }
  
  if (references && references.length > 0) {
    // sanitizeReferences já retorna IDs no formato correto e validados
    const validRefs = sanitizeReferences(references);
    if (validRefs.length > 0) {
      headers += `References: ${validRefs.join(' ')}\r\n`;
    }
  }
  
  // Se tem anexos, usar multipart/mixed
  if (hasAttachments) {
    headers += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
    headers += `\r\n`;
    
    // Parte do corpo
    headers += `--${boundary}\r\n`;
    headers += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n`;
    headers += `Content-Transfer-Encoding: base64\r\n`;
    headers += `\r\n`;
    
    const encoder = new TextEncoder();
    const bodyBytes = encoder.encode(processedBody);
    const bodyBase64 = safeBase64Encode(bodyBytes);
    const bodyLines = bodyBase64.match(/.{1,76}/g) || [];
    headers += bodyLines.join('\r\n') + '\r\n';
    
    // Partes dos anexos
    for (const att of attachments!) {
      headers += `\r\n--${boundary}\r\n`;
      headers += `Content-Type: ${att.type}; name="${att.name}"\r\n`;
      headers += `Content-Disposition: attachment; filename="${att.name}"\r\n`;
      headers += `Content-Transfer-Encoding: base64\r\n`;
      headers += `\r\n`;
      const attLines = att.data.match(/.{1,76}/g) || [];
      headers += attLines.join('\r\n') + '\r\n';
    }
    
    headers += `\r\n--${boundary}--\r\n`;
  } else {
    // Sem anexos - mensagem simples
    headers += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n`;
    headers += `Content-Transfer-Encoding: base64\r\n`;
    headers += `\r\n`;
    
    // Codificar corpo em base64
    const encoder = new TextEncoder();
    const bodyBytes = encoder.encode(processedBody);
    const bodyBase64 = safeBase64Encode(bodyBytes);
    
    // Quebrar em linhas de 76 caracteres (padrão MIME)
    const bodyLines = bodyBase64.match(/.{1,76}/g) || [];
    headers += bodyLines.join('\r\n') + '\r\n';
  }
  
  return headers;
}

// Timeout para operações de rede - otimizado para evitar wall clock limit
const IMAP_TIMEOUT_MS = 15000; // 15 segundos para operações normais
const IMAP_APPEND_FINAL_TIMEOUT_MS = 25000; // 25 segundos para resposta final APPEND

async function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error(`Timeout ${operation} após ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Ler uma linha IMAP com buffer otimizado (mais rápido que byte-a-byte)
async function readImapLine(conn: Deno.Conn): Promise<string> {
  const chunks: Uint8Array[] = [];
  const buffer = new Uint8Array(512); // Buffer maior para menos syscalls
  let totalLength = 0;
  
  while (true) {
    const n = await conn.read(buffer);
    if (n === null || n === 0) {
      throw new Error('Conexão IMAP fechada');
    }
    
    // Copiar dados lidos
    const chunk = buffer.slice(0, n);
    chunks.push(chunk);
    totalLength += n;
    
    // Verificar se temos CRLF no final
    if (totalLength >= 2) {
      // Montar os bytes finais para verificar CRLF
      const lastChunk = chunks[chunks.length - 1];
      const lastByte = lastChunk[lastChunk.length - 1];
      let secondLastByte: number;
      
      if (lastChunk.length >= 2) {
        secondLastByte = lastChunk[lastChunk.length - 2];
      } else if (chunks.length >= 2) {
        const prevChunk = chunks[chunks.length - 2];
        secondLastByte = prevChunk[prevChunk.length - 1];
      } else {
        secondLastByte = 0;
      }
      
      // Linha termina com \r\n
      if (secondLastByte === 0x0D && lastByte === 0x0A) {
        break;
      }
    }
    
    // Proteção contra linhas muito longas
    if (totalLength > 16384) {
      throw new Error('Resposta IMAP muito longa');
    }
  }
  
  // Concatenar chunks
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return new TextDecoder().decode(result);
}

// Salvar email na pasta Sent via IMAP APPEND (otimizado para evitar timeout)
async function appendToSentFolder(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  mimeMessage: string
): Promise<{ success: boolean; error?: string; uid?: number; literalSent?: boolean }> {
  let conn: Deno.Conn | Deno.TlsConn | null = null;
  let literalWasSent = false; // Flag para saber se o servidor recebeu os dados
  
  try {
    console.log(`[IMAP APPEND] Conectando a ${host}:${port}`);
    
    // Conexão com timeout
    if (ssl) {
      conn = await withTimeout(
        Deno.connectTls({ hostname: host, port }),
        IMAP_TIMEOUT_MS,
        'conexão TLS IMAP'
      );
    } else {
      conn = await withTimeout(
        Deno.connect({ hostname: host, port, transport: "tcp" }),
        IMAP_TIMEOUT_MS,
        'conexão TCP IMAP'
      );
    }
    
    const encoder = new TextEncoder();
    
    let tagCounter = 1;
    const getTag = () => `A${String(tagCounter++).padStart(3, '0')}`;
    
    // Enviar comando e ler resposta simples
    const sendCommand = async (cmd: string, timeout: number = IMAP_TIMEOUT_MS): Promise<string> => {
      const tag = getTag();
      const fullCmd = `${tag} ${cmd}\r\n`;
      const logCmd = cmd.length > 80 ? cmd.substring(0, 80) + '...' : cmd;
      console.log(`[IMAP APPEND] -> ${tag} ${logCmd}`);
      await writeAll(conn!, encoder.encode(fullCmd));
      
      // Ler até encontrar resposta tagged
      let fullResponse = '';
      let attempts = 0;
      while (attempts < 50) {
        attempts++;
        const line = await withTimeout(readImapLine(conn!), timeout, 'leitura IMAP');
        fullResponse += line;
        console.log(`[IMAP APPEND] <- ${line.trim()}`);
        
        if (line.startsWith(`${tag} OK`) || line.startsWith(`${tag} NO`) || line.startsWith(`${tag} BAD`)) {
          break;
        }
        if (line.startsWith('+ ') || line.trim() === '+') {
          break;
        }
      }
      return fullResponse;
    };
    
    // Ler greeting
    const greeting = await withTimeout(readImapLine(conn), IMAP_TIMEOUT_MS, 'greeting IMAP');
    console.log(`[IMAP APPEND] Greeting: ${greeting.trim()}`);
    
    // Login
    const loginResponse = await sendCommand(`LOGIN "${email}" "${password.replace(/"/g, '\\"')}"`);
    if (!loginResponse.includes('OK')) {
      throw new Error(`Falha na autenticação IMAP: ${loginResponse.trim()}`);
    }
    console.log('[IMAP APPEND] Login OK');

    // OTIMIZAÇÃO: Usar pasta fixa INBOX.Sent sem LIST (economia ~1-2s)
    const sentFolder = FIXED_SENT_FOLDER;
    console.log(`[IMAP APPEND] Usando pasta Sent fixa: ${sentFolder}`);

    // Calcular tamanho da mensagem COM o CRLF final
    const mimeWithCRLF = mimeMessage.endsWith('\r\n') ? mimeMessage : mimeMessage + '\r\n';
    const messageBytes = encoder.encode(mimeWithCRLF);
    const messageSize = messageBytes.length;
    
    const appendTag = getTag();
    const appendCmd = `${appendTag} APPEND "${sentFolder}" (\\Seen) {${messageSize}}\r\n`;
    
    console.log(`[IMAP APPEND] -> ${appendTag} APPEND "${sentFolder}" (\\Seen) {${messageSize}}`);
    await writeAll(conn, encoder.encode(appendCmd));
    
    // Aguardar continuação (+)
    let continuationReceived = false;
    let attempts = 0;
    
    while (!continuationReceived && attempts < 10) {
      attempts++;
      const line = await withTimeout(readImapLine(conn), IMAP_TIMEOUT_MS, 'continuação IMAP');
      console.log(`[IMAP APPEND] <- ${line.trim()}`);
      
      if (line.startsWith('+')) {
        continuationReceived = true;
        console.log('[IMAP APPEND] Servidor aguardando literal...');
      } else if (line.includes('NO') || line.includes('BAD')) {
        throw new Error(`Servidor rejeitou APPEND: ${line.trim()}`);
      }
    }
    
    if (!continuationReceived) {
      throw new Error('Servidor não enviou resposta de continuação (+)');
    }
    
    // Enviar o literal (mensagem MIME)
    console.log(`[IMAP APPEND] Enviando ${messageSize} bytes...`);
    await writeAll(conn, messageBytes);
    
    // CRÍTICO: Enviar CRLF final para encerrar o comando APPEND (RFC 3501)
    // Sem isso, o servidor Dovecot fica aguardando mais dados e causa timeout
    await writeAll(conn, encoder.encode('\r\n'));
    console.log('[IMAP APPEND] CRLF final enviado');
    
    literalWasSent = true; // Dados enviados - servidor provavelmente salvou
    
    // Aguardar resposta final com timeout reduzido
    let finalResponse = '';
    let appendedUid: number | undefined = undefined;
    attempts = 0;
    const maxFinalAttempts = 10;
    
    console.log(`[IMAP APPEND] Aguardando resposta final (timeout: ${IMAP_APPEND_FINAL_TIMEOUT_MS / 1000}s)...`);
    
    while (attempts < maxFinalAttempts) {
      attempts++;
      try {
        const line = await withTimeout(
          readImapLine(conn), 
          IMAP_APPEND_FINAL_TIMEOUT_MS / maxFinalAttempts,
          'resposta final IMAP'
        );
        finalResponse += line;
        console.log(`[IMAP APPEND] <- ${line.trim()}`);
        
        // Extrair UID do APPENDUID (RFC 4315)
        const uidMatch = line.match(/\[APPENDUID\s+\d+\s+(\d+)\]/i);
        if (uidMatch) {
          appendedUid = parseInt(uidMatch[1], 10);
          console.log(`[IMAP APPEND] UID extraído: ${appendedUid}`);
        }
        
        if (line.startsWith(`${appendTag} OK`)) {
          console.log('[IMAP APPEND] Email salvo na pasta Sent com sucesso');
          break;
        } else if (line.startsWith(`${appendTag} NO`) || line.startsWith(`${appendTag} BAD`)) {
          throw new Error(`APPEND falhou: ${line.trim()}`);
        }
      } catch (lineErr) {
        if (attempts >= maxFinalAttempts) {
          // Timeout mas literal foi enviado - servidor provavelmente salvou
          if (literalWasSent) {
            console.log('[IMAP APPEND] Timeout aguardando confirmação, mas literal foi enviado');
            throw new Error('TIMEOUT_AFTER_LITERAL');
          }
          throw lineErr;
        }
      }
    }
    
    if (!finalResponse.includes(`${appendTag} OK`)) {
      if (literalWasSent) {
        throw new Error('TIMEOUT_AFTER_LITERAL');
      }
      throw new Error(`Resposta inesperada do APPEND: ${finalResponse.substring(0, 200)}`);
    }
    
    // Logout rápido (sem esperar resposta)
    try {
      const logoutTag = getTag();
      await writeAll(conn, encoder.encode(`${logoutTag} LOGOUT\r\n`));
    } catch {
      // Ignorar erro no LOGOUT
    }
    
    conn.close();
    
    return { success: true, uid: appendedUid, literalSent: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[IMAP APPEND] Erro:', errorMessage);
    if (conn) {
      try { conn.close(); } catch {}
    }
    
    // Se o erro é timeout após enviar literal, retornar sucesso parcial
    if (errorMessage === 'TIMEOUT_AFTER_LITERAL' && literalWasSent) {
      console.log('[IMAP APPEND] Sucesso parcial: literal enviado, timeout na confirmação');
      return { success: true, error: 'Timeout aguardando confirmação (email provavelmente salvo)', literalSent: true };
    }
    
    return { success: false, error: errorMessage, literalSent: literalWasSent };
  }
}

// Ler uma linha SMTP byte a byte (evita consumir bytes do TLS handshake)
async function readSmtpLine(conn: Deno.Conn): Promise<string> {
  const bytes: number[] = [];
  const buffer = new Uint8Array(1);
  
  while (true) {
    const n = await conn.read(buffer);
    if (n === null || n === 0) {
      throw new Error('Conexão fechada pelo servidor SMTP');
    }
    
    bytes.push(buffer[0]);
    
    // Linha termina com \r\n
    if (bytes.length >= 2 && bytes[bytes.length - 2] === 0x0D && bytes[bytes.length - 1] === 0x0A) {
      break;
    }
    
    // Proteção contra linhas muito longas
    if (bytes.length > 8192) {
      throw new Error('Resposta SMTP muito longa');
    }
  }
  
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Ler resposta SMTP completa (pode ser multiline: 250-... 250 ...)
async function readSmtpResponse(conn: Deno.Conn): Promise<{ code: string; lines: string[] }> {
  const lines: string[] = [];
  let code = '';
  
  while (true) {
    const line = await readSmtpLine(conn);
    lines.push(line.trim());
    
    // Código são os 3 primeiros caracteres
    if (!code && line.length >= 3) {
      code = line.substring(0, 3);
    }
    
    // Se o 4º caractere for espaço (ou fim), é a última linha
    // Ex: "250 OK" vs "250-PIPELINING"
    if (line.length < 4 || line[3] !== '-') {
      break;
    }
  }
  
  return { code, lines };
}

// Enviar email via SMTP usando conexão nativa Deno (sem nodemailer)
async function sendSmtpEmail(
  host: string,
  port: number,
  authEmail: string,
  password: string,
  to: string[],
  cc: string[],
  bcc: string[],
  subject: string,
  body: string,
  isHtml: boolean,
  attachments: Attachment[] = [],
  inReplyTo?: string,
  references?: string[],
  fromEmail?: string,
  fromName?: string
): Promise<{ success: boolean; error?: string; messageId?: string; stage?: string }> {
  let conn: Deno.Conn | Deno.TlsConn | null = null;
  let stage = 'INIT';
  
  try {
    const cleanAuthEmail = authEmail.trim().toLowerCase();
    const cleanFromEmail = (fromEmail || authEmail).trim().toLowerCase();
    const emailValidationRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailValidationRegex.test(cleanAuthEmail)) {
      throw new Error(`Email SMTP inválido: ${cleanAuthEmail}`);
    }
    if (!emailValidationRegex.test(cleanFromEmail)) {
      throw new Error(`Email remetente inválido: ${cleanFromEmail}`);
    }
    
    console.log(`[SMTP] Conectando a ${host}:${port} como ${cleanAuthEmail}`);
    console.log(`[SMTP] From: "${cleanFromEmail}"`);

    // Porta 465 = TLS implícito (conexão direta TLS)
    // Porta 587/25 = STARTTLS (conexão TCP, depois upgrade)
    const useImplicitTls = port === 465;
    
    const encoder = new TextEncoder();
    const domain = extractDomain(cleanAuthEmail);
    
    stage = 'CONNECT';
    if (useImplicitTls) {
      console.log('[SMTP] Usando TLS implícito (porta 465)');
      conn = await Deno.connectTls({ hostname: host, port });
    } else {
      console.log(`[SMTP] Usando STARTTLS (porta ${port})`);
      conn = await Deno.connect({ hostname: host, port, transport: "tcp" });
    }
    
    const sendCommand = async (cmd: string): Promise<{ code: string; lines: string[] }> => {
      await conn!.write(encoder.encode(cmd + '\r\n'));
      return await readSmtpResponse(conn!);
    };
    
    // Ler greeting
    stage = 'GREETING';
    const greeting = await readSmtpResponse(conn);
    console.log('[SMTP] Greeting:', greeting.lines[0]);
    if (!greeting.code.startsWith('2')) {
      throw new Error(`SMTP greeting falhou: ${greeting.lines.join(' ')}`);
    }
    
    // EHLO inicial
    stage = 'EHLO';
    let ehloResp = await sendCommand(`EHLO ${domain}`);
    console.log('[SMTP] EHLO response code:', ehloResp.code);
    if (ehloResp.code !== '250') {
      throw new Error(`EHLO falhou: ${ehloResp.lines.join(' ')}`);
    }
    
    // Se não for TLS implícito, fazer STARTTLS
    if (!useImplicitTls) {
      stage = 'STARTTLS';
      console.log('[SMTP] Enviando STARTTLS...');
      const startTlsResp = await sendCommand('STARTTLS');
      console.log('[SMTP] STARTTLS response:', startTlsResp.code, startTlsResp.lines[0]);
      
      if (!startTlsResp.code.startsWith('2')) {
        throw new Error(`STARTTLS falhou: ${startTlsResp.lines.join(' ')}`);
      }
      
      // Upgrade para TLS (agora é seguro, lemos só a linha de resposta)
      stage = 'TLS_UPGRADE';
      console.log('[SMTP] Fazendo upgrade TLS...');
      conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: host });
      console.log('[SMTP] Upgrade TLS concluído');
      
      // EHLO novamente após TLS (obrigatório)
      stage = 'EHLO_POST_TLS';
      ehloResp = await sendCommand(`EHLO ${domain}`);
      console.log('[SMTP] EHLO pós-TLS code:', ehloResp.code);
      if (ehloResp.code !== '250') {
        throw new Error(`EHLO pós-TLS falhou: ${ehloResp.lines.join(' ')}`);
      }
    }
    
    // AUTH LOGIN
    stage = 'AUTH';
    console.log('[SMTP] Iniciando AUTH LOGIN...');
    let authResp = await sendCommand('AUTH LOGIN');
    if (!authResp.code.startsWith('3')) {
      throw new Error(`AUTH LOGIN falhou: ${authResp.lines.join(' ')}`);
    }
    
    // Username (base64)
    authResp = await sendCommand(btoa(cleanAuthEmail));
    if (!authResp.code.startsWith('3')) {
      throw new Error(`AUTH username falhou: ${authResp.lines.join(' ')}`);
    }
    
    // Password (base64)
    authResp = await sendCommand(btoa(password));
    if (!authResp.code.startsWith('2')) {
      throw new Error(`Autenticação falhou (credenciais inválidas?): ${authResp.lines.join(' ')}`);
    }
    console.log('[SMTP] Autenticação OK');
    
    // MAIL FROM
    stage = 'MAIL_FROM';
    const mailFromResp = await sendCommand(`MAIL FROM:<${cleanFromEmail}>`);
    if (!mailFromResp.code.startsWith('2')) {
      throw new Error(`MAIL FROM falhou: ${mailFromResp.lines.join(' ')}`);
    }
    
    // RCPT TO para cada destinatário
    stage = 'RCPT_TO';
    const allRecipients = [...to, ...cc, ...bcc];
    for (const recipient of allRecipients) {
      const rcptResp = await sendCommand(`RCPT TO:<${recipient.trim()}>`);
      if (!rcptResp.code.startsWith('2')) {
        throw new Error(`RCPT TO falhou para ${recipient}: ${rcptResp.lines.join(' ')}`);
      }
    }
    
    // DATA
    stage = 'DATA';
    const dataResp = await sendCommand('DATA');
    if (!dataResp.code.startsWith('3')) {
      throw new Error(`DATA falhou: ${dataResp.lines.join(' ')}`);
    }
    
    // Gerar Message-ID
    const messageId = generateMessageId(domain);
    
    // Construir mensagem MIME
    stage = 'BUILD_MESSAGE';
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const hasAttachments = attachments.length > 0;
    
    let message = '';
    message += `Message-ID: ${messageId}\r\n`;
    message += `Date: ${formatRFC2822Date(new Date())}\r\n`;
    message += `From: ${fromName ? `${encodeMimeHeader(fromName)} <${cleanFromEmail}>` : `<${cleanFromEmail}>`}\r\n`;
    message += `To: ${to.join(', ')}\r\n`;
    if (cc.length > 0) {
      message += `Cc: ${cc.join(', ')}\r\n`;
    }
    message += `Subject: ${encodeMimeHeader(subject)}\r\n`;
    message += `MIME-Version: 1.0\r\n`;
    
    // Headers de threading com validação RFC 5322 e folding para evitar linhas > 998 chars
    if (inReplyTo) {
      // IMPORTANTE: Sanitizar In-Reply-To para evitar erro SMTP com IDs inválidos
      const sanitizedInReplyTo = sanitizeMessageId(inReplyTo);
      if (sanitizedInReplyTo) {
        message += `In-Reply-To: ${sanitizedInReplyTo}\r\n`;
      } else {
        console.log(`[SMTP] In-Reply-To inválido removido (caminho SMTP): ${inReplyTo.substring(0, 60)}...`);
      }
    }
    
    // Sanitizar e aplicar folding no References
    const sanitizedRefs = sanitizeReferences(references);
    if (sanitizedRefs.length > 0) {
      const refsValue = sanitizedRefs.join(' ');
      const foldedRefs = foldHeader('References', refsValue);
      message += foldedRefs + '\r\n';
      console.log(`[SMTP] References: ${sanitizedRefs.length} IDs, header length: ${foldedRefs.length}`);
    }
    
    // IMPORTANTE: Processar corpo HTML para garantir compatibilidade com Gmail/Outlook
    const processedBody = isHtml ? processEmailBody(body, true) : body;
    
    if (hasAttachments) {
      message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
      message += `\r\n`;
      message += `--${boundary}\r\n`;
      message += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n`;
      message += `Content-Transfer-Encoding: base64\r\n`;
      message += `\r\n`;
      
      const bodyBytes = new TextEncoder().encode(processedBody);
      const bodyBase64 = safeBase64Encode(bodyBytes);
      const bodyLines = bodyBase64.match(/.{1,76}/g) || [];
      message += bodyLines.join('\r\n') + '\r\n';
      
      // Anexos
      for (const att of attachments) {
        message += `\r\n--${boundary}\r\n`;
        message += `Content-Type: ${att.type}; name="${att.name}"\r\n`;
        message += `Content-Disposition: attachment; filename="${att.name}"\r\n`;
        message += `Content-Transfer-Encoding: base64\r\n`;
        message += `\r\n`;
        const attLines = att.data.match(/.{1,76}/g) || [];
        message += attLines.join('\r\n') + '\r\n';
      }
      message += `\r\n--${boundary}--\r\n`;
    } else {
      message += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n`;
      message += `Content-Transfer-Encoding: base64\r\n`;
      message += `\r\n`;
      
      const bodyBytes = new TextEncoder().encode(processedBody);
      const bodyBase64 = safeBase64Encode(bodyBytes);
      const bodyLines = bodyBase64.match(/.{1,76}/g) || [];
      message += bodyLines.join('\r\n') + '\r\n';
    }
    
    // Normalizar CRLF + dot-stuffing
    stage = 'SEND_MESSAGE';
    const normalizedMessage = normalizeCRLF(message);
    const stuffedMessage = applyDotStuffing(normalizedMessage);
    
    // Log de diagnóstico
    const messageBytes = encoder.encode(stuffedMessage + '\r\n.\r\n');
    console.log(`[SMTP] Enviando mensagem (${messageBytes.length} bytes, CRLF normalizado, dot-stuffing aplicado)...`);
    
    // Usar writeAll para garantir escrita completa
    await writeAll(conn, messageBytes);
    
    const sendResp = await readSmtpResponse(conn);
    console.log('[SMTP] Send response:', sendResp.code, sendResp.lines[0]);
    if (!sendResp.code.startsWith('2')) {
      throw new Error(`Envio da mensagem falhou: ${sendResp.lines.join(' ')}`);
    }
    
    console.log('[SMTP] Email enviado com sucesso');
    
    // QUIT
    stage = 'QUIT';
    try {
      await sendCommand('QUIT');
    } catch {
      // Ignorar erro no QUIT
    }
    
    if (conn) {
      try { conn.close(); } catch {}
    }
    
    return { success: true, messageId };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error(`[SMTP] Erro na etapa ${stage}:`, errorMessage);
    if (conn) {
      try { conn.close(); } catch {}
    }
    return { success: false, error: `[${stage}] ${errorMessage}`, stage };
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

    // Extrair user ID do token JWT e mapear para usuarios.id
    let usuarioResponsavelId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
        if (!claimsError && claimsData?.claims?.sub) {
          const supabaseAuthId = claimsData.claims.sub as string;
          console.log('[email-send] Auth ID (Supabase):', supabaseAuthId);
          
          // Buscar o ID real da tabela usuarios usando supabase_id
          const { data: usuarioData, error: usuarioError } = await supabaseClient
            .from('usuarios')
            .select('id')
            .eq('supabase_id', supabaseAuthId)
            .single();
          
          if (!usuarioError && usuarioData?.id) {
            usuarioResponsavelId = usuarioData.id;
            console.log('[email-send] Usuario ID mapeado:', usuarioResponsavelId);
          } else {
            console.warn('[email-send] Usuario não encontrado para supabase_id:', supabaseAuthId);
            // Fallback: usar o auth ID se não encontrar mapeamento
            usuarioResponsavelId = supabaseAuthId;
          }
        }
      } catch (authErr) {
        console.warn('[email-send] Não foi possível extrair user ID do token:', authErr);
      }
    }

    // ===== TRATAMENTO DE JSON VAZIO/MALFORMADO =====
    let rawData: any;
    try {
      const bodyText = await req.text();
      console.log('[email-send] Body recebido, tamanho:', bodyText.length, 'bytes');
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('[email-send] Erro: Body vazio recebido');
        return new Response(
          JSON.stringify({ success: false, error: 'Request body está vazio' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      rawData = JSON.parse(bodyText);
    } catch (parseErr) {
      const parseError = parseErr instanceof Error ? parseErr.message : 'Erro de parsing';
      console.error('[email-send] Erro ao parsear JSON:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: `JSON inválido: ${parseError}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Normalizar request (aceitar PT e EN)
    const data = normalizeRequest(rawData);
    
    // ===== VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS =====
    const missingFields: string[] = [];
    if (!data.para || data.para.length === 0) missingFields.push('para/to (destinatários)');
    if (!data.assunto || data.assunto.trim() === '') missingFields.push('assunto/subject');
    if (!data.corpo || data.corpo.trim() === '') missingFields.push('corpo/html (conteúdo)');
    if (!data.conta_id && !data.conta_email) missingFields.push('conta_id ou conta_email');
    
    if (missingFields.length > 0) {
      console.error('[email-send] Campos obrigatórios faltando:', missingFields);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log('[email-send] Request normalizado:', {
      conta_id: data.conta_id,
      conta_email: data.conta_email,
      para: data.para,
      assunto: data.assunto,
      corpo_length: data.corpo?.length || 0,
      in_reply_to: data.in_reply_to,
      references_count: data.references?.length || 0,
      usuario_responsavel: usuarioResponsavelId
    });

    // Resolver conta SMTP
    let conta: any = null;
    let senha = '';
    let cleanContaEmail = '';
    let fromName = '';

    // Prioridade 0: smtp_override enviado pela função chamadora
    if (data.smtp_override) {
      const override = data.smtp_override;
      cleanContaEmail = override.user.trim().toLowerCase();
      senha = override.password;
      fromName = override.from_name || '';
      conta = {
        id: 'smtp-override',
        email: override.from_email || override.user,
        smtp_host: override.host,
        smtp_port: override.port,
        smtp_ssl: override.secure ?? (override.port === 465),
        imap_host: override.host,
        imap_port: 993,
        imap_ssl: true,
        ativo: true,
      };
      console.log('[email-send] Usando smtp_override:', {
        auth_user: cleanContaEmail,
        from_email: conta.email,
        host: conta.smtp_host,
        port: conta.smtp_port,
      });
    }

    // Prioridade 1: conta_id
    if (!conta && data.conta_id) {
      const { data: contaById, error: contaByIdError } = await supabaseClient
        .from('email_contas')
        .select('*')
        .eq('id', data.conta_id)
        .single();
      
      if (!contaByIdError && contaById) {
        conta = contaById;
      }
    }
    
    // Prioridade 2: conta_email
    if (!conta && data.conta_email) {
      const { data: contaByEmail, error: contaByEmailError } = await supabaseClient
        .from('email_contas')
        .select('*')
        .eq('email', data.conta_email)
        .eq('ativo', true)
        .single();
      
      if (!contaByEmailError && contaByEmail) {
        conta = contaByEmail;
      }
    }
    
    // Prioridade 3: primeira conta ativa (fallback)
    if (!conta) {
      const { data: contaFallback, error: contaFallbackError } = await supabaseClient
        .from('email_contas')
        .select('*')
        .eq('ativo', true)
        .limit(1)
        .single();
      
      if (!contaFallbackError && contaFallback) {
        conta = contaFallback;
        console.log('[email-send] Usando conta fallback:', conta.email);
      }
    }

    if (!conta) {
      throw new Error('Conta de email não encontrada. Informe conta_id, conta_email ou smtp_override.');
    }

    if (!conta.ativo) {
      throw new Error('Conta de email está inativa');
    }

    if (!cleanContaEmail) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const emailMatch = conta.email.match(emailRegex);
      cleanContaEmail = emailMatch ? emailMatch[0].toLowerCase() : conta.email.trim().replace(/[,;\s]/g, '');
    }
    
    console.log('[email-send] Conta selecionada:', cleanContaEmail);

    if (!senha) {
      senha = await decryptPassword(conta.senha_criptografada);
    }

    const fromEmail = conta.email;

    // Enviar email via SMTP com suporte a threading
    const result = await sendSmtpEmail(
      conta.smtp_host,
      conta.smtp_port,
      cleanContaEmail,
      senha,
      data.para,
      data.cc,
      data.cco,
      data.assunto,
      data.corpo,
      data.html,
      data.anexos,
      data.in_reply_to,
      data.references,
      fromEmail,
      fromName
    );

    if (!result.success) {
      // Log do erro de envio
      try {
        await supabaseClient.from('logs_email').insert({
          uid: null,
          erro: result.error || 'Erro ao enviar email',
          html: data.corpo,
          pasta: 'INBOX.Sent',
          assunto: data.assunto,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent'),
          destinatario: data.para.join(', '),
          tipo_de_acao: 'erro_envio',
          conta_email_id: conta.id,
          usuario_responsavel: usuarioResponsavelId
        });

        // Também registrar na tabela erros
        await supabaseClient.from('erros').insert({
          titulo: 'Erro ao enviar email',
          descricao: result.error || 'Erro ao enviar email',
          categoria: 'email_send',
          nivel: 'error',
          pagina: '/admin/email',
          dados_extra: { conta_email: conta.email, destinatarios: data.para }
        });
      } catch (logErr) {
        console.error('[email-send] Erro ao registrar log de erro:', logErr);
      }

      throw new Error(result.error || 'Erro ao enviar email');
    }

    // Determinar tipo de ação para o log
    const tipoAcao = data.in_reply_to ? 'respondido' : 'enviado';

    // Salvar email na pasta Sent via IMAP APPEND - SÍNCRONO (ANTES de registrar logs)
    // CORREÇÃO: Executar com await para garantir que não seja cancelado
    console.log('[email-send] Salvando na pasta Enviados via IMAP APPEND...');
    
    const mimeMessage = buildMimeMessage(
      fromEmail,
      data.para,
      data.cc,
      data.assunto,
      data.corpo,
      data.html,
      result.messageId!,
      data.in_reply_to,
      data.references,
      new Date(),
      data.anexos
    );
    
    // Executar IMAP APPEND de forma SÍNCRONA (com await)
    // Edge Functions cancelam operações assíncronas quando a resposta é enviada
    let sentFolderSaved = false;
    let imapError: string | null = null;
    let appendedUid: number | null = null;
    
    try {
      const appendResult = await appendToSentFolder(
        conta.imap_host,
        conta.imap_port,
        conta.imap_ssl,
        cleanContaEmail,
        senha,
        mimeMessage
      );
      
      sentFolderSaved = appendResult.success;
      imapError = appendResult.error || null;
      appendedUid = appendResult.uid || null;
      
      if (appendResult.success) {
        console.log(`[email-send] Email salvo na pasta Enviados com sucesso (UID: ${appendedUid || 'não retornado'})`);
      } else {
        console.warn('[email-send] Falha ao salvar no IMAP Sent:', appendResult.error);
      }
    } catch (imapErr) {
      imapError = imapErr instanceof Error ? imapErr.message : 'Erro desconhecido IMAP';
      console.error('[email-send] Erro ao salvar na pasta Enviados:', imapError);
    }

    // Registrar log do email enviado - AGORA com o UID do IMAP
    try {
      // Log principal (destinatários principais)
      await supabaseClient.from('logs_email').insert({
        uid: appendedUid,
        erro: imapError,
        html: data.corpo,
        pasta: 'INBOX.Sent',
        assunto: data.assunto,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
        destinatario: data.para.join(', '),
        tipo_de_acao: tipoAcao,
        conta_email_id: conta.id,
        usuario_responsavel: usuarioResponsavelId
      });

      // Log para CC (se houver)
      if (data.cc && data.cc.length > 0) {
        await supabaseClient.from('logs_email').insert({
          uid: appendedUid,
          erro: null,
          html: data.corpo,
          pasta: 'INBOX.Sent',
          assunto: data.assunto,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent'),
          destinatario: data.cc.join(', '),
          tipo_de_acao: 'cc',
          conta_email_id: conta.id,
          usuario_responsavel: usuarioResponsavelId
        });
      }

      // Log para CCO (se houver)
      if (data.cco && data.cco.length > 0) {
        await supabaseClient.from('logs_email').insert({
          uid: appendedUid,
          erro: null,
          html: data.corpo,
          pasta: 'INBOX.Sent',
          assunto: data.assunto,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent'),
          destinatario: data.cco.join(', '),
          tipo_de_acao: 'cco',
          conta_email_id: conta.id,
          usuario_responsavel: usuarioResponsavelId
        });
      }

      console.log(`[email-send] Log de email registrado com sucesso (UID: ${appendedUid || 'null'})`);
    } catch (logErr) {
      console.error('[email-send] Erro ao registrar log de email (não bloqueia envio):', logErr);
    }

    console.log('[email-send] Email enviado com sucesso via SMTP');

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
        sentFolderSaved,
        uid: appendedUid,
        imapError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-send] Erro:', errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
