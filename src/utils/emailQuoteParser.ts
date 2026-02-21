/**
 * Utilitários para separar o conteúdo principal de um email das citações anteriores
 */

export interface ParsedEmailContent {
  /** Conteúdo principal do email (sem citações) */
  mainContent: string;
  /** Citações/respostas anteriores ocultas */
  quotedContent: string | null;
  /** Se existe conteúdo citado */
  hasQuote: boolean;
  /** Mensagem encaminhada (forwarded message) */
  forwardedContent: string | null;
  /** Se existe mensagem encaminhada */
  hasForwarded: boolean;
}

// Padrões específicos para classes de citação (maior prioridade)
const CLASS_QUOTE_PATTERNS = [
  // Gmail quote block
  /<div[^>]*class="[^"]*gmail_quote[^"]*"[^>]*>/i,
  // Gmail extra (wrapper comum)
  /<div[^>]*class="[^"]*gmail_extra[^"]*"[^>]*>/i,
  // Outlook reply/forward
  /<div[^>]*id="divRplyFwdMsg"[^>]*>/i,
  // Yahoo quote
  /<div[^>]*class="[^"]*yahoo_quoted[^"]*"[^>]*>/i,
  // Blockquote padrão
  /<blockquote[^>]*type="cite"[^>]*>/i,
  /<blockquote[^>]*>/i,
];

// Padrões de texto que indicam início de citação (menor prioridade)
// Estes são mais específicos para evitar falsos positivos
const TEXT_QUOTE_PATTERNS = [
  // Gmail PT-BR: "Em segunda, 9 de jan de 2026 às 13:52, Nome <email> escreveu:"
  // Requer dia da semana em português + email entre &lt; &gt; + "escreveu:"
  /Em\s+(segunda|terça|quarta|quinta|sexta|sábado|domingo|seg\.?|ter\.?|qua\.?|qui\.?|sex\.?|sáb\.?|dom\.?)[^]*?&lt;[^&]+@[^&]+&gt;\s*escreveu:/i,
  
  // Gmail EN: "On Mon, Jan 9, 2026 at 1:52 PM, Name <email> wrote:"
  /On\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[^]*?&lt;[^&]+@[^&]+&gt;\s*wrote:/i,
  
  // Outlook style headers (De:/From: seguido de mais campos)
  /<hr[^>]*>\s*<b>\s*(De|From)\s*:\s*<\/b>/i,
  
  // Border-left quote (estilo comum em muitos clientes)
  /<div[^>]*style="[^"]*border-left:\s*1px\s+solid[^"]*"[^>]*>/i,
  
  // Outlook PT-BR inline: "De: email@example.com <email@example.com>\nEnviada em: ..."
  // Detecta padrão "De:" seguido de "Enviada em:" ou "Enviado em:"
  /De:\s*[^\n<]+(?:&lt;[^&]+@[^&]+&gt;|<[^>]+@[^>]+>)?\s*(?:<br\s*\/?>|\n)\s*Enviada?\s+em:/i,
  
  // Outlook EN inline: "From: ... Sent: ..."
  /From:\s*[^\n<]+(?:&lt;[^&]+@[^&]+&gt;|<[^>]+@[^>]+>)?\s*(?:<br\s*\/?>|\n)\s*Sent:/i,
];

// Padrões para limpar marcações vazias
const CLEANUP_PATTERNS = [
  // Linhas vazias ou só com espaço no início
  /^(\s*<br\s*\/?>\s*)+/gi,
  // Divs vazias no início
  /^(\s*<div>\s*<\/div>\s*)+/gi,
];

/**
 * Encontra o índice onde começa a citação, priorizando padrões de classe
 */
