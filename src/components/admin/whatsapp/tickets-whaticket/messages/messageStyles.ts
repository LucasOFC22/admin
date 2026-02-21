// Constantes de estilo para mensagens - extraídas para evitar recriação a cada render

export const MESSAGE_BUBBLE_STYLES = {
  base: {
    minWidth: '100px',
    height: 'auto',
    display: 'block' as const,
    position: 'relative' as const,
    whiteSpace: 'pre-wrap' as const,
    paddingLeft: '8px',
    paddingRight: '8px',
    paddingTop: '8px',
    paddingBottom: '4px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
  },
  fromMe: {
    backgroundColor: '#dcf8c6',
    color: '#303030',
    alignSelf: 'flex-end' as const,
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '4px',
    marginLeft: '20px',
  },
  fromMePrivate: {
    backgroundColor: '#FEF3C7',
    color: '#303030',
    alignSelf: 'flex-end' as const,
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '4px',
    marginLeft: '20px',
  },
  fromOther: {
    backgroundColor: '#ffffff',
    color: '#303030',
    alignSelf: 'flex-start' as const,
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '12px',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
    marginRight: '20px',
  },
} as const;

export const DATE_SEPARATOR_STYLE = {
  backgroundColor: '#e1f3fb',
  borderRadius: '12px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
  width: 'auto',
  minWidth: '110px',
  textAlign: 'center' as const,
  padding: '6px 14px',
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 500,
} as const;

// QUOTED_MESSAGE_STYLES removidos - agora gerenciados no QuotedMessage.tsx com Tailwind

export const TIMESTAMP_STYLE = {
  fontSize: '10px',
  position: 'absolute' as const,
  bottom: '2px',
  right: '8px',
  color: '#8696a0',
  display: 'flex' as const,
  alignItems: 'center' as const,
  gap: '4px',
} as const;

export const BODY_CONTAINER_STYLE = {
  overflowWrap: 'break-word' as const,
  padding: '3px 80px 8px 6px',
} as const;

// Função para obter estilo da bolha
export const getMessageBubbleStyle = (fromMe: boolean, isPrivate: boolean) => {
  const variantStyle = fromMe
    ? isPrivate
      ? MESSAGE_BUBBLE_STYLES.fromMePrivate
      : MESSAGE_BUBBLE_STYLES.fromMe
    : MESSAGE_BUBBLE_STYLES.fromOther;

  return {
    ...MESSAGE_BUBBLE_STYLES.base,
    ...variantStyle,
  };
};
