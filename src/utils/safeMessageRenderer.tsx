// Renderização segura de mensagens WhatsApp
import DOMPurify from 'isomorphic-dompurify';

/**
 * Processa formatação de mensagem de forma segura
 */
export const safeProcessMessageFormatting = (message: string): string => {
  if (!message || typeof message !== 'string') {
    return '';
  }

// Configuração restritiva do DOMPurify
  const cleanMessage = DOMPurify.sanitize(message, {
    ALLOWED_TAGS: ['strong', 'em', 'u', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
    RETURN_TRUSTED_TYPE: false
  });

  // Aplicar formatação básica apenas após sanitização
  return cleanMessage
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>') // *texto* -> negrito
    .replace(/_([^_]+)_/g, '<em>$1</em>')           // _texto_ -> itálico  
    .replace(/~([^~]+)~/g, '<u>$1</u>')             // ~texto~ -> sublinhado
    .replace(/\n/g, '<br>');                        // quebras de linha
};

/**
 * Componente seguro para renderizar mensagens
 */
interface SafeMessageProps {
  message: string;
  className?: string;
}

export const SafeMessageRenderer: React.FC<SafeMessageProps> = ({ 
  message, 
  className = ""
}) => {
  const safeHTML = safeProcessMessageFormatting(message);
  
  return (
    <div 
      className={`safe-message ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHTML }}
    />
  );
};