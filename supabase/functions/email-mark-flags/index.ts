import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarkFlagsRequest {
  conta_id: string;
  uids: string[];
  pasta: string;
  flags: string[];
  action: 'add' | 'remove';
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

// Mapeamento de nomes de pasta do sistema para IMAP (inclui Gmail, Outlook, etc)
const FOLDER_MAP: Record<string, string[]> = {
  'inbox': ['INBOX'],
  'sent': ['INBOX.Sent', 'Sent', 'SENT', 'Sent Items', 'Sent Messages', 'Enviados', '[Gmail]/Sent Mail', '[Gmail]/Enviados'],
  'drafts': ['INBOX.Drafts', 'Drafts', 'DRAFTS', 'Draft', 'Rascunhos', '[Gmail]/Drafts', '[Gmail]/Rascunhos'],
  'trash': ['INBOX.Trash', 'Trash', 'TRASH', 'Deleted', 'Deleted Items', 'Deleted Messages', 'Lixeira', '[Gmail]/Trash', '[Gmail]/Lixeira', '[Gmail]/Bin'],
  'spam': ['INBOX.spam', 'INBOX.Spam', 'INBOX.Junk', 'Junk', 'JUNK', 'Spam', 'SPAM', 'Junk E-mail', 'Bulk Mail', '[Gmail]/Spam', '[Gmail]/Lixo Eletrônico', 'Lixo Eletrônico', 'Junk Email'],
  'junk': ['INBOX.spam', 'INBOX.Spam', 'INBOX.Junk', 'Junk', 'JUNK', 'Spam', 'SPAM', 'Junk E-mail', 'Bulk Mail', '[Gmail]/Spam', '[Gmail]/Lixo Eletrônico', 'Lixo Eletrônico', 'Junk Email']
};

// Gerenciar flags via IMAP
async function manageImapFlags(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  uids: string[],
  folder: string,
  flags: string[],
  action: 'add' | 'remove'
): Promise<{ success: boolean; error?: string }> {
  let conn: Deno.Conn | Deno.TlsConn | null = null;
  
  try {
    console.log(`Gerenciando flags para emails ${uids.join(',')} na pasta ${folder}`);
    console.log(`Action: ${action}, Flags: ${flags.join(',')}`);
    
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
    const readResponse = async (expectedTag: string, timeout = 10000): Promise<string> => {
      let fullResponse = '';
      let complete = false;
      const startTime = Date.now();
      
      while (!complete && (Date.now() - startTime) < timeout) {
        const bytesRead = await conn!.read(buffer);
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
      console.log(`Enviando: ${tag} ${cmd.includes('LOGIN') ? 'LOGIN ***' : cmd}`);
      await conn!.write(encoder.encode(`${tag} ${cmd}\r\n`));
      const response = await readResponse(tag);
      console.log(`Resposta: ${response.substring(0, 200)}...`);
      return response;
    };
    
    // Ler greeting
    await conn.read(buffer);
    
    // Login
    let response = await sendCommand(`LOGIN "${email}" "${password}"`);
    if (!response.includes('OK')) {
      return { success: false, error: 'Falha na autenticação' };
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
    console.log('Pastas disponíveis:', availableFolders);

    // Encontrar pasta real
    let actualFolder = folder;
    const folderLower = folder.toLowerCase();
    const folderAliases = FOLDER_MAP[folderLower] || [folder];
    for (const alias of folderAliases) {
      const found = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase());
      if (found) {
        actualFolder = found;
        break;
      }
    }

    console.log(`Selecionando pasta: ${actualFolder}`);
    
    // Selecionar pasta
    response = await sendCommand(`SELECT "${actualFolder}"`);
    if (!response.includes('OK')) {
      await sendCommand('LOGOUT');
      return { success: false, error: `Pasta ${actualFolder} não encontrada` };
    }
    
    // Construir lista de UIDs
    const uidList = uids.join(',');
    
    // Construir lista de flags
    const flagsStr = flags.join(' ');
    
    // Adicionar ou remover flags
    const operator = action === 'add' ? '+FLAGS' : '-FLAGS';
    response = await sendCommand(`UID STORE ${uidList} ${operator} (${flagsStr})`);
    
    if (!response.includes('OK')) {
      console.warn('Aviso: Resposta inesperada ao modificar flags:', response);
    }
    
    // Logout
    await sendCommand('LOGOUT');
    
    console.log(`Flags ${action === 'add' ? 'adicionadas' : 'removidas'} com sucesso`);
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro ao gerenciar flags:', errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    if (conn) {
      try {
        conn.close();
      } catch {
        // Ignorar erro ao fechar conexão
      }
    }
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

    const data: MarkFlagsRequest = await req.json();
    
    console.log('Gerenciando flags:', {
      conta_id: data.conta_id,
      uids: data.uids,
      pasta: data.pasta,
      flags: data.flags,
      action: data.action
    });

    if (!data.conta_id || !data.uids || !data.flags || !data.action) {
      throw new Error('Parâmetros obrigatórios: conta_id, uids, flags, action');
    }

    if (!Array.isArray(data.uids) || data.uids.length === 0) {
      throw new Error('uids deve ser um array não vazio');
    }

    if (!Array.isArray(data.flags) || data.flags.length === 0) {
      throw new Error('flags deve ser um array não vazio');
    }

    if (data.action !== 'add' && data.action !== 'remove') {
      throw new Error('action deve ser "add" ou "remove"');
    }

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

    // Gerenciar flags
    const result = await manageImapFlags(
      conta.imap_host,
      conta.imap_port,
      conta.imap_ssl,
      conta.email,
      senha,
      data.uids.map(String),
      data.pasta || 'INBOX',
      data.flags,
      data.action
    );

    if (!result.success) {
      throw new Error(result.error || 'Erro ao gerenciar flags');
    }

    console.log('[email-mark-flags] Flags atualizadas com sucesso no IMAP');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro ao gerenciar flags:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
