import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Kanban } from "lucide-react";
import { toast } from '@/lib/toast';

import { filaService, Fila } from "@/services/supabase/filaService";
import { chatWhatsAppService, ChatWhatsApp, parseFilas, parseTags } from "@/services/supabase/chatWhatsAppService";
import { KanbanBoard, KanbanLaneData, KanbanCardData, KanbanCardTag } from "@/components/admin/kanban";
import { requireAuthenticatedClient } from "@/config/supabaseAuth";
import { supabase } from "@/config/supabase";
import { useUserFilas } from "@/hooks/useUserFilas";
import { logsWhatsAppService } from "@/services/whatsapp/logsWhatsAppService";
import PermissionGuard from "@/components/admin/permissions/PermissionGuard";


const WhatsAppKanban: React.FC = () => {
  const navigate = useNavigate();
  const [allFilas, setAllFilas] = useState<Fila[]>([]);
  
  // FONTE ÚNICA DE VERDADE: chats como Record<id, chat>
  const [chatsById, setChatsById] = useState<Record<string, ChatWhatsApp>>({});
  
  const tagsMapRef = useRef<Map<number, KanbanCardTag>>(new Map());
  const [tagsMap, setTagsMap] = useState<Map<number, KanbanCardTag>>(new Map());
  const [loading, setLoading] = useState(true);
  
  // Ref para rastrear cards em movimento (para ignorar eventos realtime durante o move)
  const movingCardIdsRef = useRef<Set<string>>(new Set());

  // Usar hook de permissões de filas do usuário
  const { filasPermitidas, hasFilasRestriction, isLoading: isLoadingFilas } = useUserFilas();

  // Filtrar filas baseado nas permissões do usuário
  const filas = useMemo(() => {
    if (!hasFilasRestriction) {
      return allFilas;
    }
    if (filasPermitidas.length === 0) {
      return [];
    }
    return allFilas.filter(fila => filasPermitidas.includes(fila.id));
  }, [allFilas, filasPermitidas, hasFilasRestriction]);

  // Converter chatsById para array quando necessário
  const chats = useMemo(() => Object.values(chatsById), [chatsById]);

  // Converter chat para card (memoizado)
  const chatToCard = useCallback((chat: ChatWhatsApp): KanbanCardData => {
    const tagIds = parseTags(chat.tags || null);
    const chatTags = tagIds
      .map(id => tagsMap.get(id))
      .filter((tag): tag is KanbanCardTag => tag !== undefined);

    const contato = chat.contatos_whatsapp;
    const contactName = contato?.nome || chat.nome || "Sem nome";
    const contactNumber = contato?.telefone || chat.telefone || "";

    return {
      id: String(chat.id),
      ticketId: chat.id,
      uuid: chat.usuarioid,
      contactName,
      contactNumber,
      lastMessage: chat.lastMessage || "",
      updatedAt: chat.atualizadoem,
      unreadMessages: 0,
      userName: undefined,
      channel: "whatsapp",
      tags: chatTags,
      origemCampanhaId: (chat as any).origem_campanha_id || undefined,
      campanhaNome: (chat as any).campanhas_whatsapp?.nome || undefined,
    };
  }, [tagsMap]);

  // LANES DERIVADAS dos chats - Cada chat aparece em APENAS UMA fila (primeira do array)
  const lanes = useMemo((): KanbanLaneData[] => {
    // Filtrar chats baseado nas filas permitidas
    const filteredChats = hasFilasRestriction
      ? chats.filter(chat => {
          const chatFilas = parseFilas(chat.filas);
          if (chatFilas.length === 0) {
            return filasPermitidas.includes(1);
          }
          return chatFilas.some(filaId => filasPermitidas.includes(Number(filaId)));
        })
      : chats;

    // Criar mapa de chat -> fila principal (primeira fila do array ou "sem fila")
    const chatPrimaryLane = new Map<string, string>();
    
    filteredChats.forEach(chat => {
      const chatFilas = parseFilas(chat.filas);
      // Encontrar a primeira fila que existe nas filas disponíveis
      const primaryFila = chatFilas.find(filaId => 
        filas.some(f => f.id.toString() === filaId)
      );
      
      if (primaryFila) {
        chatPrimaryLane.set(String(chat.id), primaryFila);
      }
      // Se não encontrou fila válida, o chat não aparece no board
    });

    // Construir lanes baseado nas filas
    return filas.map((fila) => {
      const laneChats = filteredChats.filter(chat => 
        chatPrimaryLane.get(String(chat.id)) === fila.id.toString()
      );

      return {
        id: fila.id.toString(),
        title: fila.name,
        color: fila.color,
        cards: laneChats.map(chatToCard),
      };
    });
  }, [chats, filas, filasPermitidas, hasFilasRestriction, chatToCard]);

  useEffect(() => {
    fetchFilas();
    fetchTags();
  }, []);

  useEffect(() => {
    if (!isLoadingFilas) {
      fetchChats();
    }
  }, [filas, isLoadingFilas]);

  // Função para buscar um chat completo com dados relacionados
  const fetchSingleChat = useCallback(async (chatId: string) => {
    try {
      const chat = await chatWhatsAppService.getChatById(parseInt(chatId, 10));
      if (chat) {
        setChatsById(prev => ({
          ...prev,
          [chatId]: chat
        }));
      }
    } catch (error) {
      console.error('[Realtime] Erro ao buscar chat:', chatId, error);
    }
  }, []);

  // Supabase Realtime para atualizações em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('kanban-chats-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats_whatsapp'
        },
        async (payload) => {
          console.log('[Realtime] Evento:', payload.eventType, payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedChat = payload.new as ChatWhatsApp;
            const chatId = String(updatedChat.id);
            
            // Ignorar updates de cards que estão sendo movidos localmente
            if (movingCardIdsRef.current.has(chatId)) {
              console.log('[Realtime] Ignorando UPDATE de card em movimento:', chatId);
              return;
            }
            
            // Buscar chat completo com dados relacionados (contatos, lastMessage)
            await fetchSingleChat(chatId);
            
          } else if (payload.eventType === 'INSERT') {
            const newChat = payload.new as ChatWhatsApp;
            const chatId = String(newChat.id);
            // Buscar dados completos para ter lastMessage, contatos, etc
            await fetchSingleChat(chatId);
            
          } else if (payload.eventType === 'DELETE') {
            const deletedId = String((payload.old as any)?.id);
            if (deletedId) {
              setChatsById(prev => {
                const next = { ...prev };
                delete next[deletedId];
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSingleChat]);

  const fetchFilas = async () => {
    try {
      const data = await filaService.getFilas();
      setAllFilas(data);
    } catch (error) {
      console.error('Erro ao buscar filas:', error);
      toast.error('Erro ao carregar filas');
    }
  };

  const fetchTags = async () => {
    try {
      const client = requireAuthenticatedClient();
      const { data, error } = await client
        .from('tags')
        .select('id, name, color');

      if (error) throw error;

      const map = new Map<number, KanbanCardTag>();
      (data || []).forEach(tag => {
        map.set(tag.id, { id: tag.id, name: tag.name, color: tag.color });
      });
      setTagsMap(map);
      tagsMapRef.current = map;
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
    }
  };

  const fetchChats = async () => {
    setLoading(true);
    try {
      const data = await chatWhatsAppService.getChats();
      
      // Converter array para Record<id, chat>
      const byId: Record<string, ChatWhatsApp> = {};
      data.forEach(chat => {
        byId[String(chat.id)] = chat;
      });
      setChatsById(byId);
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      toast.error('Erro ao carregar chats');
    } finally {
      setLoading(false);
    }
  };

  const handleCardMove = useCallback(async (
    cardId: string,
    sourceLaneId: string,
    targetLaneId: string
  ) => {
    console.log('[DnD] Movendo card:', cardId, 'de', sourceLaneId, 'para', targetLaneId);
    
    // Validar que a fila de destino existe
    const targetFilaExists = allFilas.some(f => f.id.toString() === targetLaneId);
    if (!targetFilaExists) {
      console.warn('[DnD] Fila de destino não existe:', targetLaneId);
      toast.error("Solte o card em uma fila válida");
      return;
    }
    
    // Marcar card como em movimento para ignorar eventos realtime
    movingCardIdsRef.current.add(cardId);
    
    // Salvar estado anterior para rollback
    const previousChat = chatsById[cardId];
    if (!previousChat) {
      console.error('[DnD] Chat não encontrado:', cardId);
      movingCardIdsRef.current.delete(cardId);
      return;
    }

    // Calcular novas filas
    let currentFilas = parseFilas(previousChat.filas || null);
    
    // Remove da fila de origem
    currentFilas = currentFilas.filter(id => id !== sourceLaneId);
    
    // Adiciona na fila de destino (no início para ser a fila principal)
    if (!currentFilas.includes(targetLaneId)) {
      currentFilas = [targetLaneId, ...currentFilas];
    }
    
    const newFilasString = JSON.stringify(currentFilas);
    
    // ATUALIZAÇÃO OTIMISTA - Atualiza estado local imediatamente
    setChatsById(prev => ({
      ...prev,
      [cardId]: { 
        ...prev[cardId], 
        filas: newFilasString,
        atualizadoem: new Date().toISOString()
      }
    }));

    try {
      // Persistir no banco
      await chatWhatsAppService.updateChatFilas(parseInt(cardId, 10), currentFilas);
      
      // Registrar log de movimentação
      const sourceFila = allFilas.find(f => f.id.toString() === sourceLaneId);
      const targetFila = allFilas.find(f => f.id.toString() === targetLaneId);
      const contato = previousChat.contatos_whatsapp;
      
      await logsWhatsAppService.registrarLog({
        acao: 'card_movido',
        chat_id: parseInt(cardId, 10),
        detalhes: {
          contato_nome: contato?.nome,
          fila_origem: sourceLaneId,
          fila_origem_nome: sourceFila?.name || 'Sem Fila',
          fila_destino: targetLaneId,
          fila_destino_nome: targetFila?.name || 'Sem Fila'
        }
      });
      
      toast.success("Fila atualizada com sucesso!");
      
    } catch (error) {
      console.error("[DnD] Erro ao mover card:", error);
      
      // ROLLBACK - Restaurar estado anterior
      setChatsById(prev => ({
        ...prev,
        [cardId]: previousChat
      }));
      
      toast.error("Erro ao atualizar fila");
    } finally {
      // Remover da lista de cards em movimento após delay maior
      // (para garantir que eventos realtime atrasados sejam ignorados)
      setTimeout(() => {
        movingCardIdsRef.current.delete(cardId);
        console.log('[DnD] Card removido da lista de movimento:', cardId);
      }, 3000);
    }
  }, [chatsById, allFilas]);

  const handleCardClick = useCallback((card: KanbanCardData) => {
    navigate(`/whatsapp/${card.uuid}`);
  }, [navigate]);

  return (
    <>
      <PermissionGuard 
        permissions="admin.whatsapp-kanban.visualizar"
        showMessage={true}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden bg-muted/30 rounded-lg p-2 sm:p-4 md:p-6 m-2 sm:m-4 md:m-6">
            {loading || isLoadingFilas ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Carregando...</p>
              </div>
            ) : hasFilasRestriction && filas.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Kanban className="h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">Sem acesso a filas</p>
                <p className="text-sm text-center max-w-md">
                  Seu usuário não possui permissão para visualizar nenhuma fila do WhatsApp. 
                  Entre em contato com um administrador para solicitar acesso.
                </p>
              </div>
            ) : lanes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Nenhuma fila encontrada. Crie filas para usar o Kanban.</p>
              </div>
            ) : (
              <KanbanBoard
                lanes={lanes}
                onCardMove={handleCardMove}
                onCardClick={handleCardClick}
              />
            )}
          </div>
        </div>
      </PermissionGuard>
    </>
  );
};

export default WhatsAppKanban;
