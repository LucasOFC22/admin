import { useState } from 'react';
import { formatDateTime } from '@/utils/dateFormatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  Filter,
  Download,
  Eye,
  Calendar,
  FileText,
  User
} from 'lucide-react';

interface ErroEnvio {
  id: string;
  endpoint?: string;
  erro?: string;
  formType?: string;
  status: 'pendente' | 'processando' | 'resolvido' | 'erro';
  createdAt?: string;
  timestamp?: any;
}

const ErrosEnvioContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Mock data para demonstração
  const mockErros: ErroEnvio[] = [
    {
      id: '1',
      endpoint: '/api/cotacoes',
      erro: 'Timeout na conexão',
      formType: 'cotacao',
      status: 'pendente',
      createdAt: new Date().toISOString(),
      timestamp: new Date()
    },
    {
      id: '2',
      endpoint: '/api/coletas',
      erro: 'Dados inválidos',
      formType: 'coleta',
      status: 'erro',
      createdAt: new Date().toISOString(),
      timestamp: new Date()
    }
  ];

  const erros = mockErros;

  const filteredErros = erros.filter(erro => {
    const matchesSearch = searchTerm === '' || 
      erro.endpoint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      erro.erro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      erro.formType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || erro.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ErroEnvio['status']) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'processando':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolvido':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'erro':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: ErroEnvio['status']) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'processando':
        return 'Processando';
      case 'resolvido':
        return 'Resolvido';
      case 'erro':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  const formatDate = (timestamp: any) => formatDateTime(timestamp);

  // Estatísticas básicas
  const stats = {
    total: erros.length,
    pendentes: erros.filter(e => e.status === 'pendente').length,
    processando: erros.filter(e => e.status === 'processando').length,
    resolvidos: erros.filter(e => e.status === 'resolvido').length,
    erros: erros.filter(e => e.status === 'erro').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pendentes}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Processando</p>
                <p className="text-2xl font-bold text-blue-700">{stats.processando}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Resolvidos</p>
                <p className="text-2xl font-bold text-green-700">{stats.resolvidos}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Erros</p>
                <p className="text-2xl font-bold text-red-700">{stats.erros}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por endpoint, erro ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="processando">Processando</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="erro">Erro</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Erros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Erros de Envio ({filteredErros.length})
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredErros.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum erro encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há erros de envio registrados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredErros.map((erro) => (
                <div
                  key={erro.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={`px-2 py-1 text-xs ${getStatusColor(erro.status)}`}>
                          {getStatusText(erro.status)}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(erro.timestamp)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-500">Tipo de Formulário</p>
                            <p className="font-medium text-sm">{erro.formType || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-500">Endpoint</p>
                            <p className="font-medium text-sm">{erro.endpoint || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <div>
                            <p className="text-xs text-gray-500">Erro</p>
                            <p className="font-medium text-sm truncate">
                              {erro.erro || 'Erro desconhecido'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrosEnvioContent;