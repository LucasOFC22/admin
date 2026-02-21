import type { EmailMessage } from '@/types/email';

/**
 * Representa uma thread de emails agrupados (estilo Gmail)
 */
export interface EmailThread {
  id: string;                    // ID do email mais recente (para click)
  threadId: string;              // ID único da thread (baseado no message_id raiz)
  emails: EmailMessage[];        // Todos os emails da thread (ordenados cronologicamente)
  participants: ThreadParticipant[]; // Lista dos últimos 3 participantes na ordem de aparição
  subject: string;               // Assunto normalizado (sem Re: Fw:)
  preview: string;               // Preview do último email
  lastDate: string;              // Data do último email
  unread: boolean;               // true se qualquer email não foi lido
  starred: boolean;              // true se qualquer email está com estrela
  hasAttachments: boolean;       // true se qualquer email tem anexo
  messageCount: number;          // Total de emails na thread
}

export interface ThreadParticipant {
  name: string;                  // Nome ou email (ou "eu")
  email: string;                 // Email
  isMe: boolean;                 // Se sou eu (baseado na conta atual)
}

/**
 * Normaliza um Message-ID removendo < > e espaços
 */
function normalizeMessageId(id: string | null | undefined): string {
  if (!id) return '';
  return id.trim().replace(/[<>]/g, '').toLowerCase();
}

/**
 * Normaliza o assunto removendo prefixos RE:/FW:/Fwd: para agrupar emails da mesma conversa
 */
