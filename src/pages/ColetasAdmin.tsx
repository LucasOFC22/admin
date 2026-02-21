import { useState, useMemo, useEffect, useRef } from 'react';

import PageHeader from '@/components/admin/PageHeader';
import { 
  Truck, Filter, RefreshCw, Plus, 
  Activity, Loader2, Printer
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useColetasApi, getSituacaoLabel } from '@/hooks/useColetasApi';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { SelectRegisterModal } from '@/components/modals/SelectRegisterModal';
import { SelectCityModal } from '@/components/modals/SelectCityModal';
import { ColetasFilters, ColetasFilterValues } from '@/components/admin/coletas/ColetasFilters';
import { ColetasDataTable } from '@/components/admin/coletas/ColetasDataTable';
import { ColetaDetailsModal } from '@/components/admin/coletas/ColetaDetailsModal';
import { CriarColetaModal } from '@/components/admin/coletas/CriarColetaModal';
import { EditarColetaModal } from '@/components/admin/coletas/EditarColetaModal';
import { ColetaApiData } from '@/types/coleta';
import { backendService } from '@/services/api/backendService';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const ColetasAdmin = () => {
  const { logActivity } = useActivityLogger();
  const { notify } = useCustomNotifications();
  const { canAccess } = usePermissionGuard();
  
  // Permissões
  const canCreateColetas = canAccess('admin.coletas.criar');
  const canEditColetas = canAccess('admin.coletas.editar');
  const canPrintColetas = canAccess('admin.coletas.pdf');
  
  // Filtros
  const [filtros, setFiltros] = useState<ColetasFilterValues>({
    numeroColetaInicial: '',
    numeroColetaFinal: '',
    situacao: 'todos',
    tipoRegistro: 'todos',
    dataColetaInicio: '',
    dataColetaFim: '',
    dataEmissaoInicio: '',
    dataEmissaoFim: '',
    remetente: '',
    destinatario: '',
    cidadeOrigem: '',
    cidadeDestino: '',
    ufColeta: ''
  });
  const [selectedEmpresa, setSelectedEmpresa] = useState('all');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  
  // Estados para seleção de clientes
  const [remetenteModalOpen, setRemetenteModalOpen] = useState(false);
  const [destinatarioModalOpen, setDestinatarioModalOpen] = useState(false);
  const [selectedRemetente, setSelectedRemetente] = useState<any>(null);
  const [selectedDestinatario, setSelectedDestinatario] = useState<any>(null);
  
  // Estados para seleção de cidades
  const [cidadeOrigemModalOpen, setCidadeOrigemModalOpen] = useState(false);
  const [cidadeDestinoModalOpen, setCidadeDestinoModalOpen] = useState(false);
  const [selectedCidadeOrigem, setSelectedCidadeOrigem] = useState<any>(null);
  const [selectedCidadeDestino, setSelectedCidadeDestino] = useState<any>(null);
  
  // Estados do modal
  const [selectedColeta, setSelectedColeta] = useState<ColetaApiData | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [coletaModalOpen, setColetaModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [coletaParaEditar, setColetaParaEditar] = useState<ColetaApiData | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Ref para impressão
  const printRef = useRef<HTMLDivElement>(null);

  const { coletas, isLoading, stats, buscarColetas } = useColetasApi();

  useEffect(() => {
    logActivity({
      acao: 'pagina_visualizada',
      modulo: 'coletas',
      detalhes: { pagina: 'coletas_admin' }
    });
  }, [logActivity]);

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filtros, selectedEmpresa]);

  const handleBuscar = () => {
    buscarColetas({ ...filtros, empresa: selectedEmpresa });
  };

  const handleRefresh = () => {
    buscarColetas({ ...filtros, empresa: selectedEmpresa });
    notify.info('Dados Atualizados', 'Coletas recarregadas com sucesso');
  };

  const handleFilterChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const limparFiltros = () => {
    setFiltros({
      numeroColetaInicial: '',
      numeroColetaFinal: '',
      situacao: 'todos',
      tipoRegistro: 'todos',
      dataColetaInicio: '',
      dataColetaFim: '',
      dataEmissaoInicio: '',
      dataEmissaoFim: '',
      remetente: '',
      destinatario: '',
      cidadeOrigem: '',
      cidadeDestino: '',
      ufColeta: ''
    });
    setSelectedEmpresa('all');
    setSelectedRemetente(null);
    setSelectedDestinatario(null);
    setSelectedCidadeOrigem(null);
    setSelectedCidadeDestino(null);
  };

  // Filtrar coletas por situação
  const coletasPendentes = useMemo(() => 
    coletas.filter(c => getSituacaoLabel(c.situacao) === 'PENDENTE'), 
    [coletas]
  );
  const coletasRealizadas = useMemo(() => 
    coletas.filter(c => getSituacaoLabel(c.situacao) === 'REALIZADA'), 
    [coletas]
  );
  const coletasAndamento = useMemo(() => 
    coletas.filter(c => getSituacaoLabel(c.situacao) === 'ANDAMENTO'), 
    [coletas]
  );

  // Paginação
  const totalPages = Math.ceil(coletas.length / itemsPerPage);
  const totalPagesPendentes = Math.ceil(coletasPendentes.length / itemsPerPage);
  const totalPagesRealizadas = Math.ceil(coletasRealizadas.length / itemsPerPage);
  const totalPagesAndamento = Math.ceil(coletasAndamento.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedColetas = coletas.slice(startIndex, startIndex + itemsPerPage);
  const paginatedPendentes = coletasPendentes.slice(startIndex, startIndex + itemsPerPage);
  const paginatedRealizadas = coletasRealizadas.slice(startIndex, startIndex + itemsPerPage);
  const paginatedAndamento = coletasAndamento.slice(startIndex, startIndex + itemsPerPage);

  const handleViewColeta = (coleta: ColetaApiData) => {
    setSelectedColeta(coleta);
    setDetailsModalOpen(true);
  };

  const handleEditColeta = (coleta: ColetaApiData) => {
    setColetaParaEditar(coleta);
    setEditModalOpen(true);
  };

  const handleEditSave = () => {
    buscarColetas({ ...filtros, empresa: selectedEmpresa });
  };

  const handlePrintColeta = async (coleta: ColetaApiData) => {
    if (!coleta.idColeta) {
      notify.error('Erro', 'ID da coleta não encontrado');
      return;
    }

    notify.info('Gerando PDF', `Aguarde, gerando PDF da coleta #${coleta.nroColeta}...`);

    const response = await backendService.gerarPdfColeta(coleta.idColeta);

    if (!response.success || !response.data) {
      notify.error('Erro', response.error || 'Erro ao gerar PDF da coleta');
      return;
    }

    // Criar URL do blob e baixar diretamente
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coleta-${coleta.nroColeta}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    notify.success('Download concluído', `PDF da coleta #${coleta.nroColeta} baixado com sucesso`);
  };

  const renderPagination = (total: number, pages: number) => {
    if (pages <= 1) return null;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-3">
        <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
          {startIndex + 1} - {Math.min(startIndex + itemsPerPage, total)} de {total}
        </div>
        <div className="flex items-center gap-1 order-1 sm:order-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap">{currentPage}/{pages}</span>
          <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(pages, p + 1))} disabled={currentPage === pages} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentPage(pages)} disabled={currentPage === pages} className="h-8 w-8">
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <PageHeader
          title="Gestão de Coletas"
          subtitle="Controle inteligente de coletas e cotações"
          icon={Truck}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Coletas' }
          ]}
          actions={
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setFiltrosAbertos(!filtrosAbertos)} className="h-8 sm:h-9">
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="h-8 sm:h-9">
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              {canCreateColetas && (
                <Button size="sm" onClick={() => setColetaModalOpen(true)} className="h-8 sm:h-9">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nova Coleta</span>
                </Button>
              )}
            </div>
          }
        />

        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando coletas...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Total</p>
                        <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-primary/10 rounded-full shrink-0">
                        <Truck className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Pendentes</p>
                        <p className="text-xl sm:text-2xl font-bold text-amber-600">{stats.pendentes}</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-amber-100 rounded-full shrink-0">
                        <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Andamento</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.andamento}</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-blue-100 rounded-full shrink-0">
                        <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Realizadas</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.realizadas}</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-green-100 rounded-full shrink-0">
                        <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros */}
              <ColetasFilters
                isOpen={filtrosAbertos}
                onOpenChange={setFiltrosAbertos}
                filtros={filtros}
                onFilterChange={handleFilterChange}
                onLimparFiltros={limparFiltros}
                selectedEmpresa={selectedEmpresa}
                onEmpresaChange={setSelectedEmpresa}
                selectedRemetente={selectedRemetente}
                selectedDestinatario={selectedDestinatario}
                selectedCidadeOrigem={selectedCidadeOrigem}
                selectedCidadeDestino={selectedCidadeDestino}
                onOpenRemetenteModal={() => setRemetenteModalOpen(true)}
                onOpenDestinatarioModal={() => setDestinatarioModalOpen(true)}
                onOpenCidadeOrigemModal={() => setCidadeOrigemModalOpen(true)}
                onOpenCidadeDestinoModal={() => setCidadeDestinoModalOpen(true)}
                onBuscar={handleBuscar}
              />

              {/* Lista de Coletas */}
              <Card>
                <div className="p-0">
                  <Tabs defaultValue="todas">
                    <div className="border-b p-2 sm:p-4">
                      <TabsList className="grid w-full grid-cols-4 h-auto">
                        <TabsTrigger value="todas" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3">
                          <Truck className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="hidden md:inline">Todas</span>
                          <span className="text-[10px] sm:text-xs">({stats.total})</span>
                        </TabsTrigger>
                        <TabsTrigger value="pendentes" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3">
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="hidden md:inline">Pendentes</span>
                          <span className="text-[10px] sm:text-xs">({stats.pendentes})</span>
                        </TabsTrigger>
                        <TabsTrigger value="andamento" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3">
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="hidden md:inline">Andamento</span>
                          <span className="text-[10px] sm:text-xs">({stats.andamento})</span>
                        </TabsTrigger>
                        <TabsTrigger value="realizadas" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-1 sm:px-3">
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="hidden md:inline">Realizadas</span>
                          <span className="text-[10px] sm:text-xs">({stats.realizadas})</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="todas" className="p-2 sm:p-4 mt-0">
                      <ColetasDataTable
                        data={paginatedColetas}
                        onView={handleViewColeta}
                        onEdit={handleEditColeta}
                        onPrint={handlePrintColeta}
                        canEdit={canEditColetas}
                        canPrint={canPrintColetas}
                      />
                      {renderPagination(coletas.length, totalPages)}
                    </TabsContent>

                    <TabsContent value="pendentes" className="p-2 sm:p-4 mt-0">
                      <ColetasDataTable
                        data={paginatedPendentes}
                        onView={handleViewColeta}
                        onEdit={handleEditColeta}
                        onPrint={handlePrintColeta}
                        canEdit={canEditColetas}
                        canPrint={canPrintColetas}
                      />
                      {renderPagination(coletasPendentes.length, totalPagesPendentes)}
                    </TabsContent>

                    <TabsContent value="andamento" className="p-2 sm:p-4 mt-0">
                      <ColetasDataTable
                        data={paginatedAndamento}
                        onView={handleViewColeta}
                        onEdit={handleEditColeta}
                        onPrint={handlePrintColeta}
                        canEdit={canEditColetas}
                        canPrint={canPrintColetas}
                      />
                      {renderPagination(coletasAndamento.length, totalPagesAndamento)}
                    </TabsContent>

                    <TabsContent value="realizadas" className="p-2 sm:p-4 mt-0">
                      <ColetasDataTable
                        data={paginatedRealizadas}
                        onView={handleViewColeta}
                        onEdit={handleEditColeta}
                        onPrint={handlePrintColeta}
                        canEdit={canEditColetas}
                        canPrint={canPrintColetas}
                      />
                      {renderPagination(coletasRealizadas.length, totalPagesRealizadas)}
                    </TabsContent>
                  </Tabs>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Detalhes */}
      <ColetaDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        coleta={selectedColeta}
      />
      
      <CriarColetaModal
        open={coletaModalOpen}
        onOpenChange={setColetaModalOpen}
        onSave={(data) => {
          notify.success('Coleta criada', 'A coleta foi criada com sucesso');
        }}
      />

      {/* Modal de Seleção de Remetente */}
      <SelectRegisterModal
        open={remetenteModalOpen}
        onOpenChange={setRemetenteModalOpen}
        onSelect={(cadastro) => {
          setSelectedRemetente(cadastro);
          handleFilterChange('remetente', cadastro.idCliente?.toString() || '');
        }}
        title="Selecionar Remetente"
      />

      {/* Modal de Seleção de Destinatário */}
      <SelectRegisterModal
        open={destinatarioModalOpen}
        onOpenChange={setDestinatarioModalOpen}
        onSelect={(cadastro) => {
          setSelectedDestinatario(cadastro);
          handleFilterChange('destinatario', cadastro.idCliente?.toString() || '');
        }}
        title="Selecionar Destinatário"
      />

      {/* Modal de Seleção de Cidade Origem */}
      <SelectCityModal
        open={cidadeOrigemModalOpen}
        onOpenChange={setCidadeOrigemModalOpen}
        onSelect={(cidade) => {
          setSelectedCidadeOrigem(cidade);
          handleFilterChange('cidadeOrigem', cidade.cidade);
        }}
        title="Selecionar Cidade de Origem"
      />

      {/* Modal de Seleção de Cidade Destino */}
      <SelectCityModal
        open={cidadeDestinoModalOpen}
        onOpenChange={setCidadeDestinoModalOpen}
        onSelect={(cidade) => {
          setSelectedCidadeDestino(cidade);
          handleFilterChange('cidadeDestino', cidade.cidade);
        }}
         title="Selecionar Cidade de Destino"
       />

      {/* Modal de Edição de Coleta */}
      <EditarColetaModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        coleta={coletaParaEditar}
        onSave={handleEditSave}
      />
     </>
  );
};

export default ColetasAdmin;
