import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Package, AlertCircle, Inbox, Filter, Search, RotateCcw, UserSearch, Eye, Pencil, Printer, Settings, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useCotacoesPendentes } from '@/hooks/useCotacoesPendentes';
import { useSupabaseCotacoes } from '@/hooks/useSupabaseCotacoes.ts';
import { useDebounce } from '@/hooks/useDebounce.ts';
import { backendService } from '@/services/api/backendService';
import { toast } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CotacaoCard from '@/components/admin/cotacoes/CotacaoCard';
import { EditCotacaoModal } from '@/components/admin/cotacoes/EditCotacaoModal';
import { CotacaoDetailsModal } from '@/components/admin/cotacoes/CotacaoDetailsModal';
import { SelectRegisterModal } from '@/components/modals/SelectRegisterModal';
import { SelectTabelaPrecoModal, TabelaPreco } from '@/components/modals/SelectTabelaPrecoModal';
import { downloadFromApi } from '@/lib/download-utils';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { DateShortcuts } from '@/components/ui/date-shortcuts';
import { MappedQuote } from '@/utils/cotacaoMapper';

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

interface SearchResult {
  idOrcamento: number;
  emissao: string;
  nroOrcamento: number;
  solicitante: string;
  cidadeOrigem: string;
  cidadeDestino: string;
  peso: number;
  vlrTotal: number;
  ufDestino: string;
  ufOrigem?: string;
  status: string;
  statusInterno: string;
  remetenteNome: string;
  destinatarioNome: string;
}

// Função para mapear SearchResult para MappedQuote
const mapSearchResultToMappedQuote = (result: SearchResult): MappedQuote => {
  return {
    id: String(result.idOrcamento),
    quoteId: String(result.nroOrcamento).substring(0, 8),
    senderName: result.remetenteNome || result.solicitante || 'N/A',
    senderDocument: 'N/A',
    recipientName: result.destinatarioNome || 'N/A',
    recipientDocument: 'N/A',
    origin: `${result.cidadeOrigem}, ${result.ufOrigem || 'N/A'}`,
    destination: `${result.cidadeDestino}, ${result.ufDestino}`,
    cargoType: 'N/A',
    weight: `${result.peso} kg`,
    value: result.vlrTotal,
    status: result.status,
    createdAt: new Date(result.emissao).toLocaleDateString('pt-BR'),
    validUntil: 'N/A',
    criadoEm: result.emissao,
    contato: {
      nome: result.solicitante || 'N/A',
      email: 'N/A',
      telefone: undefined,
    },
    remetente: {
      nome: result.remetenteNome || 'N/A',
      documento: 'N/A',
      endereco: {
        rua: 'N/A',
        numero: 'N/A',
        cidade: result.cidadeOrigem || 'N/A',
        estado: result.ufOrigem || 'N/A',
        cep: 'N/A',
      },
    },
    destinatario: {
      nome: result.destinatarioNome || 'N/A',
      documento: 'N/A',
      endereco: {
        rua: 'N/A',
        numero: 'N/A',
        cidade: result.cidadeDestino || 'N/A',
        estado: result.ufDestino || 'N/A',
        cep: 'N/A',
      },
    },
    carga: {
      descricao: 'N/A',
      peso: result.peso,
      valorDeclarado: result.vlrTotal,
    },
  };
};

