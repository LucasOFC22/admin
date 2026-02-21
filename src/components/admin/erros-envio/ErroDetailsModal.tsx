
import { useState } from 'react';
import { formatDateTime } from '@/utils/dateFormatters';
import { AdminDialog, AdminDialogContent, AdminDialogHeader, AdminDialogTitle } from '@/components/admin/ui/AdminDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Calendar, 
  FileText, 
  User, 
  Code,
  Save,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { ErroEnvio, updateErroStatus, deleteErro } from '@/services/n8n/errorService';
import { toast } from '@/lib/toast';

interface ErroDetailsModalProps {
  erro: ErroEnvio | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const ErroDetailsModal = ({ erro, open, onOpenChange, onUpdate }: ErroDetailsModalProps) => {
  const [newStatus, setNewStatus] = useState<ErroEnvio['status']>('pendente');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!erro) return null;

  const formatDate = (timestamp: any) => formatDateTime(timestamp);

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

  const handleUpdateStatus = async () => {
    if (!erro.id) return;
    
    setIsUpdating(true);
    try {
      await updateErroStatus(erro.id, newStatus);
      toast.success('Status do erro atualizado com sucesso');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error('Não foi possível atualizar o status do erro');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!erro.id) return;
    
    setIsDeleting(true);
    try {
      await deleteErro(erro.id);
      toast.success('Erro excluído com sucesso');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error('Não foi possível excluir o erro');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminDialog open={open} onOpenChange={onOpenChange}>
      <AdminDialogContent className="max-w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[85vh] overflow-y-auto">
        <AdminDialogHeader>
          <AdminDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            Detalhes do Erro de Envio
          </AdminDialogTitle>
        </AdminDialogHeader>

        <div className="space-y-6">
          {/* Status e Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Informações Gerais
                <Badge className={`px-3 py-1 ${getStatusColor(erro.status)}`}>
                  {erro.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Data do Erro</p>
                    <p className="font-medium">{formatDate(erro.timestamp)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Formulário</p>
                    <p className="font-medium">{erro.formType || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Endpoint</p>
                    <p className="font-medium">{erro.endpoint || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Mensagem de Erro</p>
                    <p className="font-medium text-red-600">{erro.erro || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payload */}
          {erro.payload && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Dados do Payload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                    {typeof erro.payload === 'string' 
                      ? erro.payload 
                      : JSON.stringify(erro.payload, null, 2)
                    }
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Atualizar Status */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Atualizar Status
                    </label>
                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ErroEnvio['status'])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="processando">Processando</SelectItem>
                        <SelectItem value="resolvido">Resolvido</SelectItem>
                        <SelectItem value="erro">Erro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleUpdateStatus}
                    disabled={isUpdating || newStatus === erro.status}
                    className="mt-6 w-full sm:w-auto min-h-[44px]"
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Atualizar
                  </Button>
                </div>

                {/* Excluir */}
                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full min-h-[44px]"
                  >
                    {isDeleting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Excluir Erro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminDialogContent>
    </AdminDialog>
  );
};

export default ErroDetailsModal;
