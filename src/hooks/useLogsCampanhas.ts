/**
 * Hook para gerenciar logs de campanhas WhatsApp
 * Integra com a tabela logs_campanhas
 */

import { useState, useCallback, useEffect } from 'react';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';

// Helper para obter cliente Supabase autenticado
const getSupabase = () => requireAuthenticatedClient();

// Tipos de eventos possíveis
export const TIPOS_EVENTO = [
  { value: 'campanha_criada', label: 'Campanha Criada', category: 'campanha', color: 'bg-blue-500' },
  { value: 'campanha_editada', label: 'Campanha Editada', category: 'campanha', color: 'bg-blue-400' },
  { value: 'campanha_excluida', label: 'Campanha Excluída', category: 'campanha', color: 'bg-red-500' },
  { value: 'campanha_iniciada', label: 'Campanha Iniciada', category: 'campanha', color: 'bg-green-500' },
  { value: 'campanha_pausada', label: 'Campanha Pausada', category: 'campanha', color: 'bg-yellow-500' },
  { value: 'campanha_retomada', label: 'Campanha Retomada', category: 'campanha', color: 'bg-green-400' },
  { value: 'campanha_cancelada', label: 'Campanha Cancelada', category: 'campanha', color: 'bg-red-400' },
  { value: 'campanha_concluida', label: 'Campanha Concluída', category: 'campanha', color: 'bg-emerald-500' },
  { value: 'contatos_adicionados', label: 'Contatos Adicionados', category: 'contato', color: 'bg-indigo-500' },
  { value: 'contatos_removidos', label: 'Contatos Removidos', category: 'contato', color: 'bg-indigo-400' },
  { value: 'mensagem_enviando', label: 'Mensagem Enviando', category: 'mensagem', color: 'bg-blue-300' },
  { value: 'mensagem_enviada', label: 'Mensagem Enviada', category: 'mensagem', color: 'bg-blue-500' },
  { value: 'mensagem_entregue', label: 'Mensagem Entregue', category: 'mensagem', color: 'bg-green-500' },
  { value: 'mensagem_lida', label: 'Mensagem Lida', category: 'mensagem', color: 'bg-emerald-600' },
  { value: 'mensagem_erro', label: 'Erro de Mensagem', category: 'erro', color: 'bg-red-500' },
  { value: 'mensagem_falha', label: 'Falha de Mensagem', category: 'erro', color: 'bg-red-700' },
  { value: 'reenvio_solicitado', label: 'Reenvio Solicitado', category: 'mensagem', color: 'bg-orange-500' },
  { value: 'webhook_recebido', label: 'Webhook Recebido', category: 'sistema', color: 'bg-purple-500' },
  { value: 'erro_sistema', label: 'Erro de Sistema', category: 'erro', color: 'bg-red-600' },
  { value: 'alerta', label: 'Alerta', category: 'sistema', color: 'bg-yellow-600' },
] as const;

export type TipoEvento = typeof TIPOS_EVENTO[number]['value'];

export interface LogCampanha {
  id: string;
  campanha_id: string | null;
  contato_id: string | null;
  usuario_id: string | null;
  conexao_id: string | null;
  tipo_evento: string;
  acao: string | null;
  status_anterior: string | null;
  status_novo: string | null;
  telefone: string | null;
  message_id: string | null;
  template_name: string | null;
  erro_codigo: string | null;
  erro_mensagem: string | null;
  erro_detalhes: Record<string, unknown> | null;
  total_contatos: number;
  enviados: number;
  entregues: number;
  lidos: number;
  erros: number;
  dados_extra: Record<string, unknown>;
  ip_origem: string | null;
  user_agent: string | null;
  duracao_ms: number | null;
  created_at: string;
  data_evento: string;
  // Relacionamentos
  campanha?: { nome: string } | null;
  conexao?: { nome: string } | null;
}

export interface LogsFilters {
  campanha_id?: string;
  tipo_evento?: string;
  categoria?: string;
  telefone?: string;
  startDate: string;
  endDate: string;
}

export interface LogsStats {
  total: number;
  por_tipo: Record<string, number>;
  por_categoria: Record<string, number>;
  erros: number;
  sucesso: number;
}

