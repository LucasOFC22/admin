import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/client-dashboard/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  MapPin,
  Calendar,
  Truck,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from '@/hooks/useAuthState';
import ConhecimentoCard from '@/components/conhecimentos/ConhecimentoCard';
import ConhecimentoDetailsModal from '@/components/conhecimentos/ConhecimentoDetailsModal';
import ConhecimentoFilters from '@/components/conhecimentos/ConhecimentoFilters';

export interface Conhecimento {
  id: string;
  numero: string;
  data_emissao: string;
  origem: string;
  destino: string;
  remetente: string;
  destinatario: string;
  valor_frete: number;
  peso: number;
  volume: number;
  status: 'pendente' | 'em_transito' | 'entregue' | 'cancelado';
  nfe_numero?: string;
  previsao_entrega?: string;
  data_entrega?: string;
  observacoes?: string;
}

const Conhecimentos = () => {
  const { toast } = useToast();
  const { userEmail } = useAuthState();
  const [loading, setLoading] = useState(true);
  const [conhecimentos, setConhecimentos] = useState<Conhecimento[]>([]);
  const [filteredConhecimentos, setFilteredConhecimentos] = useState<Conhecimento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedConhecimento, setSelectedConhecimento] = useState<Conhecimento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Buscar conhecimentos do banco de dados
  useEffect(() => {
    fetchConhecimentos();
  }, [userEmail]);

  // Filtrar conhecimentos
  useEffect(() => {
    filterConhecimentos();
  }, [conhecimentos, searchTerm, selectedStatus, activeTab]);

  const fetchConhecimentos = async () => {
    try {
      setLoading(true);
      
      // Simulação de dados - Substituir por query real do Supabase
      const mockData: Conhecimento[] = [
        {
          id: '1',
          numero: 'CT-2025-001234',
          data_emissao: '2025-01-15T10:30:00',
          origem: 'Salvador, BA',
          destino: 'São Paulo, SP',
          remetente: 'Empresa ABC Ltda',
          destinatario: 'Distribuidora XYZ S.A.',
          valor_frete: 2500.00,
          peso: 1500,
          volume: 10,
          status: 'em_transito',
          nfe_numero: '12345',
          previsao_entrega: '2025-01-20T18:00:00',
          observacoes: 'Carga frágil - manusear com cuidado'
        },
        {
          id: '2',
          numero: 'CT-2025-001235',
          data_emissao: '2025-01-10T14:20:00',
          origem: 'Salvador, BA',
          destino: 'Rio de Janeiro, RJ',
          remetente: 'Indústria DEF Ltda',
          destinatario: 'Comércio GHI S.A.',
          valor_frete: 3200.00,
          peso: 2000,
          volume: 15,
          status: 'entregue',
          nfe_numero: '12346',
          previsao_entrega: '2025-01-14T16:00:00',
          data_entrega: '2025-01-14T15:30:00',
        },
        {
          id: '3',
          numero: 'CT-2025-001236',
          data_emissao: '2025-01-18T09:15:00',
          origem: 'Feira de Santana, BA',
          destino: 'Brasília, DF',
          remetente: 'Comercial JKL Ltda',
          destinatario: 'Empresa MNO S.A.',
          valor_frete: 1800.00,
          peso: 800,
          volume: 5,
          status: 'pendente',
          nfe_numero: '12347',
          previsao_entrega: '2025-01-22T17:00:00',
        },
      ];

      setConhecimentos(mockData);
    } catch (error) {
      console.error('Erro ao buscar conhecimentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os conhecimentos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterConhecimentos = () => {
    let filtered = [...conhecimentos];

    // Filtrar por status da aba
    if (activeTab !== 'all') {
      filtered = filtered.filter(c => c.status === activeTab);
    }

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.remetente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.destinatario.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status adicional
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(c => c.status === selectedStatus);
    }

    setFilteredConhecimentos(filtered);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pendente':
        return { icon: Clock, label: 'Pendente', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
      case 'em_transito':
        return { icon: TrendingUp, label: 'Em Trânsito', color: 'bg-blue-500', textColor: 'text-blue-700' };
      case 'entregue':
        return { icon: CheckCircle2, label: 'Entregue', color: 'bg-green-500', textColor: 'text-green-700' };
      case 'cancelado':
        return { icon: XCircle, label: 'Cancelado', color: 'bg-red-500', textColor: 'text-red-700' };
      default:
        return { icon: AlertCircle, label: 'Desconhecido', color: 'bg-gray-500', textColor: 'text-gray-700' };
    }
  };

  const stats = {
    total: conhecimentos.length,
    pendente: conhecimentos.filter(c => c.status === 'pendente').length,
    em_transito: conhecimentos.filter(c => c.status === 'em_transito').length,
    entregue: conhecimentos.filter(c => c.status === 'entregue').length,
    cancelado: conhecimentos.filter(c => c.status === 'cancelado').length,
  };

  const handleViewDetails = (conhecimento: Conhecimento) => {
    setSelectedConhecimento(conhecimento);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando conhecimentos...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Conhecimentos de Transporte
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe todos os seus documentos de transporte
            </p>
          </div>
          <Button onClick={fetchConhecimentos} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendente}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Trânsito</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.em_transito}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entregues</p>
                  <p className="text-2xl font-bold text-green-600">{stats.entregue}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cancelados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelado}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número, origem, destino..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_transito">Em Trânsito</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
              <TabsTrigger value="pendente">Pendentes ({stats.pendente})</TabsTrigger>
              <TabsTrigger value="em_transito">Em Trânsito ({stats.em_transito})</TabsTrigger>
              <TabsTrigger value="entregue">Entregues ({stats.entregue})</TabsTrigger>
              <TabsTrigger value="cancelado">Cancelados ({stats.cancelado})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredConhecimentos.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center space-y-4">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
                      <div>
                        <h3 className="text-lg font-semibold">Nenhum conhecimento encontrado</h3>
                        <p className="text-muted-foreground mt-2">
                          {searchTerm
                            ? 'Tente ajustar os filtros de busca'
                            : 'Não há conhecimentos nesta categoria'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredConhecimentos.map((conhecimento, index) => (
                      <ConhecimentoCard
                        key={conhecimento.id}
                        conhecimento={conhecimento}
                        index={index}
                        onViewDetails={handleViewDetails}
                        getStatusInfo={getStatusInfo}
                      />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Modal de Detalhes */}
      <ConhecimentoDetailsModal
        conhecimento={selectedConhecimento}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        getStatusInfo={getStatusInfo}
      />
    </DashboardLayout>
  );
};

export default Conhecimentos;
