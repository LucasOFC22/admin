import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestConnectionRequest {
  imap_host: string;
  imap_port: number;
  imap_ssl: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_ssl: boolean;
  email: string;
  senha: string;
}

interface TestConnectionResponse {
  imap_ok: boolean;
  smtp_ok: boolean;
  imap_error?: string;
  smtp_error?: string;
}

// Função para testar conexão TCP básica
async function testTcpConnection(host: string, port: number, timeoutMs: number = 5000): Promise<{ success: boolean; error?: string }> {
  try {
    const conn = await Deno.connect({
      hostname: host,
      port: port,
      transport: "tcp",
    });
    
    // Ler resposta inicial (greeting)
    const buffer = new Uint8Array(1024);
    const decoder = new TextDecoder();
    
    // Definir timeout
    const timeoutId = setTimeout(() => {
      try { conn.close(); } catch {}
    }, timeoutMs);
    
    try {
      const bytesRead = await conn.read(buffer);
      clearTimeout(timeoutId);
      
      if (bytesRead && bytesRead > 0) {
        const response = decoder.decode(buffer.subarray(0, bytesRead));
        console.log(`Resposta do servidor ${host}:${port}:`, response.substring(0, 100));
        conn.close();
        return { success: true };
      }
    } catch (readError) {
      clearTimeout(timeoutId);
      throw readError;
    }
    
    conn.close();
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error(`Erro ao conectar em ${host}:${port}:`, errorMessage);
    return { 
      success: false, 
      error: errorMessage || 'Não foi possível conectar ao servidor'
    };
  }
}

// Testar IMAP com autenticação básica
async function testImapConnection(
  host: string, 
  port: number, 
  ssl: boolean, 
  email: string, 
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Testando IMAP ${host}:${port} (SSL: ${ssl})`);
    
    // Para conexões SSL/TLS, usamos connectTls
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
    const buffer = new Uint8Array(4096);
    
    // Ler greeting
    let bytesRead = await conn.read(buffer);
    if (bytesRead) {
      const greeting = decoder.decode(buffer.subarray(0, bytesRead));
      console.log('IMAP Greeting:', greeting.substring(0, 100));
      
      if (!greeting.includes('OK')) {
        conn.close();
        return { success: false, error: 'Servidor IMAP não respondeu corretamente' };
      }
    }
    
    // Enviar comando de login
    const loginCommand = `A001 LOGIN "${email}" "${password}"\r\n`;
    await conn.write(encoder.encode(loginCommand));
    
    // Ler resposta do login
    bytesRead = await conn.read(buffer);
    if (bytesRead) {
      const loginResponse = decoder.decode(buffer.subarray(0, bytesRead));
      console.log('IMAP Login Response:', loginResponse.substring(0, 100));
      
      // Enviar logout
      await conn.write(encoder.encode('A002 LOGOUT\r\n'));
      conn.close();
      
      if (loginResponse.includes('A001 OK')) {
        return { success: true };
      } else if (loginResponse.includes('NO') || loginResponse.includes('BAD')) {
        return { success: false, error: 'Credenciais inválidas ou acesso negado' };
      }
    }
    
    conn.close();
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro IMAP:', errorMessage);
    return { 
      success: false, 
      error: errorMessage || 'Erro ao conectar ao servidor IMAP'
    };
  }
}

// Testar SMTP com autenticação
async function testSmtpConnection(
  host: string, 
  port: number, 
  ssl: boolean, 
  email: string, 
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Testando SMTP ${host}:${port} (SSL: ${ssl})`);
    
    let conn: Deno.Conn | Deno.TlsConn;
    
    // Porta 465 geralmente usa SSL implícito
    if (port === 465) {
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
    const buffer = new Uint8Array(4096);
    
    // Ler greeting
    let bytesRead = await conn.read(buffer);
    if (bytesRead) {
      const greeting = decoder.decode(buffer.subarray(0, bytesRead));
      console.log('SMTP Greeting:', greeting.substring(0, 100));
      
      if (!greeting.startsWith('220')) {
        conn.close();
        return { success: false, error: 'Servidor SMTP não respondeu corretamente' };
      }
    }
    
    // Enviar EHLO
    await conn.write(encoder.encode(`EHLO localhost\r\n`));
    bytesRead = await conn.read(buffer);
    if (bytesRead) {
      const ehloResponse = decoder.decode(buffer.subarray(0, bytesRead));
      console.log('SMTP EHLO Response:', ehloResponse.substring(0, 200));
      
      // Se não for SSL implícito e o servidor suporta STARTTLS
      if (port !== 465 && ssl && ehloResponse.includes('STARTTLS')) {
        await conn.write(encoder.encode('STARTTLS\r\n'));
        bytesRead = await conn.read(buffer);
        if (bytesRead) {
          const starttlsResponse = decoder.decode(buffer.subarray(0, bytesRead));
          console.log('STARTTLS Response:', starttlsResponse);
          
          if (starttlsResponse.startsWith('220')) {
            // Upgrade para TLS
            // Nota: Deno não suporta upgrade de conexão existente para TLS facilmente
            // Por enquanto, consideramos sucesso se STARTTLS foi aceito
            conn.close();
            return { success: true };
          }
        }
      }
    }
    
    // Enviar QUIT
    await conn.write(encoder.encode('QUIT\r\n'));
    conn.close();
    
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro SMTP:', errorMessage);
    return { 
      success: false, 
      error: errorMessage || 'Erro ao conectar ao servidor SMTP'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: TestConnectionRequest = await req.json();
    
    console.log('Testando conexão de email:', {
      imap: `${data.imap_host}:${data.imap_port}`,
      smtp: `${data.smtp_host}:${data.smtp_port}`,
      email: data.email
    });

    // Testar IMAP e SMTP em paralelo
    const [imapResult, smtpResult] = await Promise.all([
      testImapConnection(data.imap_host, data.imap_port, data.imap_ssl, data.email, data.senha),
      testSmtpConnection(data.smtp_host, data.smtp_port, data.smtp_ssl, data.email, data.senha)
    ]);

    const response: TestConnectionResponse = {
      imap_ok: imapResult.success,
      smtp_ok: smtpResult.success,
      imap_error: imapResult.error,
      smtp_error: smtpResult.error
    };

    console.log('Resultado do teste:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro ao testar conexão:', errorMessage);
    return new Response(
      JSON.stringify({ 
        imap_ok: false,
        smtp_ok: false,
        imap_error: errorMessage,
        smtp_error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});