function findQuoteStartIndex(htmlContent: string): { index: number; pattern: string } {
  let bestMatch = { index: -1, pattern: '' };
  
  // Primeiro, tentar padrões de classe (mais confiáveis)
  for (const pattern of CLASS_QUOTE_PATTERNS) {
    const match = htmlContent.match(pattern);
    if (match && match.index !== undefined) {
      // Só aceitar se não estiver muito no início
      if (match.index > 20) {
        if (bestMatch.index === -1 || match.index < bestMatch.index) {
          bestMatch = { index: match.index, pattern: match[0] };
        }
      }
    }
  }
  
  // Se encontrou padrão de classe, usar ele
  if (bestMatch.index > 0) {
    return bestMatch;
  }
  
  // Fallback: tentar padrões de texto
  for (const pattern of TEXT_QUOTE_PATTERNS) {
    const match = htmlContent.match(pattern);
    if (match && match.index !== undefined) {
      // Requer posição mínima maior para padrões de texto (evitar falsos positivos)
      if (match.index > 50) {
        if (bestMatch.index === -1 || match.index < bestMatch.index) {
          bestMatch = { index: match.index, pattern: match[0] };
        }
      }
    }
  }
  
  return bestMatch;
}

/**
 * Verifica se o conteúdo principal extraído parece válido
 */
function isValidMainContent(mainContent: string): boolean {
  // Remover tags HTML e contar texto real
  const textOnly = mainContent.replace(/<[^>]*>/g, '').trim();
  
  // Conteúdo principal deve ter pelo menos 10 caracteres de texto real
  if (textOnly.length < 10) {
    return false;
  }
  
  // Verificar se não é só whitespace/pontuação
  const alphanumeric = textOnly.replace(/[\s\W]/g, '');
  if (alphanumeric.length < 5) {
    return false;
  }
  
  return true;
}

/**
 * Separa o conteúdo principal de um email das citações anteriores
 */
