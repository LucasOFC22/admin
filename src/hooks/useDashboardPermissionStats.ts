import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { backendService } from '@/services/api/backendService';
import { normalizeContasReceberResponse, calcContasReceberSummary } from '@/utils/contasReceberSummary';

export interface ModuleStats {
  cotacoes?: {
    total: number;
    pendentes: number;
    aprovadas: number;
    trend: number;
  };
  coletas?: {
    total: number;
    pendentes: number;
    realizadas: number;
    trend: number;
  };
  whatsapp?: {
    emAtendimento: number;
    aguardando: number;
    finalizados: number;
    trend: number;
  };
  financeiro?: {
    totalReceber: number;
    valorAtrasado: number;
    qtdAtrasados: number;
    aVencer: number;
    trend: number;
    semanaPassada?: { valorAberto: number; valorAtrasado: number };
    semanaAtual?: { valorAberto: number; valorAtrasado: number };
    proximaSemana?: { valorAberto: number; valorAtrasado: number };
  };
  usuarios?: {
    total: number;
    ativos: number;
    trend: number;
  };
  contatos?: {
    total: number;
    novos: number;
    respondidos: number;
    trend: number;
  };
}

export interface PermissionModules {
  cotacoes: boolean;
  coletas: boolean;
  whatsapp: boolean;
  financeiro: boolean;
  usuarios: boolean;
  contatos: boolean;
}

export interface IndividualLoadingStates {
  cotacoes: boolean;
  coletas: boolean;
  whatsapp: boolean;
  financeiro: boolean;
  usuarios: boolean;
  contatos: boolean;
}

const fetchWhatsappStats = async () => {
  const supabase = requireAuthenticatedClient();
  const { data: chats, error: chatsError } = await supabase
    .from('chats_whatsapp')
    .select('id, resolvido, aceitoporadmin, mododeatendimento, adminid, criadoem');

  if (chatsError) throw chatsError;
  if (!chats) return null;

  const emAtendimento = chats.filter(c => !c.resolvido && c.aceitoporadmin).length;
  // Aguardando = modoDeAtendimento = 'Atendimento Humano' + sem adminid
  const aguardando = chats.filter(c => 
    !c.resolvido && 
    c.mododeatendimento === 'Atendimento Humano' && 
    !c.adminid
  ).length;
  const finalizados = chats.filter(c => c.resolvido).length;

  return { emAtendimento, aguardando, finalizados, trend: 0 };
};

const fetchUsuariosStats = async () => {
  const supabase = requireAuthenticatedClient();
  const { data: usuarios, error: usuariosError } = await supabase
    .from('usuarios')
    .select('id, ativo');

  if (usuariosError) throw usuariosError;
  if (!usuarios) return null;

  const total = usuarios.length;
  const ativos = usuarios.filter(u => u.ativo).length;

  return { total, ativos, trend: 0 };
};

const fetchContatosStats = async () => {
  const supabase = requireAuthenticatedClient();
  const { data: contatos, error: contatosError } = await supabase
    .from('contatos')
    .select('contact_id, status, created_at');

  if (contatosError) throw contatosError;
  if (!contatos) return null;

  const total = contatos.length;
  const novos = contatos.filter(c => c.status === 'novo').length;
  const respondidos = contatos.filter(c => c.status === 'respondido').length;

  return { total, novos, respondidos, trend: 0 };
};

const getWeekDates = () => {
  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 });
  const fimSemana = endOfWeek(hoje, { weekStartsOn: 0 });
  
  // Semana passada
  const inicioSemanaPassada = new Date(inicioSemana);
  inicioSemanaPassada.setDate(inicioSemanaPassada.getDate() - 7);
  const fimSemanaPassada = new Date(fimSemana);
  fimSemanaPassada.setDate(fimSemanaPassada.getDate() - 7);
  
  // Próxima semana
  const inicioProximaSemana = new Date(inicioSemana);
  inicioProximaSemana.setDate(inicioProximaSemana.getDate() + 7);
  const fimProximaSemana = new Date(fimSemana);
  fimProximaSemana.setDate(fimProximaSemana.getDate() + 7);
  
  return {
    hoje: format(hoje, 'yyyy-MM-dd'),
    inicioSemana: format(inicioSemana, 'yyyy-MM-dd'),
    fimSemana: format(fimSemana, 'yyyy-MM-dd'),
    inicioSemanaPassada: format(inicioSemanaPassada, 'yyyy-MM-dd'),
    fimSemanaPassada: format(fimSemanaPassada, 'yyyy-MM-dd'),
    inicioProximaSemana: format(inicioProximaSemana, 'yyyy-MM-dd'),
    fimProximaSemana: format(fimProximaSemana, 'yyyy-MM-dd'),
  };
};