const CotacoesContent = () => {
  const { logActivity } = useActivityLogger();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('todos');
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({});

  // Preencher filtro ao vir da notificação
  useEffect(() => {
    const orcamento = searchParams.get('orcamento');
    if (orcamento) {
      setAdvancedFilters(prev => ({ ...prev, id: orcamento }));
      // Limpar o param da URL para não reprocessar
      searchParams.delete('orcamento');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Estados dos modais de cliente
  const [remetenteModalOpen, setRemetenteModalOpen] = useState(false);
  const [destinatarioModalOpen, setDestinatarioModalOpen] = useState(false);
  const [tabelaPrecoModalOpen, setTabelaPrecoModalOpen] = useState(false);
  const [remetenteNome, setRemetenteNome] = useState('');
  const [destinatarioNome, setDestinatarioNome] = useState('');
  const [tabelaPrecoNome, setTabelaPrecoNome] = useState('');
  
  // Estados dos modais de cotação
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState<MappedQuote | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

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
    refetch, 
    updateQuoteStatus 
  } = useSupabaseCotacoes(activeStatus, combinedFilters);

  const { data: cotacoesPendentes = [] } = useCotacoesPendentes();
  const [prioridadeFilter, setPrioridadeFilter] = useState<'todos' | 'urgente' | 'medio' | 'suave'>('todos');

  const prioridadeStats = {
    urgente: cotacoesPendentes.filter(c => c.prioridade === 'urgente').length,
    medio: cotacoesPendentes.filter(c => c.prioridade === 'medio').length,
    suave: cotacoesPendentes.filter(c => c.prioridade === 'suave').length,
  };

  const handlePrioridadeClick = (prioridade: 'urgente' | 'medio' | 'suave') => {
    setPrioridadeFilter(prev => prev === prioridade ? 'todos' : prioridade);
  };

  // Filtrar quotes por prioridade quando filtro ativo
  const pendentesIds = new Set(
    prioridadeFilter !== 'todos' 
      ? cotacoesPendentes.filter(c => c.prioridade === prioridadeFilter).map(c => c.id)
      : []
  );
  const filteredQuotes = prioridadeFilter === 'todos'
    ? quotes
    : quotes.filter(q => pendentesIds.has(q.id));

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    logActivity({
      acao: 'cotacoes_filtro_status_alterado',
      modulo: 'cotacoes',
      detalhes: { status: status }
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveStatus('todos');
    setAdvancedFilters({});
    setRemetenteNome('');
    setDestinatarioNome('');
    setSearchResults([]);
    setShowSearchResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleBuscar = async () => {
    try {
      setIsSearching(true);
      
      await logActivity({
        acao: 'cotacoes_busca_avancada_realizada',
        modulo: 'cotacoes',
        detalhes: {
          filtros: advancedFilters,
          status: activeStatus
        }
      });
      
      const filtrosLimpos: Record<string, any> = {};
      
      if (advancedFilters.id) filtrosLimpos.id = advancedFilters.id;
      if (advancedFilters.nro_orcamento_inicio) filtrosLimpos.nro_orcamento_inicio = advancedFilters.nro_orcamento_inicio;
      if (advancedFilters.nro_orcamento_fim) filtrosLimpos.nro_orcamento_fim = advancedFilters.nro_orcamento_fim;
      if (advancedFilters.id_remetente) filtrosLimpos.id_remetente = advancedFilters.id_remetente;
      if (advancedFilters.id_destinatario) filtrosLimpos.id_destinatario = advancedFilters.id_destinatario;
      if (advancedFilters.id_cidade_origem) filtrosLimpos.id_cidade_origem = advancedFilters.id_cidade_origem;
      if (advancedFilters.id_cidade_destino) filtrosLimpos.id_cidade_destino = advancedFilters.id_cidade_destino;
      if (advancedFilters.uf_origem) filtrosLimpos.uf_origem = advancedFilters.uf_origem;
      if (advancedFilters.uf_destino) filtrosLimpos.uf_destino = advancedFilters.uf_destino;
      if (advancedFilters.vlr_total) filtrosLimpos.vlr_total = advancedFilters.vlr_total;
      if (activeStatus && activeStatus !== 'todos') filtrosLimpos.status = activeStatus;
      if (advancedFilters.emissao_inicio) filtrosLimpos.emissao_inicio = advancedFilters.emissao_inicio;
      if (advancedFilters.emissao_fim) filtrosLimpos.emissao_fim = advancedFilters.emissao_fim;
      if (advancedFilters.nro_cte) filtrosLimpos.nro_cte = advancedFilters.nro_cte;
      if (advancedFilters.id_tomador) filtrosLimpos.id_tomador = advancedFilters.id_tomador;
      if (advancedFilters.id_tabela_preco) filtrosLimpos.id_tabela_preco = advancedFilters.id_tabela_preco;
      if (advancedFilters.remetente) filtrosLimpos.remetente = advancedFilters.remetente;
      if (advancedFilters.destinatario) filtrosLimpos.destinatario = advancedFilters.destinatario;

      const response = await backendService.buscarCotacoes(filtrosLimpos);
      
      if (response.success && response.data) {
        const responseData = Array.isArray(response.data) ? response.data : [];
        const data = (responseData.length > 0 && responseData[0]?.data) || [];
        
        setSearchResults(data);
        setShowSearchResults(true);
        
        await logActivity({
          acao: 'cotacoes_busca_sucesso',
          modulo: 'cotacoes',
          detalhes: {
            total_resultados: data.length,
            filtros: filtrosLimpos
          }
        });
        
        toast.default(`${data.length} cotações encontradas`);
      } else {
        setSearchResults([]);
        setShowSearchResults(true);
        toast.info('Nenhuma cotação encontrada');
      }
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      setSearchResults([]);
      toast.error('Erro ao buscar cotações', {
        description: 'Não foi possível completar a busca'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePreviewCotacao = async (idOrcamento: number) => {
    await logActivity({
      acao: 'cotacao_pdf_download',
      modulo: 'cotacoes',
      detalhes: { orcamento_id: idOrcamento }
    });
    
    downloadFromApi(
      `https://kong.fptranscargas.com.br/functions/v1/imprimir-cotacao/${idOrcamento}`,
      `cotacao-${idOrcamento}.pdf`,
      { method: 'POST' }
    );
  };

  const handleEdit = (cotacao: MappedQuote) => {
    setSelectedCotacao(cotacao);
    setEditModalOpen(true);
  };

  const handlePrint = (id: string) => {
    handlePreviewCotacao(Number(id));
  };

  const handleViewDetails = (cotacao: MappedQuote) => {
    setSelectedCotacao(cotacao);
    setDetailsModalOpen(true);
  };

  const handleSaveEdit = (data: any) => {
    console.log('Saving cotacao:', data);
    setEditModalOpen(false);
    refetch();
  };

  const handleChangeStatus = (cotacao: MappedQuote) => {
    toast.info(`Alterar status da cotação #${cotacao.id}`);
    // TODO: Implementar modal de alteração de status
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4 p-6 border rounded-lg">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-muted/30 rounded-full p-6 mb-6">
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
    <PermissionGuard 
      permissions="admin.cotacoes.visualizar"
      showMessage={true}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20"
      >
        {/* Header */}
        <div className="bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm">
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="bg-primary/10 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl font-bold truncate">Cotações</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    Gerencie todas as cotações de transporte
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="hover:bg-muted/80 flex-shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} sm:mr-2`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Prioridade - Cotações sem valor */}
        {cotacoesPendentes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mx-3 sm:mx-4 mt-3 sm:mt-4">
            <Card 
              className={`p-4 border-l-4 border-l-red-500 cursor-pointer transition-all hover:shadow-md ${prioridadeFilter === 'urgente' ? 'ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20' : ''}`}
              onClick={() => handlePrioridadeClick('urgente')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Urgente (&gt;48h)</p>
                  <p className="text-2xl font-bold text-red-600">{prioridadeStats.urgente}</p>
                </div>
              </div>
            </Card>
            <Card 
              className={`p-4 border-l-4 border-l-yellow-500 cursor-pointer transition-all hover:shadow-md ${prioridadeFilter === 'medio' ? 'ring-2 ring-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' : ''}`}
              onClick={() => handlePrioridadeClick('medio')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Médio (24-48h)</p>
                  <p className="text-2xl font-bold text-yellow-600">{prioridadeStats.medio}</p>
                </div>
              </div>
            </Card>
            <Card 
              className={`p-4 border-l-4 border-l-green-500 cursor-pointer transition-all hover:shadow-md ${prioridadeFilter === 'suave' ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20' : ''}`}
              onClick={() => handlePrioridadeClick('suave')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Suave (&lt;24h)</p>
                  <p className="text-2xl font-bold text-green-600">{prioridadeStats.suave}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filtros Fixos */}
        <Card className="m-3 sm:m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grid de Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>ID da Cotação</Label>
                <Input
                  placeholder="Digite o ID..."
                  value={advancedFilters.id || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, id: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Nº Orçamento Início</Label>
                <Input
                  placeholder="Número inicial"
                  value={advancedFilters.nro_orcamento_inicio || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, nro_orcamento_inicio: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Nº Orçamento Fim</Label>
                <Input
                  placeholder="Número final"
                  value={advancedFilters.nro_orcamento_fim || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, nro_orcamento_fim: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Remetente</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={remetenteNome || "Selecionar remetente..."}
                    value={remetenteNome}
                    readOnly
                    className="flex-1 cursor-pointer"
                    onClick={() => setRemetenteModalOpen(true)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setRemetenteModalOpen(true)}
                  >
                    <UserSearch className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Destinatário</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={destinatarioNome || "Selecionar destinatário..."}
                    value={destinatarioNome}
                    readOnly
                    className="flex-1 cursor-pointer"
                    onClick={() => setDestinatarioModalOpen(true)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDestinatarioModalOpen(true)}
                  >
                    <UserSearch className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ID Cidade Origem</Label>
                <Input
                  placeholder="ID da cidade origem"
                  value={advancedFilters.id_cidade_origem || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, id_cidade_origem: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>ID Cidade Destino</Label>
                <Input
                  placeholder="ID da cidade destino"
                  value={advancedFilters.id_cidade_destino || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, id_cidade_destino: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>UF Origem</Label>
                <Input
                  placeholder="Ex: SP, RJ, MG"
                  maxLength={2}
                  value={advancedFilters.uf_origem || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, uf_origem: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="space-y-2">
                <Label>UF Destino</Label>
                <Input
                  placeholder="Ex: SP, RJ, MG"
                  maxLength={2}
                  value={advancedFilters.uf_destino || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, uf_destino: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Total</Label>
                <Input
                  type="number"
                  placeholder="Valor total"
                  value={advancedFilters.vlr_total || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, vlr_total: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={activeStatus} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Emissão (Início)</Label>
                <Input
                  type="date"
                  value={advancedFilters.emissao_inicio || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, emissao_inicio: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Emissão (Fim)</Label>
                <Input
                  type="date"
                  value={advancedFilters.emissao_fim || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, emissao_fim: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Número CTE</Label>
                <Input
                  placeholder="Digite o número do CTE"
                  value={advancedFilters.nro_cte || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, nro_cte: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>ID Tomador</Label>
                <Input
                  placeholder="ID do tomador"
                  value={advancedFilters.id_tomador || ''}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, id_tomador: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Tabela de Frete</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    placeholder="Selecionar tabela de frete..."
                    value={tabelaPrecoNome || (advancedFilters.id_tabela_preco ? `ID: ${advancedFilters.id_tabela_preco}` : '')}
                    onClick={() => setTabelaPrecoModalOpen(true)}
                    className="cursor-pointer bg-background"
                  />
                  {advancedFilters.id_tabela_preco && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setAdvancedFilters({...advancedFilters, id_tabela_preco: ''});
                        setTabelaPrecoNome('');
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Atalhos de Data de Emissão */}
              <div className="space-y-2 lg:col-span-2">
                <Label className="text-xs text-muted-foreground">Data Emissão - Atalhos</Label>
                <DateShortcuts 
                  shortcuts={['mes-passado', 'mes-atual', 'semana-atual']}
                  onSelect={(start, end) => setAdvancedFilters({...advancedFilters, emissao_inicio: start, emissao_fim: end})}
                />
              </div>

            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={handleBuscar} 
                className="flex items-center gap-2"
                disabled={isSearching}
              >
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isSearching ? 'Buscando...' : 'Buscar'}
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resultados */}
        {searchResults.length > 0 && (
          <div className="m-3 sm:m-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Resultados da Busca ({searchResults.length})</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {searchResults.map((result) => (
                <Card key={result.idOrcamento} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">Orçamento #{result.nroOrcamento}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(result.emissao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {result.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Solicitante</p>
                      <p className="text-sm font-semibold truncate">{result.solicitante}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Origem</p>
                        <p className="text-sm font-medium">{result.cidadeOrigem}</p>
                        <p className="text-xs text-muted-foreground">{result.ufDestino}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Destino</p>
                        <p className="text-sm font-medium">{result.cidadeDestino}</p>
                        <p className="text-xs text-muted-foreground">{result.ufDestino}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Peso</p>
                        <p className="text-sm font-semibold">{result.peso.toLocaleString('pt-BR')} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valor Total</p>
                        <p className="text-sm font-semibold text-primary">
                          R$ {result.vlrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(mapSearchResultToMappedQuote(result))}
                        title="Editar"
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePreviewCotacao(result.idOrcamento)}
                        title="Imprimir"
                        className="h-8 w-8"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleViewDetails(mapSearchResultToMappedQuote(result))}
                        title="Detalhes"
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleChangeStatus(mapSearchResultToMappedQuote(result))}
                        title="Alterar Status"
                        className="h-8 w-8"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="flex-1 p-3 sm:p-4">
          {error ? (
            <ErrorState />
          ) : isLoading ? (
            <LoadingSkeleton />
          ) : !showSearchResults && filteredQuotes.length === 0 ? (
            <EmptyState />
          ) : !showSearchResults ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 animate-fade-in">
              {filteredQuotes.map((cotacao) => (
                <CotacaoCard
                  key={cotacao.id}
                  cotacao={cotacao}
                  onStatusChange={updateQuoteStatus}
                  onEdit={handleEdit}
                  onPrint={handlePrint}
                  onViewDetails={handleViewDetails}
                  onChangeStatus={handleChangeStatus}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Modais de Seleção de Cadastro */}
        <SelectRegisterModal
          open={remetenteModalOpen}
          onOpenChange={setRemetenteModalOpen}
          onSelect={(cadastro) => {
            setAdvancedFilters({
              ...advancedFilters,
              id_remetente: cadastro.idCliente.toString()
            });
            setRemetenteNome(cadastro.nome);
          }}
          title="Selecionar Remetente"
        />

        <SelectRegisterModal
          open={destinatarioModalOpen}
          onOpenChange={setDestinatarioModalOpen}
          onSelect={(cadastro) => {
            setAdvancedFilters({
              ...advancedFilters,
              id_destinatario: cadastro.idCliente.toString()
            });
            setDestinatarioNome(cadastro.nome);
          }}
          title="Selecionar Destinatário"
        />

        {/* Modal de Tabela de Frete */}
        <SelectTabelaPrecoModal
          open={tabelaPrecoModalOpen}
          onOpenChange={setTabelaPrecoModalOpen}
          onSelect={(tabela: TabelaPreco) => {
            setAdvancedFilters({...advancedFilters, id_tabela_preco: String(tabela.idTabela)});
            setTabelaPrecoNome(tabela.descricao);
          }}
          title="Selecionar Tabela de Frete"
        />

        {/* Modais de Cotação */}
        <EditCotacaoModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          cotacao={selectedCotacao}
          onSave={handleSaveEdit}
        />

        <CotacaoDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          cotacao={selectedCotacao}
        />
      </motion.div>
    </PermissionGuard>
  );
};

export default CotacoesContent;
