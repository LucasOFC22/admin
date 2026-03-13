import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, CheckCircle, XCircle, Clock, List, Grid3x3, Loader2, FileText, Printer, Copy, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminTab } from '@/config/adminSidebarConfig';
import { ContasReceberFilters, ContasReceberFiltros } from '@/components/admin/contas-receber/ContasReceberFilters';
import { useNotification } from '@/hooks/useCustomNotifications';
import { downloadPdf } from '@/lib/download-utils';
import { EmpresaSelector } from '@/components/admin/EmpresaSelector';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { ContaReceberCard } from '@/components/admin/contas-receber/ContaReceberCard';
import { DetalhesContaModal } from '@/components/admin/contas-receber/DetalhesContaModal';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { formatDateOnly } from '@/utils/dateFormatters';
import { backendService } from '@/services/api/backendService';

interface ContaReceber {
  doc: string;
  emissao: string;
  vencimento: string;
  dataPagamento?: string;
  valorPago?: number;
  juros?: number;
  valorTitulo: number;
  pago: string;
  saldo: number;
  docCliente: string;
  cliente: string;
  contaRecebimento?: string;
  nossonumero?: string;
  boleto?: string;
  idBoleto?: number;
  status: string;
  linhadigitavel?: string;
  ctes?: string;
  idTitulo: number;
}

