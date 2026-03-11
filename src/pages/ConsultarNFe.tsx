import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Search, Building2, ChevronDown, UserSearch, List, Grid3x3, Download, FileText, Info, Loader2, Eye, Package, Calculator, MoreVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { downloadPdf, downloadXml } from '@/lib/download-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { n8nApi } from '@/services/n8n/apiService';
import { backendService } from '@/services/api/backendService';
import { SelectRegisterModal } from '@/components/modals/SelectRegisterModal';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { useNotification } from '@/hooks/useCustomNotifications';
import { EmpresaSelector } from '@/components/admin/EmpresaSelector';
import { NFeDetailsModal } from '@/components/modals/NFeDetailsModal';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { DateShortcuts } from '@/components/ui/date-shortcuts';

interface NFeData {
  idConhecimento: number;
  nroConhec: number;
  doc: string;
  nroNf: string;
  destNome: string;
  destCgc: string;
  remeNome: string;
  remeCgc: string;
  cidDestino: string;
  ufOrigem: string;
  ufDestino: string;
  cidOrigem: string;
  emissao: string;
  vlrTotal: number;
  vlrMerc: number;
  peso: number;
  pesoCubado: number;
  descPosicao: string;
  dataUltOcorrencia: string;
  ultimaOcorrencia: string;
  comprovante: string;
  chaveCte: string;
  tipoServico: string;
}


