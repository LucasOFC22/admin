import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  AdminDialog as Dialog, 
  AdminDialogContent as DialogContent, 
  AdminDialogDescription as DialogDescription, 
  AdminDialogFooter as DialogFooter, 
  AdminDialogHeader as DialogHeader, 
  AdminDialogTitle as DialogTitle 
} from "@/components/admin/ui/AdminDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_OPTIONS } from "./constants";
import { ensureDate } from "./utils";
import { Contato } from "./types";
import { toast } from '@/lib/toast';
import { n8nContactService as ContactService } from "@/services/n8n/contactService";

interface ViewContatoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contato: Contato | null;
  refetch: () => void;
  user: any;
}

export const ViewContatoDialog = ({ open, onOpenChange, contato, refetch, user }: ViewContatoDialogProps) => {
  const [currentStatus, setCurrentStatus] = useState<string>(contato?.status || "novo");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [autoMarkingAsRead, setAutoMarkingAsRead] = useState(false);


  // Atualizar o status local quando o contato mudar
  useEffect(() => {
    if (contato?.status) {
      setCurrentStatus(contato.status);
    }
  }, [contato?.status]);

  // Auto-marcar como lido quando o modal abrir com status "novo"
  useEffect(() => {
    const autoMarkAsRead = async () => {
      if (open && contato && contato.status === 'novo' && contato.id) {
        setAutoMarkingAsRead(true);
        
        try {
          await ContactService.updateContactStatus(contato.id, 'respondido');
          setCurrentStatus('respondido');
          
          toast.info('Contato marcado como lido automaticamente');
          
          refetch();
          
        } catch (error) {
          console.error('❌ Erro ao marcar automaticamente como lido:', error);
          
          toast.error('Não foi possível marcar automaticamente como lido');
        } finally {
          setAutoMarkingAsRead(false);
        }
      }
    };

    autoMarkAsRead();
  }, [open, contato, refetch]);

  // Função para atualizar o status do contato manualmente
  const handleStatusChange = async (statusValue: string) => {
    if (!contato?.id) {
      toast.error('ID do contato não encontrado');
      return;
    }

    setIsUpdatingStatus(true);
    
    try {
      await ContactService.updateContactStatus(contato.id, statusValue as 'novo' | 'respondido' | 'processando' | 'arquivado');
      
      setCurrentStatus(statusValue);
      
      const statusLabel = STATUS_OPTIONS.find(opt => opt.value === statusValue)?.label || statusValue;
      
      toast.success(`Status atualizado para "${statusLabel}"`);
      
      refetch();
      
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      
      setCurrentStatus(contato.status);
      
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleArchive = async () => {
    if (!contato?.id) return;
    
    try {
      await ContactService.updateContactStatus(contato.id, 'arquivado');
      setCurrentStatus('arquivado');
      
      toast.success('Contato arquivado com sucesso');
      
      refetch();
    } catch (error) {
      console.error('❌ Erro ao arquivar contato:', error);
      toast.error('Não foi possível arquivar o contato');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Contato</DialogTitle>
          <DialogDescription>
            Mensagem enviada pelo formulário de contato
          </DialogDescription>
        </DialogHeader>
        {contato && (
          <div className="grid gap-6 pt-2">
            {/* Indicador de auto-marcação como lido */}
            {autoMarkingAsRead && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border border-blue-600 border-t-transparent mr-2"></div>
                  <strong>Marcando automaticamente como lido...</strong>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Informações do Contato</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome</p>
                    <p className="font-medium">{contato.name || contato.nome || ''}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">E-mail</p>
                    <p>{contato.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefone</p>
                    <p>{contato.phone || contato.telefone || ''}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Departamento</p>
                    <Badge variant="outline" className="bg-primary/10 hover:bg-primary/10">
                      {contato.department || 'Geral'}
                    </Badge>
                  </div>
                  
                  {contato.location && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Localização</p>
                      <p>{contato.location}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Envio</p>
                    <p>{contato.createdAt && format(ensureDate(contato.createdAt) || new Date(), "PPpp", { locale: ptBR })}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Gerenciamento</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Status Atual</p>
                    <div className="flex mt-1">
                      <Select 
                        value={currentStatus} 
                        onValueChange={handleStatusChange} 
                        disabled={isUpdatingStatus || autoMarkingAsRead}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value} className="flex items-center">
                              <div className="flex items-center">
                                <status.icon className="mr-2 h-4 w-4" />
                                <span>{status.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(isUpdatingStatus || autoMarkingAsRead) && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-2"></div>
                        Sincronizando com N8N...
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Ações Rápidas</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleArchive}
                        disabled={isUpdatingStatus || autoMarkingAsRead || currentStatus === 'arquivado'}
                      >
                        Arquivar
                      </Button>
                    </div>
                  </div>
                  
                  {contato.referenceId && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">ID de Referência</p>
                      <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">{contato.referenceId}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-500">Fonte</p>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      N8N
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Assunto</p>
              <p className="text-base font-medium">{contato.subject || contato.assunto || ''}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Mensagem</p>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <p className="whitespace-pre-wrap">{contato.message || contato.mensagem || ''}</p>
              </ScrollArea>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};