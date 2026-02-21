import { useMemo } from 'react';
import { useEmailStore } from '@/stores/emailStore';
import type { EmailMessage } from '@/types/email';

/**
 * Normaliza um Message-ID removendo < > e espaços de qualquer posição
 * Também normaliza caracteres de encoding Base64 URL-safe para comparação
 * (Gmail e outros clientes podem usar + vs _ vs = de forma intercambiável)
 */
function normalizeMessageId(id: string | null | undefined): string {
  if (!id) return '';
  // Remove < e > de qualquer posição
  let normalized = id.trim().replace(/[<>\s]/g, '');
  
  // Normaliza caracteres Base64 URL-safe para comparação:
  // Os caracteres +, -, _ e = podem ser intercambiáveis em diferentes implementações
  // Substituímos todos por um mesmo caractere para comparação
  normalized = normalized.replace(/[+\-_=]/g, '0');
  
  return normalized.toLowerCase();
}

/**
 * Normaliza o assunto removendo prefixos RE:/FW:/Fwd: para agrupar emails da mesma conversa
 */
function normalizeSubject(subject: string): string {
  if (!subject) return '';
  return subject
    .replace(/^(re:|fw:|fwd:|enc:|res:|aw:|wg:)\s*/gi, '')
    .replace(/^(re:|fw:|fwd:|enc:|res:|aw:|wg:)\s*/gi, '') // Duplo para casos como "Re: Re:"
    .replace(/\s+/g, ' ') // Normalizar espaços
    .trim()
    .toLowerCase();
}

/**
 * Extrai todos os Message-IDs de um email (próprio + references + in_reply_to)
 * Retorna IDs normalizados (sem < >)
 */
function getEmailMessageIds(email: EmailMessage): Set<string> {
  const ids = new Set<string>();
  
  const messageId = normalizeMessageId(email.message_id);
  if (messageId) {
    ids.add(messageId);
  }
  
  const inReplyTo = normalizeMessageId(email.in_reply_to);
  if (inReplyTo) {
    ids.add(inReplyTo);
  }
  
  if (email.references && Array.isArray(email.references)) {
    email.references.forEach(ref => {
      const normalizedRef = normalizeMessageId(ref);
      if (normalizedRef) ids.add(normalizedRef);
    });
  }
  
  return ids;
}

/**
 * Verifica se um email tem informações de threading válidas
 */
function hasValidThreadingInfo(email: EmailMessage): boolean {
  return !!(
    normalizeMessageId(email.message_id) ||
    normalizeMessageId(email.in_reply_to) ||
    (email.references && email.references.length > 0)
  );
}

/**
 * Verifica se dois emails estão na mesma thread usando Message-ID chain
 * Busca bidirecional: A referencia B OU B referencia A
 */
function areEmailsInSameThread(email1: EmailMessage, email2: EmailMessage): boolean {
  const msgId1 = normalizeMessageId(email1.message_id);
  const msgId2 = normalizeMessageId(email2.message_id);
  
  // Se são o mesmo email, estão na mesma thread
  if (msgId1 && msgId2 && msgId1 === msgId2) return true;
  
  // Verificar se email1 referencia email2 (via in_reply_to ou references)
  const inReplyTo1 = normalizeMessageId(email1.in_reply_to);
  if (msgId2 && inReplyTo1 === msgId2) return true;
  
  if (email1.references && Array.isArray(email1.references)) {
    for (const ref of email1.references) {
      if (normalizeMessageId(ref) === msgId2) return true;
    }
  }
  
  // Verificar se email2 referencia email1 (busca reversa - crucial para encontrar respostas)
  const inReplyTo2 = normalizeMessageId(email2.in_reply_to);
  if (msgId1 && inReplyTo2 === msgId1) return true;
  
  if (email2.references && Array.isArray(email2.references)) {
    for (const ref of email2.references) {
      if (normalizeMessageId(ref) === msgId1) return true;
    }
  }
  
  // Verificar interseção de todos os IDs (references podem se sobrepor)
  const ids1 = getEmailMessageIds(email1);
  const ids2 = getEmailMessageIds(email2);
  
  if (ids1.size === 0 && ids2.size === 0) return false;
  
  for (const id of ids1) {
    if (id && ids2.has(id)) return true;
  }
  
  return false;
}

