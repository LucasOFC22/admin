import { useState, useMemo, useEffect } from 'react';

import PageHeader from '@/components/admin/PageHeader';
import { FileText, Eye, CircleCheckBig, ChevronDown, List, Grid3X3, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ManifestoStats as Stats, EstadoStat } from '@/types/manifesto';
import { ManifestoCard } from '@/components/admin/manifestos/ManifestoCard';
import { ManifestoTable } from '@/components/admin/manifestos/ManifestoTable';
import { ManifestoStats } from '@/components/admin/manifestos/ManifestoStats';
import { EstadosCard } from '@/components/admin/manifestos/EstadosCard';
import { useManifestos } from '@/hooks/useManifestos';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { EmpresaSelector } from '@/components/admin/EmpresaSelector';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const Manifestos = () => {
  const { logActivity } = useActivityLogger();
  const { canAccess } = usePermissionGuard();
  const canViewAllEmpresas = canAccess('admin.manifestos.todas-empresas');
  
  const { 
    manifestos, 
    isLoading, 
    imprimirManifesto, 
    encerrarManifesto, 
    cancelarManifesto 
  } = useManifestos();
  
  const [searchNumero, setSearchNumero] = useState('');
  const [searchCondutor, setSearchCondutor] = useState('');
  const [searchPlaca, setSearchPlaca] = useState('');
  const [searchTipoAquisicao, setSearchTipoAquisicao] = useState('');
  const [searchContrato, setSearchContrato] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState('all');
  const [sortBy, setSortBy] = useState('emissao');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    logActivity({
      acao: 'pagina_visualizada',
      modulo: 'manifestos',
      detalhes: { pagina: 'manifestos' }
    });
  }, [logActivity]);


  // Filtrar e ordenar manifestos
  const filteredManifestos = useMemo(() => {
    // Ensure manifestos is always an array
    if (!Array.isArray(manifestos)) {
      return [];
    }
    
    const filtered = manifestos.filter(m => {
      const matchNumero = searchNumero === '' || m.nroManifesto.toString().includes(searchNumero);
      const matchCondutor = searchCondutor === '' || m.condutor.toLowerCase().includes(searchCondutor.toLowerCase());
      const matchPlaca = searchPlaca === '' || m.veictracaoPlaca.toLowerCase().includes(searchPlaca.toLowerCase());
      const matchTipo = searchTipoAquisicao === '' || m.tipoAquisicao.toLowerCase().includes(searchTipoAquisicao.toLowerCase());
      const matchContrato = searchContrato === '' || (m.nroContrato && String(m.nroContrato).includes(searchContrato));
      const matchEmpresa = selectedEmpresa === 'all' || m.idEmpresa.toString() === selectedEmpresa;
      
      return matchNumero && matchCondutor && matchPlaca && matchTipo && matchContrato && matchEmpresa;
    });

    // Aplicar ordenação
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'emissao':
          return new Date(b.emissao).getTime() - new Date(a.emissao).getTime();
        case 'numero':
          return b.nroManifesto - a.nroManifesto;
        case 'peso':
          return b.tPeso - a.tPeso;
        case 'valor':
          return b.tVlrMerc - a.tVlrMerc;
        default:
          return 0;
      }
    });

    return sorted;
  }, [manifestos, searchNumero, searchCondutor, searchPlaca, searchTipoAquisicao, searchContrato, selectedEmpresa, sortBy]);

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchNumero, searchCondutor, searchPlaca, searchTipoAquisicao, searchContrato, selectedEmpresa, sortBy]);

  // Filtrar apenas < 24h
  const manifestosMenos24h = useMemo(() => {
    return filteredManifestos.filter(m => m.menos24h === 'S');
  }, [filteredManifestos]);

  // Paginação
  const totalPages = Math.ceil(filteredManifestos.length / itemsPerPage);
  const totalPagesMenos24h = Math.ceil(manifestosMenos24h.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedManifestos = filteredManifestos.slice(startIndex, startIndex + itemsPerPage);
  const paginatedMenos24h = manifestosMenos24h.slice(startIndex, startIndex + itemsPerPage);

  // Calcular estatísticas
  const stats: Stats = useMemo(() => {
    return {
      total: filteredManifestos.length,
      menos24h: manifestosMenos24h.length,
      pesoTotal: filteredManifestos.reduce((acc, m) => acc + m.tPeso, 0),
      valorTotal: filteredManifestos.reduce((acc, m) => acc + m.tVlrMerc, 0)
    };
  }, [filteredManifestos, manifestosMenos24h]);

  // Calcular estados
  const estadosStats: EstadoStat[] = useMemo(() => {
    const estadoMap = new Map<string, number>();
    filteredManifestos.forEach(m => {
      const count = estadoMap.get(m.ufDestino) || 0;
      estadoMap.set(m.ufDestino, count + 1);
    });
    return Array.from(estadoMap.entries()).map(([estado, count]) => ({ estado, count }));
  }, [filteredManifestos]);

  return (
    <>
      <PermissionGuard 
        permissions="admin.manifestos.visualizar"
        showMessage={true}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <PageHeader
            title="Manifestos"
            subtitle="Gerenciamento de manifestos eletrônicos"
            icon={FileText}
            breadcrumbs={[
              { label: 'Dashboard', href: '/' },
              { label: 'Manifestos' }
            ]}
          />

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando manifestos...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <ManifestoStats stats={stats} />
                <EstadosCard estados={estadosStats} />

                <Card className="border-0 shadow-sm overflow-hidden">
                  <div className="p-0">
                    <Tabs defaultValue="pendentes">
                      <div className="border-b border-border/50 p-3 sm:p-4 bg-gradient-to-r from-muted/30 to-transparent">
                        <div className="flex flex-col gap-3 sm:gap-4">
                          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                            <TabsTrigger value="pendentes" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="hidden xs:inline">Todos</span> ({stats.total})
                            </TabsTrigger>
                            <TabsTrigger value="menos24h" className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                              <CircleCheckBig className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              &lt; 24h ({stats.menos24h})
                            </TabsTrigger>
                          </TabsList>

                          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-2">
                            <Select value={sortBy} onValueChange={setSortBy}>
                              <SelectTrigger className="w-full xs:w-40 sm:w-48 text-xs sm:text-sm">
                                <SelectValue placeholder="Data de Emissão" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="emissao">Data de Emissão</SelectItem>
                                <SelectItem value="numero">Número</SelectItem>
                                <SelectItem value="peso">Peso</SelectItem>
                                <SelectItem value="valor">Valor</SelectItem>
                              </SelectContent>
                            </Select>

                            <div className="flex items-center gap-2 justify-between xs:justify-start">
                              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>

                              <div className="flex items-center border rounded-md">
                                <Button
                                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                                  size="icon"
                                  className="rounded-r-none h-8 w-8 sm:h-9 sm:w-9"
                                  onClick={() => setViewMode('list')}
                                >
                                  <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                  size="icon"
                                  className="rounded-l-none h-8 w-8 sm:h-9 sm:w-9"
                                  onClick={() => setViewMode('grid')}
                                >
                                  <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 border-b border-border/50 bg-muted/10">
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                          <EmpresaSelector
                            value={selectedEmpresa}
                            onChange={setSelectedEmpresa}
                            showAllOption={canViewAllEmpresas}
                            bypassEmpresaPermissions={canViewAllEmpresas}
                            label=""
                          />
                          <Input
                            placeholder="Número..."
                            value={searchNumero}
                            onChange={(e) => setSearchNumero(e.target.value)}
                            className="bg-background/50 border-border/50 focus:border-primary/50 text-sm"
                          />
                          <Input
                            placeholder="Condutor..."
                            value={searchCondutor}
                            onChange={(e) => setSearchCondutor(e.target.value)}
                            className="bg-background/50 border-border/50 focus:border-primary/50 text-sm"
                          />
                          <Input
                            placeholder="Placa..."
                            value={searchPlaca}
                            onChange={(e) => setSearchPlaca(e.target.value)}
                            className="bg-background/50 border-border/50 focus:border-primary/50 text-sm"
                          />
                          <Input
                            placeholder="Tipo aquisição..."
                            value={searchTipoAquisicao}
                            onChange={(e) => setSearchTipoAquisicao(e.target.value)}
                            className="bg-background/50 border-border/50 focus:border-primary/50 text-sm"
                          />
                          <Input
                            placeholder="Nº contrato..."
                            value={searchContrato}
                            onChange={(e) => setSearchContrato(e.target.value)}
                            className="bg-background/50 border-border/50 focus:border-primary/50 text-sm"
                          />
                        </div>
                      </div>

                      <TabsContent value="pendentes" className="p-4 mt-0">
                        {viewMode === 'list' ? (
                          <ManifestoTable
                            manifestos={paginatedManifestos}
                            onPrint={imprimirManifesto}
                            onEncerrar={encerrarManifesto}
                            onCancelar={cancelarManifesto}
                          />
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {paginatedManifestos.map((manifesto) => (
                              <ManifestoCard
                                key={manifesto.nroManifesto}
                                manifesto={manifesto}
                                onPrint={imprimirManifesto}
                                onEncerrar={encerrarManifesto}
                                onCancelar={cancelarManifesto}
                              />
                            ))}
                          </div>
                        )}
                        
                        {totalPages > 1 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
                            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                              <span className="hidden xs:inline">Mostrando </span>{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredManifestos.length)} de {filteredManifestos.length}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                              >
                                <ChevronsLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <span className="px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap">
                                {currentPage}/{totalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                              >
                                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                              >
                                <ChevronsRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="menos24h" className="p-4 mt-0">
                        {viewMode === 'list' ? (
                          <ManifestoTable
                            manifestos={paginatedMenos24h}
                            onPrint={imprimirManifesto}
                            onEncerrar={encerrarManifesto}
                            onCancelar={cancelarManifesto}
                          />
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {paginatedMenos24h.map((manifesto) => (
                              <ManifestoCard
                                key={manifesto.nroManifesto}
                                manifesto={manifesto}
                                onPrint={imprimirManifesto}
                                onEncerrar={encerrarManifesto}
                                onCancelar={cancelarManifesto}
                              />
                            ))}
                          </div>
                        )}
                        
                        {totalPagesMenos24h > 1 && (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, manifestosMenos24h.length)} de {manifestosMenos24h.length}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                              >
                                <ChevronsLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <span className="px-3 text-sm">
                                Página {currentPage} de {totalPagesMenos24h}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.min(totalPagesMenos24h, p + 1))}
                                disabled={currentPage === totalPagesMenos24h}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(totalPagesMenos24h)}
                                disabled={currentPage === totalPagesMenos24h}
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>
      </PermissionGuard>
    </>
  );
};

export default Manifestos;
