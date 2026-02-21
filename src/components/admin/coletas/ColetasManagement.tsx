import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  RefreshCw, 
  Truck, 
  Package, 
  MapPin, 
  Calendar, 
  User, 
  Filter, 
  Search, 
  Eye, 
  Clock,
  Building2,
  TrendingUp,
  Activity,
  Hash,
  CreditCard,
  CalendarIcon,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSupabaseColetas } from '@/hooks/useSupabaseColetas';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { authActivityLogService } from '@/services/auth/activityLogService';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import PageHeader from '../PageHeader';
import ViewColetaModal from './ViewColetaModal';

const ColetasManagement = () => {
  const [filtros, setFiltros] = useState({
    empresa: 'all',
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
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [selectedColeta, setSelectedColeta] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const { coletas, isLoading, stats, buscarColetas } = useSupabaseColetas();
  const { notify } = useCustomNotifications();
  const { user } = useUnifiedAuth();

  const handleBuscar = () => {
    buscarColetas(filtros);
  };

  const handleRefresh = async () => {
    try {
      await buscarColetas(filtros);
      
      // Log da atividade de atualização
      if (user?.id) {
        await authActivityLogService.logActivity({
          usuario_id: user.id,
          acao: 'coletas_atualizadas',
          modulo: 'coletas',
          detalhes: {
            acao: 'refresh_dados',
            filtros_aplicados: filtros
          }
        });
      }
      
      notify.success('Dados Atualizados', 'Coletas recarregadas com sucesso');
    } catch (error) {
      notify.error('Erro', 'Falha ao atualizar coletas');
      console.error('Erro ao atualizar coletas:', error);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      empresa: 'all',
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
    setDataInicio(undefined);
    setDataFim(undefined);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      'Pendente': { variant: 'secondary', icon: '⏳', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      'Implantado': { variant: 'default', icon: '🚀', color: 'bg-green-50 text-green-700 border-green-200' }
    };
    
    const config = configs[status as keyof typeof configs] || configs['Pendente'];
    
    return (
      <Badge className={`${config.color} border font-medium`}>
        <span className="mr-1">{config.icon}</span>
        {status}
      </Badge>
    );
  };

  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'Coletas' }
  ];

  const actions = (
    <div className="flex items-center gap-3">
      <Button
        onClick={() => setFiltrosAbertos(!filtrosAbertos)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 hover:bg-slate-50"
      >
        <Filter className="h-4 w-4" />
        Filtros
      </Button>
      <Button
        onClick={handleRefresh}
        disabled={isLoading}
        size="sm"
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Atualizar
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <PageHeader
        title="Gestão de Coletas"
        subtitle="Controle inteligente de coletas e entregas"
        icon={Truck}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Section com estatísticas */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Truck className="h-6 w-6" />
                </div>
                Central de Coletas
              </h2>
              <p className="text-blue-100 text-lg">
                Monitore e gerencie todas as solicitações de coleta em tempo real
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full lg:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-blue-100 text-sm">Total</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-200">{stats.pendentes}</div>
                <div className="text-blue-100 text-sm">Pendentes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-200">{stats.implantadas}</div>
                <div className="text-blue-100 text-sm">Implantadas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
          <CollapsibleContent>
            <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Search className="h-5 w-5" />
                  Filtros Avançados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* ID da Coleta */}
                  <div className="space-y-2">
                    <Label htmlFor="id" className="text-slate-600 font-medium flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Número da Coleta
                    </Label>
                    <Input
                      id="numeroColeta"
                      placeholder="Digite o número da coleta..."
                      value={filtros.numeroColetaInicial}
                      onChange={(e) => handleFilterChange('numeroColetaInicial', e.target.value)}
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Remetente e Destinatário lado a lado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Remetente */}
                    <div className="space-y-2">
                      <Label htmlFor="remetente" className="text-slate-600 font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Remetente
                      </Label>
                      <Input
                        id="remetente"
                        placeholder="Nome ou CPF/CNPJ do remetente..."
                        value={filtros.remetente}
                        onChange={(e) => handleFilterChange('remetente', e.target.value)}
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Destinatário */}
                    <div className="space-y-2">
                      <Label htmlFor="destinatario" className="text-slate-600 font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Destinatário
                      </Label>
                      <Input
                        id="destinatario"
                        placeholder="Nome ou CPF/CNPJ do destinatário..."
                        value={filtros.destinatario}
                        onChange={(e) => handleFilterChange('destinatario', e.target.value)}
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Situação
                    </Label>
                    <Select value={filtros.situacao} onValueChange={(value) => handleFilterChange('situacao', value)}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="Pendente">⏳ Pendente</SelectItem>
                        <SelectItem value="Implantado">🚀 Implantado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data Inicial */}
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-medium flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Data Inicial
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-slate-200 focus:border-blue-500",
                            !dataInicio && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dataInicio}
                          onSelect={(date) => {
                            setDataInicio(date);
                            handleFilterChange('dataInicio', date ? format(date, 'yyyy-MM-dd') : '');
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Data Final */}
                  <div className="space-y-2">
                    <Label className="text-slate-600 font-medium flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Data Final
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-slate-200 focus:border-blue-500",
                            !dataFim && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dataFim}
                          onSelect={(date) => {
                            setDataFim(date);
                            handleFilterChange('dataFim', date ? format(date, 'yyyy-MM-dd') : '');
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-slate-500">
                    {coletas.length > 0 && (
                      <span>
                        {coletas.length} coleta{coletas.length !== 1 ? 's' : ''} encontrada{coletas.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <Button 
                    onClick={limparFiltros} 
                    variant="outline" 
                    size="sm"
                    className="hover:bg-slate-50"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Lista de Coletas */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-t-lg border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Activity className="h-5 w-5" />
                Solicitações de Coleta
                <Badge variant="secondary" className="ml-2">
                  {coletas.length} itens
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                    <Truck className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-slate-600 font-medium">Carregando coletas...</p>
                  <p className="text-slate-400 text-sm">Aguarde um momento</p>
                </div>
              </div>
            ) : coletas.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-slate-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Truck className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Nenhuma coleta encontrada
                </h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Não foram encontradas solicitações de coleta que correspondam aos filtros aplicados.
                </p>
                <Button 
                  onClick={handleRefresh} 
                  variant="outline"
                  className="hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar Dados
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[700px]">
                <div className="p-6 space-y-4">
                  {coletas.map((coleta, index) => (
                    <motion.div
                      key={coleta.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
                            <Package className="h-6 w-6 text-blue-600" />
                          </div>
                          
                          <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-slate-800 text-lg">#{coleta.id}</h3>
                              {getStatusBadge(coleta.status)}
                              <Badge variant="outline" className="text-slate-600 border-slate-300">
                                📦 Coleta
                              </Badge>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-4">
                              <div className="flex items-center gap-2 text-slate-600 mb-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">Solicitado por:</span>
                              </div>
                              <div className="font-semibold text-slate-800">{coleta.solicitante_nome}</div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Building2 className="h-4 w-4" />
                                  <span className="font-medium">Origem</span>
                                </div>
                                <div className="pl-6 space-y-1">
                                  <div className="font-semibold text-slate-800">{coleta.remetente}</div>
                                  <div className="text-slate-600 text-sm">
                                    📍 {coleta.remetente_cidade}, {coleta.remetente_bairro}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <MapPin className="h-4 w-4" />
                                  <span className="font-medium">Destino</span>
                                </div>
                                <div className="pl-6 space-y-1">
                                  <div className="font-semibold text-slate-800">{coleta.destinatario}</div>
                                  <div className="text-slate-600 text-sm">
                                    📍 {coleta.destinatario_cidade}, {coleta.destinatario_bairro}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm flex-wrap">
                              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                                <Package className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-800 font-medium">{coleta.mercadoria_descricao}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <span className="text-green-800 font-medium">
                                  {new Date(coleta.criado_em).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              
                              {(() => {
                                const { mercadoria_comprimento, mercadoria_largura, mercadoria_altura, mercadoria_quantidade } = coleta;
                                if (mercadoria_comprimento && mercadoria_largura && mercadoria_altura && mercadoria_quantidade &&
                                    Number(mercadoria_comprimento) > 0 && Number(mercadoria_largura) > 0 && Number(mercadoria_altura) > 0 && Number(mercadoria_quantidade) > 0) {
                                  // Dimensões em cm, convertendo para m³: (cm³ / 1.000.000) * quantidade
                                  const volumeUnitario = (Number(mercadoria_comprimento) * Number(mercadoria_largura) * Number(mercadoria_altura)) / 1000000;
                                  const volumeTotal = volumeUnitario * Number(mercadoria_quantidade);
                                  return (
                                    <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                                      <TrendingUp className="h-4 w-4 text-purple-600" />
                                      <span className="text-purple-800 font-medium">{volumeTotal.toFixed(6)} m³</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              
                              {coleta.nota_fiscal && (
                                <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg">
                                  <FileText className="h-4 w-4 text-amber-600" />
                                  <span className="text-amber-800 font-medium">NFe: {coleta.nota_fiscal}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            onClick={() => {
                              setSelectedColeta(coleta);
                              setModalOpen(true);
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <ViewColetaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        coleta={selectedColeta}
        onStatusUpdate={handleBuscar}
      />
    </div>
  );
};

export default ColetasManagement;