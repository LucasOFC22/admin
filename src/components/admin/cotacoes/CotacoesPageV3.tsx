import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Package, AlertCircle, Inbox, Search } from 'lucide-react';
import { useSupabaseCotacoes } from '@/hooks/useSupabaseCotacoes';
import { useDebounce } from '@/hooks/useDebounce';
import SearchBar from './SearchBar';
import StatusFilterBar from './StatusFilterBar';
import CotacaoCard from './CotacaoCard';
import QuoteFiltersSheet from './QuoteFiltersSheet';
import { EditCotacaoModal } from './EditCotacaoModal';
import { CotacaoDetailsModal } from './CotacaoDetailsModal';
import { downloadFromApi } from '@/lib/download-utils';
import { MappedQuote } from '@/utils/cotacaoMapper';
import { motion } from 'framer-motion';

interface FilterOptions {
  id?: string;
  remetente?: string;
  destinatario?: string;
  emissao_inicio?: string;
  emissao_fim?: string;
  nro_orcamento_inicio?: string;
  nro_orcamento_fim?: string;
  nro_cte?: string;
  id_cliente?: string;
  id_remetente?: string;
  id_destinatario?: string;
  id_tomador?: string;
  id_cidade_origem?: string;
  id_cidade_destino?: string;
  id_tabela_preco?: string;
  vlr_total?: string;
  empresas?: string;
  uf_origem?: string;
  uf_destino?: string;
}

export default function CotacoesPageV3() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('todos');
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({});
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState<MappedQuote | null>(null);
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Combine all filters for the hook
  const combinedFilters = {
    ...advancedFilters,
    status: activeStatus !== 'todos' ? activeStatus : undefined,
    ...(debouncedSearch && {
      remetente: debouncedSearch,
      destinatario: debouncedSearch,
      id: debouncedSearch
    })
  };

  const { 
    quotes, 
    isLoading, 
    error, 
    stats, 
    refetch, 
    updateQuoteStatus 
  } = useSupabaseCotacoes(activeStatus, combinedFilters);

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFiltersChange = (filters: FilterOptions) => {
    setAdvancedFilters(filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveStatus('todos');
    setAdvancedFilters({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (cotacao: MappedQuote) => {
    setSelectedCotacao(cotacao);
    setEditModalOpen(true);
  };

  const handlePrint = (id: string) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
    downloadFromApi(
      `${baseUrl}/functions/v1/imprimir-cotacao/${id}`,
      `Cotacao_${id}.pdf`,
      { method: 'POST' }
    );
  };

  const handleViewDetails = (cotacao: MappedQuote) => {
    setSelectedCotacao(cotacao);
    setDetailsModalOpen(true);
  };

  const handleSaveEdit = (data: any) => {
    console.log('Cotação salva:', data);
  };

  const handleSaveSuccess = () => {
    setEditModalOpen(false);
    refetch();
  };

  const handleSearch = () => {
    refetch();
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4 p-5 border border-border/60 rounded-lg bg-card">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-5 w-14" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2 justify-center">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-muted/40 rounded-full p-6 mb-6">
        <Inbox className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhuma cotação encontrada</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {debouncedSearch || Object.values(advancedFilters).some(v => v) || activeStatus !== 'todos'
          ? 'Não encontramos cotações com os filtros aplicados. Tente ajustar sua busca.'
          : 'Ainda não há cotações cadastradas no sistema.'
        }
      </p>
      {(debouncedSearch || Object.values(advancedFilters).some(v => v) || activeStatus !== 'todos') && (
        <Button variant="outline" onClick={handleClearFilters}>
          Limpar Filtros
        </Button>
      )}
    </div>
  );

  // Error state
  const ErrorState = () => (
    <Alert className="border-destructive/50 bg-destructive/5">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/60">
        <div className="p-3 sm:p-4 space-y-3">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold truncate">Cotações</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Gerencie todas as cotações de transporte
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <QuoteFiltersSheet
                filters={advancedFilters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-9 w-9"
                title="Atualizar"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Search Row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por ID, remetente ou destinatário..."
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isLoading}
              size="sm"
              className="h-10 px-4"
            >
              <Search className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Buscar</span>
            </Button>
          </div>

          {/* Status Filter Bar */}
          <StatusFilterBar
            activeStatus={activeStatus}
            onStatusChange={handleStatusChange}
            stats={stats}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-4">
        {error ? (
          <ErrorState />
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : quotes.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
          >
            {quotes.map((cotacao) => (
              <CotacaoCard
                key={cotacao.id}
                cotacao={cotacao}
                onStatusChange={updateQuoteStatus}
                onEdit={handleEdit}
                onPrint={handlePrint}
                onViewDetails={handleViewDetails}
                onChangeStatus={(cotacao) => console.log('Change status:', cotacao.id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <EditCotacaoModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        cotacao={selectedCotacao}
        onSave={handleSaveEdit}
        onSaveSuccess={handleSaveSuccess}
      />

      <CotacaoDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        cotacao={selectedCotacao}
      />
    </div>
  );
}
