import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UnreadCountsRequest {
  conta_id: string;
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

// Mapeamento de nomes de pasta IMAP para nomes do sistema
const SYSTEM_FOLDER_MAP: Record<string, string> = {
  'inbox': 'inbox',
  'sent': 'sent',
  'drafts': 'drafts',
  'trash': 'trash',
  'spam': 'spam',
  'junk': 'spam'
};

// Nomes de pasta que mapeiam para cada categoria (inclui Gmail, Outlook, etc)
const FOLDER_PATTERNS: Record<string, string[]> = {
  'inbox': ['INBOX', 'Inbox'],
  'sent': ['INBOX.Sent', 'Sent', 'SENT', 'Sent Items', 'Sent Messages', 'Enviados', 'Itens Enviados', '[Gmail]/Sent Mail', '[Gmail]/Enviados'],
  'drafts': ['INBOX.Drafts', 'Drafts', 'DRAFTS', 'Draft', 'Rascunhos', '[Gmail]/Drafts', '[Gmail]/Rascunhos'],
  'trash': ['INBOX.Trash', 'Trash', 'TRASH', 'Deleted', 'Deleted Items', 'Deleted Messages', 'Lixeira', '[Gmail]/Trash', '[Gmail]/Lixeira', '[Gmail]/Bin'],
  'spam': ['INBOX.spam', 'INBOX.Spam', 'INBOX.Junk', 'Junk', 'JUNK', 'Spam', 'SPAM', 'Junk E-mail', 'Bulk Mail', '[Gmail]/Spam', '[Gmail]/Lixo Eletrônico', 'Lixo Eletrônico', 'Junk Email']
};

// Pastas que devem ser ignoradas como labels
const SYSTEM_FOLDERS_TO_IGNORE = new Set([
  'inbox', 'sent', 'drafts', 'trash', 'spam', 'junk',
  'all mail', 'todos os emails', '[gmail]/all mail', '[gmail]/todos os emails',
  'important', 'importante', '[gmail]/important', '[gmail]/importante',
  'starred', 'com estrela', '[gmail]/starred', '[gmail]/com estrela',
  'archive', 'arquivo', 'notes', 'outbox', 'caixa de saída'
]);

interface FolderCounts {
  inbox: number;
  sent: number;
  drafts: number;
  trash: number;
  spam: number;
}

interface LabelInfo {
  name: string;
  imapName: string;
  unread: number;
  total: number;
}

interface ExtendedCounts extends FolderCounts {
  starred: number;
  snoozed: number;
  labels: LabelInfo[];
}

// Buscar contagem de não lidos via IMAP
async function fetchUnreadCounts(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string
): Promise<{ success: boolean; counts?: ExtendedCounts; error?: string }> {
  try {
    console.log(`[email-unread-counts] Conectando IMAP ${host}:${port}`);
    
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

    // Listar todas as pastas disponíveis
    const listResponse = await sendCommand('LIST "" "*"');
    const availableFolders: string[] = [];
    const listLines = listResponse.split('\r\n');
    for (const line of listLines) {
      const match = line.match(/\* LIST \([^)]*\) "[^"]+" "?([^"]+)"?/);
      if (match) {
        availableFolders.push(match[1]);
      }
    }
    console.log('[email-unread-counts] Pastas disponíveis:', availableFolders);

    // Mapear pastas do servidor para pastas do sistema
    const folderMapping: Record<string, string> = {};
    const usedFolders = new Set<string>();
    
    for (const [systemFolder, patterns] of Object.entries(FOLDER_PATTERNS)) {
      for (const pattern of patterns) {
        const found = availableFolders.find(f => f.toLowerCase() === pattern.toLowerCase());
        if (found) {
          folderMapping[systemFolder] = found;
          usedFolders.add(found.toLowerCase());
          break;
        }
      }
    }
    
    console.log('[email-unread-counts] Mapeamento de pastas:', folderMapping);

    // Buscar contagem de não lidos para cada pasta
    const counts: ExtendedCounts = {
      inbox: 0,
      sent: 0,
      drafts: 0,
      trash: 0,
      spam: 0,
      starred: 0,
      snoozed: 0,
      labels: []
    };

    for (const [systemFolder, imapFolder] of Object.entries(folderMapping)) {
      try {
        const statusCmd = `STATUS "${imapFolder}" (UNSEEN)`;
        const statusResp = await sendCommand(statusCmd);
        
        const unseenMatch = statusResp.match(/UNSEEN\s+(\d+)/i);
        if (unseenMatch) {
          const unseenCount = parseInt(unseenMatch[1]);
          counts[systemFolder as keyof FolderCounts] = unseenCount;
          console.log(`[email-unread-counts] ${systemFolder} (${imapFolder}): ${unseenCount} não lidos`);
        }
      } catch (err) {
        console.log(`[email-unread-counts] Erro ao buscar status de ${systemFolder}:`, err);
      }
    }

    // Buscar emails com estrela (FLAGGED) na INBOX
    try {
      const inboxFolder = folderMapping['inbox'] || 'INBOX';
      const selectResp = await sendCommand(`SELECT "${inboxFolder}"`);
      
      if (selectResp.includes('OK')) {
        // Buscar emails com flag FLAGGED
        const searchFlaggedResp = await sendCommand('SEARCH FLAGGED');
        const flaggedMatch = searchFlaggedResp.match(/\* SEARCH([\d\s]*)/);
        if (flaggedMatch && flaggedMatch[1].trim()) {
          const flaggedIds = flaggedMatch[1].trim().split(/\s+/).filter(id => id);
          counts.starred = flaggedIds.length;
          console.log(`[email-unread-counts] Emails com estrela: ${counts.starred}`);
        }

        // Buscar emails "snoozed" - alguns servidores usam keyword $snoozed ou X-GM-SNOOZED
        try {
          const searchSnoozedResp = await sendCommand('SEARCH KEYWORD $snoozed');
          const snoozedMatch = searchSnoozedResp.match(/\* SEARCH([\d\s]*)/);
          if (snoozedMatch && snoozedMatch[1].trim()) {
            const snoozedIds = snoozedMatch[1].trim().split(/\s+/).filter(id => id);
            counts.snoozed = snoozedIds.length;
            console.log(`[email-unread-counts] Emails adiados: ${counts.snoozed}`);
          }
        } catch (e) {
          console.log('[email-unread-counts] Servidor não suporta snoozed keyword');
        }
      }
    } catch (err) {
      console.log('[email-unread-counts] Erro ao buscar starred/snoozed:', err);
    }

    // Identificar labels/marcadores (pastas que não são do sistema)
    for (const folder of availableFolders) {
      const folderLower = folder.toLowerCase();
      
      // Ignorar pastas do sistema
      if (usedFolders.has(folderLower)) continue;
      if (SYSTEM_FOLDERS_TO_IGNORE.has(folderLower)) continue;
      
      // Ignorar pastas especiais do Gmail
      if (folderLower.startsWith('[gmail]') || folderLower.startsWith('[google mail]')) continue;
      
      // Ignorar pastas que começam com INBOX. mas são subpastas do sistema
      if (folderLower.startsWith('inbox.')) {
        const subFolder = folderLower.replace('inbox.', '');
        if (SYSTEM_FOLDERS_TO_IGNORE.has(subFolder)) continue;
      }

      try {
        // Buscar contagens para este label
        const statusCmd = `STATUS "${folder}" (MESSAGES UNSEEN)`;
        const statusResp = await sendCommand(statusCmd);
        
        const messagesMatch = statusResp.match(/MESSAGES\s+(\d+)/i);
        const unseenMatch = statusResp.match(/UNSEEN\s+(\d+)/i);
        
        const total = messagesMatch ? parseInt(messagesMatch[1]) : 0;
        const unread = unseenMatch ? parseInt(unseenMatch[1]) : 0;

        // Só adicionar se tiver mensagens
        if (total > 0) {
          // Extrair nome amigável do label
          let displayName = folder;
          if (folder.includes('/')) {
            displayName = folder.split('/').pop() || folder;
          } else if (folder.includes('.')) {
            displayName = folder.split('.').pop() || folder;
          }

          counts.labels.push({
            name: displayName,
            imapName: folder,
            unread,
            total
          });
          
          console.log(`[email-unread-counts] Label "${displayName}": ${unread}/${total}`);
        }
      } catch (err) {
        console.log(`[email-unread-counts] Erro ao buscar label ${folder}:`, err);
      }
    }

    // Ordenar labels por nome
    counts.labels.sort((a, b) => a.name.localeCompare(b.name));
    
    // LOGOUT
    await sendCommand('LOGOUT');
    conn.close();
    
    console.log('[email-unread-counts] Contagens finais:', counts);
    return { success: true, counts };
    
  } catch (err: any) {
    console.error('[email-unread-counts] Erro IMAP:', err);
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

    const data: UnreadCountsRequest = await req.json();
    console.log("[email-unread-counts] Request:", data);

    if (!data.conta_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Parâmetro obrigatório: conta_id" }),
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
      console.error("[email-unread-counts] Conta não encontrada:", contaError);
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
      console.error("[email-unread-counts] Erro ao descriptografar senha:", e);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao descriptografar credenciais" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Buscar contagens
    const result = await fetchUnreadCounts(
      conta.imap_host,
      conta.imap_port,
      conta.imap_ssl,
      conta.email,
      senha
    );

    return new Response(
      JSON.stringify({ 
        success: result.success, 
        counts: result.counts,
        error: result.error 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: result.success ? 200 : 500 }
    );

  } catch (err: any) {
    console.error("[email-unread-counts] Erro geral:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
