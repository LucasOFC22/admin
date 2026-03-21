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
  nroOrcamento: string | number;
  valorTotal?: string;
  origem?: string;
  destino?: string;
  peso?: string;
}): string {
  const { nomeCliente, nroOrcamento, valorTotal, origem, destino, peso } = data;
  
  const detailsRows: string[] = [];
  if (origem && origem !== '/') detailsRows.push(`<tr><td style="padding:10px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:120px;">Origem</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${origem}</td></tr>`);
  if (destino && destino !== '/') detailsRows.push(`<tr><td style="padding:10px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:120px;">Destino</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${destino}</td></tr>`);
  if (peso) detailsRows.push(`<tr><td style="padding:10px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:120px;">Peso</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${peso}</td></tr>`);
  if (valorTotal && valorTotal !== '0' && valorTotal !== '0,00') detailsRows.push(`<tr><td style="padding:10px 16px;color:#64748b;font-size:13px;width:120px;">Valor Total</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#1e293b;">${valorTotal}</td></tr>`);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotação ${nroOrcamento} - FP Transcargas</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 8px;">
    <tr>
      <td align="center">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
          
          <!-- Logo -->
          <tr>
            <td style="background-color:#ffffff;padding:20px 32px;text-align:center;border-bottom:3px solid #1e40af;">
              <img src="https://fptranscargas.com.br/imags/logo.png" alt="FP Transcargas" style="height:44px;width:auto;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;">
              
              <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Cotação nº ${nroOrcamento}</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0 24px;" />

              <p style="margin:0 0 16px;color:#1e293b;font-size:14px;line-height:1.6;">
                Prezado(a) <strong>${nomeCliente}</strong>,
              </p>
              
              <p style="margin:0 0 24px;color:#334155;font-size:14px;line-height:1.6;">
                Agradecemos o seu contato. Segue em anexo a cotação de frete conforme solicitado.
              </p>

              ${detailsRows.length > 0 ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e2e8f0;">
                <tr><td colspan="2" style="padding:8px 16px;background-color:#f8fafc;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">Resumo</td></tr>
                ${detailsRows.join('')}
              </table>
              ` : ''}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;background-color:#f0f9ff;border-left:3px solid #1e40af;">
                    <p style="margin:0;color:#1e40af;font-size:13px;">O PDF da cotação está anexado a este e-mail.</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.6;">
                Em caso de dúvidas ou para prosseguir com esta cotação:
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:4px 0;color:#334155;font-size:13px;">
                    E-mail: <a href="mailto:atendimento@fptranscargas.com.br" style="color:#1e40af;text-decoration:none;">atendimento@fptranscargas.com.br</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#334155;font-size:13px;">
                    WhatsApp: <a href="https://wa.me/5575837117561" style="color:#1e40af;text-decoration:none;">+55 75 8371-7561</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">
                Atenciosamente,<br/><strong>Equipe FP Transcargas</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;">
                E-mail automático — não responda esta mensagem.
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:10px;">
                © ${new Date().getFullYear()} FP Transcargas
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
      nroOrcamento,
      emailCliente, 
      nomeCliente, 
      contaEmailId,
      valorTotal,
      origem,
      destino,
      peso
    } = body;

    const numeroCotacao = nroOrcamento || idCotacao;

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
      nroOrcamento: numeroCotacao,
      valorTotal,
      origem,
      destino,
      peso,
    });

    // 3. Chamar a edge function email-send para enviar
    const contaEmail = 'noreply@fptranscargas.com.br';
    console.log(`[email-cotacao] Usando conta: ${contaEmail}`);

    const emailPayload: any = {
      conta_email: contaEmail,
      para: [emailCliente],
      assunto: `Cotação de Frete nº ${numeroCotacao} - FP Transcargas`,
      corpo: htmlEmail,
      html: true,
      anexos: [{
        nome: `Cotacao_${numeroCotacao}.pdf`,
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