const fetchCotacoesStats = async () => {
  const { inicioSemana, fimSemana } = getWeekDates();

  const response = await backendService.buscarCotacoes({
    emissao_inicio: inicioSemana,
    emissao_fim: fimSemana
  });

  if (!response.success || !response.data) return null;

  const responseData = response.data || [];
  const cotacoes = Array.isArray(responseData) && responseData[0]?.data
    ? responseData[0].data
    : Array.isArray(responseData) ? responseData : [];
  const total = cotacoes.length;
  const pendentes = cotacoes.filter((c: any) => {
    const status = (c.status || '').toUpperCase();
    const vlrTotal = c.vlrTotal ?? c.valor_declarado ?? 0;
    return status === 'PENDENTE' || vlrTotal === 0;
  }).length;
  const aprovadas = cotacoes.filter((c: any) => {
    const status = (c.status || '').toUpperCase();
    return status === 'APROVADA' || status === 'ACEITA' || status === 'FINALIZADA';
  }).length;

  return { total, pendentes, aprovadas, trend: 0 };
};

const fetchColetasStats = async () => {
  const { inicioSemana, fimSemana } = getWeekDates();
  
  const response = await backendService.buscarColetas({ 
    empresas: '2',
    emissao_inicio: inicioSemana,
    emissao_fim: fimSemana
  });

  if (!response.success || !response.data) return null;

  const payload = response.data;
  const items = Array.isArray(payload) 
    ? payload 
    : Array.isArray(payload?.data) 
      ? payload.data 
      : [];
  
  const total = typeof payload?.total === 'number' ? payload.total : items.length;
  // Pendentes = todas que NÃO são "REALIZADA" (ANDAMENTO, etc.)
  const pendentes = items.filter((c: any) => 
    c.situacao !== 'REALIZADA' && c.situacao !== 2
  ).length;
  // Realizadas = situacao === "REALIZADA" ou situacao === 2
  const realizadas = items.filter((c: any) => 
    c.situacao === 'REALIZADA' || c.situacao === 2
  ).length;

  return { total, pendentes, realizadas, trend: 0 };
};

const fetchFinanceiroStats = async () => {
  const { 
    inicioSemana, fimSemana,
    inicioSemanaPassada, fimSemanaPassada,
    inicioProximaSemana, fimProximaSemana
  } = getWeekDates();
  
  const defaultResult = { 
    totalReceber: 0, valorAtrasado: 0, qtdAtrasados: 0, aVencer: 0, trend: 0,
    semanaPassada: { valorAberto: 0, valorAtrasado: 0 },
    semanaAtual: { valorAberto: 0, valorAtrasado: 0 },
    proximaSemana: { valorAberto: 0, valorAtrasado: 0 }
  };
  
  try {
    // Buscar dados das 3 semanas em paralelo
    const [semanaAtualRes, semanaPassadaRes, proximaSemanaRes] = await Promise.all([
      backendService.buscarContasReceber({
        vencimento_inicio: inicioSemana,
        vencimento_fim: fimSemana,
        empresas: '1',
      }),
      backendService.buscarContasReceber({
        vencimento_inicio: inicioSemanaPassada,
        vencimento_fim: fimSemanaPassada,
        empresas: '1',
      }),
      backendService.buscarContasReceber({
        vencimento_inicio: inicioProximaSemana,
        vencimento_fim: fimProximaSemana,
        empresas: '1',
      })
    ]);

    // Processar semana atual
    const titulosAtual = semanaAtualRes.success && semanaAtualRes.data 
      ? normalizeContasReceberResponse(semanaAtualRes.data) 
      : [];
    const summaryAtual = calcContasReceberSummary(titulosAtual);

    // Processar semana passada
    const titulosPassada = semanaPassadaRes.success && semanaPassadaRes.data 
      ? normalizeContasReceberResponse(semanaPassadaRes.data) 
      : [];
    const summaryPassada = calcContasReceberSummary(titulosPassada);

    // Processar próxima semana
    const titulosProxima = proximaSemanaRes.success && proximaSemanaRes.data 
      ? normalizeContasReceberResponse(proximaSemanaRes.data) 
      : [];
    const summaryProxima = calcContasReceberSummary(titulosProxima);

    return {
      totalReceber: summaryAtual.valorEmAberto,
      valorAtrasado: summaryAtual.valorAtrasado,
      qtdAtrasados: summaryAtual.qtdAtrasados,
      aVencer: 0,
      trend: 0,
      semanaPassada: { 
        valorAberto: summaryPassada.valorEmAberto, 
        valorAtrasado: summaryPassada.valorAtrasado 
      },
      semanaAtual: { 
        valorAberto: summaryAtual.valorEmAberto, 
        valorAtrasado: summaryAtual.valorAtrasado 
      },
      proximaSemana: { 
        valorAberto: summaryProxima.valorEmAberto, 
        valorAtrasado: summaryProxima.valorAtrasado 
      }
    };
  } catch {
    return defaultResult;
  }
};

