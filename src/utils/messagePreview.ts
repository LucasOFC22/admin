/**
 * Formata a última mensagem para exibição em previews (kanban, notificações, lista de tickets).
 * Evita mostrar URLs brutas para mensagens de mídia.
 */

const MEDIA_LABELS: Record<string, string> = {
  image: '📷 Foto',
  video: '🎥 Vídeo',
  audio: '🎵 Áudio',
  document: '📄 Documento',
  sticker: '😊 Sticker',
  voice: '🎤 Áudio',
};

/**
 * Retorna o label amigável para tipos de mídia.
 * Para texto/interativo/desconhecido, retorna o texto em si (truncado se necessário).
 */
export function formatMessagePreview(
  messageText: string | null | undefined,
  messageType: string | null | undefined,
  caption?: string | null
): string {
  const type = messageType?.toLowerCase() || 'text';

  // Tipos de mídia conhecidos
  if (MEDIA_LABELS[type]) {
    // Se tiver caption, mostrar junto ao label
    const cap = caption?.trim();
    if (cap) return `${MEDIA_LABELS[type]}: ${cap}`;
    return MEDIA_LABELS[type];
  }

  // Para texto e outros tipos, usar o message_text
  const text = messageText?.trim() || '';

  // Se o texto for uma URL (mensagem de mídia sem message_type correto), mostrar label genérico
  if (text.startsWith('http://') || text.startsWith('https://')) {
    // Tentar inferir tipo pela extensão
    const lower = text.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|heic)(\?|$)/.test(lower)) return '📷 Foto';
    if (/\.(mp4|mov|avi|webm)(\?|$)/.test(lower)) return '🎥 Vídeo';
    if (/\.(mp3|ogg|m4a|wav|opus)(\?|$)/.test(lower)) return '🎵 Áudio';
    if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)(\?|$)/.test(lower)) return '📄 Documento';
    return '📎 Arquivo';
  }

  return text;
}
