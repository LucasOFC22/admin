import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUserFilas } from '@/hooks/useUserFilas';

interface Queue {
  id: string;
  name: string;
  color: string;
}

interface AcceptTicketModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: (queueId?: string, queueName?: string) => void;
  queues: Queue[];
  isLoading?: boolean;
}

export const AcceptTicketModal: React.FC<AcceptTicketModalProps> = ({
  open,
  onClose,
  onAccept,
  queues,
  isLoading = false
}) => {
  const [selectedQueue, setSelectedQueue] = useState<string>('');
  const { filasPermitidas, hasFilasRestriction } = useUserFilas();

  // Filtrar filas baseado nas permissões
  const filasDisponiveis = useMemo(() => {
    if (!hasFilasRestriction || filasPermitidas.length === 0) {
      return queues;
    }
    return queues.filter(queue => filasPermitidas.includes(Number(queue.id)));
  }, [queues, filasPermitidas, hasFilasRestriction]);

  const handleAccept = () => {
    const selectedQueueData = filasDisponiveis.find(q => q.id === selectedQueue);
    onAccept(selectedQueue || undefined, selectedQueueData?.name);
    setSelectedQueue('');
  };

  const handleClose = () => {
    setSelectedQueue('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[350px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Aceitar Chat
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Select value={selectedQueue} onValueChange={setSelectedQueue}>
            <SelectTrigger className="w-full bg-white border-gray-300">
              <SelectValue placeholder="Selecionar setor" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {filasDisponiveis.map((queue) => (
                <SelectItem key={queue.id} value={queue.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: queue.color }}
                    />
                    {queue.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilasRestriction && (
            <p className="text-xs text-muted-foreground mt-2">
              Apenas filas permitidas para seu cargo são exibidas.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-600 hover:text-gray-800"
          >
            CANCELAR
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'INICIANDO...' : 'INICIAR'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AcceptTicketModal;