export const useDashboardPermissionStats = () => {
  const { cargoPermissions, hasPermission, isLoadingCargoPermissions } = usePermissionGuard();
  const queryClient = useQueryClient();

  const modules: PermissionModules = {
    cotacoes: hasPermission('admin.cotacoes.visualizar'),
    coletas: hasPermission('admin.coletas.visualizar'),
    whatsapp: hasPermission('admin.whatsapp.visualizar'),
    financeiro: hasPermission('admin.contas-receber.visualizar'),
    usuarios: hasPermission('admin.usuarios.visualizar'),
    contatos: hasPermission('admin.contatos.visualizar'),
  };

  const whatsappQuery = useQuery({
    queryKey: ['dashboard-whatsapp'],
    queryFn: fetchWhatsappStats,
    enabled: modules.whatsapp && !isLoadingCargoPermissions,
    staleTime: 30000,
  });

  const usuariosQuery = useQuery({
    queryKey: ['dashboard-usuarios'],
    queryFn: fetchUsuariosStats,
    enabled: modules.usuarios && !isLoadingCargoPermissions,
    staleTime: 60000,
  });

  const contatosQuery = useQuery({
    queryKey: ['dashboard-contatos'],
    queryFn: fetchContatosStats,
    enabled: modules.contatos && !isLoadingCargoPermissions,
    staleTime: 30000,
  });

  const cotacoesQuery = useQuery({
    queryKey: ['dashboard-cotacoes'],
    queryFn: fetchCotacoesStats,
    enabled: modules.cotacoes && !isLoadingCargoPermissions,
    staleTime: 60000,
  });

  const coletasQuery = useQuery({
    queryKey: ['dashboard-coletas'],
    queryFn: fetchColetasStats,
    enabled: modules.coletas && !isLoadingCargoPermissions,
    staleTime: 60000,
  });

  const financeiroQuery = useQuery({
    queryKey: ['dashboard-financeiro'],
    queryFn: fetchFinanceiroStats,
    enabled: modules.financeiro && !isLoadingCargoPermissions,
    staleTime: 60000,
  });

  const stats: ModuleStats = {
    ...(whatsappQuery.data && { whatsapp: whatsappQuery.data }),
    ...(usuariosQuery.data && { usuarios: usuariosQuery.data }),
    ...(contatosQuery.data && { contatos: contatosQuery.data }),
    ...(cotacoesQuery.data && { cotacoes: cotacoesQuery.data }),
    ...(coletasQuery.data && { coletas: coletasQuery.data }),
    ...(financeiroQuery.data && { financeiro: financeiroQuery.data }),
  };

  const loadingStates: IndividualLoadingStates = {
    whatsapp: whatsappQuery.isLoading,
    usuarios: usuariosQuery.isLoading,
    contatos: contatosQuery.isLoading,
    cotacoes: cotacoesQuery.isLoading,
    coletas: coletasQuery.isLoading,
    financeiro: financeiroQuery.isLoading,
  };

  const isLoading = isLoadingCargoPermissions;

  const refetch = useCallback(() => {
    if (modules.whatsapp) whatsappQuery.refetch();
    if (modules.usuarios) usuariosQuery.refetch();
    if (modules.contatos) contatosQuery.refetch();
    if (modules.cotacoes) cotacoesQuery.refetch();
    if (modules.coletas) coletasQuery.refetch();
    if (modules.financeiro) financeiroQuery.refetch();
  }, [modules, whatsappQuery, usuariosQuery, contatosQuery, cotacoesQuery, coletasQuery, financeiroQuery]);

  const isRefetching = 
    whatsappQuery.isFetching || 
    usuariosQuery.isFetching || 
    contatosQuery.isFetching || 
    cotacoesQuery.isFetching || 
    coletasQuery.isFetching || 
    financeiroQuery.isFetching;

  return {
    stats,
    modules,
    isLoading,
    loadingStates,
    isRefetching,
    error: null,
    refetch
  };
};
