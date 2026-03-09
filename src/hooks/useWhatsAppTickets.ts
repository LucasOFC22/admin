import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { requireAuthenticatedClient, getAuthenticatedSupabaseClient, getRealtimeClient } from '@/config/supabaseAuth';
import { CookieAuth } from '@/lib/auth/cookieAuth';
import { toast } from '@/lib/toast';

// Helper para obter cliente Supabase autenticado
const getSupabase = () => requireAuthenticatedClient();
import { useUserFilas } from '@/hooks/useUserFilas';
import { logsWhatsAppService } from '@/services/whatsapp/logsWhatsAppService';
import { whatsappConfigService } from '@/services/supabase/whatsappConfigService';
import { sendAutoMessage, createMessageContext } from '@/utils/whatsappAutoMessages';
import { playGlobalNotificationSound } from '@/contexts/SoundNotificationContext';
import { isWhatsAppDebugEnabled } from '@/utils/whatsappDebug';

// Debounce simples para evitar spam de requisições
const createDebounce = (delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (fn: () => void) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(fn, delay);
  };
};

export interface TicketTag {
  id: number;
  name: string;
  color: string;
}

export interface WhatsAppChat {
  id: number;
  ativo: boolean;
  resolvido: boolean;
  filas?: string[];
  modoDeAtendimento: string;
  aceitoPorAdmin: boolean;
  adminId?: string;
  adminIdPendente?: string;
  adminIdAntigo?: string;
  criadoEm: string;
  atualizadoEm: string;
  encerradoEm?: string;
  tags?: TicketTag[];
}

export interface WhatsAppTicket {
  // Dados do contato (entidade principal)
  id: string; // ID do contato
  contatoId: string;
  nome: string;
  telefone: string;
  picture?: string;
  email?: string;
  chatbotDesabilitado?: boolean;
  informacoesAdicionais?: any;
  contatoCriadoEm: string;
  
  // Dados do chat ativo (se houver)
  chatId?: number;
  filas?: string[];
  modoDeAtendimento: string;
  aceitoPorAdmin: boolean;
  adminId?: string;
  adminIdPendente?: string;
  adminIdAntigo?: string;
  resolvido: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  encerradoEm?: string;
  lastMessage?: string;
  unreadCount?: number;
  tags?: TicketTag[];
  isGroup?: boolean;
  
  // Dados de campanha (origem do chat)
  origemCampanhaId?: string;
  campanhaNome?: string;
  
  // Histórico de chats
  chatsCount?: number;
  hasActiveChat?: boolean;

  // Dados do atendente
  user?: {
    id: string;
    name: string;
  };

  // Compatibilidade (deprecated)
  usuarioId: string;
}

export interface FilaWhatsApp {
  id: number;
  name: string;
  color: string;
  description?: string;
  orderPosition: number;
  active: boolean;
}

