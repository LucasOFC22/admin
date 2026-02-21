import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DownloadAttachmentRequest {
  conta_id: string;
  uid: string;
  pasta: string;
  part_id: string;
  filename: string;
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

// Mapeamento de nomes de pasta alternativos
const FOLDER_ALIASES: Record<string, string[]> = {
  'INBOX': ['INBOX', 'Inbox'],
  'Sent': ['Sent', 'SENT', 'Sent Items', 'Sent Messages', 'INBOX.Sent', 'Enviados', 'Itens Enviados'],
  'Drafts': ['Drafts', 'DRAFTS', 'Draft', 'INBOX.Drafts', 'Rascunhos'],
  'Trash': ['Trash', 'TRASH', 'Deleted', 'Deleted Items', 'Deleted Messages', 'INBOX.Trash', 'Lixeira'],
  'Junk': ['Junk', 'JUNK', 'Spam', 'SPAM', 'Junk E-mail', 'Bulk Mail', 'INBOX.Junk', 'INBOX.Spam']
};

// Decodificar base64 para bytes
function base64ToBytes(base64: string): Uint8Array {
  const cleaned = base64.replace(/\r?\n/g, '').replace(/\s/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Decodificar quoted-printable para bytes
function quotedPrintableToBytes(text: string): Uint8Array {
  const decoded = text
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}

// Buscar anexo específico via IMAP
async function fetchAttachment(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  folder: string,
  uid: string,
  partId: string
): Promise<{ success: boolean; data?: Uint8Array; encoding?: string; error?: string }> {
  try {
    console.log(`[email-download-attachment] Conectando IMAP ${host}:${port} pasta ${folder} uid ${uid} part ${partId}`);
    
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
    const buffer = new Uint8Array(4194304); // 4MB buffer para anexos grandes
    
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
    const sendCommand = async (cmd: string): Promise<string> => {
      const tag = getTag();
      const fullCmd = `${tag} ${cmd}\r\n`;
      await conn.write(encoder.encode(fullCmd));
      return await readResponse(tag);
    };
    
    // Ler saudação inicial
    await conn.read(buffer);
    
    // LOGIN
    const loginResp = await sendCommand(`LOGIN "${email}" "${password}"`);
    if (!loginResp.includes('OK')) {
      conn.close();
      return { success: false, error: 'Falha no login' };
    }

    // Listar pastas disponíveis para encontrar a correta
    const listResponse = await sendCommand('LIST "" "*"');
    const availableFolders: string[] = [];
    const listLines = listResponse.split('\r\n');
    for (const line of listLines) {
      const match = line.match(/\* LIST \([^)]*\) "[^"]+" "?([^"]+)"?/);
      if (match) {
        availableFolders.push(match[1]);
      }
    }

    // Tentar encontrar a pasta correta usando aliases
    let actualFolder = folder;
    const aliases = FOLDER_ALIASES[folder] || [folder];
    
    for (const alias of aliases) {
      const found = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase());
      if (found) {
        actualFolder = found;
        break;
      }
    }
    
    console.log(`[email-download-attachment] Usando pasta: ${actualFolder}`);
    
    // SELECT pasta
    const selectResp = await sendCommand(`SELECT "${actualFolder}"`);
    if (!selectResp.includes('OK')) {
      conn.close();
      return { success: false, error: `Pasta ${actualFolder} não encontrada` };
    }
    
    // FETCH parte específica do anexo
    // Se partId for "1", busca BODY[1], se for "2.1", busca BODY[2.1], etc.
    const fetchCmd = `UID FETCH ${uid} (BODY.PEEK[${partId}])`;
    console.log(`[email-download-attachment] Executando: ${fetchCmd}`);
    const fetchResp = await sendCommand(fetchCmd);
    
    // LOGOUT
    await sendCommand('LOGOUT');
    conn.close();
    
    // Extrair corpo da resposta
    // Formato: * UID FETCH (BODY[partId] {size}\r\n...dados...\r\n)\r\nA00X OK
    const literalMatch = fetchResp.match(/\{(\d+)\}\r\n/);
    if (!literalMatch) {
      console.log('[email-download-attachment] Resposta:', fetchResp.substring(0, 500));
      return { success: false, error: 'Não foi possível extrair anexo' };
    }
    
    const literalStart = fetchResp.indexOf(literalMatch[0]) + literalMatch[0].length;
    const literalSize = parseInt(literalMatch[1]);
    const rawData = fetchResp.substring(literalStart, literalStart + literalSize);
    
    console.log(`[email-download-attachment] Dados brutos: ${rawData.length} bytes`);
    
    // Detectar encoding do Content-Transfer-Encoding (pode vir na resposta anterior do BODYSTRUCTURE)
    // Por padrão, tentar base64 primeiro (mais comum para anexos)
    let bytes: Uint8Array;
    
    // Verificar se parece base64 (apenas caracteres base64 válidos)
    const isBase64 = /^[A-Za-z0-9+/\r\n=]+$/.test(rawData.trim());
    
    if (isBase64) {
      try {
        bytes = base64ToBytes(rawData);
        console.log(`[email-download-attachment] Decodificado base64: ${bytes.length} bytes`);
      } catch (e) {
        console.log('[email-download-attachment] Falha base64, tentando quoted-printable');
        bytes = quotedPrintableToBytes(rawData);
      }
    } else {
      // Tentar quoted-printable
      bytes = quotedPrintableToBytes(rawData);
      console.log(`[email-download-attachment] Decodificado QP: ${bytes.length} bytes`);
    }
    
    return { success: true, data: bytes };
    
  } catch (err: any) {
    console.error('[email-download-attachment] Erro IMAP:', err);
    return { success: false, error: err.message };
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

    const data: DownloadAttachmentRequest = await req.json();
    console.log("[email-download-attachment] Request:", data);

    if (!data.conta_id || !data.uid || !data.pasta || !data.part_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Parâmetros obrigatórios: conta_id, uid, pasta, part_id" }),
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
      console.error("[email-download-attachment] Conta não encontrada:", contaError);
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
      console.error("[email-download-attachment] Erro ao descriptografar senha:", e);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao descriptografar credenciais" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Mapear pasta para nome IMAP base
    const pastaMap: Record<string, string> = {
      'INBOX': 'INBOX',
      'inbox': 'INBOX',
      'Sent': 'Sent',
      'sent': 'Sent',
      'Drafts': 'Drafts',
      'drafts': 'Drafts',
      'Trash': 'Trash',
      'trash': 'Trash',
      'Junk': 'Junk',
      'junk': 'Junk',
      'Spam': 'Junk',
      'spam': 'Junk'
    };

    const folder = pastaMap[data.pasta] || data.pasta;

    // Buscar anexo
    const result = await fetchAttachment(
      conta.imap_host,
      conta.imap_port,
      conta.imap_ssl,
      conta.email,
      senha,
      folder,
      data.uid,
      data.part_id
    );

    if (!result.success || !result.data) {
      return new Response(
        JSON.stringify({ success: false, error: result.error || 'Erro ao baixar anexo' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Detectar MIME type baseado na extensão do arquivo
    const ext = (data.filename || '').split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'html': 'text/html',
      'xml': 'application/xml',
      'json': 'application/json',
      'mobileconfig': 'application/x-apple-aspen-config'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const filename = data.filename || 'attachment';

    console.log(`[email-download-attachment] Retornando ${result.data.length} bytes como ${contentType}`);

    // Converter para string base64 e retornar como JSON
    // (mais compatível que retornar binário direto)
    const base64Data = btoa(String.fromCharCode(...result.data));
    
    return new Response(
      JSON.stringify({
        success: true,
        data: base64Data,
        filename: filename,
        contentType: contentType,
        size: result.data.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (err: any) {
    console.error("[email-download-attachment] Erro geral:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
