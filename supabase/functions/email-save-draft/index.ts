import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SaveDraftRequest {
  conta_id: string;
  para?: string[];
  cc?: string[];
  assunto: string;
  corpo: string;
  html?: boolean;
  anexos?: {
    nome: string;
    tipo: string;
    tamanho: number;
    conteudo: string; // base64
  }[];
  in_reply_to?: string;
  references?: string[];
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

// Função para gerar boundary único
function generateBoundary(): string {
  return `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

// Codificar string para Base64 seguro para MIME
function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return btoa(String.fromCharCode(...bytes));
}

// ========== RFC 5322 Message-ID Validation ==========
// Subconjunto seguro de caracteres para Message-ID (dot-atom-text)
// Permitidos: letras, números, ., -, _, +
// Bloqueados: $, espaço, <, >, quebras de linha, caracteres não-ASCII

/**
 * Verifica se um Message-ID é válido segundo RFC 5322 (subconjunto seguro)
 */
function isValidMessageId(messageId: string): boolean {
  if (!messageId || typeof messageId !== 'string') return false;
  if (!messageId.startsWith('<') || !messageId.endsWith('>')) return false;
  
  const inner = messageId.slice(1, -1);
  if (inner.length === 0 || inner.length > 248) return false;
  
  const atIndex = inner.indexOf('@');
  if (atIndex === -1 || inner.indexOf('@', atIndex + 1) !== -1) return false;
  
  const localPart = inner.substring(0, atIndex);
  const domain = inner.substring(atIndex + 1);
  
  if (!localPart || !domain) return false;
  
  // Subconjunto seguro - bloqueia $ e outros caracteres problemáticos
  const safeLocalPartRegex = /^[a-zA-Z0-9._+-]+$/;
  if (!safeLocalPartRegex.test(localPart)) return false;
  
  const safeDomainRegex = /^[a-zA-Z0-9.-]+$/;
  if (!safeDomainRegex.test(domain)) return false;
  
  if (localPart.startsWith('.') || localPart.endsWith('.') ||
      domain.startsWith('.') || domain.endsWith('.') ||
      domain.startsWith('-') || domain.endsWith('-')) {
    return false;
  }
  
  return true;
}

/**
 * Sanitiza um Message-ID para RFC 5322
 */
function sanitizeMessageId(messageId: string): string | null {
  if (!messageId || typeof messageId !== 'string') return null;
  
  let normalized = messageId.trim();
  if (!normalized.startsWith('<')) normalized = '<' + normalized;
  if (!normalized.endsWith('>')) normalized = normalized + '>';
  
  if (isValidMessageId(normalized)) return normalized;
  
  const inner = normalized.slice(1, -1);
  const atIndex = inner.indexOf('@');
  if (atIndex === -1) return null;
  
  let localPart = inner.substring(0, atIndex);
  let domain = inner.substring(atIndex + 1);
  
  // Substituir $ e outros caracteres problemáticos
  localPart = localPart.replace(/[^a-zA-Z0-9._+-]/g, '_');
  localPart = localPart.replace(/\.{2,}/g, '.').replace(/^\.+|\.+$/g, '');
  
  domain = domain.replace(/[^a-zA-Z0-9.-]/g, '');
  domain = domain.replace(/^[.-]+|[.-]+$/g, '');
  
  if (!localPart || !domain || localPart.length < 1 || domain.length < 3) return null;
  
  const sanitized = `<${localPart}@${domain}>`;
  return isValidMessageId(sanitized) ? sanitized : null;
}

/**
 * Sanitiza lista de References
 */
function sanitizeReferences(refs: string[] | undefined): string[] {
  if (!refs || refs.length === 0) return [];
  
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const ref of refs) {
    const sanitized = sanitizeMessageId(ref);
    if (sanitized && !seen.has(sanitized)) {
      seen.add(sanitized);
      unique.push(sanitized);
    }
  }
  
  // Limitar a 25 para evitar headers gigantes
  return unique.length > 25 ? unique.slice(-25) : unique;
}

// Função para construir mensagem MIME
function buildMimeMessage(
  from: string,
  to: string[],
  cc: string[],
  subject: string,
  body: string,
  isHtml: boolean,
  anexos?: SaveDraftRequest['anexos'],
  inReplyTo?: string,
  references?: string[]
): string {
  const date = new Date().toUTCString();
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@draft>`;
  
  let message = '';
  
  // Headers básicos
  message += `From: ${from}\r\n`;
  if (to.length > 0) {
    message += `To: ${to.join(', ')}\r\n`;
  }
  if (cc.length > 0) {
    message += `Cc: ${cc.join(', ')}\r\n`;
  }
  message += `Subject: =?UTF-8?B?${encodeBase64(subject)}?=\r\n`;
  message += `Date: ${date}\r\n`;
  message += `Message-ID: ${messageId}\r\n`;
  message += `MIME-Version: 1.0\r\n`;
  message += `X-Draft: true\r\n`;
  
  // Headers de threading - com validação RFC 5322
  if (inReplyTo) {
    const sanitizedInReplyTo = sanitizeMessageId(inReplyTo);
    if (sanitizedInReplyTo) {
      message += `In-Reply-To: ${sanitizedInReplyTo}\r\n`;
    } else {
      console.log(`[DRAFT] In-Reply-To inválido removido: ${inReplyTo.substring(0, 60)}...`);
    }
  }
  
  if (references && references.length > 0) {
    const validRefs = sanitizeReferences(references);
    if (validRefs.length > 0) {
      message += `References: ${validRefs.join(' ')}\r\n`;
    }
  }
  
  if (anexos && anexos.length > 0) {
    // Mensagem multipart com anexos
    const boundary = generateBoundary();
    message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
    message += `\r\n`;
    
    // Parte do corpo
    message += `--${boundary}\r\n`;
    message += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n`;
    message += `Content-Transfer-Encoding: base64\r\n`;
    message += `\r\n`;
    message += `${encodeBase64(body)}\r\n`;
    
    // Anexos
    for (const anexo of anexos) {
      message += `--${boundary}\r\n`;
      message += `Content-Type: ${anexo.tipo}; name="=?UTF-8?B?${encodeBase64(anexo.nome)}?="\r\n`;
      message += `Content-Disposition: attachment; filename="=?UTF-8?B?${encodeBase64(anexo.nome)}?="\r\n`;
      message += `Content-Transfer-Encoding: base64\r\n`;
      message += `\r\n`;
      message += `${anexo.conteudo}\r\n`;
    }
    
    message += `--${boundary}--\r\n`;
  } else {
    // Mensagem simples sem anexos
    message += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n`;
    message += `Content-Transfer-Encoding: base64\r\n`;
    message += `\r\n`;
    message += `${encodeBase64(body)}\r\n`;
  }
  
  return message;
}

// Mapeamento de pasta de rascunhos
const DRAFTS_FOLDERS = ['INBOX.Drafts', 'Drafts', 'DRAFTS', 'Draft', 'Rascunhos'];

// Salvar rascunho via IMAP APPEND
async function saveDraftImap(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  mimeMessage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[email-save-draft] Conectando ao servidor IMAP...`);
    
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
    const buffer = new Uint8Array(65536);
    
    let tagCounter = 1;
    const getTag = () => `A${String(tagCounter++).padStart(3, '0')}`;
    
    // Helper para ler resposta completa
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
              chunk.includes(`${expectedTag} BAD`) ||
              chunk.includes('+ ')) {
            complete = true;
          }
        } else {
          break;
        }
      }
      
      return fullResponse;
    };
    
    // Helper para enviar comando
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
      return { success: false, error: 'Falha na autenticação' };
    }
    console.log('[email-save-draft] Login bem-sucedido');

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
    console.log('[email-save-draft] Pastas disponíveis:', availableFolders);

    // Encontrar pasta de rascunhos real
    let actualDraftsFolder = 'INBOX.Drafts';
    for (const alias of DRAFTS_FOLDERS) {
      const found = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase());
      if (found) {
        actualDraftsFolder = found;
        break;
      }
    }
    console.log('[email-save-draft] Usando pasta:', actualDraftsFolder);

    // APPEND: enviar o rascunho
    const messageBytes = encoder.encode(mimeMessage);
    const tag = getTag();
    const appendCmd = `${tag} APPEND "${actualDraftsFolder}" (\\Draft \\Seen) {${messageBytes.length}}\r\n`;
    
    await conn.write(encoder.encode(appendCmd));
    
    // Aguardar continuação
    const continueResponse = await readResponse(tag);
    
    if (continueResponse.includes('+ ')) {
      // Servidor pediu continuação, enviar a mensagem
      await conn.write(messageBytes);
      await conn.write(encoder.encode('\r\n'));
      
      // Ler resposta final
      response = await readResponse(tag);
    } else {
      response = continueResponse;
    }
    
    if (!response.includes('OK')) {
      console.error('[email-save-draft] Erro no APPEND:', response);
      await sendCommand('LOGOUT');
      conn.close();
      return { success: false, error: 'Erro ao salvar rascunho no servidor' };
    }
    
    console.log('[email-save-draft] Rascunho salvo com sucesso');
    
    // Logout
    await sendCommand('LOGOUT');
    conn.close();
    
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-save-draft] Erro:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: SaveDraftRequest = await req.json();
    const { conta_id, para = [], cc = [], assunto, corpo, html = true, anexos, in_reply_to, references } = body;

    console.log(`[email-save-draft] Salvando rascunho para conta: ${conta_id}`);

    // Buscar dados da conta
    const { data: conta, error: contaError } = await supabase
      .from("email_contas")
      .select("*")
      .eq("id", conta_id)
      .single();

    if (contaError || !conta) {
      throw new Error("Conta de email não encontrada");
    }

    // Descriptografar senha
    const senha = await decryptPassword(conta.senha_criptografada);

    // Construir mensagem MIME com validação de threading
    const mimeMessage = buildMimeMessage(
      conta.email,
      para,
      cc,
      assunto || "(Sem assunto)",
      corpo,
      html,
      anexos,
      in_reply_to,
      references
    );

    // Salvar via IMAP
    const result = await saveDraftImap(
      conta.imap_host,
      conta.imap_port,
      conta.imap_ssl,
      conta.usuario || conta.email,
      senha,
      mimeMessage
    );

    if (!result.success) {
      throw new Error(result.error || 'Erro ao salvar rascunho');
    }

    console.log('[email-save-draft] Rascunho salvo com sucesso no IMAP');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Rascunho salvo com sucesso"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[email-save-draft] Erro:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
