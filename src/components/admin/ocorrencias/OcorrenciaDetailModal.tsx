import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ocorrencia, TIPO_OCORRENCIA_LABELS, STATUS_OCORRENCIA_LABELS, LABELS_CAMPOS, CAMPOS_OBRIGATORIOS, TipoOcorrencia } from '@/types/ocorrencias';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import OcorrenciaStatusSelect from './OcorrenciaStatusSelect';
import OcorrenciaFotosGallery from './OcorrenciaFotosGallery';
import OcorrenciaEditForm from './OcorrenciaEditForm';
import { useOcorrenciaLogs } from '@/hooks/useOcorrenciaLogs';
import { Clock, User, FileEdit, Phone, UserCircle } from 'lucide-react';
import { formatPhone } from '@/utils/phone';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

interface OcorrenciaDetailModalProps {
  ocorrencia: Ocorrencia | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: any, oldStatus: any) => void;
  onAddObservacao: (id: string, observacao: string) => void;
  onEditOcorrencia: (id: string, dados: Partial<Ocorrencia>, dadosAnteriores: Partial<Ocorrencia>) => void;
  isUpdating?: boolean;
}

const OcorrenciaDetailModal = ({
  ocorrencia,
  open,
  onClose,
  onStatusChange,
  onEditOcorrencia,
  isUpdating
}: OcorrenciaDetailModalProps) => {
  const { canAccess } = usePermissionGuard();
  const canEditStatus = canAccess('admin.ocorrencias.alterar_status');
  const canEdit = canAccess('admin.ocorrencias.editar');
  const queryClient = useQueryClient();

  const { logs, isLoading: isLoadingLogs } = useOcorrenciaLogs(ocorrencia?.id || '');

  // Atualiza o modal quando os dados mudam
  useEffect(() => {
    if (open && ocorrencia?.id) {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
    }
  }, [ocorrencia?.status, open, ocorrencia?.id, queryClient]);

  if (!ocorrencia) return null;

  const handleSaveEdit = (dados: Partial<Ocorrencia>) => {
    const camposPermitidos = CAMPOS_OBRIGATORIOS[ocorrencia.tipo_ocorrencia as TipoOcorrencia];
    const dadosAnteriores: Record<string, any> = {};
    
    camposPermitidos.forEach(campo => {
      const key = campo as keyof Ocorrencia;
      dadosAnteriores[campo] = ocorrencia[key];
    });

    onEditOcorrencia(ocorrencia.id, dados, dadosAnteriores);
  };

  const renderCampoInfo = (campo: string, valor: any) => {
    // Se for nome_recebedor e estiver vazio, usar o valor de responsavel
    if (campo === 'nome_recebedor' && !valor && ocorrencia.responsavel) {
      valor = ocorrencia.responsavel;
    }
    
    if (!valor && valor !== 0) return null;
    
    const label = LABELS_CAMPOS[campo] || campo;
    
    return (
      <div key={campo} className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm">{String(valor)}</p>
      </div>
    );
  };

  const camposExibir = CAMPOS_OBRIGATORIOS[ocorrencia.tipo_ocorrencia as TipoOcorrencia];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl">
              {TIPO_OCORRENCIA_LABELS[ocorrencia.tipo_ocorrencia]}
            </DialogTitle>
            <Badge className={getStatusColor(ocorrencia.status)} variant="outline">
              {STATUS_OCORRENCIA_LABELS[ocorrencia.status]}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="editar" disabled={!canEdit}>
              <FileEdit className="h-4 w-4 mr-2" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="detalhes" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">ID da Ocorrência</p>
                    <p className="text-sm font-mono text-xs">{ocorrencia.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(ocorrencia.status)} variant="outline">
                      {STATUS_OCORRENCIA_LABELS[ocorrencia.status]}
                    </Badge>
                  </div>
                  {ocorrencia.criado_em && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Criado em</p>
                      <p className="text-sm">{format(new Date(ocorrencia.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  )}
                  {ocorrencia.atualizado_em && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Atualizado em</p>
                      <p className="text-sm">{format(new Date(ocorrencia.atualizado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  )}
                  {ocorrencia.contato && (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <UserCircle className="h-4 w-4" />
                          Nome do Usuário
                        </p>
                        <p className="text-sm">{ocorrencia.contato.nome}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          Telefone
                        </p>
                        <p className="text-sm">{formatPhone(ocorrencia.contato.telefone)}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalhes da Ocorrência</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {camposExibir.map(campo => renderCampoInfo(campo, ocorrencia[campo as keyof Ocorrencia]))}
                  {ocorrencia.descricao && renderCampoInfo('descricao', ocorrencia.descricao)}
                </CardContent>
              </Card>

              {ocorrencia.fotos && ocorrencia.fotos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Fotos Anexadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OcorrenciaFotosGallery fotos={ocorrencia.fotos} />
                  </CardContent>
                </Card>
              )}

              {canEditStatus && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Alterar Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OcorrenciaStatusSelect
                      currentStatus={ocorrencia.status}
                      onStatusChange={(newStatus) => onStatusChange(ocorrencia.id, newStatus, ocorrencia.status)}
                      disabled={isUpdating}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="editar" className="mt-0">
              {canEdit ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Editar Ocorrência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OcorrenciaEditForm
                      ocorrencia={ocorrencia}
                      onSave={handleSaveEdit}
                      isUpdating={isUpdating || false}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Você não tem permissão para editar ocorrências
                </div>
              )}
            </TabsContent>

            <TabsContent value="historico" className="mt-0">
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma atividade registrada
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {log.usuario?.nome || 'Usuário desconhecido'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">
                            {log.tipo_de_acao.replace(/_/g, ' ')}
                          </div>
                          
                          {log.dados_anteriores && Object.keys(log.dados_anteriores).length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Dados Anteriores:</p>
                              <div className="bg-muted/50 rounded p-2 text-xs">
                                {Object.entries(log.dados_anteriores).map(([key, value]) => (
                                  <div key={key} className="flex gap-2">
                                    <span className="font-medium">{LABELS_CAMPOS[key] || key}:</span>
                                    <span className="text-muted-foreground">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {log.dados_novos && Object.keys(log.dados_novos).length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">Dados Novos:</p>
                              <div className="bg-primary/5 rounded p-2 text-xs">
                                {Object.entries(log.dados_novos).map(([key, value]) => (
                                  <div key={key} className="flex gap-2">
                                    <span className="font-medium">{LABELS_CAMPOS[key] || key}:</span>
                                    <span className="text-foreground">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    em_analise: 'bg-blue-100 text-blue-800 border-blue-300',
    resolvido: 'bg-green-100 text-green-800 border-green-300',
    cancelado: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

export default OcorrenciaDetailModal;
