/**
 * Utilitário centralizado de sanitização HTML
 * Previne ataques XSS em toda a aplicação
 */
import DOMPurify, { Config } from 'isomorphic-dompurify';

/**
 * Configurações pré-definidas de sanitização
 */
export type SanitizeProfile = 'strict' | 'email' | 'rich' | 'text-only';

interface SanitizeConfig {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  FORBID_TAGS: string[];
  FORBID_ATTR: string[];
  USE_PROFILES?: { html: boolean };
}

const SANITIZE_CONFIGS: Record<SanitizeProfile, SanitizeConfig> = {
  // Perfil mais restritivo - apenas texto básico
  'strict': {
    ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'br', 'p', 'span'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style']
  },
  // Perfil para emails - permite HTML comum de email
  'email': {
    ALLOWED_TAGS: [
      'a', 'b', 'i', 'u', 'strong', 'em', 'br', 'p', 'div', 'span',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'hr', 'pre', 'code', 'font', 'center'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height', 'class', 'id',
      'style', 'border', 'cellpadding', 'cellspacing', 'colspan', 'rowspan',
      'align', 'valign', 'bgcolor', 'color', 'size', 'face', 'target'
    ],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link', 'base'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onreset', 'onchange', 'oninput']
  },
  // Perfil rico - HTML completo mas seguro
  'rich': {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link', 'base', 'noscript'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onreset', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress'],
    USE_PROFILES: { html: true }
  },
  // Apenas texto - remove todas as tags
  'text-only': {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_TAGS: [],
    FORBID_ATTR: []
  }
};

/**
 * Sanitiza HTML com perfil específico
 */
export function sanitizeHTML(
  html: string | null | undefined,
  profile: SanitizeProfile = 'email'
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const config = SANITIZE_CONFIGS[profile];

  if (profile === 'text-only') {
    // Remove todas as tags HTML
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [], RETURN_TRUSTED_TYPE: false }) as string;
  }

  const sanitizeOptions: Config = {
    FORBID_TAGS: config.FORBID_TAGS,
    FORBID_ATTR: config.FORBID_ATTR,
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
    RETURN_TRUSTED_TYPE: false
  };

  if (config.ALLOWED_TAGS.length > 0) {
    sanitizeOptions.ALLOWED_TAGS = config.ALLOWED_TAGS;
  }
  
  if (config.ALLOWED_ATTR.length > 0) {
    sanitizeOptions.ALLOWED_ATTR = config.ALLOWED_ATTR;
  }

  if (config.USE_PROFILES) {
    sanitizeOptions.USE_PROFILES = config.USE_PROFILES;
  }

  return DOMPurify.sanitize(html, sanitizeOptions) as string;
}

/**
 * Sanitiza para exibição em email (caso de uso mais comum)
 */
export function sanitizeEmailHTML(html: string | null | undefined): string {
  return sanitizeHTML(html, 'email');
}

/**
 * Sanitiza para texto puro
 */
export function sanitizeToText(html: string | null | undefined): string {
  return sanitizeHTML(html, 'text-only');
}

/**
 * Sanitiza para exibição estrita (comentários, mensagens de usuário)
 */
export function sanitizeStrict(html: string | null | undefined): string {
  return sanitizeHTML(html, 'strict');
}

/**
 * Verifica se string contém scripts maliciosos
 */
export function containsMaliciousContent(content: string): boolean {
  if (!content) return false;
  
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];

  return dangerousPatterns.some(pattern => pattern.test(content));
}

/**
 * Escapa caracteres HTML especiais
 */
export function escapeHTML(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, char => htmlEntities[char] || char);
}

/**
 * Desescapa caracteres HTML
 */
export function unescapeHTML(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  };
  
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, entity => htmlEntities[entity] || entity);
}