interface UseLogsCampanhasResult {
  logs: LogCampanha[];
  totalLogs: number;
  loading: boolean;
  stats: LogsStats;
  campanhas: Array<{ id: string; nome: string }>;
  filters: LogsFilters;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setFilters: (filters: Partial<LogsFilters>) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => Promise<void>;
  exportCSV: () => void;
}

export function useLogsCampanhas(): UseLogsCampanhasResult {
  const [logs, setLogs] = useState<LogCampanha[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [campanhas, setCampanhas] = useState<Array<{ id: string; nome: string }>>([]);
  const [stats, setStats] = useState<LogsStats>({
    total: 0,
    por_tipo: {},
    por_categoria: {},
    erros: 0,
    sucesso: 0,
  });

  const [filters, setFiltersState] = useState<LogsFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const setFilters = useCallback((newFilters: Partial<LogsFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Carregar campanhas para o filtro
  const loadCampanhas = useCallback(async () => {
    const { data } = await getSupabase()
      .from('campanhas_whatsapp')
      .select('id, nome')
      .order('created_at', { ascending: false });
    setCampanhas(data || []);
  }, []);

  // Carregar logs
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = getSupabase()
        .from('logs_campanhas')
        .select(`
          *,
          campanha:campanhas_whatsapp(nome),
          conexao:conexoes(nome)
        `, { count: 'exact' })
        .gte('created_at', `${filters.startDate}T00:00:00`)
        .lte('created_at', `${filters.endDate}T23:59:59`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.campanha_id) {
        query = query.eq('campanha_id', filters.campanha_id);
      }
      if (filters.tipo_evento) {
        query = query.eq('tipo_evento', filters.tipo_evento);
      }
      if (filters.telefone) {
        query = query.ilike('telefone', `%${filters.telefone}%`);
      }
      if (filters.categoria) {
        const tiposCategoria = TIPOS_EVENTO
          .filter(t => t.category === filters.categoria)
          .map(t => t.value);
        if (tiposCategoria.length > 0) {
          query = query.in('tipo_evento', tiposCategoria);
        }
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setLogs(data || []);
      setTotalLogs(count || 0);

      // Calcular stats dos logs carregados
      const newStats: LogsStats = {
        total: count || 0,
        por_tipo: {},
        por_categoria: {},
        erros: 0,
        sucesso: 0,
      };

      (data || []).forEach(log => {
        // Contagem por tipo
        newStats.por_tipo[log.tipo_evento] = (newStats.por_tipo[log.tipo_evento] || 0) + 1;
        
        // Contagem por categoria
        const tipoConfig = TIPOS_EVENTO.find(t => t.value === log.tipo_evento);
        if (tipoConfig) {
          newStats.por_categoria[tipoConfig.category] = (newStats.por_categoria[tipoConfig.category] || 0) + 1;
        }

        // Erros vs sucesso
        if (log.tipo_evento.includes('erro') || log.tipo_evento.includes('falha')) {
          newStats.erros++;
        } else if (log.tipo_evento.includes('enviada') || log.tipo_evento.includes('entregue') || log.tipo_evento.includes('lida')) {
          newStats.sucesso++;
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs de campanhas');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  // Exportar para CSV
  const exportCSV = useCallback(() => {
    const csvContent = [
      ['Data/Hora', 'Campanha', 'Tipo Evento', 'Ação', 'Status Anterior', 'Status Novo', 'Telefone', 'Template', 'Erro', 'Total Contatos', 'Enviados', 'Entregues', 'Lidos', 'Erros'].join(';'),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.campanha?.nome || '-',
        log.tipo_evento,
        log.acao || '-',
        log.status_anterior || '-',
        log.status_novo || '-',
        log.telefone || '-',
        log.template_name || '-',
        log.erro_mensagem || '-',
        log.total_contatos,
        log.enviados,
        log.entregues,
        log.lidos,
        log.erros
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `logs_campanhas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Logs exportados com sucesso!');
  }, [logs]);

  useEffect(() => {
    loadCampanhas();
  }, [loadCampanhas]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return {
    logs,
    totalLogs,
    loading,
    stats,
    campanhas,
    filters,
    currentPage,
    pageSize,
    totalPages: Math.ceil(totalLogs / pageSize),
    setFilters,
    setCurrentPage,
    setPageSize: handleSetPageSize,
    refresh: loadLogs,
    exportCSV,
  };
}
