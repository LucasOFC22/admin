/**
 * Utilitário centralizado para mapeamento de pastas de email
 * Garante consistência entre frontend e chamadas IMAP
 */

import { EmailPasta } from '@/types/email';

/**
 * Mapeamento de pasta do frontend para nome IMAP
 * Suporta tanto EmailPasta quanto strings lowercase vindas do email.pasta
 */
const PASTA_TO_IMAP_MAP: Record<string, string> = {
  inbox: 'INBOX',
  sent: 'INBOX.Sent',
  drafts: 'INBOX.Drafts',
  trash: 'INBOX.Trash',
  spam: 'INBOX.spam',
  starred: 'INBOX', // starred é virtual, usa INBOX
  archive: 'Archive',
  snoozed: 'snoozed', // snoozed é virtual
  
  // Aliases comuns que podem vir do IMAP ou email.pasta
  'inbox.sent': 'INBOX.Sent',
  'enviados': 'INBOX.Sent',
  'sent items': 'INBOX.Sent',
  'sent messages': 'INBOX.Sent',
  '[gmail]/sent mail': 'INBOX.Sent',
  '[gmail]/enviados': 'INBOX.Sent',
  
  'inbox.drafts': 'INBOX.Drafts',
  'rascunhos': 'INBOX.Drafts',
  
  'inbox.trash': 'INBOX.Trash',
  'lixeira': 'INBOX.Trash',
  'deleted items': 'INBOX.Trash',
  'deleted messages': 'INBOX.Trash',
  '[gmail]/trash': 'INBOX.Trash',
  '[gmail]/lixeira': 'INBOX.Trash',
  
  'inbox.spam': 'INBOX.spam',
  'inbox.junk': 'INBOX.spam',
  'junk': 'INBOX.spam',
  'lixo eletrônico': 'INBOX.spam',
  '[gmail]/spam': 'INBOX.spam',
};

/**
 * Converte pasta do frontend (EmailPasta ou string lowercase) para pasta IMAP
 * 
 * @param pasta - Nome da pasta (ex: 'inbox', 'sent', 'INBOX.Sent')
 * @returns Nome da pasta IMAP (ex: 'INBOX', 'INBOX.Sent')
 * 
 * @example
 * pastaToImapFolder('inbox') // => 'INBOX'
 * pastaToImapFolder('sent') // => 'INBOX.Sent'
 * pastaToImapFolder('INBOX.Sent') // => 'INBOX.Sent' (preserva se não encontrar no mapa)
 */
export function pastaToImapFolder(pasta: EmailPasta | string): string {
  if (!pasta) return 'INBOX';
  
  const normalizedPasta = pasta.toLowerCase().trim();
  return PASTA_TO_IMAP_MAP[normalizedPasta] || pasta;
}

/**
 * Converte pasta IMAP para pasta do frontend (EmailPasta)
 * Útil para normalizar respostas do servidor IMAP
 * 
 * @param imapFolder - Nome da pasta IMAP (ex: 'INBOX.Sent', '[Gmail]/Sent Mail')
 * @returns EmailPasta correspondente
 */
export function imapFolderToPasta(imapFolder: string): EmailPasta {
  if (!imapFolder) return 'inbox';
  
  const normalized = imapFolder.toLowerCase().trim();
  
  // Verificar cada alias
  if (normalized === 'inbox') return 'inbox';
  
  // Sent variations
  if (
    normalized === 'sent' ||
    normalized === 'inbox.sent' ||
    normalized.includes('sent') ||
    normalized.includes('enviados')
  ) {
    return 'sent';
  }
  
  // Drafts variations
  if (
    normalized === 'drafts' ||
    normalized === 'inbox.drafts' ||
    normalized.includes('draft') ||
    normalized.includes('rascunho')
  ) {
    return 'drafts';
  }
  
  // Trash variations
  if (
    normalized === 'trash' ||
    normalized === 'inbox.trash' ||
    normalized.includes('trash') ||
    normalized.includes('deleted') ||
    normalized.includes('lixeira')
  ) {
    return 'trash';
  }
  
  // Spam/Junk variations
  if (
    normalized === 'spam' ||
    normalized === 'junk' ||
    normalized === 'inbox.spam' ||
    normalized === 'inbox.junk' ||
    normalized.includes('spam') ||
    normalized.includes('junk') ||
    normalized.includes('lixo eletrônico')
  ) {
    return 'spam';
  }
  
  // Archive
  if (normalized.includes('archive') || normalized.includes('arquivo')) {
    return 'archive';
  }
  
  // Default to inbox
  return 'inbox';
}

/**
 * Verifica se uma pasta é virtual (não existe no IMAP)
 */
export function isVirtualFolder(pasta: EmailPasta): boolean {
  return pasta === 'starred' || pasta === 'snoozed';
}

/**
 * Normaliza pasta para formato do cache (lowercase)
 * Usar para queries no Supabase (email_cache, email_threads, email_sync_status)
 * 
 * @param pasta - Nome da pasta (ex: 'inbox', 'INBOX', 'INBOX.Sent')
 * @returns Nome normalizado lowercase (ex: 'inbox', 'sent', 'drafts')
 * 
 * @example
 * pastaToCache('INBOX') // => 'inbox'
 * pastaToCache('INBOX.Sent') // => 'sent'
 * pastaToCache('sent') // => 'sent'
 */
export function pastaToCache(pasta: EmailPasta | string): string {
  if (!pasta) return 'inbox';
  
  const normalized = pasta.toLowerCase().trim();
  
  // Remover prefixo INBOX. se existir
  if (normalized.startsWith('inbox.')) {
    const suffix = normalized.replace('inbox.', '');
    // Mapear sufixo para nome padrão
    const suffixMap: Record<string, string> = {
      'sent': 'sent',
      'drafts': 'drafts',
      'trash': 'trash',
      'spam': 'spam',
      'junk': 'spam',
    };
    return suffixMap[suffix] || suffix;
  }
  
  // Mapear variações comuns para nomes padrão
  const cacheMap: Record<string, string> = {
    'inbox': 'inbox',
    'sent': 'sent',
    'sent items': 'sent',
    'sent messages': 'sent',
    'enviados': 'sent',
    '[gmail]/sent mail': 'sent',
    '[gmail]/enviados': 'sent',
    'drafts': 'drafts',
    'rascunhos': 'drafts',
    'trash': 'trash',
    'lixeira': 'trash',
    'deleted items': 'trash',
    '[gmail]/trash': 'trash',
    '[gmail]/lixeira': 'trash',
    'spam': 'spam',
    'junk': 'spam',
    'lixo eletrônico': 'spam',
    '[gmail]/spam': 'spam',
    'archive': 'archive',
    'arquivo': 'archive',
    'starred': 'starred',
    'snoozed': 'snoozed',
  };
  
  return cacheMap[normalized] || normalized;
}
