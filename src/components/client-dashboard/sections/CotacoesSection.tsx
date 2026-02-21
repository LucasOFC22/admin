import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus, RefreshCw, Loader2, LayoutGrid, Table as TableIcon, Download, Filter, CheckCircle2, Clock, Package } from 'lucide-react';
import { toast } from '@/lib/toast';
import { downloadFromApi } from '@/lib/download-utils';
import { CotacaoCardView } from '../cotacoes/CotacaoCardView';
import { CotacaoCardSkeletonGrid } from '../cotacoes/CotacaoCardSkeleton';
import { CotacaoTableView } from '../cotacoes/CotacaoTableView';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useClientActivityLogger } from '@/hooks/useClientActivityLogger';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useClientDocumentStore } from '@/stores/clientDocumentStore';

const API_URL = 'https://api.fptranscargas.com.br/cotacao';

export const CotacoesSection = () => {
  const navigate = useNavigate();
  const { selectedDocument } = useClientDocumentStore();
  const { canAccess } = usePermissionGuard();
  const { logActivity } = useClientActivityLogger();
  const canExport = canAccess('clientes.cotacoes.exportar');
  const [cotacoes, setCotacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'concluido'>('todos');

  const fetchCotacoes = async () => {
    if (!selectedDocument) {
      return;
    }

    setIsLoading(true);
    await logActivity({
      acao: 'cliente_cotacoes_buscar',
      modulo: 'cliente-cotacoes',
      detalhes: { cnpjcpf: selectedDocument, statusFilter }
    });
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'cotacao',
          acao: 'buscar-cotacao-cliente',
          cnpjcpf: selectedDocument,
        }),
      });

      if (!response.ok) {
        console.error('Erro ao buscar cotações:', response.statusText);
        toast.error('Erro ao buscar cotações');
        setCotacoes([]);
        await logActivity({
          acao: 'cliente_cotacoes_buscar',
          modulo: 'cliente-cotacoes',
          detalhes: { erro: response.statusText }
        });
        return;
      }

      const data = await response.json();
      const rawData = Array.isArray(data?.data) 
        ? data.data.map((item: any) => item.json || item)
        : Array.isArray(data) 
          ? data.map((item: any) => item.json || item)
          : [];
      
      const cotacoesData = rawData.filter((item: any) => 
        item && Object.keys(item).length > 0 && item.idOrcamento
      );
      
      setCotacoes(cotacoesData);
      if (cotacoesData.length > 0) {
        toast.success(`${cotacoesData.length} cotação(ões) encontrada(s)`);
      } else {
        toast.info('Nenhuma cotação encontrada');
      }
      await logActivity({
        acao: 'cliente_cotacoes_visualizar',
        modulo: 'cliente-cotacoes',
        detalhes: { total_cotacoes: cotacoesData.length, statusFilter }
      });
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      toast.error('Erro ao buscar cotações');
      setCotacoes([]);
      await logActivity({
        acao: 'cliente_cotacoes_buscar',
        modulo: 'cliente-cotacoes',
        detalhes: { erro: String(error) }
      });
    } finally {
      setIsLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    if (selectedDocument) {
      fetchCotacoes();
    }
  }, [selectedDocument]);

  const handlePrint = (cotacao: any) => {
    downloadFromApi(
      `https://kong.fptranscargas.com.br/functions/v1/imprimir-cotacao/${cotacao.idOrcamento}`,
      `Cotacao_${cotacao.idOrcamento}.pdf`,
      { method: 'POST' }
    );
  };

  const getCotacaoStatus = (cotacao: any) => {
    return cotacao.vlrTotal === 0 ? 'pendente' : 'concluido';
  };

  const stats = {
    total: cotacoes.length,
    pendentes: cotacoes.filter(c => getCotacaoStatus(c) === 'pendente').length,
    concluidas: cotacoes.filter(c => getCotacaoStatus(c) === 'concluido').length,
  };

  const filteredCotacoes = cotacoes.filter((cotacao) => {
    if (statusFilter === 'todos') return true;
    return getCotacaoStatus(cotacao) === statusFilter;
  });

  const filterOptions = [
    { id: 'todos', label: 'Todas', count: stats.total },
    { id: 'pendente', label: 'Pendentes', count: stats.pendentes },
    { id: 'concluido', label: 'Concluídas', count: stats.concluidas },
  ];

  if (initialLoad && isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-12 bg-muted rounded" />
                  <div className="h-6 w-8 bg-muted rounded" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Cards Skeleton */}
        <CotacaoCardSkeletonGrid count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Pendentes', value: stats.pendentes, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Concluídas', value: stats.concluidas, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-2.5 sm:p-4 rounded-xl border border-border bg-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className={cn("text-lg sm:text-2xl font-bold", stat.color)}>{stat.value}</p>
              </div>
              <div className={cn("w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("h-3.5 w-3.5 sm:h-5 sm:w-5", stat.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setStatusFilter(opt.id as any);
                logActivity({
                  acao: 'cliente_cotacao_filtrar',
                  modulo: 'cliente-cotacoes',
                  detalhes: { filtro: opt.id }
                });
              }}
              className={cn(
                "px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap",
                statusFilter === opt.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted active:scale-95"
              )}
            >
              {opt.label}
              <span className={cn(
                "ml-1 sm:ml-1.5 px-1 sm:px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px]",
                statusFilter === opt.id ? "bg-primary-foreground/20" : "bg-background"
              )}>
                {opt.count}
              </span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto">
          {/* View Toggle */}
          <div className="hidden xs:flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
            <button
              onClick={() => {
                setViewMode('card');
                logActivity({
                  acao: 'cliente_cotacao_mudar_visualizacao',
                  modulo: 'cliente-cotacoes',
                  detalhes: { modo: 'card' }
                });
              }}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'card' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('table');
                logActivity({
                  acao: 'cliente_cotacao_mudar_visualizacao',
                  modulo: 'cliente-cotacoes',
                  detalhes: { modo: 'table' }
                });
              }}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'table' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TableIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          <Button 
            onClick={async () => {
              await logActivity({
                acao: 'cliente_cotacoes_refresh',
                modulo: 'cliente-cotacoes',
                detalhes: { manual: true }
              });
              fetchCotacoes();
            }} 
            variant="ghost" 
            size="sm"
            disabled={isLoading || !selectedDocument}
            className="text-muted-foreground h-8 sm:h-9 px-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>

          {canExport && cotacoes.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3 text-xs"
              onClick={async () => {
                await logActivity({
                  acao: 'cliente_cotacao_exportar',
                  modulo: 'cliente-cotacoes',
                  detalhes: { total: cotacoes.length }
                });
              }}
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          )}

          <Button 
            onClick={async () => {
              await logActivity({
                acao: 'cliente_quick_action_nova_cotacao',
                modulo: 'cliente-cotacoes',
                detalhes: { origem: 'cotacoes_section' }
              });
              navigate('/cotacao');
            }} 
            size="sm"
            className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Nova</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <CotacaoCardSkeletonGrid count={6} />
        ) : cotacoes.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/20">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="font-medium text-foreground mb-1">Nenhuma cotação encontrada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Solicite uma nova cotação para começar
            </p>
            <Button 
              size="sm" 
              onClick={() => navigate('/cotacao')} 
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Cotação
            </Button>
          </div>
        ) : filteredCotacoes.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/20">
            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="font-medium text-foreground mb-1">Nenhuma cotação encontrada</p>
            <p className="text-sm text-muted-foreground">
              Nenhuma cotação corresponde aos filtros selecionados
            </p>
          </div>
        ) : viewMode === 'card' ? (
          <CotacaoCardView cotacoes={filteredCotacoes} onPrint={handlePrint} />
        ) : (
          <CotacaoTableView cotacoes={filteredCotacoes} onPrint={handlePrint} />
        )}
      </motion.div>
    </div>
  );
};
