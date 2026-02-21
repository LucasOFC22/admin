import { useState } from 'react';
import { RefreshCw, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { useSupabaseCotacoes } from '@/hooks/useSupabaseCotacoes';
import { useImprovedAsyncOperation } from '@/hooks/useImprovedAsyncOperation';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { CotacoesStats } from './CotacoesStats';
import { CotacoesFilters } from './CotacoesFilters';
import { CotacoesList } from './CotacoesList';

const CotacoesManagement = () => {
  const [filtros, setFiltros] = useState({
    remetente: '',
    destinatario: '',
    status: 'todos',
    id: '',
    emissao_inicio: '',
    emissao_fim: '',
    nro_cte: '',
    id_tomador: '',
    id_tabela_preco: ''
  });
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  
  const { cotacoes, isLoading, stats, refetch } = useSupabaseCotacoes(filtros.status, filtros);
  const { execute: executeRefresh, loading: refreshing } = useImprovedAsyncOperation({
    successMessage: 'Cotações recarregadas com sucesso',
    errorMessage: 'Erro ao recarregar cotações'
  });

  const handleRefresh = async () => {
    await executeRefresh(() => refetch(), {
      context: { filtros, action: 'refresh_cotacoes' }
    });
  };

  const handleFilterChange = (field: string, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      remetente: '',
      destinatario: '',
      status: 'todos',
      id: '',
      emissao_inicio: '',
      emissao_fim: '',
      nro_cte: '',
      id_tomador: '',
      id_tabela_preco: ''
    });
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Gestão de Cotações</h1>
              <p className="text-sm md:text-base text-muted-foreground">Controle e monitore todas as cotações</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setFiltrosAbertos(!filtrosAbertos)}
                variant="outline"
                size="sm"
                className="gap-2 flex-1 sm:flex-none"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${filtrosAbertos ? 'rotate-180' : ''}`} />
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={isLoading || refreshing}
                variant="ghost"
                size="icon"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading || refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6">
        {/* Stats Cards */}
        <CotacoesStats stats={stats} />

        {/* Filtros */}
        <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
          <CollapsibleContent>
            <CotacoesFilters 
              filtros={filtros}
              onFilterChange={handleFilterChange}
              onClearFilters={limparFiltros}
              cotacoesCount={cotacoes.length}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Lista de Cotações */}
        <ErrorBoundary
          fallback={
            <div className="text-center py-8">
              <p className="text-destructive">Erro ao carregar lista de cotações</p>
              <Button onClick={handleRefresh} className="mt-4">
                Tentar Novamente
              </Button>
            </div>
          }
        >
          <CotacoesList 
            cotacoes={cotacoes}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default CotacoesManagement;