export const useWhatsAppTickets = (options?: {
  mode?: 'full' | 'list';
  pageSize?: number;
}) => {
  const mode = options?.mode ?? 'full';
  const pageSize = options?.pageSize ?? 50;

  const [allTickets, setAllTickets] = useState<WhatsAppTicket[]>([]);
  const [filas, setFilas] = useState<FilaWhatsApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Infinite scroll (somente para mode: 'list')
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreTickets, setHasMoreTickets] = useState(true);
  const [isLoadingMoreTickets, setIsLoadingMoreTickets] = useState(false);
  const isLoadingMoreRef = useRef(false);

  // Usar hook de permissões de filas do usuário
  const { filasPermitidas, hasFilasRestriction, isLoading: isLoadingFilas } = useUserFilas();

  // Filtrar tickets baseado nas filas permitidas
  const tickets = useMemo(() => {
    if (!hasFilasRestriction || filasPermitidas.length === 0) {
      return allTickets;
    }

    return allTickets.filter(ticket => {
      // Se não tem chat ativo, mostrar o contato
      if (!ticket.chatId) return true;

      // Garantir que filas seja sempre um array
      const rawFilas = ticket.filas;
      const ticketFilas = Array.isArray(rawFilas) ? rawFilas : (rawFilas ? [rawFilas] : []);

      // Se o ticket não tem filas, verificar se tem acesso à fila 1 (Sem Fila)
      if (ticketFilas.length === 0) {
        return filasPermitidas.includes(1);
      }

      // Verificar se alguma fila do ticket está nas filas permitidas
      return ticketFilas.some(filaId => filasPermitidas.includes(Number(filaId)));
    });
  }, [allTickets, filasPermitidas, hasFilasRestriction]);

  // Filtrar filas baseado nas permissões
  const filasPermitidaList = useMemo(() => {
    if (!hasFilasRestriction || filasPermitidas.length === 0) {
      return filas;
    }
    return filas.filter(fila => filasPermitidas.includes(fila.id));
  }, [filas, filasPermitidas, hasFilasRestriction]);

  const parseFilas = (filasValue: string | string[] | null | undefined): string[] => {
    if (!filasValue) return [];
    if (Array.isArray(filasValue)) return filasValue.map(String);
    try {
      const parsed = JSON.parse(filasValue);
      return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
    } catch {
      return filasValue.split(',').filter(Boolean).map(s => s.trim());
    }
  };

  const parseTagIds = (tagsStr: string | null): number[] => {
    if (!tagsStr) return [];
    try {
      const parsed = JSON.parse(tagsStr);
      return Array.isArray(parsed) ? parsed.map(Number).filter(n => !isNaN(n)) : [];
    } catch {
      return [];
    }
  };

  const mergeTicketsDedup = (prev: WhatsAppTicket[], next: WhatsAppTicket[]) => {
    const map = new Map<string, WhatsAppTicket>();
    prev.forEach(t => map.set(t.id, t));
    next.forEach(t => map.set(t.id, t));
    const merged = Array.from(map.values());
    merged.sort((a, b) => {
      if (a.hasActiveChat && !b.hasActiveChat) return -1;
      if (!a.hasActiveChat && b.hasActiveChat) return 1;
      return new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime();
    });
    return merged;
  };

  const fetchTicketsPage = useCallback(async (pageIndex: number, append: boolean) => {
    const debug = isWhatsAppDebugEnabled();

    // Em mode:list, a paginação precisa ser baseada na atividade do chat (atualizadoem)
    // e NÃO na data de criação do contato. Caso contrário:
    // - a aba "Atendendo" pode abrir vazia (meus atendimentos ficam em contatos antigos fora da 1ª página)
    // - ao refetch do realtime (reset para page 0) o chat some da lista
    const CHATS_FETCH_MULTIPLIER = 4;

    try {
      if (!append) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMoreTickets(true);
        isLoadingMoreRef.current = true;
      }

      const authClient = getSupabase();

      // 1) Buscar chats mais recentes (fonte de ordenação/paginação)
      // Observação: pode haver múltiplos chats por contato, então buscamos um bloco maior
      // e extraímos usuarioid únicos até preencher pageSize.
      const chatsFrom = pageIndex * pageSize * CHATS_FETCH_MULTIPLIER;
      const chatsTo = chatsFrom + (pageSize * CHATS_FETCH_MULTIPLIER) - 1;

      if (debug) {
        console.debug(
          `📋 [useWhatsAppTickets:list] Carregando página ${pageIndex} via chats (${chatsFrom}-${chatsTo}), pageSize=${pageSize}`
        );
      }

      const { data: chatsIndexData, error: chatsIndexError } = await authClient
        .from('chats_whatsapp')
        .select('id, usuarioid, atualizadoem')
        .order('atualizadoem', { ascending: false })
        .range(chatsFrom, chatsTo);

      if (chatsIndexError) throw chatsIndexError;

      const uniqueContatoIds: string[] = [];
      const contatoSeen = new Set<string>();
      for (const c of (chatsIndexData || [])) {
        const contatoId = String((c as any).usuarioid);
        if (!contatoId || contatoSeen.has(contatoId)) continue;
        contatoSeen.add(contatoId);
        uniqueContatoIds.push(contatoId);
        if (uniqueContatoIds.length >= pageSize) break;
      }

      // hasMore baseado na capacidade de buscar mais do "índice" (chats)
      const indexPageFull = (chatsIndexData || []).length >= pageSize * CHATS_FETCH_MULTIPLIER;
      setHasMoreTickets(indexPageFull);
      setCurrentPage(pageIndex);

      if (uniqueContatoIds.length === 0) {
        if (!append) setAllTickets([]);
        return;
      }

      // 2) Buscar contatos correspondentes mantendo a ordem (por atividade)
      const { data: contatosData, error: contatosError } = await authClient
        .from('contatos_whatsapp')
        .select('*')
        .in('id', uniqueContatoIds);

      if (contatosError) throw contatosError;

      const contatosMap = new Map<string, any>();
      (contatosData || []).forEach(c => contatosMap.set(String(c.id), c));
      const contatos = uniqueContatoIds.map(id => contatosMap.get(id)).filter(Boolean);

      // 3) Chats apenas desses contatos (dados completos)
      const { data: chatsData, error: chatsError } = await authClient
        .from('chats_whatsapp')
        .select('*')
        .in('usuarioid', uniqueContatoIds)
        .order('atualizadoem', { ascending: false });

      if (chatsError) throw chatsError;

      // 4) Agrupar chats por contato
      const chatsByContato: Record<string, any[]> = {};
      (chatsData || []).forEach(chat => {
        const contatoId = chat.usuarioid;
        if (!chatsByContato[contatoId]) chatsByContato[contatoId] = [];
        chatsByContato[contatoId].push(chat);
      });

      // 5) Tags (somente as usadas nesses chats)
      const allTagIds = new Set<number>();
      (chatsData || []).forEach(c => parseTagIds(c.tags).forEach(id => allTagIds.add(id)));

      let tagsMap: Record<number, TicketTag> = {};
      if (allTagIds.size > 0) {
        const { data: tagsData } = await authClient
          .from('tags')
          .select('id, name, color')
          .in('id', Array.from(allTagIds));

        (tagsData || []).forEach(tag => {
          tagsMap[tag.id] = { id: tag.id, name: tag.name, color: tag.color };
        });
      }

      // 6) Última mensagem (somente chats carregados)
      const chatIds = (chatsData || []).map(c => c.id);
      const lastMessagesMap: Record<number, string> = {};

      if (chatIds.length > 0) {
        const { data: messagesData } = await authClient
          .from('mensagens_whatsapp')
          .select('chatId, message_text, created_at')
          .in('chatId', chatIds)
          .order('created_at', { ascending: false });

        const seenChats = new Set<number>();
        (messagesData || []).forEach(msg => {
          if (!seenChats.has(msg.chatId) && msg.message_text) {
            lastMessagesMap[msg.chatId] = msg.message_text;
            seenChats.add(msg.chatId);
          }
        });
      }

      // 7) Nomes dos atendentes
      const adminIds = [...new Set((chatsData || []).map(c => c.adminid).filter(Boolean))] as string[];
      let usersMap: Record<string, { id: string; name: string }> = {};

      if (adminIds.length > 0) {
        const { data: usersData } = await authClient
          .from('usuarios')
          .select('id, nome')
          .in('id', adminIds);

        (usersData || []).forEach(u => {
          usersMap[u.id] = { id: u.id, name: u.nome };
        });
      }

      // 7.1) Nomes das campanhas
      const campanhaIds = [...new Set((chatsData || []).map(c => c.origem_campanha_id).filter(Boolean))] as string[];
      let campanhasMap: Record<string, string> = {};

      if (campanhaIds.length > 0) {
        const { data: campanhasData } = await authClient
          .from('campanhas_whatsapp')
          .select('id, nome')
          .in('id', campanhaIds);

        (campanhasData || []).forEach(c => {
          campanhasMap[c.id] = c.nome;
        });
      }

      // 8) Formatar tickets (preservando a ordem por atividade)
      const formattedTickets: WhatsAppTicket[] = (contatos || []).map(contato => {
        const contatoChats = chatsByContato[contato.id] || [];
        const activeChat = contatoChats.find(c => c.ativo && !c.resolvido);
        const mostRecentChat = activeChat || contatoChats[0];

        const chatTagIds = mostRecentChat ? parseTagIds(mostRecentChat.tags) : [];
        const chatTags = chatTagIds
          .map(id => tagsMap[id])
          .filter((tag): tag is TicketTag => tag !== undefined);

        return {
          id: contato.id,
          contatoId: contato.id,
          nome: contato.nome || '',
          telefone: contato.telefone || '',
          picture: contato.perfil,
          email: contato.email,
          chatbotDesabilitado: contato.chatbot_desabilitado,
          informacoesAdicionais: contato.informacoes_adicionais,
          contatoCriadoEm: contato.criadoem,

          chatId: mostRecentChat?.id,
          filas: parseFilas(mostRecentChat?.filas),
          modoDeAtendimento: mostRecentChat?.mododeatendimento || 'Bot',
          aceitoPorAdmin: mostRecentChat?.aceitoporadmin || false,
          adminId: mostRecentChat?.adminid,
          adminIdPendente: mostRecentChat?.adminid_pendente,
          adminIdAntigo: mostRecentChat?.adminid_antigo,
          resolvido: mostRecentChat?.resolvido ?? true,
          ativo: mostRecentChat?.ativo ?? false,
          criadoEm: mostRecentChat?.criadoem || contato.criadoem,
          atualizadoEm: mostRecentChat?.atualizadoem || contato.criadoem,
          encerradoEm: mostRecentChat?.encerradoem,
          lastMessage: mostRecentChat ? lastMessagesMap[mostRecentChat.id] || '' : '',
          tags: chatTags,
          origemCampanhaId: mostRecentChat?.origem_campanha_id,
          campanhaNome: mostRecentChat?.origem_campanha_id ? campanhasMap[mostRecentChat.origem_campanha_id] : undefined,

          chatsCount: contatoChats.length,
          hasActiveChat: !!activeChat,

          user: mostRecentChat?.adminid ? usersMap[mostRecentChat.adminid] : undefined,

          usuarioId: contato.id
        };
      });

      if (append) {
        setAllTickets(prev => mergeTicketsDedup(prev, formattedTickets));
      } else {
        setAllTickets(formattedTickets);
      }
    } catch (err) {
      console.error('Erro ao carregar tickets:', err);
      setError('Erro ao carregar tickets');
    } finally {
      setIsLoading(false);
      setIsLoadingMoreTickets(false);
      isLoadingMoreRef.current = false;
    }
  }, [pageSize]);

  const loadTicketsFull = useCallback(async () => {
    const debug = isWhatsAppDebugEnabled();

    try {
      setIsLoading(true);
      setError(null);

      if (debug) console.debug('📋 [useWhatsAppTickets] Carregando contatos...');

      const authClient = getSupabase();
      // 1. Buscar CONTATOS (entidade principal) com seus chats
      const { data: contatosData, error: contatosError } = await authClient
        .from('contatos_whatsapp')
        .select('*')
        .order('criadoem', { ascending: false });

      if (contatosError) throw contatosError;

      if (debug) {
        console.debug(`📋 [useWhatsAppTickets] ${contatosData?.length || 0} contatos encontrados`);
      }

      // 2. Buscar todos os chats
      const { data: chatsData, error: chatsError } = await authClient
        .from('chats_whatsapp')
        .select('*')
        .order('atualizadoem', { ascending: false });

      if (chatsError) throw chatsError;

      if (debug) console.debug(`📋 [useWhatsAppTickets] ${chatsData?.length || 0} chats encontrados`);

      // 3. Agrupar chats por contato (usuarioid = id do contato)
      const chatsByContato: Record<string, any[]> = {};
      (chatsData || []).forEach(chat => {
        const contatoId = chat.usuarioid;
        if (!chatsByContato[contatoId]) {
          chatsByContato[contatoId] = [];
        }
        chatsByContato[contatoId].push(chat);
      });

      const allTagIds = new Set<number>();
      (chatsData || []).forEach(c => parseTagIds(c.tags).forEach(id => allTagIds.add(id)));

      // Buscar detalhes das tags
      let tagsMap: Record<number, TicketTag> = {};
      if (allTagIds.size > 0) {
        const { data: tagsData } = await authClient
          .from('tags')
          .select('id, name, color')
          .in('id', Array.from(allTagIds));

        if (tagsData) {
          tagsData.forEach(tag => {
            tagsMap[tag.id] = { id: tag.id, name: tag.name, color: tag.color };
          });
        }
      }

      // 5. Buscar última mensagem de cada chat
      const chatIds = (chatsData || []).map(c => c.id);
      const lastMessagesMap: Record<number, string> = {};

      if (chatIds.length > 0) {
        // Buscar última mensagem de todos os chats de uma vez
        const { data: messagesData } = await authClient
          .from('mensagens_whatsapp')
          .select('chatId, message_text, created_at')
          .in('chatId', chatIds)
          .order('created_at', { ascending: false });

        // Agrupar por chatId e pegar a primeira (mais recente)
        const seenChats = new Set<number>();
        (messagesData || []).forEach(msg => {
          if (!seenChats.has(msg.chatId) && msg.message_text) {
            lastMessagesMap[msg.chatId] = msg.message_text;
            seenChats.add(msg.chatId);
          }
        });
      }

      // 5.1 Buscar nomes dos atendentes (adminid = usuarios.id)
      const adminIds = [...new Set(
        (chatsData || [])
          .map(c => c.adminid)
          .filter(Boolean)
      )] as string[];

      let usersMap: Record<string, { id: string; name: string }> = {};

      if (adminIds.length > 0) {
        const { data: usersData } = await authClient
          .from('usuarios')
          .select('id, nome')
          .in('id', adminIds);

        if (usersData) {
          usersData.forEach(u => {
            usersMap[u.id] = {
              id: u.id,
              name: u.nome
            };
          });
        }
      }

      // 5.2 Buscar nomes das campanhas
      const campanhaIds = [...new Set(
        (chatsData || [])
          .map(c => c.origem_campanha_id)
          .filter(Boolean)
      )] as string[];

      let campanhasMap: Record<string, string> = {};

      if (campanhaIds.length > 0) {
        const { data: campanhasData } = await authClient
          .from('campanhas_whatsapp')
          .select('id, nome')
          .in('id', campanhaIds);

        if (campanhasData) {
          campanhasData.forEach(c => {
            campanhasMap[c.id] = c.nome;
          });
        }
      }

      // 6. Formatar tickets por CONTATO
      const formattedTickets: WhatsAppTicket[] = (contatosData || []).map(contato => {
        // Buscar chats deste contato
        const contatoChats = chatsByContato[contato.id] || [];

        // Encontrar chat ativo (não resolvido) mais recente
        const activeChat = contatoChats.find(c => c.ativo && !c.resolvido);

        // Se não tem chat ativo, pegar o mais recente
        const mostRecentChat = activeChat || contatoChats[0];

        // Parsear tags do chat ativo
        const chatTagIds = mostRecentChat ? parseTagIds(mostRecentChat.tags) : [];
        const chatTags = chatTagIds
          .map(id => tagsMap[id])
          .filter((tag): tag is TicketTag => tag !== undefined);

        return {
          // Dados do contato (entidade principal)
          id: contato.id,
          contatoId: contato.id,
          nome: contato.nome || '',
          telefone: contato.telefone || '',
          picture: contato.perfil,
          email: contato.email,
          chatbotDesabilitado: contato.chatbot_desabilitado,
          informacoesAdicionais: contato.informacoes_adicionais,
          contatoCriadoEm: contato.criadoem,

          // Dados do chat ativo/recente
          chatId: mostRecentChat?.id,
          filas: parseFilas(mostRecentChat?.filas),
          modoDeAtendimento: mostRecentChat?.mododeatendimento || 'Bot',
          aceitoPorAdmin: mostRecentChat?.aceitoporadmin || false,
          adminId: mostRecentChat?.adminid,
          adminIdPendente: mostRecentChat?.adminid_pendente,
          adminIdAntigo: mostRecentChat?.adminid_antigo,
          resolvido: mostRecentChat?.resolvido ?? true, // Se não tem chat, considera resolvido
          ativo: mostRecentChat?.ativo ?? false,
          criadoEm: mostRecentChat?.criadoem || contato.criadoem,
          atualizadoEm: mostRecentChat?.atualizadoem || contato.criadoem,
          encerradoEm: mostRecentChat?.encerradoem,
          lastMessage: mostRecentChat ? lastMessagesMap[mostRecentChat.id] || '' : '',
          tags: chatTags,
          origemCampanhaId: mostRecentChat?.origem_campanha_id,
          campanhaNome: mostRecentChat?.origem_campanha_id ? campanhasMap[mostRecentChat.origem_campanha_id] : undefined,

          // Estatísticas
          chatsCount: contatoChats.length,
          hasActiveChat: !!activeChat,

          // Dados do atendente
          user: mostRecentChat?.adminid
            ? usersMap[mostRecentChat.adminid]
            : undefined,

          // Compatibilidade
          usuarioId: contato.id
        };
      });

      // Ordenar por: 1) tem chat ativo primeiro, 2) data de atualização
      formattedTickets.sort((a, b) => {
        // Priorizar contatos com chat ativo
        if (a.hasActiveChat && !b.hasActiveChat) return -1;
        if (!a.hasActiveChat && b.hasActiveChat) return 1;

        // Depois ordenar por data de atualização
        return new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime();
      });

      if (debug) console.debug(`📋 [useWhatsAppTickets] ${formattedTickets.length} tickets formatados`);
      setAllTickets(formattedTickets);
    } catch (err) {
      console.error('Erro ao carregar tickets:', err);
      setError('Erro ao carregar tickets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    const debug = isWhatsAppDebugEnabled();
    if (debug) console.debug('📋 [useWhatsAppTickets] loadTickets chamado, mode:', mode);
    
    if (mode === 'list') {
      setHasMoreTickets(true);
      setCurrentPage(0);
      await fetchTicketsPage(0, false);
      if (debug) console.debug('📋 [useWhatsAppTickets] loadTickets (list) concluído');
      return;
    }

    await loadTicketsFull();
    if (debug) console.debug('📋 [useWhatsAppTickets] loadTickets (full) concluído');
  }, [mode, fetchTicketsPage, loadTicketsFull]);
  const loadFilas = useCallback(async () => {
    try {
      const authClient = getSupabase();
      const { data, error: filasError } = await authClient
        .from('filas_whatsapp')
        .select('*')
        .eq('active', true)
        .order('order_position', { ascending: true });

      if (filasError) throw filasError;

      const formattedFilas: FilaWhatsApp[] = (data || []).map(fila => ({
        id: fila.id,
        name: fila.name,
        color: fila.color || '#6b7280',
        description: fila.description,
        orderPosition: fila.order_position || 0,
        active: fila.active !== false
      }));

      setFilas(formattedFilas);
    } catch (err) {
      console.error('Erro ao carregar filas:', err);
    }
  }, []);

  const acceptTicket = useCallback(async (ticketId: string, adminId: string) => {
    try {
      // Verificar limite de tickets antes de aceitar
      const { ticketLimitService } = await import('@/services/whatsapp/ticketLimitService');
      const limitCheck = await ticketLimitService.checkTicketLimit(adminId);
      
      if (!limitCheck.canAccept) {
        toast.error(limitCheck.errorMessage || 'Limite de tickets atingido');
        return;
      }

      const authClient = getSupabase();
      // ticketId agora é o ID do contato, precisamos do chatId
      const ticket = allTickets.find(t => t.id === ticketId || t.chatId?.toString() === ticketId);
      const chatId = ticket?.chatId || ticketId;

      // Buscar dados do atendente na tabela usuarios (pode ser por id ou supabase_id)
      let userData: { nome?: string; email?: string } | null = null;
      
      // Tentar buscar por supabase_id primeiro (UUID do auth.users)
      const { data: userBySupabaseId } = await authClient
        .from('usuarios')
        .select('nome, email')
        .eq('supabase_id', adminId)
        .maybeSingle();
      
      if (userBySupabaseId) {
        userData = userBySupabaseId;
      } else {
        // Fallback: buscar por id interno
        const { data: userById } = await authClient
          .from('usuarios')
          .select('nome, email')
          .eq('id', adminId)
          .maybeSingle();
        userData = userById;
      }
      
      if (isWhatsAppDebugEnabled()) {
        console.debug('👤 [AcceptTicket] Dados do atendente encontrados:', { adminId, nome: userData?.nome, email: userData?.email });
      }

      const { error: updateError } = await authClient
        .from('chats_whatsapp')
        .update({
          aceitoporadmin: true,
          adminid: adminId,
          mododeatendimento: 'Atendimento Humano',
          atualizadoem: new Date().toISOString()
        })
        .eq('id', chatId);

      if (updateError) throw updateError;

      // Enviar mensagem automática de aceite se configurado
      try {
        const config = await whatsappConfigService.getConfig();
        if (isWhatsAppDebugEnabled()) {
          console.debug('📧 [AutoMsg] Config carregada:', {
            send_greeting_accepted: config.send_greeting_accepted,
            greeting_use_template: config.greeting_use_template,
            chatId: ticket?.chatId
          });
        }

        if (config.send_greeting_accepted && ticket?.chatId) {
          const filaAtual = filas.find(f => ticket.filas?.includes(f.id.toString()));
          const context = createMessageContext({
            ticket: { nome: ticket.nome, telefone: ticket.telefone, email: ticket.email, chatId: ticket.chatId, criadoEm: ticket.criadoEm },
            userData: { nome: userData?.nome, email: userData?.email },
            filaAtual: filaAtual ? { name: filaAtual.name } : undefined
          });
          
          await sendAutoMessage({
            chatId: ticket.chatId.toString(),
            contatoId: ticket.contatoId,
            telefone: ticket.telefone,
            messageText: config.greeting_accepted_message,
            useTemplate: config.greeting_use_template,
            templateName: config.greeting_template_name,
            templateLanguage: config.greeting_template_language,
            templateVariables: config.greeting_template_variables || [],
            context
          });
          if (isWhatsAppDebugEnabled()) console.debug('📧 [AutoMsg] Mensagem de aceite enviada com sucesso!');
        }
      } catch (msgErr) {
        console.error('❌ [AutoMsg] Erro ao enviar mensagem automática de aceite:', msgErr);
      }

      // Registrar log
      await logsWhatsAppService.registrarLog({
        acao: 'ticket_aceito',
        contato_id: ticket?.contatoId,
        chat_id: ticket?.chatId,
        detalhes: {
          contato_nome: ticket?.nome,
          contato_telefone: ticket?.telefone
        }
      });

      toast.success('Ticket aceito com sucesso!');
      await loadTickets();
    } catch (err) {
      console.error('Erro ao aceitar ticket:', err);
      toast.error('Erro ao aceitar ticket');
    }
  }, [loadTickets, allTickets, filas]);

  const transferTicket = useCallback(async (ticketId: string, filaId: string, userId?: string) => {
    try {
      const authClient = getSupabase();
      const ticket = allTickets.find(t => t.id === ticketId || t.chatId?.toString() === ticketId);
      const chatId = ticket?.chatId || ticketId;

      // Buscar dados do atendente atual via cookie
      const currentUserId = CookieAuth.getUserId();
      
      // Buscar dados do atendente na tabela usuarios
      let userData: { nome?: string; email?: string } | null = null;
      if (currentUserId) {
        const { data: userBySupabaseId } = await authClient
          .from('usuarios')
          .select('nome, email')
          .eq('id', currentUserId)
          .maybeSingle();
        userData = userBySupabaseId;
      }

      const updateData: any = {
        filas: filaId,
        atualizadoem: new Date().toISOString()
      };

      if (userId) {
        updateData.adminid_pendente = userId;
      }

      const { error: updateError } = await authClient
        .from('chats_whatsapp')
        .update(updateData)
        .eq('id', chatId);

      if (updateError) throw updateError;

      // Enviar mensagem automática de transferência se configurado
      try {
        const config = await whatsappConfigService.getConfig();
        if (config.send_msg_transf_ticket && ticket?.chatId) {
          const filaDestino = filas.find(f => f.id.toString() === filaId);
          const filaAtual = filas.find(f => ticket.filas?.includes(f.id.toString()));
          
          const context = createMessageContext({
            ticket: { nome: ticket.nome, telefone: ticket.telefone, email: ticket.email, chatId: ticket.chatId, criadoEm: ticket.criadoEm },
            userData: { nome: userData?.nome, email: userData?.email },
            filaAtual: filaAtual ? { name: filaAtual.name } : undefined,
            filaDestino: filaDestino ? { name: filaDestino.name } : undefined
          });
          
          await sendAutoMessage({
            chatId: ticket.chatId.toString(),
            contatoId: ticket.contatoId,
            telefone: ticket.telefone,
            messageText: config.transfer_message,
            useTemplate: config.transfer_use_template,
            templateName: config.transfer_template_name,
            templateLanguage: config.transfer_template_language,
            templateVariables: config.transfer_template_variables || [],
            context
          });
        }
      } catch (msgErr) {
        console.error('Erro ao enviar mensagem automática de transferência:', msgErr);
      }

      // Registrar log
      await logsWhatsAppService.registrarLog({
        acao: 'ticket_transferido',
        contato_id: ticket?.contatoId,
        chat_id: ticket?.chatId,
        detalhes: {
          contato_nome: ticket?.nome,
          contato_telefone: ticket?.telefone,
          fila_origem: ticket?.filas?.join(','),
          fila_destino: filaId,
          usuario_destino: userId
        }
      });

      toast.success('Ticket transferido com sucesso!');
      await loadTickets();
    } catch (err) {
      console.error('Erro ao transferir ticket:', err);
      toast.error('Erro ao transferir ticket');
    }
  }, [loadTickets, allTickets, filas]);

  const resolveTicket = useCallback(async (ticketId: string, silent: boolean = false) => {
    try {
      const authClient = getSupabase();
      const ticket = allTickets.find(t => t.id === ticketId || t.chatId?.toString() === ticketId);
      const chatId = ticket?.chatId || ticketId;

      // 1. PRIORIDADE: Atualizar o banco PRIMEIRO para feedback imediato
      const { error: updateError } = await authClient
        .from('chats_whatsapp')
        .update({
          resolvido: true,
          ativo: false,
          encerradoem: new Date().toISOString(),
          atualizadoem: new Date().toISOString()
        })
        .eq('id', chatId);

      if (updateError) throw updateError;

      // Mostrar feedback imediato
      toast.success(silent ? 'Ticket encerrado silenciosamente!' : 'Ticket finalizado com sucesso!');
      
      // Atualizar lista local imediatamente (otimistic update)
      loadTickets();

      // 2. BACKGROUND: Operações secundárias (não bloqueiam a UI)
      (async () => {
        try {
          const bgClient = getSupabase();
          // Buscar dados do atendente atual via cookie
          const currentUserId = CookieAuth.getUserId();
          
          let userData: { nome?: string; email?: string } | null = null;
          if (currentUserId) {
            const { data: userBySupabaseId } = await bgClient
              .from('usuarios')
              .select('nome, email')
              .eq('id', currentUserId)
              .maybeSingle();
            userData = userBySupabaseId;
          }

          // Enviar mensagem automática de encerramento (somente se NÃO for silencioso)
          if (!silent && ticket?.chatId) {
            try {
              const config = await whatsappConfigService.getConfig();
              if (config.send_msg_close_ticket) {
                const filaAtual = filas.find(f => ticket.filas?.includes(f.id.toString()));
                
                const context = createMessageContext({
                  ticket: { nome: ticket.nome, telefone: ticket.telefone, email: ticket.email, chatId: ticket.chatId, criadoEm: ticket.criadoEm },
                  userData: { nome: userData?.nome, email: userData?.email },
                  filaAtual: filaAtual ? { name: filaAtual.name } : undefined
                });
                
                await sendAutoMessage({
                  chatId: ticket.chatId.toString(),
                  contatoId: ticket.contatoId,
                  telefone: ticket.telefone,
                  messageText: config.close_ticket_message,
                  useTemplate: config.close_use_template,
                  templateName: config.close_template_name,
                  templateLanguage: config.close_template_language,
                  templateVariables: config.close_template_variables || [],
                  context
                });
              }
            } catch (msgErr) {
              console.error('❌ [AutoMsg] Erro ao enviar mensagem automática de encerramento:', msgErr);
            }
          }

          // Criar registro de avaliação (somente se NÃO for silencioso)
          if (!silent && ticket?.chatId) {
            try {
              const token = crypto.randomUUID();
              await bgClient
                .from('avaliacoes_whatsapp')
                .insert({
                  chat_id: ticket.chatId,
                  token
                });
              console.log('✅ Avaliação criada para chat', ticket.chatId);
            } catch (avalErr) {
              console.error('❌ Erro ao criar avaliação:', avalErr);
            }
          }

          // Registrar log detalhado
          await logsWhatsAppService.registrarLog({
            acao: 'ticket_encerrado',
            contato_id: ticket?.contatoId,
            chat_id: ticket?.chatId,
            detalhes: {
              contato_nome: ticket?.nome,
              contato_telefone: ticket?.telefone,
              modo_encerramento: silent ? 'silencioso' : 'com_mensagem',
              mensagem_enviada: !silent,
              atendente_nome: userData?.nome || 'Desconhecido',
              atendente_email: userData?.email
            }
          });
        } catch (bgError) {
          console.error('Erro em operações de background:', bgError);
        }
      })();

    } catch (err) {
      console.error('Erro ao finalizar ticket:', err);
      toast.error('Erro ao finalizar ticket');
    }
  }, [loadTickets, allTickets, filas]);

  const reopenTicket = useCallback(async (ticketId: string) => {
    try {
      const authClient = getSupabase();
      const ticket = allTickets.find(t => t.id === ticketId || t.chatId?.toString() === ticketId);
      const chatId = ticket?.chatId || ticketId;

      // Obter o ID do usuário logado via cookie
      const userId = CookieAuth.getUserId();

      if (!userId) {
        toast.error('Usuário não autenticado');
        return;
      }

      // userId do cookie já é o usuarios.id
      const usuarioId = userId;
      let userData: { id?: string; nome?: string; email?: string } | null = null;
      const { data: userById } = await authClient
        .from('usuarios')
        .select('id, nome, email')
        .eq('id', usuarioId)
        .maybeSingle();
      userData = userById;

      const { error: updateError } = await authClient
        .from('chats_whatsapp')
        .update({
          resolvido: false,
          encerradoem: null,
          adminid: usuarioId,
          aceitoporadmin: true,
          ativo: true,
          mododeatendimento: 'Atendimento Humano',
          atualizadoem: new Date().toISOString()
        })
        .eq('id', chatId);

      if (updateError) throw updateError;

      // Enviar mensagem automática de reabertura se configurado
      try {
          const config = await whatsappConfigService.getConfig();
          if (isWhatsAppDebugEnabled()) {
            console.debug('📧 [AutoMsg] Config carregada para REABERTURA:', {
              send_msg_reopen_ticket: config.send_msg_reopen_ticket,
              reopen_use_template: config.reopen_use_template,
              reopen_template_name: config.reopen_template_name,
              reopen_template_variables: config.reopen_template_variables,
              chatId: ticket?.chatId
            });
          }

        if (config.send_msg_reopen_ticket && ticket?.chatId) {
          const filaAtual = filas.find(f => ticket.filas?.includes(f.id.toString()));
          
          const context = createMessageContext({
            ticket: { nome: ticket.nome, telefone: ticket.telefone, email: ticket.email, chatId: ticket.chatId, criadoEm: ticket.criadoEm },
            userData: { nome: userData?.nome, email: userData?.email },
            filaAtual: filaAtual ? { name: filaAtual.name } : undefined
          });
          
          await sendAutoMessage({
            chatId: ticket.chatId.toString(),
            contatoId: ticket.contatoId,
            telefone: ticket.telefone,
            messageText: config.reopen_ticket_message,
            useTemplate: config.reopen_use_template,
            templateName: config.reopen_template_name,
            templateLanguage: config.reopen_template_language,
            templateVariables: config.reopen_template_variables || [],
            context
          });
          if (isWhatsAppDebugEnabled()) {
            console.debug('📧 [AutoMsg] Mensagem de REABERTURA enviada - template:', config.reopen_template_name);
          }
        }
      } catch (msgErr) {
        console.error('❌ [AutoMsg] Erro ao enviar mensagem automática de reabertura:', msgErr);
      }

      // Registrar log de reabertura
      await logsWhatsAppService.registrarLog({
        acao: 'ticket_reaberto',
        contato_id: ticket?.contatoId,
        chat_id: ticket?.chatId,
        detalhes: {
          contato_nome: ticket?.nome,
          contato_telefone: ticket?.telefone,
          admin_id: usuarioId,
          admin_nome: userData?.nome || 'Desconhecido'
        }
      });

      toast.success('Ticket reaberto com sucesso!');
      await loadTickets();
    } catch (err) {
      console.error('Erro ao reabrir ticket:', err);
      toast.error('Erro ao reabrir ticket');
    }
  }, [loadTickets, allTickets, filas]);

  const cancelTicket = useCallback(async (ticketId: string, silent: boolean = false) => {
    try {
      const authClient = getSupabase();
      const ticket = allTickets.find(t => t.id === ticketId || t.chatId?.toString() === ticketId);
      const chatId = ticket?.chatId || ticketId;

      // 1. PRIORIDADE: Atualizar o banco PRIMEIRO para feedback imediato
      const { error: updateError } = await authClient
        .from('chats_whatsapp')
        .update({
          resolvido: true,
          ativo: false,
          encerradoem: new Date().toISOString(),
          atualizadoem: new Date().toISOString()
        })
        .eq('id', chatId);

      if (updateError) throw updateError;

      // Mostrar feedback imediato
      toast.success(silent ? 'Ticket encerrado silenciosamente!' : 'Ticket cancelado/ignorado com sucesso!');
      
      // Atualizar lista local imediatamente
      loadTickets();

      // 2. BACKGROUND: Operações secundárias (não bloqueiam a UI)
      (async () => {
        try {
          const bgClient = getSupabase();
          // Buscar dados do atendente atual via cookie
          const currentUserId = CookieAuth.getUserId();
          
          let userData: { nome?: string; email?: string } | null = null;
          if (currentUserId) {
            const { data: userBySupabaseId } = await bgClient
              .from('usuarios')
              .select('nome, email')
              .eq('id', currentUserId)
              .maybeSingle();
            userData = userBySupabaseId;
          }

          // Enviar mensagem automática de cancelamento (somente se NÃO for silencioso)
          if (!silent && ticket?.chatId) {
            try {
              const config = await whatsappConfigService.getConfig();
              if (config.send_msg_cancel_ticket) {
                const filaAtual = filas.find(f => ticket.filas?.includes(f.id.toString()));
                
                const context = createMessageContext({
                  ticket: { nome: ticket.nome, telefone: ticket.telefone, email: ticket.email, chatId: ticket.chatId, criadoEm: ticket.criadoEm },
                  userData: { nome: userData?.nome, email: userData?.email },
                  filaAtual: filaAtual ? { name: filaAtual.name } : undefined
                });
                
                await sendAutoMessage({
                  chatId: ticket.chatId.toString(),
                  contatoId: ticket.contatoId,
                  telefone: ticket.telefone,
                  messageText: config.cancel_ticket_message,
                  useTemplate: config.cancel_use_template,
                  templateName: config.cancel_template_name,
                  templateLanguage: config.cancel_template_language,
                  templateVariables: config.cancel_template_variables || [],
                  context
                });
              }
            } catch (msgErr) {
              console.error('Erro ao enviar mensagem automática de cancelamento:', msgErr);
            }
          }

          // Registrar log
          await logsWhatsAppService.registrarLog({
            acao: silent ? 'ticket_cancelado_silencioso' : 'ticket_cancelado',
            contato_id: ticket?.contatoId,
            chat_id: ticket?.chatId,
            detalhes: {
              contato_nome: ticket?.nome,
              contato_telefone: ticket?.telefone,
              silencioso: silent
            }
          });
        } catch (bgError) {
          console.error('Erro em operações de background:', bgError);
        }
      })();

    } catch (err) {
      console.error('Erro ao cancelar ticket:', err);
      toast.error('Erro ao cancelar ticket');
    }
  }, [loadTickets, allTickets, filas]);

  const acceptTransfer = useCallback(async (ticketId: string) => {
    try {
      const authClient = getSupabase();
      const ticket = allTickets.find(t => t.id === ticketId || t.chatId?.toString() === ticketId);
      const chatId = ticket?.chatId || ticketId;

      // Buscar adminIdPendente do ticket
      const { data: chatData, error: fetchError } = await authClient
        .from('chats_whatsapp')
        .select('adminid_pendente, adminid')
        .eq('id', chatId)
        .single();

      if (fetchError) throw fetchError;

      const adminIdPendente = chatData?.adminid_pendente;
      if (!adminIdPendente) {
        toast.error('Não há transferência pendente para este ticket');
        return;
      }

      // Atualizar: novo admin = adminIdPendente, guardar admin antigo
      const { error: updateError } = await authClient
        .from('chats_whatsapp')
        .update({
          adminid: adminIdPendente,
          adminid_pendente: null,
          adminid_antigo: chatData?.adminid,
          aceitoporadmin: true,
          atualizadoem: new Date().toISOString()
        })
        .eq('id', chatId);

      if (updateError) throw updateError;

      // Registrar log
      await logsWhatsAppService.registrarLog({
        acao: 'transferencia_aceita',
        contato_id: ticket?.contatoId,
        chat_id: ticket?.chatId,
        detalhes: {
          contato_nome: ticket?.nome,
          admin_anterior: chatData?.adminid
        }
      });

      toast.success('Transferência aceita com sucesso!');
      await loadTickets();
    } catch (err) {
      console.error('Erro ao aceitar transferência:', err);
      toast.error('Erro ao aceitar transferência');
    }
  }, [loadTickets, allTickets]);

  const rejectTransfer = useCallback(async (ticketId: string) => {
    try {
      const authClient = getSupabase();
      const ticket = allTickets.find(t => t.id === ticketId || t.chatId?.toString() === ticketId);
      const chatId = ticket?.chatId || ticketId;

      // Limpar adminIdPendente
      const { error: updateError } = await authClient
        .from('chats_whatsapp')
        .update({
          adminid_pendente: null,
          atualizadoem: new Date().toISOString()
        })
        .eq('id', chatId);

      if (updateError) throw updateError;

      // Registrar log
      await logsWhatsAppService.registrarLog({
        acao: 'transferencia_recusada',
        contato_id: ticket?.contatoId,
        chat_id: ticket?.chatId,
        detalhes: {
          contato_nome: ticket?.nome
        }
      });

      toast.success('Transferência recusada');
      await loadTickets();
    } catch (err) {
      console.error('Erro ao recusar transferência:', err);
      toast.error('Erro ao recusar transferência');
    }
  }, [loadTickets, allTickets]);

  useEffect(() => {
    loadTickets();
    loadFilas();

    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let isSubscribed = true;
    let reconnectAttempts = 0;
    let isReconnecting = false;
    let isRealtimeConnected = false;
    const debug = isWhatsAppDebugEnabled();
    const MAX_RECONNECT_ATTEMPTS = 5;
    const BASE_RECONNECT_DELAY = 5000; // 5 seconds
    const POLLING_INTERVAL = 10000; // 10 seconds

    // Debounce para evitar spam de requisições - 500ms de delay
    const debouncedLoadTickets = createDebounce(500);

    const getReconnectDelay = (attempt: number) => {
      // Exponential backoff: 5s, 10s, 20s, 40s, 60s (max)
      return Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), 60000);
    };

    // Fallback polling quando Realtime falha
    const startPolling = () => {
      if (pollingInterval) return;
      if (debug) console.debug('🔄 [Realtime] Iniciando polling fallback (10s)...');
      pollingInterval = setInterval(() => {
        if (isSubscribed) loadTickets();
      }, POLLING_INTERVAL);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        if (debug) console.debug('🔄 [Realtime] Parando polling fallback');
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const realtimeClient = getRealtimeClient();
    let isSettingUpChannels = false;

    if (debug) console.debug('[Realtime:Tickets] 📡 Configurando canais Realtime');

    const setupRealtimeChannels = () => {
      // Guarda contra setup duplicado (race conditions)
      if (isSettingUpChannels) {
        if (debug) console.debug('[Realtime:Tickets] ⚠️ Setup já em andamento, ignorando');
        return channels;
      }
      isSettingUpChannels = true;

      try {
        // Remover canais existentes com os mesmos nomes antes de criar novos
        const existingChannels = realtimeClient.getChannels();
        existingChannels.forEach(ch => {
          if (ch.topic.includes('whatsapp-contatos-realtime') ||
              ch.topic.includes('whatsapp-tickets-realtime') ||
              ch.topic.includes('whatsapp-messages-realtime')) {
            if (debug) console.debug(`[Realtime:Tickets] 🧹 Removendo canal existente: ${ch.topic}`);
            realtimeClient.removeChannel(ch);
          }
        });

        // Setup realtime subscription for contatos
        const contatosChannel = realtimeClient
          .channel('whatsapp-contatos-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'contatos_whatsapp'
            },
            (payload) => {
              if (debug) {
                console.debug('[Realtime:Tickets] 📥 contatos_whatsapp evento', {
                  eventType: payload.eventType,
                  id: (payload.new as any)?.id || (payload.old as any)?.id
                });
              }
              debouncedLoadTickets(loadTickets);
            }
          )
          .subscribe((status, err) => {
            if (debug) console.debug(`[Realtime:Tickets] 📡 contatos status: ${status}`, err ? `Erro: ${JSON.stringify(err)}` : '');
            if (status === 'SUBSCRIBED') {
              reconnectAttempts = 0;
              isRealtimeConnected = true;
              stopPolling();
            }
            if ((status === 'CHANNEL_ERROR' || status === 'CLOSED') && isSubscribed) {
              if (debug) console.debug(`[Realtime:Tickets] 🔴 contatos canal com problema: ${status}`);
              isRealtimeConnected = false;
              startPolling();
              scheduleReconnect();
            }
          });

        // Setup realtime subscription for chats
        const chatsChannel = realtimeClient
          .channel('whatsapp-tickets-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'chats_whatsapp'
            },
          (payload) => {
              const updatedChat = payload.new as any;
              const deletedChat = payload.old as any;
              
              if (debug) {
                console.debug('[Realtime:Tickets] 📥 chats_whatsapp evento', {
                  eventType: payload.eventType,
                  id: updatedChat?.id || deletedChat?.id,
                  adminId: updatedChat?.adminid,
                  modoAtendimento: updatedChat?.mododeatendimento,
                  aceitoPorAdmin: updatedChat?.aceitoporadmin
                });
              }
              
              // Atualização OTIMISTA - atualizar imediatamente no estado local
              if (payload.eventType === 'UPDATE' && updatedChat) {
                setAllTickets(prev => {
                  const updated = prev.map(ticket => {
                    if (ticket.chatId === updatedChat.id) {
                      if (debug) {
                        console.debug('[Realtime:Tickets] ✅ Atualizando ticket otimisticamente', {
                          ticketId: ticket.id,
                          chatId: ticket.chatId,
                          oldModo: ticket.modoDeAtendimento,
                          newModo: updatedChat.mododeatendimento,
                          oldAceito: ticket.aceitoPorAdmin,
                          newAceito: updatedChat.aceitoporadmin
                        });
                      }
                      return {
                        ...ticket,
                        modoDeAtendimento: updatedChat.mododeatendimento || ticket.modoDeAtendimento,
                        aceitoPorAdmin: updatedChat.aceitoporadmin ?? ticket.aceitoPorAdmin,
                        adminId: updatedChat.adminid || ticket.adminId,
                        adminIdPendente: updatedChat.adminid_pendente,
                        resolvido: updatedChat.resolvido ?? ticket.resolvido,
                        ativo: updatedChat.ativo ?? ticket.ativo,
                        atualizadoEm: updatedChat.atualizadoem || new Date().toISOString(),
                        filas: parseFilas(updatedChat.filas) || ticket.filas,
                      };
                    }
                    return ticket;
                  });
                  
                  // Re-ordenar por atualizadoEm (mais recentes primeiro)
                  return updated.sort((a, b) => {
                    if (a.hasActiveChat && !b.hasActiveChat) return -1;
                    if (!a.hasActiveChat && b.hasActiveChat) return 1;
                    return new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime();
                  });
                });
              }
              
              // Depois, fazer o refetch completo com debounce para sincronizar
              debouncedLoadTickets(loadTickets);
            }
          )
          .subscribe((status, err) => {
            if (debug) console.debug(`[Realtime:Tickets] 📡 chats status: ${status}`, err ? `Erro: ${JSON.stringify(err)}` : '');
            if (status === 'SUBSCRIBED') {
              reconnectAttempts = 0;
              isRealtimeConnected = true;
              stopPolling();
            }
            if ((status === 'CHANNEL_ERROR' || status === 'CLOSED') && isSubscribed) {
              if (debug) console.debug(`[Realtime:Tickets] 🔴 chats canal com problema: ${status}`);
              isRealtimeConnected = false;
              startPolling();
              scheduleReconnect();
            }
          });

        // Setup realtime subscription for messages (to update lastMessage)
        const messagesChannel = realtimeClient
          .channel('whatsapp-messages-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'mensagens_whatsapp'
            },
          (payload) => {
              const newMessage = payload.new as any;
              
              // Som de notificação é gerenciado pelo useGlobalWhatsAppNotifications
              if (debug) {
                console.debug('[Realtime:Tickets] 📩 mensagens_whatsapp INSERT', {
                  id: newMessage?.id,
                  chatId: newMessage?.chatId,
                  send: newMessage?.send,
                  messageText: newMessage?.message_text?.substring(0, 50)
                });
              }
              
              // Atualização OTIMISTA para nova mensagem - atualizar lastMessage e atualizadoEm
              if (newMessage?.chatId) {
                setAllTickets(prev => {
                  const updated = prev.map(ticket => {
                    if (ticket.chatId === newMessage.chatId) {
                      if (debug) {
                        console.debug('[Realtime:Tickets] ✅ Atualizando lastMessage otimisticamente', {
                          ticketId: ticket.id,
                          chatId: ticket.chatId
                        });
                      }
                      return {
                        ...ticket,
                        lastMessage: newMessage.message_text || ticket.lastMessage,
                        atualizadoEm: newMessage.created_at || new Date().toISOString(),
                      };
                    }
                    return ticket;
                  });
                  
                  // Re-ordenar para que o ticket atualizado vá para o topo
                  return updated.sort((a, b) => {
                    if (a.hasActiveChat && !b.hasActiveChat) return -1;
                    if (!a.hasActiveChat && b.hasActiveChat) return 1;
                    return new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime();
                  });
                });
              }
              
              // Depois, fazer o refetch completo com debounce para sincronizar
              debouncedLoadTickets(loadTickets);
            }
          )
          .subscribe((status, err) => {
            if (debug) console.debug(`[Realtime:Tickets] 📡 messages status: ${status}`, err ? `Erro: ${JSON.stringify(err)}` : '');
            if (status === 'SUBSCRIBED') {
              reconnectAttempts = 0;
              isRealtimeConnected = true;
              stopPolling();
            }
            if ((status === 'CHANNEL_ERROR' || status === 'CLOSED') && isSubscribed) {
              if (debug) console.debug(`[Realtime:Tickets] 🔴 messages canal com problema: ${status}`);
              isRealtimeConnected = false;
              startPolling();
              scheduleReconnect();
            }
          });

        return { contatosChannel, chatsChannel, messagesChannel };
      } finally {
        isSettingUpChannels = false;
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimeout || isReconnecting || !isSubscribed) return;

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('❌ [Realtime] Limite de reconexões atingido, parando tentativas');
        return;
      }

      const delay = getReconnectDelay(reconnectAttempts);
      reconnectAttempts++;

      if (debug) {
        console.debug(
          `⚠️ [Realtime] Agendando reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} em ${delay / 1000}s...`
        );
      }

      reconnectTimeout = setTimeout(async () => {
        if (!isSubscribed) return;

        isReconnecting = true;
        try {
          await Promise.allSettled([
            realtimeClient.removeChannel(channels.contatosChannel),
            realtimeClient.removeChannel(channels.chatsChannel),
            realtimeClient.removeChannel(channels.messagesChannel)
          ]);
        } finally {
          isReconnecting = false;
          reconnectTimeout = null;
        }

        if (isSubscribed) {
          channels = setupRealtimeChannels();
          loadTickets();
        }
      }, delay);
    };

    let channels = setupRealtimeChannels();

    return () => {
      isSubscribed = false;
      stopPolling();
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      realtimeClient.removeChannel(channels.contatosChannel);
      realtimeClient.removeChannel(channels.chatsChannel);
      realtimeClient.removeChannel(channels.messagesChannel);
    };
  }, [loadTickets, loadFilas]);

  return {
    tickets,
    filas: filasPermitidaList,
    allFilas: filas,
    isLoading: isLoading || isLoadingFilas,
    error,
    acceptTicket,
    transferTicket,
    resolveTicket,
    reopenTicket,
    cancelTicket,
    acceptTransfer,
    rejectTransfer,
    refetch: loadTickets,
    filasPermitidas,
    hasFilasRestriction,
    isLoadingMoreTickets,
    hasMoreTickets,
    loadMoreTickets: () => {
      if (!isLoadingMoreRef.current && hasMoreTickets) {
        fetchTicketsPage(currentPage + 1, true);
      }
    },
  };
};
