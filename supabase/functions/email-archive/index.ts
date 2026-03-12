import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ArchiveRequest {
  conta_id: string;
  uids: string[];
  pasta_origem?: string;
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

// Mapeamento de nomes de pasta
const FOLDER_ALIASES: Record<string, string[]> = {
  'INBOX': ['INBOX', 'Inbox'],
  'inbox': ['INBOX', 'Inbox'],
  'Archive': ['Archive', 'ARCHIVE', 'Archived', 'Arquivados', 'All Mail', '[Gmail]/All Mail', '[Gmail]/Todos os e-mails'],
  'archive': ['Archive', 'ARCHIVE', 'Archived', 'Arquivados', 'All Mail', '[Gmail]/All Mail', '[Gmail]/Todos os e-mails'],
};

async function archiveEmails(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  uids: string[],
  sourceFolder: string
): Promise<{ success: boolean; archived: number; error?: string }> {
  try {
    console.log(`[email-archive] Arquivando ${uids.length} emails de ${sourceFolder}`);
    
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
      return { success: false, archived: 0, error: 'Falha na autenticação' };
    }

    // Listar pastas para encontrar Archive
    const listResponse = await sendCommand('LIST "" "*"');
    const availableFolders: string[] = [];
    const listLines = listResponse.split('\r\n');
    for (const line of listLines) {
      const match = line.match(/\* LIST \([^)]*\) "[^"]+" "?([^"]+)"?/);
      if (match) {
        availableFolders.push(match[1]);
      }
    }
    console.log('[email-archive] Pastas disponíveis:', availableFolders);

    // Encontrar pasta Archive - primeiro verificar se já existe com padrão INBOX.Archive
    const archiveAliases = FOLDER_ALIASES['archive'] || ['Archive'];
    let archiveFolder = '';
    
    // Primeiro, verificar pastas que terminam com .Archive ou /Archive (padrão comum)
    for (const folder of availableFolders) {
      const lowerFolder = folder.toLowerCase();
      if (lowerFolder.endsWith('.archive') || lowerFolder.endsWith('/archive') || lowerFolder === 'archive') {
        archiveFolder = folder;
        console.log(`[email-archive] Encontrada pasta Archive existente: ${folder}`);
        break;
      }
    }
    
    // Se não encontrou, verificar aliases exatos
    if (!archiveFolder) {
      for (const alias of archiveAliases) {
        const found = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase());
        if (found) {
          archiveFolder = found;
          console.log(`[email-archive] Encontrada pasta Archive por alias: ${found}`);
          break;
        }
      }
    }

    // Se não existir Archive, criar
    if (!archiveFolder) {
      console.log('[email-archive] Pasta Archive não existe, criando...');
      // Tentar criar INBOX.Archive primeiro (mais comum em servidores Dovecot/Courier)
      response = await sendCommand('CREATE "INBOX.Archive"');
      if (response.includes('OK') || response.includes('ALREADYEXISTS')) {
        archiveFolder = 'INBOX.Archive';
        console.log('[email-archive] Pasta INBOX.Archive criada/encontrada com sucesso');
      } else {
        // Tentar criar Archive na raiz
        response = await sendCommand('CREATE "Archive"');
        if (response.includes('OK') || response.includes('ALREADYEXISTS')) {
          archiveFolder = 'Archive';
          console.log('[email-archive] Pasta Archive criada/encontrada com sucesso');
        } else {
          conn.close();
          return { success: false, archived: 0, error: 'Não foi possível criar pasta Archive' };
        }
      }
    }

    console.log(`[email-archive] Usando pasta de arquivo: ${archiveFolder}`);

    // Encontrar pasta de origem
    const sourceAliases = FOLDER_ALIASES[sourceFolder] || [sourceFolder];
    let actualSource = sourceFolder;
    
    for (const alias of sourceAliases) {
      if (availableFolders.some(f => f.toLowerCase() === alias.toLowerCase())) {
        actualSource = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase()) || alias;
        break;
      }
    }

    // Selecionar pasta de origem
    response = await sendCommand(`SELECT "${actualSource}"`);
    if (!response.includes('OK')) {
      conn.close();
      return { success: false, archived: 0, error: `Pasta ${actualSource} não encontrada` };
    }

    let archivedCount = 0;
    
    for (const uid of uids) {
      // Copiar para Archive
      response = await sendCommand(`UID COPY ${uid} "${archiveFolder}"`);
      if (response.includes('OK')) {
        // Marcar como deletado na origem
        response = await sendCommand(`UID STORE ${uid} +FLAGS (\\Deleted)`);
        if (response.includes('OK')) {
          archivedCount++;
        }
      }
    }

    // Expunge para remover emails marcados como deletados
    if (archivedCount > 0) {
      await sendCommand('EXPUNGE');
    }

    await sendCommand('LOGOUT');
    conn.close();
    
    console.log(`[email-archive] ${archivedCount} emails arquivados com sucesso`);
    return { success: true, archived: archivedCount };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-archive] Erro:', errorMessage);
    return { success: false, archived: 0, error: errorMessage };
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

    const data: ArchiveRequest = await req.json();
    const pastaOrigem = data.pasta_origem || 'INBOX';
    
    console.log('[email-archive] Request:', { conta_id: data.conta_id, uids: data.uids, pastaOrigem });

    if (!data.uids || data.uids.length === 0) {
      throw new Error('Nenhum UID de email fornecido');
    }

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

    const result = await archiveEmails(
      conta.imap_host,
      conta.imap_port,
      conta.imap_ssl,
      conta.email,
      senha,
      data.uids,
      pastaOrigem
    );

    if (!result.success) {
      throw new Error(result.error || 'Erro ao arquivar emails');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        archived: result.archived,
        message: `${result.archived} email(s) arquivado(s) com sucesso`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-archive] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
