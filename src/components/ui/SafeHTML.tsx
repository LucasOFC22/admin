/**
 * Componente SafeHTML - Renderização segura de HTML
 * Use este componente ao invés de dangerouslySetInnerHTML direto
 */
import React from 'react';
import { sanitizeHTML, type SanitizeProfile } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

interface SafeHTMLProps {
  /** Conteúdo HTML a ser renderizado */
  html: string | null | undefined;
  /** Perfil de sanitização */
  profile?: SanitizeProfile;
  /** Classes CSS adicionais */
  className?: string;
  /** Tag HTML a ser usada (padrão: div) */
  as?: 'div' | 'span' | 'p' | 'section' | 'article';
  /** Estilos inline (use com moderação) */
  style?: React.CSSProperties;
  /** ID do elemento */
  id?: string;
}

/**
 * Componente para renderização segura de HTML
 * Sanitiza automaticamente o conteúdo antes de renderizar
 * 
 * @example
 * <SafeHTML 
 *   html={emailBody} 
 *   profile="email" 
 *   className="prose prose-sm"
 * />
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({
  html,
  profile = 'email',
  className,
  as: Component = 'div',
  style,
  id
}) => {
  const sanitizedHTML = sanitizeHTML(html, profile);
  
  // Não renderizar se não houver conteúdo
  if (!sanitizedHTML) {
    return null;
  }

  return (
    <Component
      id={id}
      className={cn(className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

/**
 * Variante para conteúdo de email
 */
export const SafeEmailHTML: React.FC<Omit<SafeHTMLProps, 'profile'>> = (props) => (
  <SafeHTML {...props} profile="email" />
);

/**
 * Variante para conteúdo estrito (comentários, inputs de usuário)
 */
export const SafeStrictHTML: React.FC<Omit<SafeHTMLProps, 'profile'>> = (props) => (
  <SafeHTML {...props} profile="strict" />
);

/**
 * Variante rica para editores WYSIWYG
 */
export const SafeRichHTML: React.FC<Omit<SafeHTMLProps, 'profile'>> = (props) => (
  <SafeHTML {...props} profile="rich" />
);

export default SafeHTML;
