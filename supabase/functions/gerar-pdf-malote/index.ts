import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Viagem {
  data: string;
  origem: string;
  destino: string;
  adiantamento: number;
  valor_frete: number;
  valor_motorista: number;
}

interface ValeViagemItem {
  descricao: string;
  valor: number;
}

interface MaloteData {
  id: string;
  numero?: number;
  motorista: string;
  telefone_motorista?: string;
  percentual: number;
  vale_viagem: number;
  combustivel: number;
  quant_litros: number;
  notas: number;
  quant_arla: number;
  extra: number;
  pedagio: number;
  despesa_motorista: number;
  assinatura_imagem?: string;
  assinatura_data?: string;
  assinado?: boolean;
  viagens: Viagem[];
  vale_viagem_itens: ValeViagemItem[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR');
}

function calcularTotais(malote: MaloteData) {
  const viagens = malote.viagens || [];
  const totalFaturamento = viagens.reduce((acc, v) => acc + (v.valor_frete || 0), 0);
  const totalAdiantamento = viagens.reduce((acc, v) => acc + (v.adiantamento || 0), 0);
  const totalMotorista = viagens.reduce((acc, v) => acc + (v.valor_motorista || 0), 0);
  
  // Soma = Combustível + Notas + Extra + Total Motorista (igual ao MalotePrint)
  const soma = 
    (malote.combustivel || 0) +
    (malote.notas || 0) +
    (malote.extra || 0) +
    totalMotorista;
  
  const saldo = (malote.vale_viagem || 0) - soma;
  
  return { totalFaturamento, totalAdiantamento, totalMotorista, soma, saldo };
}

// Função para baixar logo da URL e converter para base64
async function fetchLogoAsBase64(): Promise<string | null> {
  try {
    console.log('[Logo] Iniciando download do logo...');
    const response = await fetch('https://fptranscargas.com.br/imags/logo.png', {
      headers: {
        'Accept': 'image/png,image/*',
      }
    });
    
    if (!response.ok) {
      console.error('[Logo] Falha ao baixar logo:', response.status, response.statusText);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Converter para base64
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
    console.log('[Logo] Logo baixado com sucesso, tamanho:', uint8Array.length, 'bytes');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('[Logo] Erro ao baixar logo:', error);
    return null;
  }
}

async function generatePDF(malote: MaloteData): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = 12;

  // Baixar logo
  const logoBase64 = await fetchLogoAsBase64();

  // ========== CABEÇALHO COM LOGO ==========
  const headerEndY = y + 18;
  
  // Adicionar logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, y, 12, 12);
      console.log('[PDF] Logo adicionado com sucesso');
    } catch (e) {
      console.error('[PDF] Erro ao adicionar logo:', e);
    }
  } else {
    console.log('[PDF] Logo não disponível, continuando sem logo');
  }
  
  // Info da empresa (lado esquerdo, após logo)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FP TRANSCARGAS', margin + 14, y + 4);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('CNPJ: 05.805.337/0001-90', margin + 14, y + 9);
  doc.text('Rua Comendador Gomes, 265 - Tomba | Feira de Santana - BA', margin + 14, y + 13);
  doc.setTextColor(0, 0, 0);
  
  // Box do número do malote (lado direito)
  const boxWidth = 32;
  const boxHeight = 18;
  const boxX = pageWidth - margin - boxWidth;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, y, boxWidth, boxHeight, 2, 2, 'S');
  
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text('MALOTE', boxX + boxWidth / 2, y + 5, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`${malote.numero || '—'}`, boxX + boxWidth / 2, y + 13, { align: 'center' });
  
  // Linha divisória
  y = headerEndY + 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // ========== MOTORISTA E VALE ==========
  const infoBoxHeight = 14;
  doc.setFillColor(249, 250, 251); // bg-gray-50
  doc.setDrawColor(229, 231, 235); // border-gray-200
  doc.roundedRect(margin, y, pageWidth - 2 * margin, infoBoxHeight, 1.5, 1.5, 'FD');
  
  // Motorista info
  doc.setFontSize(6);
  doc.setTextColor(107, 114, 128); // text-gray-500
  doc.text(`MOTORISTA (${malote.percentual || 0}%)`, margin + 4, y + 4);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(malote.motorista || 'N/A', margin + 4, y + 9);
  
  // Telefone
  if (malote.telefone_motorista) {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('TELEFONE', margin + 60, y + 4);
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(malote.telefone_motorista, margin + 60, y + 9);
  }
  
  // Vale Viagem (lado direito)
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('VALE VIAGEM', pageWidth - margin - 35, y + 4);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(malote.vale_viagem || 0), pageWidth - margin - 35, y + 9);
  
  y += infoBoxHeight + 5;

  // ========== TABELA DE VIAGENS ==========
  const colWidths = [22, 32, 32, 30, 30, 30];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const tableX = margin;
  
  // Header da tabela (fundo escuro)
  doc.setFillColor(31, 41, 55); // bg-gray-800
  doc.rect(tableX, y, tableWidth, 6, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  
  let xPos = tableX + 2;
  doc.text('Data', xPos, y + 4);
  xPos += colWidths[0];
  doc.text('Origem', xPos, y + 4);
  xPos += colWidths[1];
  doc.text('Destino', xPos, y + 4);
  xPos += colWidths[2];
  doc.text('Adiantamento', xPos + colWidths[3] - 2, y + 4, { align: 'right' });
  xPos += colWidths[3];
  doc.text('Frete', xPos + colWidths[4] - 2, y + 4, { align: 'right' });
  xPos += colWidths[4];
  doc.text('Motorista', xPos + colWidths[5] - 2, y + 4, { align: 'right' });
  
  y += 6;
  
  // Linhas da tabela (alternando cores como MalotePrint)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const viagens = malote.viagens || [];
  viagens.forEach((viagem, index) => {
    // Fundo alternado (par = branco, ímpar = cinza) - igual MalotePrint
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251); // bg-gray-50
      doc.rect(tableX, y, tableWidth, 5, 'F');
    }
    
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    xPos = tableX + 2;
    doc.text(formatDate(viagem.data), xPos, y + 3.5);
    xPos += colWidths[0];
    doc.text((viagem.origem || '').substring(0, 18), xPos, y + 3.5);
    xPos += colWidths[1];
    doc.text((viagem.destino || '').substring(0, 18), xPos, y + 3.5);
    xPos += colWidths[2];
    doc.text(formatCurrency(viagem.adiantamento || 0), xPos + colWidths[3] - 2, y + 3.5, { align: 'right' });
    xPos += colWidths[3];
    doc.text(formatCurrency(viagem.valor_frete || 0), xPos + colWidths[4] - 2, y + 3.5, { align: 'right' });
    xPos += colWidths[4];
    doc.text(formatCurrency(viagem.valor_motorista || 0), xPos + colWidths[5] - 2, y + 3.5, { align: 'right' });
    
    // Linha divisória
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.1);
    doc.line(tableX, y + 5, tableX + tableWidth, y + 5);
    
    y += 5;
  });
  
  // Totais
  const totais = calcularTotais(malote);
  doc.setFillColor(229, 231, 235); // bg-gray-200
  doc.rect(tableX, y, tableWidth, 6, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  xPos = tableX + 2 + colWidths[0] + colWidths[1];
  doc.text('Totais', xPos + colWidths[2] - 2, y + 4, { align: 'right' });
  xPos += colWidths[2];
  doc.text(formatCurrency(totais.totalAdiantamento), xPos + colWidths[3] - 2, y + 4, { align: 'right' });
  xPos += colWidths[3];
  doc.text(formatCurrency(totais.totalFaturamento), xPos + colWidths[4] - 2, y + 4, { align: 'right' });
  xPos += colWidths[4];
  doc.text(formatCurrency(totais.totalMotorista), xPos + colWidths[5] - 2, y + 4, { align: 'right' });
  
  y += 10;

  // ========== DESPESAS E RESUMO LADO A LADO ==========
  const gapBetweenBoxes = 4;
  const resumoWidth = 48; // w-48 do MalotePrint
  const despesasWidth = pageWidth - 2 * margin - gapBetweenBoxes - resumoWidth;
  
  // Box Despesas
  doc.setDrawColor(209, 213, 219); // border-gray-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, despesasWidth, 38, 1.5, 1.5, 'S');
  
  // Header Despesas
  doc.setFillColor(31, 41, 55);
  doc.roundedRect(margin, y, despesasWidth, 6, 1.5, 1.5, 'F');
  doc.setFillColor(31, 41, 55);
  doc.rect(margin, y + 3, despesasWidth, 3, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Despesas', margin + 4, y + 4);
  
  // Conteúdo Despesas (2 colunas como MalotePrint)
  const despY = y + 10;
  const col1X = margin + 4;
  const col2X = margin + despesasWidth / 2 + 4;
  const colValueOffset = 42;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  // Linha 1: Combustível | Qtd. Litros
  doc.setTextColor(107, 114, 128);
  doc.text('Combustível:', col1X, despY);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(malote.combustivel || 0), col1X + colValueOffset, despY, { align: 'right' });
  
  doc.setTextColor(107, 114, 128);
  doc.text('Qtd. Litros:', col2X, despY);
  doc.setTextColor(0, 0, 0);
  doc.text(`${malote.quant_litros || 0}`, col2X + 32, despY, { align: 'right' });
  
  // Linha 2: Notas | Qtd. ARLA
  doc.setTextColor(107, 114, 128);
  doc.text('Notas:', col1X, despY + 6);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(malote.notas || 0), col1X + colValueOffset, despY + 6, { align: 'right' });
  
  doc.setTextColor(107, 114, 128);
  doc.text('Qtd. ARLA:', col2X, despY + 6);
  doc.setTextColor(0, 0, 0);
  doc.text(`${malote.quant_arla || 0}`, col2X + 32, despY + 6, { align: 'right' });
  
  // Linha 3: Extra | Pedágio
  doc.setTextColor(107, 114, 128);
  doc.text('Extra:', col1X, despY + 12);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(malote.extra || 0), col1X + colValueOffset, despY + 12, { align: 'right' });
  
  doc.setTextColor(107, 114, 128);
  doc.text('Pedágio:', col2X, despY + 12);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(malote.pedagio || 0), col2X + 32, despY + 12, { align: 'right' });
  
  // Linha 4: Motorista (só na coluna 1)
  doc.setTextColor(107, 114, 128);
  doc.text('Motorista:', col1X, despY + 18);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(totais.totalMotorista), col1X + colValueOffset, despY + 18, { align: 'right' });
  
  // Box Resumo
  const resumoX = margin + despesasWidth + gapBetweenBoxes;
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(resumoX, y, resumoWidth, 38, 1.5, 1.5, 'S');
  
  // Header Resumo
  doc.setFillColor(31, 41, 55);
  doc.roundedRect(resumoX, y, resumoWidth, 6, 1.5, 1.5, 'F');
  doc.rect(resumoX, y + 3, resumoWidth, 3, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Resumo', resumoX + 4, y + 4);
  
  // Conteúdo Resumo
  const resY = y + 12;
  const isNegativo = totais.soma > (malote.vale_viagem || 0);
  const valeExibir = isNegativo ? -(malote.vale_viagem || 0) : (malote.vale_viagem || 0);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  // Soma
  doc.setTextColor(107, 114, 128);
  doc.text('Soma:', resumoX + 4, resY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(totais.soma), resumoX + resumoWidth - 4, resY, { align: 'right' });
  
  // Linha divisória
  doc.setDrawColor(229, 231, 235);
  doc.line(resumoX + 4, resY + 3, resumoX + resumoWidth - 4, resY + 3);
  
  // Vale
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Vale:', resumoX + 4, resY + 8);
  doc.setFont('helvetica', 'bold');
  if (isNegativo) {
    doc.setTextColor(185, 28, 28); // text-red-700
  } else {
    doc.setTextColor(0, 0, 0);
  }
  doc.text(formatCurrency(valeExibir), resumoX + resumoWidth - 4, resY + 8, { align: 'right' });
  
  // Linha divisória
  doc.setDrawColor(229, 231, 235);
  doc.line(resumoX + 4, resY + 11, resumoX + resumoWidth - 4, resY + 11);
  
  // Saldo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Saldo:', resumoX + 4, resY + 17);
  
  if (totais.saldo >= 0) {
    doc.setTextColor(21, 128, 61); // text-green-700
  } else {
    doc.setTextColor(185, 28, 28); // text-red-700
  }
  doc.text(formatCurrency(totais.saldo), resumoX + resumoWidth - 4, resY + 17, { align: 'right' });
  
  y += 44;

  // ========== RODAPÉ COM ASSINATURA ==========
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  
  // Data de geração (esquerda)
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175); // text-gray-400
  doc.text(`Documento gerado em ${formatDateTime(new Date().toISOString())}`, margin, y);
  
  // Assinatura (centro)
  const centerX = pageWidth / 2;
  
  if (malote.assinado && malote.assinatura_imagem) {
    try {
      // Adicionar imagem da assinatura
      doc.addImage(malote.assinatura_imagem, 'PNG', centerX - 25, y - 2, 50, 15);
      y += 14;
    } catch (e) {
      console.error('[PDF] Erro ao adicionar imagem da assinatura:', e);
      y += 12;
    }
    
    // Linha da assinatura
    doc.setDrawColor(156, 163, 175);
    doc.line(centerX - 35, y, centerX + 35, y);
    y += 3;
    
    // Nome do motorista
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(malote.motorista || '', centerX, y, { align: 'center' });
    y += 3;
    
    // Data da assinatura
    if (malote.assinatura_data) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Assinado em ${formatDate(malote.assinatura_data)}`, centerX, y, { align: 'center' });
    }
  } else {
    // Espaço para assinatura manual
    y += 12;
    doc.setDrawColor(156, 163, 175);
    doc.line(centerX - 35, y, centerX + 35, y);
    y += 3;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Assinatura do Motorista', centerX, y, { align: 'center' });
  }
  
  // Info da empresa (direita)
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text('FP Transcargas', pageWidth - margin, pageHeight - 12, { align: 'right' });
  doc.text('(75) 3199-2515', pageWidth - margin, pageHeight - 8, { align: 'right' });

  return doc.output('datauristring').split(',')[1]; // Return base64
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { malote_id } = await req.json();

    if (!malote_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'malote_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PDF] Gerando PDF para malote:', malote_id);

    // Buscar dados do malote
    const { data: maloteData, error: maloteError } = await supabase
      .from('malotes')
      .select('*')
      .eq('id', malote_id)
      .single();

    if (maloteError || !maloteData) {
      console.error('[PDF] Erro ao buscar malote:', maloteError);
      return new Response(
        JSON.stringify({ success: false, error: 'Malote não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar viagens do malote
    const { data: viagens, error: viagensError } = await supabase
      .from('malote_viagens')
      .select('*')
      .eq('malote_id', malote_id)
      .order('data', { ascending: true });

    if (viagensError) {
      console.error('[PDF] Erro ao buscar viagens:', viagensError);
    }

    // Buscar itens do vale viagem
    const { data: valeItens, error: valeItensError } = await supabase
      .from('malote_vale_viagem_itens')
      .select('*')
      .eq('malote_id', malote_id);

    if (valeItensError) {
      console.error('[PDF] Erro ao buscar itens do vale:', valeItensError);
    }

    const malote: MaloteData = {
      ...maloteData,
      viagens: viagens || [],
      vale_viagem_itens: valeItens || []
    };

    // Gerar PDF
    const pdfBase64 = await generatePDF(malote);

    console.log('[PDF] PDF gerado com sucesso para malote:', malote_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf_base64: pdfBase64,
        filename: `malote_${malote.numero || malote_id}.pdf`,
        motorista: malote.motorista,
        telefone: malote.telefone_motorista
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[PDF] Erro na função gerar-pdf-malote:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
