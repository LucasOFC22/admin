import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmptyTrashRequest {
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

// Mapeamento de pasta de lixeira
const TRASH_FOLDERS = ['INBOX.Trash', 'Trash', 'TRASH', 'Deleted', 'Deleted Items', 'Deleted Messages', 'Lixeira'];

// Esvaziar lixeira via IMAP
async function emptyTrashImap(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    console.log(`[email-empty-trash] Conectando ao servidor IMAP...`);
    
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
      return { success: false, deletedCount: 0, error: 'Falha na autenticação' };
    }
    console.log('[email-empty-trash] Login bem-sucedido');

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
    console.log('[email-empty-trash] Pastas disponíveis:', availableFolders);

    // Encontrar pasta de lixeira real
    let actualTrashFolder = 'INBOX.Trash';
    for (const alias of TRASH_FOLDERS) {
      const found = availableFolders.find(f => f.toLowerCase() === alias.toLowerCase());
      if (found) {
        actualTrashFolder = found;
        break;
      }
    }
    console.log('[email-empty-trash] Usando pasta:', actualTrashFolder);

    // Selecionar pasta de lixeira
    response = await sendCommand(`SELECT "${actualTrashFolder}"`);
    if (!response.includes('OK')) {
      await sendCommand('LOGOUT');
      conn.close();
      return { success: false, deletedCount: 0, error: `Pasta ${actualTrashFolder} não encontrada` };
    }

    // Verificar quantas mensagens existem
    const existsMatch = response.match(/\* (\d+) EXISTS/);
    const messageCount = existsMatch ? parseInt(existsMatch[1], 10) : 0;
    
    console.log(`[email-empty-trash] Mensagens na lixeira: ${messageCount}`);

    if (messageCount === 0) {
      await sendCommand('LOGOUT');
      conn.close();
      return { success: true, deletedCount: 0 };
    }

    // Marcar todas as mensagens como deletadas (1:* significa todas)
    response = await sendCommand(`STORE 1:* +FLAGS (\\Deleted)`);
    if (!response.includes('OK')) {
      console.warn('[email-empty-trash] Aviso ao marcar mensagens:', response);
    }

    // Executar EXPUNGE para remover permanentemente
    response = await sendCommand('EXPUNGE');
    if (!response.includes('OK')) {
      console.warn('[email-empty-trash] Aviso no EXPUNGE:', response);
    }

    console.log(`[email-empty-trash] ${messageCount} mensagens excluídas permanentemente`);

    // Logout
    await sendCommand('LOGOUT');
    conn.close();
    
    return { success: true, deletedCount: messageCount };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-empty-trash] Erro:', errorMessage);
    return { success: false, deletedCount: 0, error: errorMessage };
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

    const body: EmptyTrashRequest = await req.json();
    const { conta_id } = body;

    console.log(`[email-empty-trash] Esvaziando lixeira para conta: ${conta_id}`);

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

    // Esvaziar via IMAP
    const result = await emptyTrashImap(
      conta.imap_host,
      conta.imap_porta,
      conta.imap_ssl,
      conta.usuario || conta.email,
      senha
    );

    if (!result.success) {
      throw new Error(result.error || 'Erro ao esvaziar lixeira');
    }

    console.log(`[email-empty-trash] ${result.deletedCount} mensagens excluídas permanentemente`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lixeira esvaziada com sucesso",
        deletedCount: result.deletedCount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[email-empty-trash] Erro:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