const ConsultarNFe = () => {
  const permissions = usePermissionGuard();
  const { success, error } = useNotification();
  const { logActivity } = useActivityLogger();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState('20');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultados, setResultados] = useState<NFeData[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedNFe, setSelectedNFe] = useState<NFeData | null>(null);

  // Cálculos de paginação
  const totalItems = resultados.length;
  const itemsPerPageNum = parseInt(itemsPerPage) || 20;
  const totalPages = Math.ceil(totalItems / itemsPerPageNum);
  const startIndex = (currentPage - 1) * itemsPerPageNum;
  const endIndex = startIndex + itemsPerPageNum;
  const paginatedResults = resultados.slice(startIndex, endIndex);

  // Reset página quando resultados mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [resultados, itemsPerPage]);

  // Função para determinar o status com base no comprovante
  const getStatusDisplay = (item: NFeData) => {
    // Verifica o campo comprovante
    if (item.comprovante && item.comprovante.toUpperCase() === 'S') {
      return {
        text: 'Com Comprovante',
        className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      };
    }
    if (item.comprovante && item.comprovante.toUpperCase() === 'N') {
      return {
        text: 'Sem Comprovante',
        className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      };
    }
    // Caso padrão: mostra status baseado na posição
    return {
      text: item.descPosicao || 'Em Trânsito',
      className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
    };
  };

  const handleViewDetails = (item: NFeData) => {
    setSelectedNFe(item);
    setDetailsModalOpen(true);
    
    logActivity({
      acao: 'nfe_detalhes_visualizados',
      modulo: 'consultar-nfe',
      detalhes: {
        cte_numero: item.nroConhec,
        nf_numero: item.nroNf,
        remetente: item.remeNome,
        destinatario: item.destNome
      }
    });
  };
  
  // Estados do modal de seleção de cliente
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [remetenteModalOpen, setRemetenteModalOpen] = useState(false);
  const [destinatarioModalOpen, setDestinatarioModalOpen] = useState(false);
  
  // Estados dos filtros
  const [filtros, setFiltros] = useState({
    empresa: 'all',
    numeroCteInicio: '',
    numeroCteFim: '',
    tipoCte: 'todos',
    statusEntrega: 'todos',
    numeroNfInicio: '',
    numeroNfFim: '',
    dataEmissaoCteInicio: '',
    dataEmissaoCteFim: '',
    dataInicioEmissaoNf: '',
    dataFimEmissaoNf: '',
    cliente: '',
    clienteNome: '',
    remetente: '',
    remetenteNome: '',
    destinatario: '',
    destinatarioNome: ''
  });

  const handleDownloadXml = async (idConhecimento: number, nroConhec: number) => {
    await logActivity({
      acao: 'xml_download_solicitado',
      modulo: 'consultar-nfe',
      detalhes: {
        id_conhecimento: idConhecimento,
        cte_numero: nroConhec
      }
    });

    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
    const xmlUrl = `${baseUrl}/functions/v1/xml-cte/${idConhecimento}`;
    
    await downloadXml({
      url: xmlUrl,
      fileName: `CTE_${nroConhec}.xml`,
    });
  };

  const handleDownloadPdf = async (idConhecimento: number, nroConhec: number) => {
    await logActivity({
      acao: 'pdf_download',
      modulo: 'consultar-nfe',
      detalhes: {
        id_conhecimento: idConhecimento,
        cte_numero: nroConhec
      }
    });
    
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
    const pdfUrl = `${baseUrl}/functions/v1/pdf-cte/${idConhecimento}`;
    downloadPdf({ url: pdfUrl, fileName: `CTE_${nroConhec}.pdf` });
  };

  const handleExportarCSV = () => {
    if (resultados.length === 0) {
      error('Nenhum dado para exportar', 'É necessário realizar uma busca antes de exportar');
      return;
    }
    
    logActivity({
      acao: 'csv_exportado',
      modulo: 'consultar-nfe',
      detalhes: {
        total_registros: resultados.length,
        filtros_aplicados: filtros
      }
    });

    // Cabeçalhos do CSV
    const headers = [
      'Nº CTE',
      'Doc',
      'NF',
      'Remetente',
      'CPF/CNPJ Remetente',
      'Destinatário',
      'CPF/CNPJ Destinatário',
      'Origem',
      'UF Origem',
      'Destino',
      'UF Destino',
      'Emissão',
      'Valor Total',
      'Valor Mercadoria',
      'Peso',
      'Peso Cubado',
      'Status',
      'Data Última Ocorrência',
      'Última Ocorrência',
      'Comprovante',
      'Chave CTE',
      'Tipo Serviço'
    ];

    // Converter dados para CSV com aspas duplas para melhor formatação
    const csvContent = [
      headers.map(h => `"${h}"`).join(';'),
      ...resultados.map(item => [
        `"${item.nroConhec || ''}"`,
        `"${item.doc || ''}"`,
        `"${item.nroNf || ''}"`,
        `"${(item.remeNome || '').replace(/"/g, '""')}"`,
        `"${item.remeCgc || ''}"`,
        `"${(item.destNome || '').replace(/"/g, '""')}"`,
        `"${item.destCgc || ''}"`,
        `"${(item.cidOrigem || '').replace(/"/g, '""')}"`,
        `"${item.ufOrigem || ''}"`,
        `"${(item.cidDestino || '').replace(/"/g, '""')}"`,
        `"${item.ufDestino || ''}"`,
        `"${item.emissao ? new Date(item.emissao).toLocaleDateString('pt-BR') : ''}"`,
        `"${item.vlrTotal != null ? item.vlrTotal.toFixed(2) : '0.00'}"`,
        `"${item.vlrMerc != null ? item.vlrMerc.toFixed(2) : '0.00'}"`,
        `"${item.peso != null ? item.peso.toString() : ''}"`,
        `"${item.pesoCubado != null ? item.pesoCubado.toString() : ''}"`,
        `"${getStatusDisplay(item).text}"`,
        `"${item.dataUltOcorrencia ? new Date(item.dataUltOcorrencia).toLocaleDateString('pt-BR') : ''}"`,
        `"${(item.ultimaOcorrencia || '').replace(/"/g, '""')}"`,
        `"${item.comprovante || ''}"`,
        `"${item.chaveCte || ''}"`,
        `"${(item.tipoServico || '').replace(/"/g, '""')}"`,
      ].join(';'))
    ].join('\n');

    // Criar blob e fazer download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `consulta_nfe_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Exportação concluída', `Arquivo CSV exportado com ${resultados.length} registro(s)`);
  };

  const handleBuscar = async () => {
    setIsLoading(true);
    setHasSearched(true);
    
    await logActivity({
      acao: 'nfe_busca_realizada',
      modulo: 'consultar-nfe',
      detalhes: { filtros: filtros }
    });
    
    try {
      // Criar objeto de filtros apenas com valores não vazios
      const filtrosLimpos: Record<string, any> = {};
      
      if (filtros.empresa && filtros.empresa !== 'all') filtrosLimpos.empresas = filtros.empresa;
      if (filtros.numeroCteInicio) filtrosLimpos.numero_cte_inicio = filtros.numeroCteInicio;
      if (filtros.numeroCteFim) filtrosLimpos.numero_cte_fim = filtros.numeroCteFim;
      if (filtros.tipoCte && filtros.tipoCte !== 'todos') filtrosLimpos.tipo_cte = filtros.tipoCte;
      if (filtros.statusEntrega && filtros.statusEntrega !== 'todos') filtrosLimpos.status_entrega = filtros.statusEntrega;
      if (filtros.numeroNfInicio) filtrosLimpos.numero_nf_inicio = filtros.numeroNfInicio;
      if (filtros.numeroNfFim) filtrosLimpos.numero_nf_fim = filtros.numeroNfFim;
      if (filtros.dataEmissaoCteInicio) filtrosLimpos.data_emissao_cte_inicio = filtros.dataEmissaoCteInicio;
      if (filtros.dataEmissaoCteFim) filtrosLimpos.data_emissao_cte_fim = filtros.dataEmissaoCteFim;
      if (filtros.dataInicioEmissaoNf) filtrosLimpos.data_inicio_emissao_nf = filtros.dataInicioEmissaoNf;
      if (filtros.dataFimEmissaoNf) filtrosLimpos.data_fim_emissao_nf = filtros.dataFimEmissaoNf;
      if (filtros.cliente) filtrosLimpos.cliente_id = filtros.cliente;
      if (filtros.remetente) filtrosLimpos.remetente_id = filtros.remetente;
      if (filtros.destinatario) filtrosLimpos.destinatario_id = filtros.destinatario;

      const response = await backendService.consultarNfe(filtrosLimpos);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar NF-e');
      }

      let result = response.data;

      // Passo 1: Normalizar estrutura .json (n8n webhook response format)
      if (Array.isArray(result) && result.length > 0 && result[0]?.json !== undefined) {
        result = result.map((item: any) => item.json);
      }

      // Passo 2: Se ainda for array com 1 item, extrair esse item
      if (Array.isArray(result) && result.length === 1) {
        result = result[0];
      }

      // Passo 3: Extrair dados da resposta
      let dados: NFeData[] = [];
      
      // Caso 1: Resultado tem propriedade .data
      if (result && typeof result === 'object' && result.data) {
        if (Array.isArray(result.data)) {
          dados = result.data;
        } else {
          dados = [result.data];
        }
      }
      // Caso 2: Resultado já é um array direto de dados
      else if (Array.isArray(result)) {
        dados = result;
      } 
      // Caso 3: Resultado é um objeto único (não tem .data e não é array)
      else if (typeof result === 'object' && Object.keys(result).length > 0) {
        dados = [result];
      }
      
      setResultados(dados);
      
      if (dados.length === 0) {
        error('Nenhum registro encontrado', 'Tente ajustar os filtros da busca');
      } else {
        success('Busca concluída', `${dados.length} registro(s) encontrado(s)`);
        
        await logActivity({
          acao: 'nfe_busca_sucesso',
          modulo: 'consultar-nfe',
          detalhes: {
            total_registros: dados.length,
            filtros: filtros
          }
        });
      }
    } catch (err) {
      console.error('Erro ao buscar NF-e:', err);
      error('Erro ao buscar dados', err instanceof Error ? err.message : 'Não foi possível completar a busca');
      setResultados([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLimpar = () => {
    setFiltros({
      empresa: 'all',
      numeroCteInicio: '',
      numeroCteFim: '',
      tipoCte: 'todos',
      statusEntrega: 'todos',
      numeroNfInicio: '',
      numeroNfFim: '',
      dataEmissaoCteInicio: '',
      dataEmissaoCteFim: '',
      dataInicioEmissaoNf: '',
      dataFimEmissaoNf: '',
      cliente: '',
      clienteNome: '',
      remetente: '',
      remetenteNome: '',
      destinatario: '',
      destinatarioNome: ''
    });
    setResultados([]);
    setHasSearched(false);
  };


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6"
      >
        {/* Filtros de Busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Empresa */}
            <EmpresaSelector
              value={filtros.empresa}
              onChange={(value) => setFiltros({...filtros, empresa: value})}
              showAllOption={true}
              label="Empresa"
              required={true}
            />

            {/* Grid de Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Número CTE Início</Label>
                <Input 
                  placeholder="Ex: 12345" 
                  value={filtros.numeroCteInicio}
                  onChange={(e) => setFiltros({...filtros, numeroCteInicio: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Número CTE Fim</Label>
                <Input 
                  placeholder="Ex: 54321"
                  value={filtros.numeroCteFim}
                  onChange={(e) => setFiltros({...filtros, numeroCteFim: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo CTE</Label>
                <Select value={filtros.tipoCte} onValueChange={(value) => setFiltros({...filtros, tipoCte: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="CTE">CTE</SelectItem>
                    <SelectItem value="OS">OS</SelectItem>
                    <SelectItem value="NFS">NFS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status Entrega</Label>
                <Select value={filtros.statusEntrega} onValueChange={(value) => setFiltros({...filtros, statusEntrega: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número NF Início</Label>
                <Input 
                  placeholder="Ex: 1001"
                  value={filtros.numeroNfInicio}
                  onChange={(e) => setFiltros({...filtros, numeroNfInicio: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Número NF Fim</Label>
                <Input 
                  placeholder="Ex: 9999"
                  value={filtros.numeroNfFim}
                  onChange={(e) => setFiltros({...filtros, numeroNfFim: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Emissão CTE Início</Label>
                <Input 
                  type="date"
                  value={filtros.dataEmissaoCteInicio}
                  onChange={(e) => setFiltros({...filtros, dataEmissaoCteInicio: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Emissão CTE Fim</Label>
                <Input 
                  type="date"
                  value={filtros.dataEmissaoCteFim}
                  onChange={(e) => setFiltros({...filtros, dataEmissaoCteFim: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Início Emissão NF</Label>
                <Input 
                  type="date"
                  value={filtros.dataInicioEmissaoNf}
                  onChange={(e) => setFiltros({...filtros, dataInicioEmissaoNf: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim Emissão NF</Label>
                <Input 
                  type="date"
                  value={filtros.dataFimEmissaoNf}
                  onChange={(e) => setFiltros({...filtros, dataFimEmissaoNf: e.target.value})}
                />
              </div>

              {/* Atalhos de Data Emissão CTE */}
              <div className="space-y-2 lg:col-span-2">
                <Label className="text-sm text-muted-foreground">Emissão CTE - Atalhos</Label>
                <DateShortcuts 
                  shortcuts={['mes-passado', 'mes-atual', 'semana-atual', 'prox-semana']}
                  onSelect={(start, end) => setFiltros({...filtros, dataEmissaoCteInicio: start, dataEmissaoCteFim: end})}
                />
              </div>

              {/* Atalhos de Data Emissão NF */}
              <div className="space-y-2 lg:col-span-2">
                <Label className="text-sm text-muted-foreground">Emissão NF - Atalhos</Label>
                <DateShortcuts 
                  shortcuts={['mes-passado', 'mes-atual', 'semana-atual', 'prox-semana']}
                  onSelect={(start, end) => setFiltros({...filtros, dataInicioEmissaoNf: start, dataFimEmissaoNf: end})}
                />
              </div>
            </div>

            {/* Cliente, Remetente, Destinatário */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setClienteModalOpen(true)}
                    >
                      <UserSearch className="h-4 w-4 mr-2" />
                      {filtros.clienteNome || 'Selecionar cliente'}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Remetente</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setRemetenteModalOpen(true)}
                    >
                      <UserSearch className="h-4 w-4 mr-2" />
                      {filtros.remetenteNome || 'Selecionar remetente'}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Destinatário</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setDestinatarioModalOpen(true)}
                    >
                      <UserSearch className="h-4 w-4 mr-2" />
                      {filtros.destinatarioNome || 'Selecionar destinatário'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleBuscar} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleLimpar} disabled={isLoading} className="w-full sm:w-auto">
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Buscando dados...</span>
          </div>
        )}

        {/* Estatísticas */}
        {hasSearched && !isLoading && resultados.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total CTEs</p>
                    <p className="text-xl sm:text-2xl font-bold">{resultados.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Com Comprovante</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {resultados.filter(item => item.comprovante?.toUpperCase() === 'S').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Peso Total</p>
                    <p className="text-base sm:text-xl lg:text-2xl font-bold leading-tight">
                      {resultados.reduce((acc, item) => acc + (item.peso || 0), 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} kg
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Valor Total</p>
                    <p className="text-base sm:text-xl lg:text-2xl font-bold leading-tight">
                      R$ {resultados.reduce((acc, item) => acc + (item.vlrTotal || 0), 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resultados */}
        {hasSearched && !isLoading && (
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <List className="h-4 w-4 sm:h-5 sm:w-5" />
                Resultados ({resultados.length} registros)
              </CardTitle>
              
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('cards')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Card className="rounded-lg bg-card text-card-foreground h-full bg-gradient-to-br from-background to-muted/30 border-0 shadow-lg">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-t-lg space-y-3">
                <CardTitle className="tracking-tight text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"></CardTitle>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                  <div className="relative flex-1 max-w-full sm:max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 bg-background/50 border-primary/20 focus:border-primary/40 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                      <SelectTrigger className="w-16 sm:w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <PermissionGuard permissions="admin.nfe.exportar" showMessage={false}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-primary/10 border-primary/20 hover:bg-primary/20 whitespace-nowrap"
                        onClick={handleExportarCSV}
                        disabled={resultados.length === 0}
                      >
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Exportar CSV</span>
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">{totalItems} registro(s)</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">Mostrando {totalItems > 0 ? startIndex + 1 : 0} a {Math.min(endIndex, totalItems)} de {totalItems}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {viewMode === 'cards' ? (
                  <div className="p-4">
                    {resultados.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum resultado encontrado</p>
                        <p className="text-sm mt-2">Utilize os filtros acima para realizar uma consulta</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedResults.map((item) => (
                          <Card key={item.idConhecimento} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <p className="font-semibold text-sm">{item.nroConhec || '-'}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {item.emissao ? new Date(item.emissao).toLocaleDateString('pt-BR') : '-'}
                                  </p>
                                </div>
                                <Badge className={`${getStatusDisplay(item).className} text-xs truncate max-w-[120px]`}>
                                  {getStatusDisplay(item).text}
                                </Badge>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground">Remetente</p>
                                  <p className="font-medium truncate">{item.remeNome || '-'}</p>
                                  <p className="text-xs text-muted-foreground truncate">{item.remeCgc || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Destinatário</p>
                                  <p className="font-medium truncate">{item.destNome || '-'}</p>
                                  <p className="text-xs text-muted-foreground truncate">{item.destCgc || '-'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Origem</p>
                                    <p className="text-xs truncate">{item.cidOrigem || '-'} - {item.ufOrigem || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Destino</p>
                                    <p className="text-xs truncate">{item.cidDestino || '-'} - {item.ufDestino || '-'}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Peso</p>
                                    <p className="font-medium">{item.peso != null ? `${item.peso} kg` : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Valor</p>
                                    <p className="font-medium">R$ {item.vlrTotal != null ? item.vlrTotal.toFixed(2) : '0.00'}</p>
                                  </div>
                                </div>
                                {item.tipoServico && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Tipo Serviço</p>
                                    <p className="text-xs truncate">{item.tipoServico}</p>
                                  </div>
                                )}
                                {item.doc && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Doc</p>
                                    <p className="text-xs truncate">{item.doc}</p>
                                  </div>
                                )}
                                {item.nroNf && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">NF</p>
                                    <p className="text-xs truncate">{item.nroNf}</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 pt-2 border-t">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1" 
                                  onClick={() => handleViewDetails(item)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Detalhes
                                </Button>
                                {item.doc === 'CTE' && (
                                  <>
                                    <PermissionGuard permissions="admin.nfe.xml">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1" 
                                        title="Baixar XML"
                                        onClick={() => handleDownloadXml(item.idConhecimento, item.nroConhec)}
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        XML
                                      </Button>
                                    </PermissionGuard>
                                    <PermissionGuard permissions={["admin.nfe.pdf", "admin.nfe.imprimir"]}>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1" 
                                        title="Baixar PDF"
                                        onClick={() => handleDownloadPdf(item.idConhecimento, item.nroConhec)}
                                      >
                                        <FileText className="h-4 w-4 mr-2" />
                                        PDF
                                      </Button>
                                    </PermissionGuard>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                                ))}
                              </div>
                            )}
                            
                            {/* Controles de Paginação para Cards */}
                            {totalItems > 0 && (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t border-primary/10">
                                <div className="text-sm text-muted-foreground">
                                  Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} registros
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="h-8 px-2"
                                  >
                                    <ChevronsLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 px-2"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <div className="flex items-center gap-1 px-2">
                                    <span className="text-sm font-medium">{currentPage}</span>
                                    <span className="text-sm text-muted-foreground">de</span>
                                    <span className="text-sm font-medium">{totalPages || 1}</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="h-8 px-2"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="h-8 px-2"
                                  >
                                    <ChevronsRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                  <div className="rounded-lg border border-primary/10 overflow-hidden bg-gradient-to-b from-background to-muted/20">
                    <div className="relative w-full overflow-x-auto">
                      <table className="w-full caption-bottom text-xs sm:text-sm min-w-[1200px]">
                         <thead className="sticky top-0 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm border-b border-primary/20">
                          <tr>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[120px]">Nº CTE</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[100px]">Doc</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[100px]">NF</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[200px]">Remetente</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[200px]">Destinatário</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[150px]">Origem</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[150px]">Destino</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[120px]">Emissão</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[100px]">Valor</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[100px]">Peso</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 w-[140px]">Status</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 w-[140px]">Tipo Serviço</th>
                            <th className="h-12 px-4 text-left font-semibold text-primary/90 max-w-[100px]">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultados.length === 0 ? (
                            <tr>
                              <td colSpan={13} className="p-8 text-center text-muted-foreground">
                                {isLoading ? 'Carregando...' : 'Nenhum resultado encontrado. Use os filtros acima para buscar.'}
                              </td>
                            </tr>
                          ) : (
                            paginatedResults.map((item) => (
                               <tr key={item.idConhecimento} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                                <td className="p-4 max-w-[120px] min-w-[100px]">
                                  <div className="truncate font-medium">{item.nroConhec || '-'}</div>
                                </td>
                                <td className="p-4 max-w-[100px] min-w-[80px]">
                                  <div className="truncate">{item.doc || '-'}</div>
                                </td>
                                <td className="p-4 max-w-[100px] min-w-[80px]">
                                  <div className="truncate">{item.nroNf || '-'}</div>
                                </td>
                                <td className="p-4 max-w-[200px] min-w-[150px]">
                                  <div className="truncate" title={`${item.remeNome || ''} - ${item.remeCgc || ''}`}>
                                    <div className="font-medium">{item.remeNome || '-'}</div>
                                    <div className="text-xs text-muted-foreground">{item.remeCgc || '-'}</div>
                                  </div>
                                </td>
                                <td className="p-4 max-w-[200px] min-w-[150px]">
                                  <div className="truncate" title={`${item.destNome || ''} - ${item.destCgc || ''}`}>
                                    <div className="font-medium">{item.destNome || '-'}</div>
                                    <div className="text-xs text-muted-foreground">{item.destCgc || '-'}</div>
                                  </div>
                                </td>
                                <td className="p-4 max-w-[150px] min-w-[120px]">
                                  <div>{item.cidOrigem || '-'} - {item.ufOrigem || '-'}</div>
                                </td>
                                <td className="p-4 max-w-[150px] min-w-[120px]">
                                  <div>{item.cidDestino || '-'} - {item.ufDestino || '-'}</div>
                                </td>
                                <td className="p-4 max-w-[120px] min-w-[100px]">
                                  <div>{item.emissao ? new Date(item.emissao).toLocaleDateString('pt-BR') : '-'}</div>
                                </td>
                                <td className="p-4 max-w-[100px] min-w-[80px]">
                                  <div>R$ {item.vlrTotal != null ? item.vlrTotal.toFixed(2) : '0.00'}</div>
                                </td>
                                <td className="p-4 max-w-[100px] min-w-[80px]">
                                  <div>{item.peso != null ? `${item.peso} kg` : '-'}</div>
                                </td>
                                 <td className="p-4 w-[140px]">
                                   <Badge className={`${getStatusDisplay(item).className} text-xs truncate max-w-full block`}>
                                     {getStatusDisplay(item).text}
                                   </Badge>
                                 </td>
                                 <td className="p-4 w-[140px]">
                                   <div className="text-xs truncate">{item.tipoServico || '-'}</div>
                                 </td>
                                  <td className="p-4 max-w-[120px] min-w-[100px]">
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 px-2" 
                                        title="Ver Detalhes"
                                        onClick={() => handleViewDetails(item)}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      {item.doc === 'CTE' && (
                                        <>
                                          <PermissionGuard permissions="admin.nfe.xml">
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="h-8 px-2" 
                                              title="Baixar XML"
                                              onClick={() => handleDownloadXml(item.idConhecimento, item.nroConhec)}
                                            >
                                              <Download className="h-3 w-3" />
                                            </Button>
                                          </PermissionGuard>
                                          <PermissionGuard permissions={["admin.nfe.pdf", "admin.nfe.imprimir"]}>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="h-8 px-2" 
                                              title="Baixar PDF"
                                              onClick={() => handleDownloadPdf(item.idConhecimento, item.nroConhec)}
                                            >
                                              <FileText className="h-3 w-3" />
                                            </Button>
                                          </PermissionGuard>
                                         </>
                                       )}
                                     </div>
                                  </td>
                              </tr>
                            )))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Controles de Paginação */}
                    {totalItems > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-primary/10 bg-muted/30">
                        <div className="text-sm text-muted-foreground">
                          Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} registros
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="h-8 px-2"
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="h-8 px-2"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-1 px-2">
                            <span className="text-sm font-medium">{currentPage}</span>
                            <span className="text-sm text-muted-foreground">de</span>
                            <span className="text-sm font-medium">{totalPages || 1}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-8 px-2"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-8 px-2"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
        )}

        {/* Legenda de Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
              Legenda de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-200 dark:bg-purple-800/50"></div>
                <span className="text-xs text-muted-foreground">No Armazém Origem</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-200 dark:bg-orange-800/50"></div>
                <span className="text-xs text-muted-foreground">Em Viagem/Transferência</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-200 dark:bg-blue-800/50"></div>
                <span className="text-xs text-muted-foreground">Centro Distribuição</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-200 dark:bg-sky-800/50"></div>
                <span className="text-xs text-muted-foreground">Saída p/ Entrega</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-200 dark:bg-green-800/50"></div>
                <span className="text-xs text-muted-foreground">Entrega Realizada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-200 dark:bg-red-800/50"></div>
                <span className="text-xs text-muted-foreground">Finalizada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modais de Seleção */}
        <SelectRegisterModal
          open={clienteModalOpen}
          onOpenChange={setClienteModalOpen}
          onSelect={(cadastro) => setFiltros({
            ...filtros, 
            cliente: cadastro.idCliente.toString(),
            clienteNome: cadastro.nome
          })}
          title="Selecionar Cliente"
        />
        <SelectRegisterModal
          open={remetenteModalOpen}
          onOpenChange={setRemetenteModalOpen}
          onSelect={(cadastro) => setFiltros({
            ...filtros, 
            remetente: cadastro.idCliente.toString(),
            remetenteNome: cadastro.nome
          })}
          title="Selecionar Remetente"
        />
        <SelectRegisterModal
          open={destinatarioModalOpen}
          onOpenChange={setDestinatarioModalOpen}
          onSelect={(cadastro) => setFiltros({
            ...filtros, 
            destinatario: cadastro.idCliente.toString(),
            destinatarioNome: cadastro.nome
          })}
          title="Selecionar Destinatário"
        />
        
        <NFeDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          data={selectedNFe}
        />
      </motion.div>
    </>
  );
};

export default ConsultarNFe;
