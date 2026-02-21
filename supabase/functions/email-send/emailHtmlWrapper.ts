/**
 * Wrapper HTML para emails - Compatível com Gmail, Outlook, Apple Mail
 * 
 * Este módulo garante que emails HTML sejam renderizados corretamente
 * em todos os clientes de email, especialmente o Gmail que remove
 * estilos em tags <style> e classes CSS.
 */

/**
 * Estilos inline padrão para elementos comuns
 */
const DEFAULT_INLINE_STYLES = {
  body: 'margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; color: #333333; background-color: #ffffff;',
  table: 'border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;',
  td: 'font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5;',
  p: 'margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5;',
  a: 'color: #0066cc; text-decoration: underline;',
  img: 'border: 0; display: block; outline: none; text-decoration: none;',
  strong: 'font-weight: bold;',
  em: 'font-style: italic;',
  u: 'text-decoration: underline;',
  h1: 'margin: 0 0 15px 0; font-family: Arial, Helvetica, sans-serif; font-size: 24px; line-height: 1.3; font-weight: bold;',
  h2: 'margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 20px; line-height: 1.3; font-weight: bold;',
  h3: 'margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.3; font-weight: bold;',
  div: 'margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5;',
  span: 'font-family: Arial, Helvetica, sans-serif;',
  br: '',
};

/**
 * Lista de tags que precisam de estilos inline
 */
const TAGS_TO_STYLE = ['p', 'div', 'span', 'a', 'table', 'td', 'tr', 'th', 'img', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'];

/**
 * Verifica se o HTML já tem estrutura completa (DOCTYPE, html, body)
 */
export function hasCompleteHtmlStructure(html: string): boolean {
  const lowerHtml = html.toLowerCase().trim();
  return lowerHtml.includes('<!doctype') || 
         lowerHtml.includes('<html') ||
         (lowerHtml.includes('<body') && lowerHtml.includes('</body>'));
}

/**
 * Extrai estilos inline existentes de um elemento
 */
function getExistingStyle(tag: string): string {
  const styleMatch = tag.match(/style\s*=\s*["']([^"']*)["']/i);
  return styleMatch ? styleMatch[1] : '';
}

/**
 * Mescla estilos: estilos existentes têm prioridade absoluta
 * Propriedades já definidas no HTML original NÃO são sobrescritas
 */
function mergeStyles(defaultStyle: string, existingStyle: string): string {
  if (!existingStyle) return defaultStyle;
  if (!defaultStyle) return existingStyle;
  
  // Extrair propriedades existentes para não sobrescrever
  const existingProps = new Set(
    existingStyle.split(';')
      .map(s => s.split(':')[0]?.trim().toLowerCase())
      .filter(Boolean)
  );
  
  // Filtrar defaults para não incluir propriedades já definidas
  const filteredDefaults = defaultStyle.split(';')
    .filter(s => {
      const prop = s.split(':')[0]?.trim().toLowerCase();
      return prop && !existingProps.has(prop);
    })
    .join(';');
  
  // Combinar: defaults filtrados + existentes (existentes têm prioridade)
  const combined = (filteredDefaults + '; ' + existingStyle)
    .replace(/;\s*;/g, ';')
    .replace(/^\s*;\s*/, '')
    .replace(/;\s*$/, ';');
    
  return combined;
}

/**
 * Adiciona estilos inline a tags HTML
 * Preserva estilos existentes e adiciona defaults apenas onde necessário
 */
export function addInlineStyles(html: string): string {
  if (!html) return html;
  
  let result = html;
  
  // Para cada tipo de tag, adicionar estilos inline se não existirem
  for (const tagName of TAGS_TO_STYLE) {
    const defaultStyle = DEFAULT_INLINE_STYLES[tagName as keyof typeof DEFAULT_INLINE_STYLES] || '';
    if (!defaultStyle) continue;
    
    // Regex para encontrar tags (abertas) com ou sem atributos
    // Captura: <tagName ou <tagName atributos>
    const tagRegex = new RegExp(`<${tagName}(\\s[^>]*)?>`, 'gi');
    
    result = result.replace(tagRegex, (match) => {
      const existingStyle = getExistingStyle(match);
      const mergedStyle = mergeStyles(defaultStyle, existingStyle);
      
      // Se já tem style, substituir
      if (match.includes('style=')) {
        return match.replace(/style\s*=\s*["'][^"']*["']/i, `style="${mergedStyle}"`);
      }
      
      // Senão, adicionar style antes do >
      if (match.endsWith('/>')) {
        return match.replace('/>', ` style="${mergedStyle}" />`);
      }
      return match.replace('>', ` style="${mergedStyle}">`);
    });
  }
  
  return result;
}

/**
 * Converte quebras de linha simples para tags <br>
 */
function convertLineBreaks(html: string): string {
  // Não converter se já tem estrutura HTML complexa
  if (html.includes('<div') || html.includes('<p') || html.includes('<table')) {
    return html;
  }
  return html.replace(/\n/g, '<br>');
}

/**
 * Cria wrapper HTML completo para email
 * Compatível com Gmail, Outlook, Apple Mail, etc.
 */
export function wrapEmailHtml(content: string, options: {
  backgroundColor?: string;
  contentWidth?: number;
} = {}): string {
  const { 
    backgroundColor = '#ffffff',
    contentWidth = 600 
  } = options;
  
  // Se já tem estrutura completa, apenas adicionar estilos inline
  if (hasCompleteHtmlStructure(content)) {
    return addInlineStyles(content);
  }
  
  // Processar conteúdo
  let processedContent = content;
  processedContent = convertLineBreaks(processedContent);
  processedContent = addInlineStyles(processedContent);
  
  // Template HTML completo otimizado para email
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title></title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 20px; background-color: ${backgroundColor}; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; color: #333333; text-align: left; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <!--[if mso]>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${contentWidth}">
    <tr>
      <td align="left" style="text-align: left;">
  <![endif]-->
  
  <div style="max-width: ${contentWidth}px; text-align: left;">
    ${processedContent}
  </div>
  
  <!--[if mso]>
      </td>
    </tr>
  </table>
  <![endif]-->
</body>
</html>`;
}

/**
 * Processa o corpo do email para garantir compatibilidade
 * Função principal a ser usada antes de enviar emails
 */
export function processEmailBody(body: string, isHtml: boolean = true): string {
  if (!isHtml) {
    // Para texto plano, converter para HTML simples
    const htmlBody = body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    return wrapEmailHtml(`<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; color: #333333;">${htmlBody}</div>`);
  }
  
  return wrapEmailHtml(body);
}
