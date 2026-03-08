import { useState, useMemo, useCallback, useEffect } from 'react';
import { FilterState } from '../types';
import { isWhatsAppDebugEnabled } from '@/utils/whatsappDebug';
import { whatsappConfigService } from '@/services/supabase/whatsappConfigService';

// Aceita tanto user.id (interno) quanto user.supabase_id (UUID) para compatibilidade
export interface UserIdPair {
  id: string | null;  // usuarios.id (interno)
  supabase_id: string | null;  // UUID do auth.users
  cargo?: string | number | null; // cargo ID do usuário
}

export const useTicketsFilters = (tickets: any[], filas: any[], currentUser?: UserIdPair | null, canViewAllTickets: boolean = false) => {
  const [hideChatbotTickets, setHideChatbotTickets] = useState(false);

  useEffect(() => {
    whatsappConfigService.getConfig().then(cfg => {
      setHideChatbotTickets(cfg.hide_chatbot_tickets ?? false);
    }).catch(() => {});
  }, []);
  const [filters, setFilters] = useState<FilterState>({
    searchParam: '',
    searchInMessages: false,
    currentTab: 'open',
    showFilters: false,
    selectedFilas: [],
    selectedConnections: [],
    selectedModoAtendimento: [],
    selectedUsers: [],
    showAll: false,
    showResolved: false,
    sortOrder: 'desc'
  });

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleFilter = useCallback((key: keyof Pick<FilterState, 'showFilters' | 'showAll' | 'showResolved'>) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setFilters(prev => ({ 
      ...prev, 
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      selectedFilas: [],
      selectedConnections: [],
      selectedModoAtendimento: [],
      selectedUsers: []
    }));
  }, []);

  const hasActiveFilters = useMemo(() => 
    filters.selectedFilas.length > 0 || 
    filters.selectedConnections.length > 0 || 
    filters.selectedModoAtendimento.length > 0 || 
    filters.selectedUsers.length > 0,
  [filters.selectedFilas, filters.selectedConnections, filters.selectedModoAtendimento, filters.selectedUsers]);

  // Otimização: filtro único com todas as condições + ordenação
  const filteredTickets = useMemo(() => {
    const searchTerm = filters.searchParam.trim().toLowerCase();
    const hasFilasFilter = filters.selectedFilas.length > 0;
    const hasModoFilter = filters.selectedModoAtendimento.length > 0;
    const hasUsersFilter = filters.selectedUsers.length > 0;
    const filasSet = hasFilasFilter ? new Set(filters.selectedFilas) : null;
    const modoSet = hasModoFilter ? new Set(filters.selectedModoAtendimento) : null;
    const usersSet = hasUsersFilter ? new Set(filters.selectedUsers) : null;

    // Verificar se deve ocultar tickets chatbot para não-admins
    const userCargoId = currentUser?.cargo ? Number(currentUser.cargo) : null;
    const isAdmin = userCargoId === 1;
    const shouldHideChatbot = hideChatbotTickets && !isAdmin;

    const filtered: any[] = [];

    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];

      // Ocultar tickets chatbot para não-admins se configuração ativa
      if (shouldHideChatbot) {
        const modo = (t.modoDeAtendimento || '').toLowerCase();
        if (modo === 'bot') continue;
      }

      // Filtro por status de resolução
      if (filters.showResolved) {
        if (t.resolvido !== true) continue;
      } else {
        if (t.resolvido === true) continue;
        // Filtro por tab (open/pending)
        if (filters.currentTab === 'open') {
          // Em Atendimento = APENAS Atendimento Humano aceito por admin
          const modoAtendimento = (t.modoDeAtendimento || '').toLowerCase();
          const isHumanoAceito = modoAtendimento === 'atendimento humano' && t.aceitoPorAdmin === true;
          
          if (!isHumanoAceito) continue;
          
          // Se showAll está desativado OU usuário não tem permissão, mostrar apenas tickets do usuário logado
          const effectiveShowAll = canViewAllTickets && filters.showAll;
          if (!effectiveShowAll && currentUser) {
            const ticketAdminId = t.adminId || (t as any).adminid;
            // Log para debug (ativado via localStorage.debug_whatsapp = '1')
            if (isWhatsAppDebugEnabled()) {
              console.debug('[Filter:open] Verificando ticket:', {
                ticketId: t.id,
                chatId: t.chatId,
                ticketAdminId,
                currentUserId: currentUser.id,
                currentSupabaseId: currentUser.supabase_id,
              });
            }
            // Aceita match com qualquer um dos IDs do usuário (interno ou supabase_id)
            const matchesUser = ticketAdminId === currentUser.id || ticketAdminId === currentUser.supabase_id;
            if (!matchesUser) {
              if (isWhatsAppDebugEnabled()) {
                console.debug('[Filter:open] ❌ Ticket filtrado - não pertence ao usuário atual');
              }
              continue;
            }
          }
        }
        if (filters.currentTab === 'pending') {
          // Aguardando = Bot OU Atendimento Humano não aceito por admin
          const modoAtendimento = (t.modoDeAtendimento || '').toLowerCase();
          const isBot = modoAtendimento === 'bot';
          const isHumanoAguardando = modoAtendimento === 'atendimento humano' && t.aceitoPorAdmin !== true;
          if (!isBot && !isHumanoAguardando) continue;
        }
      }

      // Filtro por busca
      if (searchTerm) {
        const matchesName = t.nome?.toLowerCase().includes(searchTerm);
        const matchesPhone = t.telefone?.includes(searchTerm);
        const matchesMessage = filters.searchInMessages && 
          t.lastMessage?.toLowerCase().includes(searchTerm);
        if (!matchesName && !matchesPhone && !matchesMessage) continue;
      }

      // Filtro por filas
      if (filasSet) {
        const ticketFilas = t.filas || [];
        let matchesFila = false;
        
        if (filasSet.has('sem-fila') && ticketFilas.length === 0) {
          matchesFila = true;
        } else {
          for (const f of ticketFilas) {
            if (filasSet.has(String(f))) {
              matchesFila = true;
              break;
            }
          }
        }
        if (!matchesFila) continue;
      }

      // Filtro por modo de atendimento
      if (modoSet && !modoSet.has(t.modoDeAtendimento)) continue;

      // Filtro por usuário (admin) - verifica se adminId está no set de usuários selecionados
      const ticketAdmin = t.adminId || t.adminid;
      if (usersSet && ticketAdmin && !usersSet.has(ticketAdmin)) continue;

      filtered.push(t);
    }

    // Ordenação
    const sortMultiplier = filters.sortOrder === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      const dateA = new Date(a.atualizadoEm || a.criadoEm).getTime();
      const dateB = new Date(b.atualizadoEm || b.criadoEm).getTime();
      return (dateA - dateB) * sortMultiplier;
    });

    return filtered;
  }, [tickets, filters, hideChatbotTickets, currentUser]);

  // Contadores otimizados - respeitam permissão e estado do showAll
  const { openCount, pendingCount } = useMemo(() => {
    let open = 0;
    let pending = 0;
    
    // Se tem permissão E showAll está ativo, mostra contagem total
    // Caso contrário, mostra apenas os tickets do usuário logado
    const effectiveShowAll = canViewAllTickets && filters.showAll;
    
    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      if (t.resolvido) continue;
      
      const modoAtendimento = (t.modoDeAtendimento || '').toLowerCase();
      const isBot = modoAtendimento === 'bot';
      const isHumano = modoAtendimento === 'atendimento humano';
      
      if (isBot) {
        // Bot agora conta como "aguardando"
        pending++;
      } else if (isHumano) {
        if (t.aceitoPorAdmin) {
          // Para contagem de "open", filtrar por usuário se não tiver showAll ativo
          if (!effectiveShowAll && currentUser) {
            const ticketAdminId = t.adminId || t.adminid;
            // Aceita match com qualquer um dos IDs do usuário
            const matchesUser = ticketAdminId === currentUser.id || ticketAdminId === currentUser.supabase_id;
            if (matchesUser) {
              open++;
            }
          } else {
            open++;
          }
        } else {
          pending++;
        }
      }
    }
    
    return { openCount: open, pendingCount: pending };
  }, [tickets, canViewAllTickets, filters.showAll, currentUser]);

  return {
    filters,
    updateFilter,
    toggleFilter,
    toggleSortOrder,
    clearFilters,
    hasActiveFilters,
    filteredTickets,
    openCount,
    pendingCount
  };
};
