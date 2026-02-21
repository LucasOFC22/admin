import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  XCircle, 
  Undo2, 
  ArrowLeftRight, 
  MoreVertical,
  History,
  FileText,
  Trash2,
  RotateCcw,
  Phone
} from 'lucide-react';
import { Ticket, Queue } from '@/services/ticketService';
import { TransferTicketModal } from './TransferTicketModal';

interface TicketActionButtonsCustomProps {
  ticket: Ticket;
  queues: Queue[];
  onResolve: () => void;
  onReopen?: () => void;
  onTransfer: (queueId: string, userId?: string) => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

export const TicketActionButtonsCustom: React.FC<TicketActionButtonsCustomProps> = ({
  ticket,
  queues,
  onResolve,
  onReopen,
  onTransfer,
  onDelete,
  isAdmin
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [disableBot, setDisableBot] = useState(ticket.contact?.disableBot || false);

  const handleResolve = async () => {
    setLoading(true);
    try {
      await onResolve();
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToQueue = async () => {
    setLoading(true);
    try {
      // Return ticket to pending status
      await onTransfer(ticket.queueId || '', undefined);
    } finally {
      setLoading(false);
    }
  };

  const iconButtonStyle = {
    padding: 4,
    color: 'var(--primary)'
  };

  return (
    <>
      <div className="flex items-center gap-1 ml-auto mr-2">
        {/* Reopen button for closed tickets */}
        {ticket.status === 'closed' && onReopen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                style={iconButtonStyle}
                onClick={onReopen}
                disabled={loading}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reabrir</TooltipContent>
          </Tooltip>
        )}

        {/* Actions for open/group tickets */}
        {(ticket.status === 'open' || ticket.status === 'group') && (
          <>
            {/* Call button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  style={iconButtonStyle}
                >
                  <Phone className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Iniciar chamada</TooltipContent>
            </Tooltip>

            {/* Resolve button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  style={iconButtonStyle}
                  onClick={handleResolve}
                  disabled={loading}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resolver</TooltipContent>
            </Tooltip>

            {/* Return to queue */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  style={iconButtonStyle}
                  onClick={handleReturnToQueue}
                  disabled={loading}
                >
                  <Undo2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Retornar à fila</TooltipContent>
            </Tooltip>

            {/* Transfer */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  style={iconButtonStyle}
                  onClick={() => setTransferModalOpen(true)}
                  disabled={loading}
                >
                  <ArrowLeftRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Transferir Ticket</TooltipContent>
            </Tooltip>

            {/* Disable Bot Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Switch
                    checked={disableBot}
                    onCheckedChange={(checked) => setDisableBot(checked)}
                    className="scale-75"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {disableBot ? 'Bot desativado' : 'Bot ativado'}
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Menu dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              style={iconButtonStyle}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ borderRadius: 0 }}>
            <DropdownMenuItem>
              <History className="h-4 w-4 mr-2" />
              Histórico
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
            {isAdmin && onDelete && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar Ticket
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Transfer Modal */}
      <TransferTicketModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        queues={queues}
        onTransfer={(options) => {
          onTransfer(options.queueId || '', options.userId);
          setTransferModalOpen(false);
        }}
        ticket={ticket}
      />
    </>
  );
};
