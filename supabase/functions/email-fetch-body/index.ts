import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept, prefer, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FetchBodyRequest {
  conta_id: string;
  uid: string;
  pasta: string;
}

interface BodyPart {
  partId: string;
  type: string;
  subtype: string;
  encoding: string;
  size: number;
  charset?: string;
  filename?: string;
  isAttachment: boolean;
  contentId?: string;
  isInline?: boolean;
  disposition?: 'inline' | 'attachment' | 'unknown';
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
  'iso-8859-15': 'iso-8859-15',
  'iso-8859-2': 'iso-8859-2',
  'windows-1250': 'windows-1250',
};

function normalizeCharset(charset: string): string {
  const normalized = charset.toLowerCase().trim().replace(/['"]/g, '');
  return CHARSET_ALIASES[normalized] || 'utf-8';
}

// Decodificar texto MIME (quoted-printable e base64) com suporte a charset correto
function decodeMimeText(text: string): string {
  if (!text) return '';
  
  let decoded = text.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (_, charsetRaw, encoding, encoded) => {
    try {
      const charset = normalizeCharset(charsetRaw);
      
      if (encoding.toUpperCase() === 'B') {
        const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
        try {
          return new TextDecoder(charset).decode(bytes);
        } catch {
          return new TextDecoder('utf-8').decode(bytes);
        }
      } else if (encoding.toUpperCase() === 'Q') {
        const qpDecoded = encoded
          .replace(/_/g, ' ')
          .replace(/=([0-9A-F]{2})/gi, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
        // Converter para bytes e decodificar com charset correto
        const bytes = new Uint8Array(qpDecoded.length);
        for (let i = 0; i < qpDecoded.length; i++) {
          bytes[i] = qpDecoded.charCodeAt(i);
        }
        try {
          return new TextDecoder(charset).decode(bytes);
        } catch {
          return new TextDecoder('utf-8').decode(bytes);
        }
      }
    } catch {
      return encoded;
    }
    return encoded;
  });
  
  return decoded;
}

// Decodificar quoted-printable com charset correto
function decodeQuotedPrintable(text: string, charset: string = 'utf-8'): string {
  const normalizedCharset = normalizeCharset(charset);
  const decoded = text
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  try {
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    try {
      return new TextDecoder(normalizedCharset).decode(bytes);
    } catch {
      return new TextDecoder('utf-8').decode(bytes);
    }
  } catch {
    return decoded;
  }
}

// Decodificar base64 com charset correto
function decodeBase64(text: string, charset: string = 'utf-8'): string {
  const normalizedCharset = normalizeCharset(charset);
  try {
    const cleaned = text.replace(/\r?\n/g, '');
    const bytes = Uint8Array.from(atob(cleaned), c => c.charCodeAt(0));
    try {
      return new TextDecoder(normalizedCharset).decode(bytes);
    } catch {
      return new TextDecoder('utf-8').decode(bytes);
    }
  } catch {
    return text;
  }
}

// Parsear BODYSTRUCTURE para extrair partes
function parseBodyStructure(response: string): BodyPart[] {
  const parts: BodyPart[] = [];
  
  // Extrair a linha BODYSTRUCTURE
  const bodyStructMatch = response.match(/BODYSTRUCTURE\s+(\([\s\S]+\))\s*\)/i);
  if (!bodyStructMatch) {
    console.log('[email-fetch-body] BODYSTRUCTURE não encontrado na resposta');
    return parts;
  }
  
  const structStr = bodyStructMatch[1];
  console.log('[email-fetch-body] BODYSTRUCTURE raw:', structStr.substring(0, 500));
  
  // Parse recursivo da estrutura
  parseStructureParts(structStr, '', parts);
  
  return parts;
}

// Parse recursivo de partes MIME
function parseStructureParts(str: string, prefix: string, parts: BodyPart[]): void {
  // Limpar a string
  str = str.trim();
  if (!str.startsWith('(')) return;
  
  // Verificar se é uma parte simples ou multipart
  // Multipart começa com (( - lista de partes
  // Parte simples começa com ("tipo"
  
  const inner = str.slice(1, -1).trim();
  
  if (inner.startsWith('(')) {
    // É multipart - contém sub-partes
    let depth = 0;
    let partIndex = 1;
    let start = 0;
    
    for (let i = 0; i < inner.length; i++) {
      if (inner[i] === '(') {
        if (depth === 0) start = i;
        depth++;
      } else if (inner[i] === ')') {
        depth--;
        if (depth === 0) {
          const subPart = inner.substring(start, i + 1);
          const partId = prefix ? `${prefix}.${partIndex}` : String(partIndex);
          parseStructureParts(subPart, partId, parts);
          partIndex++;
        }
      }
    }
  } else {
    // É uma parte simples - extrair informações
    // Formato: "type" "subtype" (params) id desc encoding size [linhas] [md5] [disp] [lang] [location]
    const tokens = tokenizeBodyPart(inner);
    
    if (tokens.length >= 7) {
      const type = (tokens[0] || '').replace(/"/g, '').toLowerCase();
      const subtype = (tokens[1] || '').replace(/"/g, '').toLowerCase();
      const params = tokens[2]; // Pode ser NIL ou lista de parâmetros
      const encoding = (tokens[5] || '').replace(/"/g, '').toLowerCase();
      const size = parseInt(tokens[6]) || 0;
      
      // Extrair charset dos parâmetros
      let charset = 'utf-8';
      if (typeof params === 'string' && params.includes('charset')) {
        const charsetMatch = params.match(/"charset"\s+"([^"]+)"/i);
        if (charsetMatch) charset = charsetMatch[1].toLowerCase();
      }
      
      // Extrair Content-ID (campo "id" do BODYSTRUCTURE, tokens[3])
      let contentId = '';
      if (tokens[3] && typeof tokens[3] === 'string' && tokens[3] !== 'NIL') {
        contentId = tokens[3].replace(/"/g, '').replace(/[<>]/g, '');
      }
      
      // Verificar se é anexo e extrair disposition
      let isAttachment = false;
      let isInline = false;
      let disposition: 'inline' | 'attachment' | 'unknown' = 'unknown';
      let filename = '';
      
      // Procurar disposition nos tokens
      for (let i = 7; i < tokens.length; i++) {
        const token = tokens[i];
        if (typeof token === 'string') {
          const tokenLower = token.toLowerCase();
          
          // Detectar disposition
          if (tokenLower.includes('("inline"') || tokenLower.includes('(inline') || tokenLower.match(/^\("?inline"?\s/i)) {
            disposition = 'inline';
            isInline = true;
          } else if (tokenLower.includes('("attachment"') || tokenLower.includes('(attachment') || tokenLower.match(/^\("?attachment"?\s/i)) {
            disposition = 'attachment';
            isAttachment = true;
          }
          
          // Extrair filename
          const fnMatch = token.match(/"filename"\s+"([^"]+)"/i);
          if (fnMatch) filename = decodeMimeText(fnMatch[1]);
          
          const nameMatch = token.match(/"name"\s+"([^"]+)"/i);
          if (nameMatch && !filename) filename = decodeMimeText(nameMatch[1]);
        }
      }
      
      // Também verificar params para name
      if (typeof params === 'string' && !filename) {
        const nameMatch = params.match(/"name"\s+"([^"]+)"/i);
        if (nameMatch) filename = decodeMimeText(nameMatch[1]);
      }
      
      // Heurística para imagens inline: se tem contentId e é imagem, provavelmente é inline
      if (contentId && type === 'image' && disposition === 'unknown') {
        isInline = true;
        disposition = 'inline';
      }
      
      // Se tem filename e não é texto e não foi marcado como inline, considerar anexo
      if (filename && type !== 'text' && !isInline) {
        isAttachment = true;
        if (disposition === 'unknown') disposition = 'attachment';
      }
      
      const partId = prefix || '1';
      
      parts.push({
        partId,
        type,
        subtype,
        encoding,
        size,
        charset,
        filename,
        isAttachment,
        contentId,
        isInline,
        disposition
      });
    }
  }
}

// Tokenizar uma parte do body structure
function tokenizeBodyPart(str: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let depth = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    if (char === '"' && str[i - 1] !== '\\') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '(' && !inQuotes) {
      if (depth === 0 && current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      depth++;
      current += char;
    } else if (char === ')' && !inQuotes) {
      current += char;
      depth--;
      if (depth === 0) {
        tokens.push(current.trim());
        current = '';
      }
    } else if ((char === ' ' || char === '\r' || char === '\n') && !inQuotes && depth === 0) {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    tokens.push(current.trim());
  }
  
  return tokens;
}

// Mapeamento de nomes de pasta alternativos
const FOLDER_ALIASES: Record<string, string[]> = {
  'INBOX': ['INBOX', 'Inbox'],
  'Sent': ['Sent', 'SENT', 'Sent Items', 'Sent Messages', 'INBOX.Sent', 'Enviados', 'Itens Enviados'],
  'INBOX.Sent': ['INBOX.Sent', 'Sent', 'SENT', 'Sent Items', 'Sent Messages', 'Enviados', 'Itens Enviados'],
  'Drafts': ['Drafts', 'DRAFTS', 'Draft', 'INBOX.Drafts', 'Rascunhos'],
  'INBOX.Drafts': ['INBOX.Drafts', 'Drafts', 'DRAFTS', 'Draft', 'Rascunhos'],
  'Trash': ['Trash', 'TRASH', 'Deleted', 'Deleted Items', 'Deleted Messages', 'INBOX.Trash', 'Lixeira'],
  'INBOX.Trash': ['INBOX.Trash', 'Trash', 'TRASH', 'Deleted', 'Deleted Items', 'Deleted Messages', 'Lixeira'],
  'Junk': ['Junk', 'JUNK', 'Spam', 'SPAM', 'Junk E-mail', 'Bulk Mail', 'INBOX.Junk', 'INBOX.Spam', 'INBOX.spam', 'Bulk', 'Lixo Eletrônico'],
  'INBOX.Spam': ['INBOX.Spam', 'INBOX.spam', 'INBOX.Junk', 'Junk', 'JUNK', 'Spam', 'SPAM', 'Lixo Eletrônico'],
  'INBOX.spam': ['INBOX.spam', 'INBOX.Spam', 'INBOX.Junk', 'Junk', 'JUNK', 'Spam', 'SPAM', 'Lixo Eletrônico']
};

// Buscar corpo do email via IMAP com otimização para emails grandes
async function fetchEmailBody(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  folder: string,
  uid: string
): Promise<{ success: boolean; corpo: string; anexos: any[]; error?: string }> {
  try {
    console.log(`[email-fetch-body] Conectando IMAP ${host}:${port} pasta ${folder} uid ${uid}`);
    
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
    const buffer = new Uint8Array(262144); // 256KB buffer (reduzido)
    
    let tagCounter = 1;
    const getTag = () => `A${String(tagCounter++).padStart(3, '0')}`;
    
    // Helper para ler resposta completa
    const readResponse = async (expectedTag: string, maxBytes: number = 262144): Promise<string> => {
      let fullResponse = '';
      let complete = false;
      let totalBytes = 0;
      
      while (!complete && totalBytes < maxBytes) {
        const bytesRead = await conn.read(buffer);
        if (bytesRead) {
          totalBytes += bytesRead;
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
    
    // Helper para enviar comando
    const sendCommand = async (cmd: string, maxBytes: number = 262144): Promise<string> => {
      const tag = getTag();
      const fullCmd = `${tag} ${cmd}\r\n`;
      await conn.write(encoder.encode(fullCmd));
      return await readResponse(tag, maxBytes);
    };
    
    // Ler saudação inicial
    await conn.read(buffer);
    
    // LOGIN
    const loginResp = await sendCommand(`LOGIN "${email}" "${password}"`);
    if (!loginResp.includes('OK')) {
      conn.close();
      return { success: false, corpo: '', anexos: [], error: 'Falha no login' };
    }

    // Listar pastas disponíveis
    const listResponse = await sendCommand('LIST "" "*"');
    const availableFolders: string[] = [];
    const listLines = listResponse.split('\r\n');
    for (const line of listLines) {
      const match = line.match(/\* LIST \([^)]*\) "[^"]+" "?([^"]+)"?/);
      if (match) {
        availableFolders.push(match[1]);
      }
    }
    console.log('[email-fetch-body] Pastas disponíveis:', availableFolders);

    // Encontrar pasta correta
    let actualFolder = folder;
    const aliases = FOLDER_ALIASES[folder] || [folder];
    
    for (const alias of aliases) {
      const found = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase());
      if (found) {
        actualFolder = found;
        break;
      }
    }
    
    console.log(`[email-fetch-body] Usando pasta: ${actualFolder}`);
    
    // SELECT pasta
    const selectResp = await sendCommand(`SELECT "${actualFolder}"`);
    if (!selectResp.includes('OK')) {
      conn.close();
      return { success: false, corpo: '', anexos: [], error: `Pasta ${actualFolder} não encontrada` };
    }
    
    // PASSO 1: Buscar BODYSTRUCTURE para analisar a estrutura do email
    console.log('[email-fetch-body] Buscando BODYSTRUCTURE...');
    const structCmd = `UID FETCH ${uid} (BODYSTRUCTURE)`;
    const structResp = await sendCommand(structCmd);
    
    const parts = parseBodyStructure(structResp);
    console.log('[email-fetch-body] Partes encontradas:', parts.map(p => ({ id: p.partId, type: `${p.type}/${p.subtype}`, attach: p.isAttachment })));
    
    // Separar partes de texto, inline e anexos reais
    const textParts = parts.filter(p => p.type === 'text' && !p.isAttachment);
    const inlineParts = parts.filter(p => p.isInline && p.type === 'image');
    // Anexos reais: marcados como attachment E NÃO são inline
    const attachmentParts = parts.filter(p => (p.isAttachment || (p.type !== 'text' && p.filename)) && !p.isInline);
    
    console.log('[email-fetch-body] Partes inline:', inlineParts.map(p => ({ id: p.partId, contentId: p.contentId, filename: p.filename })));
    console.log('[email-fetch-body] Anexos reais:', attachmentParts.map(p => ({ id: p.partId, filename: p.filename })));
    
    // Se não encontrou partes via BODYSTRUCTURE, tentar busca simples (para emails não-multipart)
    let html = '';
    let text = '';
    
    if (textParts.length === 0 && parts.length === 0) {
      // Email simples, buscar BODY[TEXT] diretamente
      console.log('[email-fetch-body] Nenhuma parte encontrada, buscando BODY[TEXT]...');
      const simpleCmd = `UID FETCH ${uid} (BODY.PEEK[TEXT] BODY.PEEK[HEADER.FIELDS (Content-Type Content-Transfer-Encoding)])`;
      const simpleResp = await sendCommand(simpleCmd, 524288); // 512KB para texto
      
      // Extrair headers
      const ctMatch = simpleResp.match(/Content-Type:\s*([^;\r\n]+)([^\r\n]*)/i);
      const contentType = ctMatch?.[1]?.toLowerCase() || 'text/plain';
      const ctParams = ctMatch?.[2] || '';
      const charsetMatch = ctParams.match(/charset=["']?([^"';\s]+)["']?/i);
      const charset = charsetMatch?.[1]?.toLowerCase() || 'utf-8';
      const encodingMatch = simpleResp.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i);
      const encoding = encodingMatch?.[1]?.toLowerCase()?.trim() || '';
      
      // Extrair body
      const literalMatch = simpleResp.match(/\{(\d+)\}\r\n/);
      if (literalMatch) {
        const literalStart = simpleResp.indexOf(literalMatch[0]) + literalMatch[0].length;
        const literalSize = parseInt(literalMatch[1]);
        let body = simpleResp.substring(literalStart, literalStart + literalSize);
        
        // Decodificar
        if (encoding === 'quoted-printable') {
          body = decodeQuotedPrintable(body, charset);
        } else if (encoding === 'base64') {
          body = decodeBase64(body, charset);
        }
        
        if (contentType.includes('text/html')) {
          html = body;
        } else {
          text = body;
        }
      }
    } else {
      // PASSO 2: Buscar apenas as partes de texto identificadas
      for (const part of textParts) {
        console.log(`[email-fetch-body] Buscando parte ${part.partId} (${part.type}/${part.subtype})...`);
        
        const partCmd = `UID FETCH ${uid} (BODY.PEEK[${part.partId}])`;
        const partResp = await sendCommand(partCmd, 524288); // 512KB por parte de texto
        
        // Extrair conteúdo
        const literalMatch = partResp.match(/\{(\d+)\}\r\n/);
        if (literalMatch) {
          const literalStart = partResp.indexOf(literalMatch[0]) + literalMatch[0].length;
          const literalSize = parseInt(literalMatch[1]);
          let body = partResp.substring(literalStart, literalStart + literalSize);
          
          // Decodificar conforme encoding
          if (part.encoding === 'quoted-printable') {
            body = decodeQuotedPrintable(body, part.charset || 'utf-8');
          } else if (part.encoding === 'base64') {
            body = decodeBase64(body, part.charset || 'utf-8');
          }
          
          if (part.subtype === 'html') {
            html = body;
          } else if (part.subtype === 'plain' && !text) {
            text = body;
          }
        }
      }
    }
    
    // ===== RESOLVER IMAGENS INLINE (cid:) =====
    // Mapa para converter cid:xxx para data:xxx no HTML
    const cidMap = new Map<string, string>();
    
    // Buscar conteúdo de cada parte inline e converter para data URL
    for (const inlinePart of inlineParts) {
      // Pular imagens muito grandes (> 500KB)
      if (inlinePart.size > 500000) {
        console.log(`[email-fetch-body] Pulando inline grande: ${inlinePart.filename} (${inlinePart.size} bytes)`);
        continue;
      }
      
      try {
        console.log(`[email-fetch-body] Buscando inline: partId=${inlinePart.partId}, contentId=${inlinePart.contentId}, filename=${inlinePart.filename}`);
        
        // Buscar conteúdo da parte inline
        const fetchInlineCmd = `UID FETCH ${uid} (BODY.PEEK[${inlinePart.partId}])`;
        const fetchInlineResp = await sendCommand(fetchInlineCmd, 1048576); // 1MB max
        
        if (!fetchInlineResp || fetchInlineResp.includes('BAD ') || fetchInlineResp.includes('NO ')) {
          console.log(`[email-fetch-body] Falha ao buscar inline ${inlinePart.partId}: ${fetchInlineResp?.substring(0, 100)}`);
          continue;
        }
        
        // Extrair conteúdo usando o tamanho do literal {SIZE}
        const literalMatch = fetchInlineResp.match(/\{(\d+)\}\r?\n/);
        let content = '';
        
        if (literalMatch) {
          const literalSize = parseInt(literalMatch[1]);
          const startIdx = fetchInlineResp.indexOf(literalMatch[0]) + literalMatch[0].length;
          content = fetchInlineResp.substring(startIdx, startIdx + literalSize);
          console.log(`[email-fetch-body] Extraído por literal: size=${literalSize}, actual=${content.length}`);
        } else {
          // Fallback: tentar extrair o conteúdo entre BODY[X] e o final
          const bodyMatch = fetchInlineResp.match(/BODY\[\d+(?:\.\d+)*\]\s+(.+?)(?:\s*\)\s*[\r\n]*[A-Z0-9]+ OK|\s*\)[\r\n]*$)/s);
          if (bodyMatch) {
            content = bodyMatch[1].trim();
            console.log(`[email-fetch-body] Extraído por fallback: length=${content.length}`);
          }
        }
        
        if (!content || content.length === 0) {
          console.log(`[email-fetch-body] Nenhum conteúdo extraído para ${inlinePart.filename}`);
          continue;
        }
        
        // Processar encoding
        const encoding = inlinePart.encoding?.toLowerCase() || '';
        let base64Content = '';
        
        if (encoding === 'base64') {
          // Conteúdo já está em base64, só limpar whitespace
          base64Content = content.replace(/[\r\n\s]/g, '');
        } else if (encoding === 'quoted-printable') {
          // Decodificar quoted-printable e converter para base64
          const decoded = content
            .replace(/=\r?\n/g, '') // Soft line breaks
            .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
          // Converter para base64
          const bytes = new Uint8Array(decoded.length);
          for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i);
          }
          base64Content = btoa(String.fromCharCode(...bytes));
        } else {
          // Sem encoding especificado - verificar se parece base64
          const cleaned = content.replace(/[\r\n\s]/g, '');
          if (/^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length > 20) {
            // Parece ser base64
            base64Content = cleaned;
          } else {
            // Tentar converter para base64
            try {
              base64Content = btoa(content);
            } catch (e) {
              try {
                base64Content = btoa(unescape(encodeURIComponent(content)));
              } catch (e2) {
                console.log(`[email-fetch-body] Falha ao converter inline para base64: ${inlinePart.filename}`);
                continue;
              }
            }
          }
        }
        
        // Validar que temos base64 válido
        if (!base64Content || base64Content.length === 0) {
          console.log(`[email-fetch-body] Base64 vazio para ${inlinePart.filename}`);
          continue;
        }
        
        // Criar data URL
        const mimeType = `${inlinePart.type}/${inlinePart.subtype}`.toLowerCase();
        const dataUrl = `data:${mimeType};base64,${base64Content}`;
        
        console.log(`[email-fetch-body] Data URL criada para ${inlinePart.filename}: length=${dataUrl.length}, preview=${dataUrl.substring(0, 80)}...`);
        
        // Mapear por contentId (várias variações)
        if (inlinePart.contentId) {
          const cid = inlinePart.contentId;
          cidMap.set(cid, dataUrl);
          cidMap.set(cid.toLowerCase(), dataUrl);
          // Também sem a parte @domain
          const shortCid = cid.split('@')[0];
          if (shortCid !== cid) {
            cidMap.set(shortCid, dataUrl);
            cidMap.set(shortCid.toLowerCase(), dataUrl);
          }
        }
        
        // Também mapear pelo filename
        if (inlinePart.filename) {
          cidMap.set(inlinePart.filename, dataUrl);
          cidMap.set(inlinePart.filename.toLowerCase(), dataUrl);
        }
        
        console.log(`[email-fetch-body] CID map agora tem ${cidMap.size} entradas`);
      } catch (inlineErr) {
        console.error(`[email-fetch-body] Erro ao buscar inline ${inlinePart.filename}:`, inlineErr);
      }
    }
    
    console.log(`[email-fetch-body] CID Map criado com ${cidMap.size} entradas`);
    
    // LOGOUT
    await sendCommand('LOGOUT');
    conn.close();
    
    // Substituir referências cid: no HTML por data: URLs
    if (html && cidMap.size > 0) {
      html = html.replace(/src\s*=\s*["']cid:([^"']+)["']/gi, (match, cid) => {
        // Limpar o CID (remover < > se houver)
        const cleanCid = cid.replace(/[<>]/g, '').trim();
        
        // Tentar encontrar no mapa (várias variações)
        const dataUrl = cidMap.get(cleanCid) || 
                        cidMap.get(cleanCid.toLowerCase()) ||
                        cidMap.get(cleanCid.split('@')[0]) ||
                        cidMap.get(cleanCid.split('@')[0].toLowerCase());
        
        if (dataUrl) {
          console.log(`[email-fetch-body] Substituindo cid:${cleanCid} por data URL`);
          return `src="${dataUrl}"`;
        }
        
        console.log(`[email-fetch-body] CID não encontrado no mapa: ${cleanCid}`);
        return match; // Manter original se não encontrar
      });
    }
    
    // Montar lista de anexos (apenas anexos reais, não inline)
    const anexos = attachmentParts.map((part, idx) => ({
      id: `anexo-${idx + 1}`,
      partId: part.partId,
      nome: part.filename || `anexo_${idx + 1}`,
      tamanho: part.size,
      tipo: `${part.type}/${part.subtype}`,
      contentId: part.contentId || undefined,
      isInline: false
    }));
    
    // Também incluir inline parts com flag (para referência/debug, mas não serão exibidos como anexos)
    const inlineAnexos = inlineParts.map((part, idx) => ({
      id: `inline-${idx + 1}`,
      partId: part.partId,
      nome: part.filename || `inline_${idx + 1}`,
      tamanho: part.size,
      tipo: `${part.type}/${part.subtype}`,
      contentId: part.contentId || undefined,
      isInline: true
    }));
    
    // Combinar anexos reais + inline (frontend vai filtrar os inline)
    const todosAnexos = [...anexos, ...inlineAnexos];
    
    // Priorizar HTML, fallback para texto
    let corpo = '';
    if (html) {
      corpo = html;
    } else if (text) {
      corpo = `<pre style="white-space: pre-wrap; font-family: inherit;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    }
    
    console.log(`[email-fetch-body] Sucesso! Corpo: ${corpo.length} chars, Anexos reais: ${anexos.length}, Inline: ${inlineAnexos.length}, CIDs resolvidos: ${cidMap.size}`);
    
    return { success: true, corpo, anexos: todosAnexos };
    
  } catch (err: any) {
    console.error('[email-fetch-body] Erro IMAP:', err);
    return { success: false, corpo: '', anexos: [], error: err.message };
  }
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Cliente com service_role para operações de cache
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const data: FetchBodyRequest = await req.json();
    console.log("[email-fetch-body] Request:", { conta_id: data.conta_id, uid: data.uid, pasta: data.pasta });

    if (!data.conta_id || !data.uid || !data.pasta) {
      return new Response(
        JSON.stringify({ success: false, error: "Parâmetros obrigatórios: conta_id, uid, pasta" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Buscar conta
    const { data: conta, error: contaError } = await supabaseClient
      .from("email_contas")
      .select("*")
      .eq("id", data.conta_id)
      .single();

    if (contaError || !conta) {
      console.error("[email-fetch-body] Conta não encontrada:", contaError);
      return new Response(
        JSON.stringify({ success: false, error: "Conta de email não encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Descriptografar senha
    let senha: string;
    try {
      senha = await decryptPassword(conta.senha_criptografada);
      if (!senha) throw new Error("Senha vazia");
    } catch (e) {
      console.error("[email-fetch-body] Erro ao descriptografar senha:", e);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao descriptografar credenciais" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Mapear pasta - apenas normalizar nomes simples, manter INBOX.X como estão
    const pastaMap: Record<string, string> = {
      'INBOX': 'INBOX',
      'inbox': 'INBOX',
      'Sent': 'INBOX.Sent',
      'sent': 'INBOX.Sent',
      'Drafts': 'INBOX.Drafts',
      'drafts': 'INBOX.Drafts',
      'Trash': 'INBOX.Trash',
      'trash': 'INBOX.Trash',
      'Junk': 'INBOX.spam',
      'junk': 'INBOX.spam',
      'Spam': 'INBOX.spam',
      'spam': 'INBOX.spam',
      'Archive': 'INBOX.Archive',
      'archive': 'INBOX.Archive'
    };

    // Manter pastas INBOX.X como estão, só mapear nomes simples
    const folder = data.pasta.startsWith('INBOX.') ? data.pasta : (pastaMap[data.pasta] || data.pasta);

    // Buscar corpo do IMAP
    const result = await fetchEmailBody(
      conta.imap_host,
      conta.imap_port,
      conta.imap_ssl,
      conta.email,
      senha,
      folder,
      data.uid
    );

    return new Response(
      JSON.stringify({ ...result, source: 'imap' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: result.success ? 200 : 500 }
    );

  } catch (err: any) {
    console.error("[email-fetch-body] Erro geral:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