/**
 * Hook para buscar emails relacionados por assunto (thread)
 * Usa Message-ID, References e In-Reply-To para agrupamento preciso
 * Fallback para assunto normalizado APENAS quando o email atual não tem Message-ID
 * Retorna emails ordenados cronologicamente (mais antigo primeiro)
 * 
 * IMPORTANTE: Sempre inclui o email atual na thread, mesmo que não esteja
 * na lista de emails do store (unifica INBOX + Enviados)
 */
/**
 * Gera uma chave única para um email para evitar colisão de UIDs entre pastas
 * Usa message_id se disponível (mais confiável), senão pasta:id
 */
function getEmailUniqueKey(email: EmailMessage): string {
  if (email.message_id && email.message_id.trim()) {
    return `mid:${normalizeMessageId(email.message_id)}`;
  }
  return `${email.pasta || 'unknown'}:${email.id}`;
}

export function useEmailThread(emailAtual: EmailMessage | null) {
  const { getAllEmailsForThread } = useEmailStore();

  const thread = useMemo(() => {
    if (!emailAtual) return [];

    // Obter todos os emails disponíveis (INBOX + Sent)
    const todosEmailsFromStore = getAllEmailsForThread();
    
    // CORREÇÃO: Garantir que o email atual está incluído na lista
    // Usa chave única pasta:id para evitar colisão
    const emailAtualKey = getEmailUniqueKey(emailAtual);
    const emailAtualJaExiste = todosEmailsFromStore.some(e => getEmailUniqueKey(e) === emailAtualKey);
    const todosEmails = emailAtualJaExiste 
      ? todosEmailsFromStore 
      : [emailAtual, ...todosEmailsFromStore];
    
    const emailAtualTemThreading = hasValidThreadingInfo(emailAtual);
    const assuntoNormalizado = normalizeSubject(emailAtual.assunto);
    
    // Se o assunto é muito curto ou genérico, não usar fallback por assunto
    const assuntoMuitoCurto = assuntoNormalizado.length < 5;
    
    // Primeiro passo: encontrar todos os emails conectados por Message-ID
    // IMPORTANTE: Usar chave única (pasta:id) em vez de apenas id
    const emailsNaThread = new Set<string>();
    emailsNaThread.add(emailAtualKey); // Sempre incluir o email atual
    
    // Mapa para lookup rápido por chave
    const emailByKey = new Map<string, EmailMessage>();
    todosEmails.forEach(e => emailByKey.set(getEmailUniqueKey(e), e));
    emailByKey.set(emailAtualKey, emailAtual);
    
    let foundNew = true;
    let iterations = 0;
    const maxIterations = 10; // Evitar loop infinito
    
    // Expandir a cadeia iterativamente até não encontrar mais conexões
    while (foundNew && iterations < maxIterations) {
      foundNew = false;
      iterations++;
      
      for (const email of todosEmails) {
        const emailKey = getEmailUniqueKey(email);
        if (emailsNaThread.has(emailKey)) continue;
        
        // Verificar se este email se conecta a qualquer email já na thread
        for (const keyNaThread of emailsNaThread) {
          const emailNaThread = emailByKey.get(keyNaThread);
          
          if (emailNaThread && areEmailsInSameThread(email, emailNaThread)) {
            emailsNaThread.add(emailKey);
            foundNew = true;
            break;
          }
        }
      }
    }
    
    // Segundo passo: adicionar emails pelo assunto normalizado
    // APENAS se o email atual NÃO tem Message-ID válido E o assunto não é muito curto
    const emailsRelacionados = todosEmails.filter((email) => {
      const emailKey = getEmailUniqueKey(email);
      
      // Já está na thread por Message-ID
      if (emailsNaThread.has(emailKey)) return true;
      
      // Se o email atual tem threading info, só usar Message-ID
      if (emailAtualTemThreading) return false;
      
      // Se o assunto é muito curto, não usar fallback
      if (assuntoMuitoCurto) return false;
      
      // Fallback: verificar por assunto normalizado
      const assuntoEmail = normalizeSubject(email.assunto);
      return assuntoEmail === assuntoNormalizado;
    });

    // Ordenar por data (mais antigo primeiro)
    return emailsRelacionados.sort((a, b) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );
  }, [emailAtual, getAllEmailsForThread]);

  return {
    thread,
    threadCount: thread.length,
    isThread: thread.length > 1,
  };
}