const ContasReceber = () => {
  const { success, error } = useNotification();
  const { logActivity } = useActivityLogger();
  const [activeTab, setActiveTab] = useState<AdminTab>('contas-receber');
  const [hasSearched, setHasSearched] = useState(false);
  // Default para cards em mobile, table em desktop
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadType, setDownloadType] = useState<'fatura' | 'boleto' | 'todas-faturas' | 'todos-boletos' | null>(null);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaReceber | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filtros, setFiltros] = useState<ContasReceberFiltros>({
    empresa: 'all',
    idCliente: '',
    clienteNome: '',
    dataEmissaoInicio: '',
    dataEmissaoFim: '',
    dataVencimentoInicio: '',
    dataVencimentoFim: '',
    dataPagamentoInicio: '',
    dataPagamentoFim: '',
    numeroFaturaInicio: '',
    numeroFaturaFim: '',
    numeroCTE: '',
    valorMinimo: '',
    valorMaximo: '',
    status: 'todos',
    apenasBoleto: false,
  });

  useEffect(() => {
    logActivity({
      acao: 'pagina_visualizada',
      modulo: 'contas-receber',
      detalhes: { pagina: 'contas_receber' }
    });
  }, [logActivity]);

  const getStatusBadge = (status: string) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'liquidado':
      case 'pago':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Liquidado
          </Badge>
        );
      case 'aberto':
      case 'pendente':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Clock className="h-3 w-3 mr-1" />
            Aberto
          </Badge>
        );
      case 'atrasado':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Atrasado
          </Badge>
        );
      default:
        return null;
    }
  };

  // formatCurrency imported from @/lib/formatters

  const formatDate = (dateString: string) => {
    return formatDateOnly(dateString);
  };

  const formatCTEs = (ctes?: string) => {
    if (!ctes) return '-';
    const ctesList = ctes.split('/').map(c => c.trim()).filter(c => c);
    if (ctesList.length === 0) return '-';
    if (ctesList.length <= 3) return ctesList.join(', ');
    return ctesList.slice(0, 3).join(', ') + '...';
  };

  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const parseCurrency = (value: number): number => {
    return value;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedContas = () => {
    if (!sortColumn) return contasReceber;

    const sorted = [...contasReceber].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'doc':
          aValue = a.doc;
          bValue = b.doc;
          break;
        case 'cliente':
          aValue = a.cliente;
          bValue = b.cliente;
          break;
        case 'ctes':
          aValue = a.ctes || '';
          bValue = b.ctes || '';
          break;
        case 'emissao':
          aValue = parseDate(formatDate(a.emissao)).getTime();
          bValue = parseDate(formatDate(b.emissao)).getTime();
          break;
        case 'vencimento':
          aValue = parseDate(formatDate(a.vencimento)).getTime();
          bValue = parseDate(formatDate(b.vencimento)).getTime();
          break;
        case 'dataPagamento':
          aValue = a.dataPagamento ? parseDate(formatDate(a.dataPagamento)).getTime() : 0;
          bValue = b.dataPagamento ? parseDate(formatDate(b.dataPagamento)).getTime() : 0;
          break;
        case 'valorTitulo':
          aValue = parseCurrency(a.valorTitulo);
          bValue = parseCurrency(b.valorTitulo);
          break;
        case 'valorPago':
          aValue = parseCurrency(a.valorPago || 0);
          bValue = parseCurrency(b.valorPago || 0);
          break;
        case 'saldo':
          aValue = parseCurrency(a.saldo);
          bValue = parseCurrency(b.saldo);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const filteredContas = getSortedContas();

  const totalPendente = contasReceber
    .filter(c => c.status && ['pendente', 'aberto'].includes(c.status.toLowerCase()))
    .reduce((sum, c) => sum + (c.saldo ?? c.valorTitulo ?? 0), 0);

  const totalAtrasado = contasReceber
    .filter(c => c.status && c.status.toLowerCase() === 'atrasado')
    .reduce((sum, c) => sum + (c.saldo ?? c.valorTitulo ?? 0), 0);

  const totalRecebido = contasReceber
    .filter(c => c.status && ['pago', 'liquidado'].includes(c.status.toLowerCase()))
    .reduce((sum, c) => sum + (c.valorPago || 0), 0);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    
    await logActivity({
      acao: 'contas_receber_busca_realizada',
      modulo: 'contas-receber',
      detalhes: { filtros: filtros }
    });
    
    try {
      // Criar objeto de filtros apenas com valores não vazios
      const filtrosLimpos: Record<string, any> = {};
      
      if (filtros.idCliente) filtrosLimpos.id_cliente = filtros.idCliente;
      if (filtros.dataEmissaoInicio) filtrosLimpos.emissao_inicio = filtros.dataEmissaoInicio;
      if (filtros.dataEmissaoFim) filtrosLimpos.emissao_fim = filtros.dataEmissaoFim;
      if (filtros.dataVencimentoInicio) filtrosLimpos.vencimento_inicio = filtros.dataVencimentoInicio;
      if (filtros.dataVencimentoFim) filtrosLimpos.vencimento_fim = filtros.dataVencimentoFim;
      if (filtros.dataPagamentoInicio) filtrosLimpos.pagamento_inicio = filtros.dataPagamentoInicio;
      if (filtros.dataPagamentoFim) filtrosLimpos.pagamento_fim = filtros.dataPagamentoFim;
      if (filtros.numeroFaturaInicio) filtrosLimpos.doc_inicio = filtros.numeroFaturaInicio;
      if (filtros.numeroFaturaFim) filtrosLimpos.doc_fim = filtros.numeroFaturaFim;
      if (filtros.numeroCTE) filtrosLimpos.nro_cte = filtros.numeroCTE;
      if (filtros.valorMinimo) filtrosLimpos.valor_titulo_inicio = parseFloat(filtros.valorMinimo);
      if (filtros.valorMaximo) filtrosLimpos.valor_titulo_fim = parseFloat(filtros.valorMaximo);
      if (filtros.status && filtros.status !== 'todos') filtrosLimpos.status_titulo = filtros.status;
      if (filtros.apenasBoleto) filtrosLimpos.apenas_boleto = filtros.apenasBoleto;
      if (filtros.empresa && filtros.empresa !== 'all') filtrosLimpos.empresas = filtros.empresa;

      // Usar backendService centralizado
      const response = await backendService.buscarContasReceber(filtrosLimpos);
      
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar contas');
      }

      // Normalizar a resposta - o N8N pode retornar em diferentes formatos
      let dados: ContaReceber[] = [];
      
      // Caso 1: response.data é um array de objetos {success, data}
      if (Array.isArray(response.data) && response.data.length > 0 && response.data[0]?.success !== undefined) {
        const wrapper = response.data[0];
        if (wrapper.success && Array.isArray(wrapper.data)) {
          dados = wrapper.data;
        }
      }
      // Caso 2: response.data é diretamente um array de contas
      else if (Array.isArray(response.data)) {
        dados = response.data;
      } 
      // Caso 3: response.data tem propriedade data
      else if (response.data?.data && Array.isArray(response.data.data)) {
        dados = response.data.data;
      }
      
      setContasReceber(dados);
      setHasSearched(true);
      
      if (dados.length === 0) {
        error('Nenhum registro encontrado', 'Tente ajustar os filtros da busca');
      } else {
        await logActivity({
          acao: 'contas_receber_busca_sucesso',
          modulo: 'contas-receber',
          detalhes: {
            total_registros: dados.length,
            filtros: filtrosLimpos
          }
        });
        
        success('Busca concluída', `${dados.length} registro(s) encontrado(s)`);
      }
    } catch (err) {
      console.error('Erro ao buscar contas:', err);
      error('Erro ao buscar contas', err instanceof Error ? err.message : 'Erro desconhecido');
      setContasReceber([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setHasSearched(false);
    setContasReceber([]);
  };

  const handleImprimirFatura = (conta: ContaReceber) => {
    logActivity({
      acao: 'fatura_download',
      modulo: 'contas-receber',
      detalhes: {
        titulo_id: conta.idTitulo,
        doc: conta.doc,
        cliente: conta.cliente
      }
    });
    
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
    const pdfUrl = `${baseUrl}/functions/v1/pdf-fatura/${conta.idTitulo}`;
    downloadPdf({ 
      url: pdfUrl, 
      fileName: `Fatura_${conta.doc}.pdf`,
      onStart: () => {
        setDownloadingId(conta.idTitulo);
        setDownloadType('fatura');
      },
      onEnd: () => {
        setDownloadingId(null);
        setDownloadType(null);
      }
    });
  };

  const handleImprimirBoleto = (conta: ContaReceber) => {
    if (!conta.idBoleto || conta.idBoleto === 0) {
      error('Boleto não disponível', 'Este título não possui boleto associado');
      return;
    }
    
    logActivity({
      acao: 'boleto_download',
      modulo: 'contas-receber',
      detalhes: {
        boleto_id: conta.idBoleto,
        doc: conta.doc,
        cliente: conta.cliente
      }
    });
    
    const baseUrl2 = import.meta.env.VITE_SUPABASE_URL || 'https://ulkppucdnmvyfsnarpth.supabase.co';
    const pdfUrl = `${baseUrl2}/functions/v1/pdf-boleto/${conta.idBoleto}`;
    downloadPdf({ 
      url: pdfUrl, 
      fileName: `Boleto_${conta.doc}.pdf`,
      onStart: () => {
        setDownloadingId(conta.idTitulo);
        setDownloadType('boleto');
      },
      onEnd: () => {
        setDownloadingId(null);
        setDownloadType(null);
      }
    });
  };

  const handleCopiarLinhaDigitavel = async (conta: ContaReceber) => {
    if (!conta.linhadigitavel) {
      error('Linha digitável não disponível', 'Este boleto não possui linha digitável');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(conta.linhadigitavel);
      
      await logActivity({
        acao: 'linha_digitavel_copiada',
        modulo: 'contas-receber',
        detalhes: {
          doc: conta.doc,
          cliente: conta.cliente
        }
      });
      
      success('Linha digitável copiada', 'A linha digitável foi copiada para a área de transferência');
    } catch (err) {
      error('Erro ao copiar', 'Não foi possível copiar a linha digitável');
    }
  };

  const handleVerDetalhes = (conta: ContaReceber) => {
    setSelectedConta(conta);
    setDetalhesModalOpen(true);
    
    logActivity({
      acao: 'conta_detalhes_visualizados',
      modulo: 'contas-receber',
      detalhes: {
        doc: conta.doc,
        cliente: conta.cliente,
        valor: conta.valorTitulo
      }
    });
  };

  return (
    
      <PermissionGuard 
        permissions="admin.contas-receber.visualizar"
        showMessage={true}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6"
        >
        {/* Filtros Avançados */}
        <ContasReceberFilters 
          filtros={filtros} 
          setFiltros={setFiltros}
          onSearch={handleSearch} 
          onClear={handleClear} 
        />

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Buscando contas...</span>
          </div>
        )}

        {/* Resultados - Só aparecem após buscar */}
        {hasSearched && !isLoading && (
          <>
            {/* Contador e botões de visualização */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {filteredContas.length} registro(s) encontrado(s)
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  onClick={() => setViewMode('table')}
                  className="hidden md:flex"
                >
                  <List className="h-4 w-4 mr-2" />
                  Tabela
                </Button>
                <Button 
                  size="sm"
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  onClick={() => setViewMode('cards')}
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Cards
                </Button>
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <div className="p-6 pt-6">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(contasReceber.reduce((sum, c) => sum + (c.valorTitulo ?? 0), 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                </div>
              </Card>
              <Card>
                <div className="p-6 pt-6">
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(totalRecebido)}
                  </div>
                  <p className="text-xs text-muted-foreground">Valor Pago</p>
                </div>
              </Card>
              <Card>
                <div className="p-6 pt-6">
                  <div className="text-2xl font-bold text-warning">
                    {formatCurrency(totalPendente + totalAtrasado)}
                  </div>
                  <p className="text-xs text-muted-foreground">Valor em Aberto</p>
                </div>
              </Card>
              <Card className="border-destructive/50">
                <div className="p-6 pt-6">
                  <div className="text-2xl font-bold text-destructive">
                    {formatCurrency(totalAtrasado)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valor em Atraso ({contasReceber.filter(c => c.status?.toLowerCase() === 'atrasado').length})
                  </p>
                </div>
              </Card>
              <Card>
                <div className="p-6 pt-6">
                  <div className="text-2xl font-bold">
                    {contasReceber.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Total de Contas</p>
                </div>
              </Card>
            </div>

            {/* Visualização em Cards - Mobile First */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContas.map((conta, index) => (
                  <ContaReceberCard
                    key={`${conta.idTitulo}-${conta.doc}-${index}`}
                    conta={conta}
                    onImprimirFatura={handleImprimirFatura}
                    onImprimirBoleto={handleImprimirBoleto}
                    onCopiarLinhaDigitavel={handleCopiarLinhaDigitavel}
                    onVerDetalhes={handleVerDetalhes}
                    isDownloading={downloadingId === conta.idTitulo}
                    downloadType={downloadingId === conta.idTitulo ? downloadType : null}
                  />
                ))}
              </div>
            ) : (
              /* Tabela de Contas - Desktop */
              <Card className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b transition-colors data-[state=selected]:bg-muted border-primary/20 hover:bg-primary/5">
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-primary/10 transition-all duration-200 font-semibold text-primary/90 text-left max-w-[150px]"
                          onClick={() => handleSort('doc')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">Nº Fatura</span>
                            {sortColumn === 'doc' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-primary/10 transition-all duration-200 font-semibold text-primary/90 text-left min-w-[280px]"
                          onClick={() => handleSort('cliente')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">Cliente</span>
                            {sortColumn === 'cliente' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-primary/10 transition-all duration-200 font-semibold text-primary/90 text-left min-w-[250px]"
                          onClick={() => handleSort('ctes')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">Nº CTE</span>
                            {sortColumn === 'ctes' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-primary/10 transition-all duration-200 font-semibold text-primary/90 text-left max-w-[150px]"
                          onClick={() => handleSort('emissao')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">Data Emissão</span>
                            {sortColumn === 'emissao' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-primary/10 transition-all duration-200 font-semibold text-primary/90 text-left max-w-[150px]"
                          onClick={() => handleSort('vencimento')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">Data Vencimento</span>
                            {sortColumn === 'vencimento' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-primary/10 transition-all duration-200 font-semibold text-primary/90 text-left max-w-[150px]"
                          onClick={() => handleSort('dataPagamento')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">Data Pagamento</span>
                            {sortColumn === 'dataPagamento' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-primary/10 transition-all duration-200 font-semibold text-primary/90 text-right max-w-[150px]"
                          onClick={() => handleSort('valorTitulo')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">Valor Total</span>
                            {sortColumn === 'valorTitulo' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-primary/10 transition-all duration-200 font-semibold text-primary/90 text-right max-w-[150px]"
                          onClick={() => handleSort('valorPago')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">Valor Pago</span>
                            {sortColumn === 'valorPago' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-primary/10 transition-all duration-200 font-semibold text-primary/90 text-right max-w-[150px]"
                          onClick={() => handleSort('saldo')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">Valor em Aberto</span>
                            {sortColumn === 'saldo' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer select-none hover:bg-primary/10 transition-all duration-200 font-semibold text-primary/90 text-left max-w-[120px]"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">Status</span>
                            {sortColumn === 'status' && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-primary/90 text-left max-w-[100px]">
                          <div className="flex items-center justify-between">
                            <span className="truncate">Ações</span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContas.map((conta, index) => (
                        <TableRow key={`${conta.idTitulo}-${conta.doc}-${index}`}>
                          <TableCell className="font-medium">{conta.doc}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{conta.cliente}</span>
                              <span className="text-xs text-muted-foreground">{conta.docCliente}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground min-w-[250px]">{formatCTEs(conta.ctes)}</TableCell>
                          <TableCell>{formatDate(conta.emissao)}</TableCell>
                          <TableCell>{formatDate(conta.vencimento)}</TableCell>
                          <TableCell>{conta.dataPagamento ? formatDate(conta.dataPagamento) : '-'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(conta.valorTitulo)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(conta.valorPago || 0)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(conta.saldo)}
                          </TableCell>
                          <TableCell>{getStatusBadge(conta.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleVerDetalhes(conta)}>
                                  <Info className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleImprimirFatura(conta)}
                                  disabled={downloadingId === conta.idTitulo && downloadType === 'fatura'}
                                >
                                  {downloadingId === conta.idTitulo && downloadType === 'fatura' ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <FileText className="h-4 w-4 mr-2" />
                                  )}
                                  {downloadingId === conta.idTitulo && downloadType === 'fatura' ? 'Baixando...' : 'Imprimir Fatura'}
                                </DropdownMenuItem>
                                {(conta.idBoleto !== undefined && conta.idBoleto !== null && conta.idBoleto !== 0) && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => handleImprimirBoleto(conta)}
                                      disabled={downloadingId === conta.idTitulo && downloadType === 'boleto'}
                                    >
                                      {downloadingId === conta.idTitulo && downloadType === 'boleto' ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Printer className="h-4 w-4 mr-2" />
                                      )}
                                      {downloadingId === conta.idTitulo && downloadType === 'boleto' ? 'Baixando...' : 'Imprimir Boleto'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCopiarLinhaDigitavel(conta)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copiar Linha Digitável
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Detalhes Modal */}
        <DetalhesContaModal
          open={detalhesModalOpen}
          onOpenChange={setDetalhesModalOpen}
          conta={selectedConta}
        />

      </motion.div>
      </PermissionGuard>
    
  );
};

export default ContasReceber;
