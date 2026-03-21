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
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#1e293b;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
              <img src="https://fptranscargas.com.br/imags/favicon.png" alt="FP Transcargas" style="height:48px;width:auto;margin-bottom:8px;" />
              <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.5px;">FP TRANSCARGAS</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">Transporte Rodoviário &amp; Logística</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;">
              
              <!-- Badge -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <span style="display:inline-block;background-color:#fff7ed;color:#ea580c;font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;border:1px solid #fed7aa;">
                      📋 Cotação #${idCotacao}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Prezado(a) <strong>${nomeCliente}</strong>,
              </p>
              
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Segue em anexo a cotação de frete solicitada. Confira os detalhes abaixo:
              </p>

              ${detailsRows.length > 0 ? `
              <!-- Details Table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                ${detailsRows.join('')}
              </table>
              ` : ''}

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center" style="padding:16px;background-color:#fffbeb;border-radius:8px;border:1px solid #fde68a;">
                    <p style="margin:0;color:#92400e;font-size:14px;">
                      📎 O PDF da cotação está anexado a este e-mail.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
                Caso tenha alguma dúvida ou queira prosseguir com esta cotação, entre em contato conosco.
              </p>
              
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
                Atenciosamente,<br/>
                <strong>Equipe FP Transcargas</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-radius:0 0 12px 12px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">
                FP Transcargas - Transporte Rodoviário &amp; Logística
              </p>
              <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;">
                Este e-mail foi enviado automaticamente. Por favor, não responda.
              </p>
              <p style="margin:0;color:#9ca3af;font-size:11px;">
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
