import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MoveRequest {
  conta_id: string;
  message_uid?: string; // Deprecated, usar uids
  uids?: string[]; // Array de UIDs para mover múltiplos
  pasta_origem: string;
  pasta_destino: string;
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

// Mapeamento de nomes de pasta do sistema para IMAP
const FOLDER_MAP: Record<string, string[]> = {
  'inbox': ['INBOX'],
  'sent': ['INBOX.Sent', 'Sent', 'SENT', 'Sent Items', 'Sent Messages', 'Enviados'],
  'drafts': ['INBOX.Drafts', 'Drafts', 'DRAFTS', 'Draft', 'Rascunhos'],
  'trash': ['INBOX.Trash', 'Trash', 'TRASH', 'Deleted', 'Deleted Items', 'Deleted Messages', 'Lixeira'],
  'spam': ['INBOX.spam', 'INBOX.Spam', 'INBOX.Junk', 'Junk', 'JUNK', 'Spam', 'SPAM', 'Junk E-mail', 'Bulk Mail']
};

// Mover emails via IMAP (suporta múltiplos UIDs)
async function moveImapEmails(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  messageUids: string[],
  sourceFolder: string,
  targetFolder: string
): Promise<{ success: boolean; moved: number; error?: string }> {
  try {
    console.log(`[email-move] Movendo ${messageUids.length} emails de ${sourceFolder} para ${targetFolder}`);
    
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
      await conn.write(encoder.encode(`${tag} ${cmd}\r\n`));
      return await readResponse(tag);
    };
    
    // Ler greeting
    await conn.read(buffer);
    
    // Login
    let response = await sendCommand(`LOGIN "${email}" "${password}"`);
    if (!response.includes('OK')) {
      conn.close();
      return { success: false, moved: 0, error: 'Falha na autenticação' };
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
    console.log('[email-move] Pastas disponíveis:', availableFolders);

    // Encontrar pasta de origem real
    let actualSourceFolder = sourceFolder;
    const sourceAliases = FOLDER_MAP[sourceFolder] || [sourceFolder];
    for (const alias of sourceAliases) {
      const found = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase());
      if (found) {
        actualSourceFolder = found;
        break;
      }
    }

    // Encontrar pasta de destino real
    let actualTargetFolder = targetFolder;
    const targetAliases = FOLDER_MAP[targetFolder] || [targetFolder];
    for (const alias of targetAliases) {
      const found = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase());
      if (found) {
        actualTargetFolder = found;
        break;
      }
    }

    console.log(`[email-move] Movendo de ${actualSourceFolder} para ${actualTargetFolder}`);
    
    // Selecionar pasta de origem
    response = await sendCommand(`SELECT "${actualSourceFolder}"`);
    if (!response.includes('OK')) {
      conn.close();
      return { success: false, moved: 0, error: `Pasta de origem ${actualSourceFolder} não encontrada` };
    }
    
    let movedCount = 0;
    
    // Mover cada email
    for (const uid of messageUids) {
      // Copiar email para pasta de destino
      response = await sendCommand(`UID COPY ${uid} "${actualTargetFolder}"`);
      if (response.includes('OK')) {
        // Marcar email original como deletado
        response = await sendCommand(`UID STORE ${uid} +FLAGS (\\Deleted)`);
        if (response.includes('OK')) {
          movedCount++;
        }
      } else {
        console.warn(`[email-move] Falha ao copiar UID ${uid}`);
      }
    }
    
    // Expunge para remover emails deletados
    if (movedCount > 0) {
      await sendCommand('EXPUNGE');
    }
    
    // Logout
    await sendCommand('LOGOUT');
    conn.close();
    
    console.log(`[email-move] ${movedCount} emails movidos com sucesso`);
    return { success: true, moved: movedCount };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-move] Erro:', errorMessage);
    return { success: false, moved: 0, error: errorMessage };
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

    const data: MoveRequest = await req.json();
    
    // Suportar tanto message_uid (legado) quanto uids (array)
    const uids = data.uids || (data.message_uid ? [data.message_uid] : []);
    
    console.log('[email-move] Request:', { conta_id: data.conta_id, uids, pasta_destino: data.pasta_destino });

    if (!data.conta_id || uids.length === 0 || !data.pasta_destino) {
      throw new Error('Parâmetros obrigatórios: conta_id, uids/message_uid, pasta_destino');
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

    // Mover emails
    const result = await moveImapEmails(
      conta.imap_host,
      conta.imap_port,
      conta.imap_ssl,
      conta.email,
      senha,
      uids,
      data.pasta_origem || 'INBOX',
      data.pasta_destino
    );

    if (!result.success) {
      throw new Error(result.error || 'Erro ao mover emails');
    }

    console.log(`[email-move] ${result.moved} email(s) movido(s) com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        moved: result.moved,
        message: `${result.moved} email(s) movido(s) com sucesso`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-move] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
