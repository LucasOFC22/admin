import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft,
  ArrowRightLeft, 
  Check,
  FileText,
  Loader2,
  MoreVertical,
  RotateCcw,
  Trash2,
  UserCheck
} from 'lucide-react';
import { Queue, Ticket } from '@/services/ticketService';
import { TransferTicketModal } from './TransferTicketModal';
import { CloseTicketModal } from '../CloseTicketModal';
import { fetchChatMessagesForTranscript } from '@/services/whatsapp/transcriptService';
import { downloadPdfTranscript } from './TranscriptPDF';
import { useToast } from '@/hooks/use-toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useIsMobile } from '@/hooks/use-mobile';

interface TicketActionButtonsProps {
  ticket: Ticket;
  queues: any[];
  onResolve: (silent: boolean) => void;
  onTransfer: (queueId: string, userId?: string) => void;
  onDelete?: () => void;
  isAdmin?: boolean;
  onBack?: () => void;
  onReopen?: () => void;
  onAccept?: () => void;
}

type TicketStatusType = 'em_atendimento' | 'aguardando' | 'chatbot' | 'encerrado';

const getTicketStatusType = (ticket: Ticket): TicketStatusType => {
  if (ticket.status === 'closed') return 'encerrado';
  
  const modo = (ticket.modoDeAtendimento || '').toLowerCase();
  
  if (modo === 'bot') return 'chatbot';
  
  if (modo === 'atendimento humano') {
    return ticket.aceitoPorAdmin ? 'em_atendimento' : 'aguardando';
  }
  
  if (ticket.status === 'pending') return 'aguardando';
  return 'em_atendimento';
};

export const TicketActionButtons: React.FC<TicketActionButtonsProps> = ({
  ticket,
  queues,
  onResolve,
  onTransfer,
  onDelete,
  isAdmin,
  onBack,
  onReopen,
  onAccept
}) => {
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { hasPermission } = usePermissionGuard();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const canFinalize = hasPermission('admin.whatsapp.finalizar');
  const canTransfer = hasPermission('admin.whatsapp.transferir');
  const canExport = hasPermission('admin.whatsapp.exportar');
  const canCloseSilently = hasPermission('admin.whatsapp.finalizar-silencioso');

  const ticketStatus = getTicketStatusType(ticket);
  const isResolved = ticketStatus === 'encerrado';
  const isChatbot = ticketStatus === 'chatbot';
  const isAguardando = ticketStatus === 'aguardando';
  const isEmAtendimento = ticketStatus === 'em_atendimento';

  // Mostra botões de ação (resolver/transferir) quando está em atendimento humano ativo
  const showActionButtons = isEmAtendimento;
  // Mostra botão aceitar quando está aguardando ou no chatbot (para assumir)
  const showAcceptButton = (isAguardando || isChatbot) && onAccept;

  const handleConfirmClose = (silent: boolean) => {
    onResolve(silent);
    setCloseModalOpen(false);
  };

  const handleConfirmReopen = () => {
    onReopen?.();
    setReopenDialogOpen(false);
  };

  const handleConfirmAccept = () => {
    onAccept?.();
    setAcceptDialogOpen(false);
  };

  const handleExportPDF = async () => {
    if (!ticket.chatId) {
      toast({
        title: "Erro",
        description: "ID do chat não encontrado",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const data = await fetchChatMessagesForTranscript(ticket.chatId);
      
      if (!data) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as mensagens do chat",
          variant: "destructive"
        });
        return;
      }

      if (data.messages.length === 0) {
        toast({
          title: "Aviso",
          description: "Este chat não possui mensagens para exportar",
          variant: "destructive"
        });
        return;
      }

      await downloadPdfTranscript(data);
      
      toast({
        title: "PDF exportado",
        description: `Transcrição com ${data.messageCount} mensagens gerada com sucesso`
      });
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao exportar",
        description: error.message || "Falha ao gerar PDF da transcrição",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Botão voltar no mobile */}
        {isMobile && onBack && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Botão Reabrir quando ticket está encerrado */}
        {isResolved && onReopen && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setReopenDialogOpen(true)}
            className="h-8 px-3"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Reabrir</span>
          </Button>
        )}

        {/* Botão Aceitar/Assumir quando está aguardando ou no chatbot */}
        {showAcceptButton && (
          <Button 
            size="sm" 
            variant="default" 
            onClick={() => setAcceptDialogOpen(true)}
            className="h-8 px-3"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{isChatbot ? 'Assumir' : 'Aceitar'}</span>
          </Button>
        )}

        {/* Botões visíveis apenas no desktop e quando ticket está em atendimento */}
        {!isMobile && showActionButtons && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setCloseModalOpen(true)}
                      disabled={!canFinalize}
                      className="h-8 px-3"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Resolver
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{!canFinalize ? 'Você não tem permissão para finalizar atendimentos' : 'Resolver'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTransferModalOpen(true)}
                      disabled={!canTransfer}
                      className="h-8 px-3"
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-1" />
                      Transferir
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{!canTransfer ? 'Você não tem permissão para transferir conversas' : 'Transferir'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Opção Aceitar/Assumir no dropdown */}
            {showAcceptButton && isMobile && (
              <>
                <DropdownMenuItem onClick={() => setAcceptDialogOpen(true)}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  {isChatbot ? 'Assumir Atendimento' : 'Aceitar Atendimento'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Opções de Resolver e Transferir apenas no mobile quando ticket está em atendimento */}
            {isMobile && showActionButtons && (
              <>
                {canFinalize && (
                  <DropdownMenuItem onClick={() => setCloseModalOpen(true)}>
                    <Check className="h-4 w-4 mr-2" />
                    Resolver
                  </DropdownMenuItem>
                )}
                {canTransfer && (
                  <DropdownMenuItem onClick={() => setTransferModalOpen(true)}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transferir
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            {/* Reabrir no dropdown para mobile */}
            {isResolved && onReopen && isMobile && (
              <>
                <DropdownMenuItem onClick={() => setReopenDialogOpen(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reabrir Ticket
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {canExport && (
              <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {isExporting ? 'Exportando...' : 'Exportar PDF'}
              </DropdownMenuItem>
            )}
            {isAdmin && onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {canTransfer && (
        <TransferTicketModal
          open={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          onTransfer={(options) => onTransfer(options.queueId || '', options.userId)}
          queues={queues}
        />
      )}

      {/* Dialog de confirmação para aceitar/assumir */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isChatbot ? 'Assumir atendimento?' : 'Aceitar atendimento?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isChatbot 
                ? 'Você irá assumir este atendimento do chatbot. O cliente será transferido para você.'
                : 'Tem certeza que deseja aceitar este atendimento? Você será responsável por esta conversa.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAccept}>
              {isChatbot ? 'Assumir' : 'Aceitar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para reabrir */}
      <AlertDialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reabrir este ticket? O atendimento será retomado e você poderá enviar novas mensagens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReopen}>
              Reabrir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmação para encerrar ticket */}
      <CloseTicketModal
        open={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onConfirm={handleConfirmClose}
        canCloseSilently={canCloseSilently}
      />
    </>
  );
};