// Padrões para detectar mensagens encaminhadas (suportando texto e HTML)
const FORWARDED_MESSAGE_PATTERNS = [
  // Gmail: "---------- Forwarded message ---------" (texto ou HTML com hífens normais ou entidades)
  /[-–—]{3,}\s*Forwarded\s+message\s*[-–—]{3,}/i,
  // Gmail PT-BR: "---------- Mensagem encaminhada ---------"
  /[-–—]{3,}\s*Mensagem\s+encaminhada\s*[-–—]{3,}/i,
  // Outlook: "-----Original Message-----"
  /[-–—]{3,}\s*Original\s+Message\s*[-–—]{3,}/i,
  // Outlook PT: "-----Mensagem Original-----"
  /[-–—]{3,}\s*Mensagem\s+Original\s*[-–—]{3,}/i,
  // Apple Mail: "Begin forwarded message:"
  /Begin\s+forwarded\s+message\s*:/i,
  // Versão com entidades HTML para hífens (&#45; ou -)
  /(?:&#45;|&#x2d;|-){3,}\s*Forwarded\s+message\s*(?:&#45;|&#x2d;|-){3,}/i,
  /(?:&#45;|&#x2d;|-){3,}\s*Mensagem\s+encaminhada\s*(?:&#45;|&#x2d;|-){3,}/i,
  // Padrão simplificado: detectar "Forwarded message" ou "Mensagem encaminhada" seguido de quebras
  /Forwarded\s+message\s*[-–—]*\s*(<br|<div|\n)/i,
  /Mensagem\s+encaminhada\s*[-–—]*\s*(<br|<div|\n)/i,
  // Detectar padrão "De:" com email entre &lt; &gt; (HTML entities)
  /De:\s*[^&<]+&lt;[^&]+@[^&]+&gt;/i,
  // Detectar padrão "From:" com email entre &lt; &gt;
  /From:\s*[^&<]+&lt;[^&]+@[^&]+&gt;/i,
];

/**
 * Encontra o índice onde começa uma mensagem encaminhada
 */
function findForwardedStartIndex(htmlContent: string): number {
  // Verificar primeiro por padrões de "Forwarded message" ou "Mensagem encaminhada"
  const forwardedHeaderPatterns = [
    /[-–—]{3,}\s*Forwarded\s+message\s*[-–—]*/i,
    /[-–—]{3,}\s*Mensagem\s+encaminhada\s*[-–—]*/i,
    /Forwarded\s+message\s*[-–—]*/i,
    /Mensagem\s+encaminhada\s*[-–—]*/i,
  ];
  
  for (const pattern of forwardedHeaderPatterns) {
    const match = htmlContent.match(pattern);
    if (match && match.index !== undefined && match.index > 10) {
      return match.index;
    }
  }
  
  // Fallback: outros padrões
  for (const pattern of FORWARDED_MESSAGE_PATTERNS) {
    const match = htmlContent.match(pattern);
    if (match && match.index !== undefined && match.index > 20) {
      return match.index;
    }
  }
  return -1;
}

export function parseEmailContent(htmlContent: string): ParsedEmailContent {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return {
      mainContent: htmlContent || '',
      quotedContent: null,
      hasQuote: false,
      forwardedContent: null,
      hasForwarded: false,
    };
  }

  // Primeiro, verificar se há mensagem encaminhada
  const forwardedStartIndex = findForwardedStartIndex(htmlContent);
  
  let mainContent = htmlContent;
  let forwardedContent: string | null = null;
  let hasForwarded = false;

  if (forwardedStartIndex >= 0) {
    // Se o forward começa muito no início (< 50 chars de texto real), 
    // ainda assim separar mas mostrar como forward
    const beforeForward = htmlContent.substring(0, forwardedStartIndex);
    const textBeforeForward = beforeForward.replace(/<[^>]*>/g, '').trim();
    
    forwardedContent = htmlContent.substring(forwardedStartIndex);
    hasForwarded = true;
    
    // Se há texto significativo antes do forward, usar como mainContent
    if (textBeforeForward.length > 10) {
      mainContent = beforeForward
        .replace(/(\s*<br\s*\/?>\s*)+$/gi, '')
        .replace(/(\s*<div>\s*<\/div>\s*)+$/gi, '')
        .replace(/(\s*<p>\s*<\/p>\s*)+$/gi, '')
        .trim();
    } else {
      // Se não há texto antes, mainContent fica vazio mas forward existe
      mainContent = '';
    }
  }

  // Se não tem forwarded, verificar citações
  if (!hasForwarded) {
    const { index: quoteStartIndex } = findQuoteStartIndex(htmlContent);

    if (quoteStartIndex <= 0) {
      return {
        mainContent: htmlContent,
        quotedContent: null,
        hasQuote: false,
        forwardedContent: null,
        hasForwarded: false,
      };
    }

    mainContent = htmlContent.substring(0, quoteStartIndex);
    const quotedContent = htmlContent.substring(quoteStartIndex);

    for (const cleanupPattern of CLEANUP_PATTERNS) {
      mainContent = mainContent.replace(cleanupPattern, '');
    }

    mainContent = mainContent
      .replace(/(\s*<br\s*\/?>\s*)+$/gi, '')
      .replace(/(\s*<div>\s*<\/div>\s*)+$/gi, '')
      .replace(/(\s*<p>\s*<\/p>\s*)+$/gi, '')
      .trim();

    if (!isValidMainContent(mainContent)) {
      return {
        mainContent: htmlContent,
        quotedContent: null,
        hasQuote: false,
        forwardedContent: null,
        hasForwarded: false,
      };
    }

    return {
      mainContent,
      quotedContent,
      hasQuote: true,
      forwardedContent: null,
      hasForwarded: false,
    };
  }

  return {
    mainContent,
    quotedContent: null,
    hasQuote: false,
    forwardedContent,
    hasForwarded,
  };
}

/**
 * Remove prefixos de resposta do assunto (Re:, Fw:, etc)
 */
export function cleanSubjectPrefix(subject: string): string {
  if (!subject) return '';
  return subject
    .replace(/^(re:|fw:|fwd:|enc:|res:|aw:|wg:)\s*/gi, '')
    .replace(/^(re:|fw:|fwd:|enc:|res:|aw:|wg:)\s*/gi, '') // Duplo para casos como "Re: Re:"
    .trim();
}
