import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StarredRequest {
  conta_id: string;
  limite?: number;
}

// Decodificador MIME RFC 2047 para headers de email
function decodeMimeHeader(header: string): string {
  if (!header || typeof header !== 'string' || !header.includes('=?')) {
    return header || '';
  }

  let processed = header.replace(/(\?=)\s+(=\?)/g, '$1$2');
  const encodedWordPattern = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g;

  processed = processed.replace(encodedWordPattern, (match, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        const decoded = atob(text);
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
      } else if (encoding.toUpperCase() === 'Q') {
        let decoded = text.replace(/_/g, ' ');
        decoded = decoded.replace(/=([0-9A-Fa-f]{2})/g, (_: string, hex: string) => {
          return String.fromCharCode(parseInt(hex, 16));
        });
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
      }
    } catch (e) {
      console.error('Erro ao decodificar MIME:', e);
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

async function fetchStarredEmails(
  host: string,
  port: number,
  ssl: boolean,
  email: string,
  password: string,
  limit: number
): Promise<{ success: boolean; emails: any[]; error?: string }> {
  try {
    console.log(`[email-starred] Buscando emails com estrela de ${host}:${port}`);
    
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
      return { success: false, emails: [], error: 'Falha na autenticação' };
    }

    // Selecionar INBOX para buscar emails com estrela
    response = await sendCommand(`SELECT "INBOX"`);
    if (!response.includes('OK')) {
      conn.close();
      return { success: false, emails: [], error: 'Não foi possível selecionar INBOX' };
    }

    // Buscar emails com flag FLAGGED (estrela)
    response = await sendCommand('SEARCH FLAGGED');
    
    // Extrair UIDs dos emails com estrela
    const searchMatch = response.match(/\* SEARCH ([\d\s]+)/);
    if (!searchMatch || !searchMatch[1].trim()) {
      console.log('[email-starred] Nenhum email com estrela encontrado');
      await sendCommand('LOGOUT');
      conn.close();
      return { success: true, emails: [] };
    }
    
    const uids = searchMatch[1].trim().split(/\s+/).slice(-limit);
    console.log(`[email-starred] Encontrados ${uids.length} emails com estrela`);
    
    if (uids.length === 0) {
      await sendCommand('LOGOUT');
      conn.close();
      return { success: true, emails: [] };
    }
    
    // Buscar detalhes dos emails
    const uidList = uids.join(',');
    response = await sendCommand(`FETCH ${uidList} (UID FLAGS BODY.PEEK[HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID)])`);
    
    const emails: any[] = [];
    const messageParts = response.split(/\* \d+ FETCH/);
    
    for (let i = 1; i < messageParts.length; i++) {
      const part = messageParts[i];
      
      const uidMatch = part.match(/UID (\d+)/);
      if (!uidMatch) continue;
      const uid = uidMatch[1];
      
      const flagsMatch = part.match(/FLAGS \(([^)]*)\)/);
      const flags = flagsMatch ? flagsMatch[1] : '';
      
      const headerStart = part.indexOf('}\r\n');
      if (headerStart !== -1) {
        const headerEnd = part.indexOf('\r\n)', headerStart);
        if (headerEnd !== -1) {
          const headerText = part.substring(headerStart + 3, headerEnd);
          const headers = parseEmailHeaders(headerText);
          
          emails.push({
            uid,
            messageId: headers['message-id'] || `${uid}@${host}`,
            from: headers['from'] || '',
            to: headers['to'] || '',
            cc: headers['cc'] || '',
            subject: headers['subject'] || '(Sem assunto)',
            date: headers['date'] || new Date().toISOString(),
            flags: flags.split(' ').filter(f => f),
            seen: flags.includes('\\Seen'),
            starred: true
          });
        }
      }
    }
    
    await sendCommand('LOGOUT');
    conn.close();
    
    console.log(`[email-starred] Retornando ${emails.length} emails com estrela`);
    return { success: true, emails };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-starred] Erro:', errorMessage);
    return { success: false, emails: [], error: errorMessage };
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

    const data: StarredRequest = await req.json();
    const limite = data.limite || 50;
    
    console.log('[email-starred] Buscando emails com estrela:', { conta_id: data.conta_id, limite });

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

    // Buscar do IMAP diretamente
    console.log('[email-starred] Buscando do IMAP...');
    
    const senha = await decryptPassword(conta.senha_criptografada);

    const result = await fetchStarredEmails(
      conta.imap_host,
      conta.imap_port,
      conta.imap_ssl,
      conta.email,
      senha,
      limite
    );

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar emails com estrela');
    }

    const formattedEmails = result.emails.map(email => {
      const decodedFrom = decodeMimeHeader(email.from);
      let fromName = '';
      let fromEmail = decodedFrom;

      // Tentar extrair nome e email de formatos como "Nome <email@domain>" ou <email@domain>
      const fullMatch = decodedFrom.match(/^(?:"?([^"<]*)"?\s*)?<([^>]+)>$/);
      if (fullMatch) {
        fromName = fullMatch[1]?.trim() || '';
        fromEmail = fullMatch[2]?.trim();
      } else {
        // Se não tem <>, assumir que é só o email
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
      
      return {
        id: email.uid,
        uid: parseInt(email.uid),
        message_id: email.messageId,
        de: fromEmail,
        de_nome: decodeMimeHeader(fromName),
        para: toEmails,
        cc: decodedCc ? decodedCc.split(',').map((e: string) => e.trim()) : [],
        assunto: decodedSubject,
        data: new Date(email.date).toISOString(),
        lido: email.seen,
        starred: true,
        pasta: 'starred'
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emails: formattedEmails,
        count: formattedEmails.length,
        source: 'imap'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[email-starred] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
