import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, prefer, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const DBFRETE = {
  IMPRIMIR_COTACAO: "https://dbfreteapi.dyndns-web.com/gerais/relatorios/imprimirOrcamento/",
  LOGIN: "https://dbfreteapi.dyndns-web.com/login",
};

async function getToken() {
  const { data: registro, error } = await supabase.from("dbfrete_token").select("*").single();
  if (error || !registro) throw new Error("Registro de token não encontrado");

  const agora = new Date();
  const atualizadoEm = registro.atualizado_em ? new Date(registro.atualizado_em) : new Date(0);

  if (!registro.token || (agora.getTime() - atualizadoEm.getTime()) > 60 * 60 * 1000) {
    const res = await fetch(DBFRETE.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: registro.usuario,
        senha: registro.senha,
        id_cliente: registro.id_cliente,
      }),
    });
    const data = await res.json();
    if (!data.token) throw new Error("Não foi possível renovar token DBFrete");

    await supabase.from("dbfrete_token").update({
      token: data.token,
      atualizado_em: new Date().toISOString(),
    }).eq("id", registro.id);

    return data.token;
  }

  return registro.token;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK_SIZE = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

function buildEmailHtml(data: {
  nomeCliente: string;
  idCotacao: string | number;
  valorTotal?: string;
  origem?: string;
  destino?: string;
  peso?: string;
}): string {
  const { nomeCliente, idCotacao, valorTotal, origem, destino, peso } = data;
  
  const detailsRows: string[] = [];
  if (origem) detailsRows.push(`<tr><td style="padding:8px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">Origem</td><td style="padding:8px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${origem}</td></tr>`);
  if (destino) detailsRows.push(`<tr><td style="padding:8px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">Destino</td><td style="padding:8px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${destino}</td></tr>`);
  if (peso) detailsRows.push(`<tr><td style="padding:8px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;">Peso</td><td style="padding:8px 16px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${peso}</td></tr>`);
  if (valorTotal) detailsRows.push(`<tr><td style="padding:8px 16px;color:#6b7280;font-size:14px;">Valor Total</td><td style="padding:8px 16px;font-size:14px;font-weight:700;color:#ea580c;">${valorTotal}</td></tr>`);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotação #${idCotacao} - FP Transcargas</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08);border-radius:12px;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#1e293b;padding:28px 32px;text-align:center;">
              <img src="https://fptranscargas.com.br/imags/logo.png" alt="FP Transcargas" style="height:52px;width:auto;margin-bottom:4px;" />
            </td>
          </tr>

          <!-- Orange accent line -->
          <tr>
            <td style="background-color:#ea580c;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 32px 28px;">
              
              <!-- Badge -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <span style="display:inline-block;background-color:#fff7ed;color:#c2410c;font-size:14px;font-weight:700;padding:8px 20px;border-radius:24px;border:1px solid #fed7aa;letter-spacing:0.3px;">
                      COTAÇÃO Nº ${idCotacao}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;color:#1f2937;font-size:15px;line-height:1.7;">
                Prezado(a) <strong>${nomeCliente}</strong>,
              </p>
              
              <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.7;">
                Agradecemos o seu contato. Segue em anexo a cotação de frete conforme solicitado.
              </p>

              ${detailsRows.length > 0 ? `
              <!-- Details Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                <tr>
                  <td colspan="2" style="padding:10px 16px;background-color:#f8fafc;font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;">
                    Resumo da Cotação
                  </td>
                </tr>
                ${detailsRows.join('')}
              </table>
              ` : ''}

              <!-- Attachment notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;border-left:4px solid #22c55e;">
                    <p style="margin:0;color:#166534;font-size:14px;font-weight:500;">
                      📎 O PDF completo da cotação está anexado a este e-mail.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
                Caso tenha alguma dúvida ou queira prosseguir com esta cotação, entre em contato conosco pelos canais abaixo:
              </p>

              <!-- Contact channels -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#374151;font-size:14px;">
                          ✉️ <strong>E-mail:</strong> <a href="mailto:atendimento@fptranscargas.com.br" style="color:#ea580c;text-decoration:none;font-weight:600;">atendimento@fptranscargas.com.br</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#374151;font-size:14px;">
                          📱 <strong>WhatsApp:</strong> <a href="https://wa.me/557583718627" style="color:#ea580c;text-decoration:none;font-weight:600;">Clique aqui para falar conosco</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
                Atenciosamente,<br/>
                <strong style="color:#1e293b;">Equipe FP Transcargas</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1e293b;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 6px;color:#cbd5e1;font-size:12px;font-weight:500;">
                FP Transcargas — Transporte Rodoviário &amp; Logística
              </p>
              <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;">
                Este é um e-mail automático enviado por <strong>noreply@fptranscargas.com.br</strong>.
              </p>
              <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;">
                Por favor, <strong>não responda</strong> este e-mail. Para atendimento, utilize os canais acima.
              </p>
              <p style="margin:0;color:#64748b;font-size:10px;margin-top:12px;">
                © ${new Date().getFullYear()} FP Transcargas. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      idCotacao, 
      emailCliente, 
      nomeCliente, 
      contaEmailId,
      valorTotal,
      origem,
      destino,
      peso
    } = body;

    if (!idCotacao || !emailCliente) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'idCotacao e emailCliente são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[email-cotacao] Buscando PDF da cotação ${idCotacao}...`);

    // 1. Buscar o PDF da cotação
    const token = await getToken();
    const pdfResponse = await fetch(`${DBFRETE.IMPRIMIR_COTACAO}${idCotacao}?empresa=1`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!pdfResponse.ok) {
      const txt = await pdfResponse.text();
      console.error(`[email-cotacao] Erro ao buscar PDF: ${txt}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Erro ao gerar PDF: ${txt}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = arrayBufferToBase64(pdfBuffer);
    
    console.log(`[email-cotacao] PDF obtido (${pdfBuffer.byteLength} bytes), enviando email para ${emailCliente}...`);

    // 2. Montar HTML do email
    const htmlEmail = buildEmailHtml({
      nomeCliente: nomeCliente || 'Cliente',
      idCotacao,
      valorTotal,
      origem,
      destino,
      peso,
    });

    // 3. Chamar a edge function email-send para enviar
    // Buscar conta de email padrão se não fornecida
    let contaId = contaEmailId;
    if (!contaId) {
      const { data: contas, error: contaError } = await supabase
        .from('email_contas')
        .select('id')
        .eq('ativo', true)
        .limit(1)
        .single();
      
      if (contaError || !contas) {
        console.error('[email-cotacao] Nenhuma conta de email ativa encontrada:', contaError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Nenhuma conta de email configurada. Configure uma conta em Configurações > Email.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      contaId = contas.id;
      console.log(`[email-cotacao] Usando conta de email padrão: ${contaId}`);
    }

    const emailPayload: any = {
      conta_id: contaId,
      para: [emailCliente],
      assunto: `Cotação de Frete #${idCotacao} - FP Transcargas`,
      corpo: htmlEmail,
      html: true,
      anexos: [{
        nome: `Cotacao_${idCotacao}.pdf`,
        tipo: 'application/pdf',
        conteudo: pdfBase64,
      }],
    };

    const emailSendUrl = `${supabaseUrl}/functions/v1/email-send`;
    const emailResponse = await fetch(emailSendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify(emailPayload),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error(`[email-cotacao] Erro ao enviar email:`, emailResult);
      return new Response(JSON.stringify({ 
        success: false, 
        error: emailResult.error || 'Erro ao enviar email' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[email-cotacao] Email enviado com sucesso para ${emailCliente}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Email enviado para ${emailCliente}`,
      data: emailResult,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    console.error(`[email-cotacao] Erro:`, errorMessage);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
