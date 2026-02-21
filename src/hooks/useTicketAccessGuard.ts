import { useState, useEffect } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { useUserFilas } from '@/hooks/useUserFilas';

// Função para parsear filas (JSON string para array)
const parseFilas = (filasValue: string | string[] | null | undefined): number[] => {
  if (!filasValue) return [];
  if (Array.isArray(filasValue)) return filasValue.map(Number);
  try {
    const parsed = JSON.parse(filasValue);
    return Array.isArray(parsed) ? parsed.map(Number) : [Number(parsed)];
  } catch {
    return String(filasValue).split(',').filter(Boolean).map(s => Number(s.trim()));
  }
};

/**
 * Hook que verifica se o usuário tem acesso a um ticket específico
 * baseado nas filas permitidas pelo usuário
 */
export const useTicketAccessGuard = (ticketId: string | undefined, chatId?: number) => {
  const { filasPermitidas, hasFilasRestriction, isLoading: isLoadingFilas } = useUserFilas();
  const [hasAccess, setHasAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [ticketFilas, setTicketFilas] = useState<number[]>([]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!ticketId) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // Se não tem restrição de filas, tem acesso a tudo
      if (!hasFilasRestriction) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Se temos chatId numérico, buscar diretamente pelo id do chat
        // Caso contrário, buscar pelo usuarioid (UUID do contato)
        let ticketData;
        const supabase = requireAuthenticatedClient();
        if (chatId && chatId > 0) {
          const { data, error } = await supabase
            .from('chats_whatsapp')
            .select('filas')
            .eq('id', chatId)
            .maybeSingle();
          
          if (error) {
            console.error('Erro ao buscar filas do ticket por chatId:', error);
            setHasAccess(false);
            return;
          }
          ticketData = data;
        } else {
          const { data, error } = await supabase
            .from('chats_whatsapp')
            .select('filas')
            .eq('usuarioid', ticketId)
            .order('atualizadoem', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error('Erro ao buscar filas do ticket por usuarioid:', error);
            setHasAccess(false);
            return;
          }
          ticketData = data;
        }

        // Parsear filas corretamente (pode ser JSON string)
        const filas = parseFilas(ticketData?.filas);
        setTicketFilas(filas);

        // Se o ticket não tem filas, verificar se tem acesso à fila 1 (Sem Fila)
        if (filas.length === 0) {
          setHasAccess(filasPermitidas.includes(1));
          return;
        }

        // Verificar se alguma fila do ticket está nas filas permitidas
        const hasAccessToTicket = filas.some(filaId => 
          filasPermitidas.includes(filaId)
        );

        setHasAccess(hasAccessToTicket);
      } catch (err) {
        console.error('Erro ao verificar acesso ao ticket:', err);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoadingFilas) {
      checkAccess();
    }
  }, [ticketId, chatId, filasPermitidas, hasFilasRestriction, isLoadingFilas]);

  return {
    hasAccess,
    isLoading: isLoading || isLoadingFilas,
    ticketFilas,
    filasPermitidas,
    hasFilasRestriction,
  };
};

/**
 * Função utilitária para verificar se o usuário tem acesso a uma fila específica
 */
export const checkQueueAccess = (queueId: number | string, filasPermitidas: number[], hasFilasRestriction: boolean): boolean => {
  if (!hasFilasRestriction) return true;
  if (filasPermitidas.length === 0) return true;
  return filasPermitidas.includes(Number(queueId));
};

/**
 * Função utilitária para filtrar filas baseado nas permissões
 */
export const filterQueuesByPermission = <T extends { id: number | string }>(
  queues: T[],
  filasPermitidas: number[],
  hasFilasRestriction: boolean
): T[] => {
  if (!hasFilasRestriction || filasPermitidas.length === 0) return queues;
  return queues.filter(queue => filasPermitidas.includes(Number(queue.id)));
};