function normalizeSubject(subject: string): string {
  if (!subject) return '';
  return subject
    .replace(/^(re:|fw:|fwd:|enc:|res:|aw:|wg:)\s*/gi, '')
    .replace(/^(re:|fw:|fwd:|enc:|res:|aw:|wg:)\s*/gi, '') // Duplo para casos como "Re: Re:"
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai todos os Message-IDs de um email (próprio + references + in_reply_to)
 */
function getEmailMessageIds(email: EmailMessage): Set<string> {
  const ids = new Set<string>();
  
  const messageId = normalizeMessageId(email.message_id);
  if (messageId) ids.add(messageId);
  
  const inReplyTo = normalizeMessageId(email.in_reply_to);
  if (inReplyTo) ids.add(inReplyTo);
  
  if (email.references && Array.isArray(email.references)) {
    email.references.forEach(ref => {
      const normalizedRef = normalizeMessageId(ref);
      if (normalizedRef) ids.add(normalizedRef);
    });
  }
  
  return ids;
}

/**
 * Verifica se dois emails estão na mesma thread usando Message-ID chain
 */
function areEmailsInSameThread(email1: EmailMessage, email2: EmailMessage): boolean {
  const msgId1 = normalizeMessageId(email1.message_id);
  const msgId2 = normalizeMessageId(email2.message_id);
  
  // Se são o mesmo email, estão na mesma thread
  if (msgId1 && msgId2 && msgId1 === msgId2) return true;
  
  // Verificar se email1 referencia email2
  const inReplyTo1 = normalizeMessageId(email1.in_reply_to);
  if (msgId2 && inReplyTo1 === msgId2) return true;
  
  if (email1.references && Array.isArray(email1.references)) {
    for (const ref of email1.references) {
      if (normalizeMessageId(ref) === msgId2) return true;
    }
  }
  
  // Verificar se email2 referencia email1
  const inReplyTo2 = normalizeMessageId(email2.in_reply_to);
  if (msgId1 && inReplyTo2 === msgId1) return true;
  
  if (email2.references && Array.isArray(email2.references)) {
    for (const ref of email2.references) {
      if (normalizeMessageId(ref) === msgId1) return true;
    }
  }
  
  // Verificar interseção de todos os IDs
  const ids1 = getEmailMessageIds(email1);
  const ids2 = getEmailMessageIds(email2);
  
  if (ids1.size === 0 && ids2.size === 0) return false;
  
  for (const id of ids1) {
    if (id && ids2.has(id)) return true;
  }
  
  return false;
}

/**
 * Gera uma chave única para um email
 */
function getEmailUniqueKey(email: EmailMessage): string {
  if (email.message_id && email.message_id.trim()) {
    return `mid:${normalizeMessageId(email.message_id)}`;
  }
  return `${email.pasta || 'unknown'}:${email.id}`;
}

/**
 * Agrupa emails em threads no estilo Gmail
 * @param emails Lista de emails para agrupar
 * @param accountEmail Email da conta atual (para detectar "eu")
 * @returns Lista de threads ordenadas por data (mais recente primeiro)
 */
/**
 * Encontra o email raiz de uma thread (o mais antigo que iniciou a conversa)
 * Usa o primeiro Message-ID da cadeia de references, ou o email com data mais antiga
 */
function findThreadRootMessageId(threadEmails: EmailMessage[]): string {
  if (threadEmails.length === 0) return '';
  
  // Ordenar por data (mais antigo primeiro)
  const sorted = [...threadEmails].sort((a, b) => 
    new Date(a.data).getTime() - new Date(b.data).getTime()
  );
  
  // Coletar todos os message_ids mencionados em references de qualquer email da thread
  const allReferencedIds = new Set<string>();
  const allMessageIds = new Set<string>();
  
  for (const email of sorted) {
    const msgId = normalizeMessageId(email.message_id);
    if (msgId) allMessageIds.add(msgId);
    
    // O primeiro reference geralmente é o email raiz da conversa
    if (email.references && email.references.length > 0) {
      const firstRef = normalizeMessageId(email.references[0]);
      if (firstRef) allReferencedIds.add(firstRef);
    }
  }
  
  // Se temos um primeiro reference comum, usar ele como ID da thread
  // (mesmo que não tenhamos esse email localmente)
  for (const refId of allReferencedIds) {
    // Verificar se é consistente (aparece como primeiro reference em múltiplos emails)
    let count = 0;
    for (const email of sorted) {
      if (email.references && email.references.length > 0) {
        const firstRef = normalizeMessageId(email.references[0]);
        if (firstRef === refId) count++;
      }
    }
    if (count > 0) {
      return `thread:${refId}`;
    }
  }
  
  // Fallback: usar o message_id do email mais antigo que temos
  const oldest = sorted[0];
  const oldestMsgId = normalizeMessageId(oldest.message_id);
  if (oldestMsgId) {
    return `thread:${oldestMsgId}`;
  }
  
  // Último fallback: usar assunto normalizado + data do mais antigo
  const subjectKey = normalizeSubject(oldest.assunto).toLowerCase().slice(0, 50);
  return `subject:${subjectKey}:${new Date(oldest.data).getTime()}`;
}

/**
 * Agrupa emails em threads no estilo Gmail
 * @param emails Lista de emails para agrupar
 * @param accountEmail Email da conta atual (para detectar "eu")
 * @returns Lista de threads ordenadas por data (mais recente primeiro)
 */
export function groupEmailsIntoThreads(
  emails: EmailMessage[],
  accountEmail?: string
): EmailThread[] {
  if (!emails || emails.length === 0) return [];
  
  const normalizedAccountEmail = accountEmail?.toLowerCase() || '';
  
  // Mapa de email por chave única
  const emailByKey = new Map<string, EmailMessage>();
  emails.forEach(e => emailByKey.set(getEmailUniqueKey(e), e));
  
  // Mapa de emails já atribuídos a uma thread
  const assignedEmails = new Set<string>();
  
  // Lista de threads encontradas
  const threads: EmailThread[] = [];
  
  // Ordenar emails por data (mais antigo primeiro para construir threads de forma estável)
  // Isso garante que processamos sempre na mesma ordem
  const sortedEmails = [...emails].sort((a, b) => 
    new Date(a.data).getTime() - new Date(b.data).getTime()
  );
  
  for (const email of sortedEmails) {
    const emailKey = getEmailUniqueKey(email);
    
    // Se já foi atribuído a uma thread, pular
    if (assignedEmails.has(emailKey)) continue;
    
    // Criar nova thread começando com este email
    const threadEmails = new Set<string>();
    threadEmails.add(emailKey);
    assignedEmails.add(emailKey);
    
    // Expandir a thread encontrando todos os emails relacionados
    let foundNew = true;
    let iterations = 0;
    const maxIterations = 20;
    
    while (foundNew && iterations < maxIterations) {
      foundNew = false;
      iterations++;
      
      for (const candidate of sortedEmails) {
        const candidateKey = getEmailUniqueKey(candidate);
        
        // Já está nesta thread ou já atribuído a outra
        if (threadEmails.has(candidateKey) || assignedEmails.has(candidateKey)) continue;
        
        // Verificar se conecta a qualquer email da thread
        for (const keyInThread of threadEmails) {
          const emailInThread = emailByKey.get(keyInThread);
          
          if (emailInThread && areEmailsInSameThread(candidate, emailInThread)) {
            threadEmails.add(candidateKey);
            assignedEmails.add(candidateKey);
            foundNew = true;
            break;
          }
        }
      }
    }
    
    // Fallback por assunto normalizado se thread ainda tem só 1 email
    if (threadEmails.size === 1) {
      const assuntoNormalizado = normalizeSubject(email.assunto).toLowerCase();
      
      // Só usar fallback se assunto não é muito curto
      if (assuntoNormalizado.length >= 5) {
        for (const candidate of sortedEmails) {
          const candidateKey = getEmailUniqueKey(candidate);
          
          if (threadEmails.has(candidateKey) || assignedEmails.has(candidateKey)) continue;
          
          const candidateAssunto = normalizeSubject(candidate.assunto).toLowerCase();
          if (candidateAssunto === assuntoNormalizado) {
            threadEmails.add(candidateKey);
            assignedEmails.add(candidateKey);
          }
        }
      }
    }
    
    // Coletar emails da thread e ordenar cronologicamente
    const threadEmailsList = Array.from(threadEmails)
      .map(key => emailByKey.get(key)!)
      .filter(Boolean)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    if (threadEmailsList.length === 0) continue;
    
    // Gerar threadId estável baseado no email raiz
    const stableThreadId = findThreadRootMessageId(threadEmailsList);
    
    // Extrair participantes únicos na ordem de aparição
    const participantsMap = new Map<string, ThreadParticipant>();
    const participantsOrder: string[] = [];
    
    for (const e of threadEmailsList) {
      const senderEmail = e.de.toLowerCase();
      
      if (!participantsMap.has(senderEmail)) {
        const isMe = senderEmail === normalizedAccountEmail || 
                     (e.para?.some(to => to.toLowerCase() === normalizedAccountEmail) && senderEmail !== normalizedAccountEmail ? false : senderEmail === normalizedAccountEmail);
        
        participantsMap.set(senderEmail, {
          name: e.de_nome || e.de.split('@')[0],
          email: e.de,
          isMe: senderEmail === normalizedAccountEmail
        });
        participantsOrder.push(senderEmail);
      } else {
        // Mover para o final se já existe (para pegar ordem de aparição)
        const idx = participantsOrder.indexOf(senderEmail);
        if (idx !== -1) {
          participantsOrder.splice(idx, 1);
        }
        participantsOrder.push(senderEmail);
      }
    }
    
    // Pegar os últimos 3 participantes
    const lastThreeEmails = participantsOrder.slice(-3);
    const participants = lastThreeEmails.map(email => participantsMap.get(email)!);
    
    const lastEmail = threadEmailsList[threadEmailsList.length - 1];
    
    threads.push({
      id: lastEmail.id,
      threadId: stableThreadId, // Usar ID estável baseado no email raiz
      emails: threadEmailsList,
      participants,
      subject: normalizeSubject(lastEmail.assunto) || '(Sem assunto)',
      preview: lastEmail.preview || '',
      lastDate: lastEmail.data,
      unread: threadEmailsList.some(e => !e.lido),
      starred: threadEmailsList.some(e => e.starred),
      hasAttachments: threadEmailsList.some(e => e.anexos && e.anexos.length > 0),
      messageCount: threadEmailsList.length
    });
  }
  
  // Ordenar threads por data do último email (mais recente primeiro)
  return threads.sort((a, b) => 
    new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
  );
}

/**
 * Formata participantes para exibição no estilo Gmail
 * Últimos 3 participantes, último em negrito
 */
export function formatParticipantsDisplay(participants: ThreadParticipant[]): {
  formatted: string;
  lastParticipant: string;
  allExceptLast: string;
} {
  if (participants.length === 0) {
    return { formatted: '', lastParticipant: '', allExceptLast: '' };
  }
  
  const names = participants.map(p => p.isMe ? 'eu' : (p.name || p.email.split('@')[0]));
  
  const lastParticipant = names[names.length - 1];
  const allExceptLast = names.slice(0, -1).join(', ');
  const formatted = names.join(', ');
  
  return { formatted, lastParticipant, allExceptLast };
}
