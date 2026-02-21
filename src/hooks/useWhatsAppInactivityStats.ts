import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { startOfDay, startOfWeek, startOfMonth, subDays, format } from 'date-fns';

export interface InactivityStats {
  totalHoje: number;
  totalSemana: number;
  totalMes: number;
  mediaTempoInatividade: number; // em minutos
  historicoSemanal: { data: string; total: number }[];
}

export interface InactiveChat {
  id: number;
  contatoNome: string;
  contatoTelefone: string;
  encerradoEm: string;
  atendenteNome: string | null;
  tempoInatividade: number; // minutos
}

export interface UseWhatsAppInactivityStatsResult {
  stats: InactivityStats;
  chats: InactiveChat[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const fetchInactivityStats = async (): Promise<{ stats: InactivityStats; chats: InactiveChat[] }> => {
  const supabase = requireAuthenticatedClient();
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const monthStart = startOfMonth(now).toISOString();

  // Buscar todos os chats encerrados por inatividade no mês
  const { data: chatsData, error: chatsError } = await supabase
    .from('chats_whatsapp')
    .select('id, usuarioid, adminid, encerradoem, last_customer_message_at, criadoem')
    .eq('closed_by_inactivity', true)
    .gte('encerradoem', monthStart)
    .order('encerradoem', { ascending: false });

  if (chatsError) {
    throw new Error(chatsError.message);
  }

  const allChats = chatsData || [];

  // Calcular totais
  const totalHoje = allChats.filter(c => c.encerradoem && c.encerradoem >= todayStart).length;
  const totalSemana = allChats.filter(c => c.encerradoem && c.encerradoem >= weekStart).length;
  const totalMes = allChats.length;

  // Calcular média de tempo de inatividade
  let totalMinutosInatividade = 0;
  let countComTempo = 0;

  allChats.forEach(chat => {
    if (chat.last_customer_message_at && chat.encerradoem) {
      const lastMessage = new Date(chat.last_customer_message_at).getTime();
      const closedAt = new Date(chat.encerradoem).getTime();
      const diffMinutes = Math.round((closedAt - lastMessage) / (1000 * 60));
      if (diffMinutes > 0 && diffMinutes < 1440) { // Máximo 24h
        totalMinutosInatividade += diffMinutes;
        countComTempo++;
      }
    }
  });

  const mediaTempoInatividade = countComTempo > 0 
    ? Math.round(totalMinutosInatividade / countComTempo) 
    : 0;

  // Histórico dos últimos 7 dias
  const historicoSemanal: { data: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(now, i);
    const dayStart = startOfDay(day).toISOString();
    const dayEnd = startOfDay(subDays(now, i - 1)).toISOString();
    
    const count = allChats.filter(c => 
      c.encerradoem && c.encerradoem >= dayStart && c.encerradoem < dayEnd
    ).length;

    historicoSemanal.push({
      data: format(day, 'dd/MM'),
      total: count
    });
  }

  // Buscar dados dos contatos e atendentes
  const usuarioIds = [...new Set(allChats.map(c => c.usuarioid).filter(Boolean))];
  const adminIds = [...new Set(allChats.map(c => c.adminid).filter(Boolean))];

  // Buscar contatos
  const contatosMap: Record<string, { nome: string; telefone: string }> = {};
  if (usuarioIds.length > 0) {
    const { data: contatosData } = await supabase
      .from('contatos_whatsapp')
      .select('id, nome, telefone')
      .in('id', usuarioIds);

    if (contatosData) {
      contatosData.forEach(c => {
        contatosMap[c.id] = { nome: c.nome || 'Desconhecido', telefone: c.telefone || '' };
      });
    }
  }

  // Buscar atendentes
  const atendentesMap: Record<string, string> = {};
  if (adminIds.length > 0) {
    const { data: atendentesData } = await supabase
      .from('usuarios')
      .select('id, nome')
      .in('id', adminIds);

    if (atendentesData) {
      atendentesData.forEach(a => {
        atendentesMap[a.id] = a.nome || 'Atendente';
      });
    }
  }

  // Montar lista de chats com detalhes (últimos 50)
  const chatsDetalhados: InactiveChat[] = allChats.slice(0, 50).map(chat => {
    const contato = contatosMap[chat.usuarioid] || { nome: 'Desconhecido', telefone: '' };
    const atendenteNome = chat.adminid ? (atendentesMap[chat.adminid] || null) : null;

    let tempoInatividade = 0;
    if (chat.last_customer_message_at && chat.encerradoem) {
      const lastMessage = new Date(chat.last_customer_message_at).getTime();
      const closedAt = new Date(chat.encerradoem).getTime();
      tempoInatividade = Math.round((closedAt - lastMessage) / (1000 * 60));
    }

    return {
      id: chat.id,
      contatoNome: contato.nome,
      contatoTelefone: contato.telefone,
      encerradoEm: chat.encerradoem || '',
      atendenteNome,
      tempoInatividade
    };
  });

  return {
    stats: {
      totalHoje,
      totalSemana,
      totalMes,
      mediaTempoInatividade,
      historicoSemanal
    },
    chats: chatsDetalhados
  };
};

export const useWhatsAppInactivityStats = (): UseWhatsAppInactivityStatsResult => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['whatsapp-inactivity-stats'],
    queryFn: fetchInactivityStats,
    refetchInterval: 60000, // Atualiza a cada minuto
    staleTime: 30000
  });

  return {
    stats: data?.stats || {
      totalHoje: 0,
      totalSemana: 0,
      totalMes: 0,
      mediaTempoInatividade: 0,
      historicoSemanal: []
    },
    chats: data?.chats || [],
    isLoading,
    error: error as Error | null,
    refetch
  };
};
