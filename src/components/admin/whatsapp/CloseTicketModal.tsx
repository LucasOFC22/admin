import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Loader2 } from 'lucide-react';

interface CloseTicketModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (silent: boolean) => void;
  isPending?: boolean;
  canCloseSilently: boolean;
  isLoading?: boolean;
}

export const CloseTicketModal: React.FC<CloseTicketModalProps> = ({
  open,
  onClose,
  onConfirm,
  isPending = false,
  canCloseSilently,
  isLoading = false
}) => {
  const [closeMode, setCloseMode] = useState<'with-message' | 'silent'>('with-message');

  const handleConfirm = () => {
    onConfirm(closeMode === 'silent');
  };

  const title = isPending ? 'Ignorar Ticket' : 'Encerrar Ticket';
  const description = isPending 
    ? 'O ticket será marcado como resolvido sem ser atendido.'
    : 'O atendimento será finalizado.';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {canCloseSilently ? (
          <div className="py-4">
            <RadioGroup
              value={closeMode}
              onValueChange={(value) => setCloseMode(value as 'with-message' | 'silent')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                <RadioGroupItem value="with-message" id="with-message" />
                <Label htmlFor="with-message" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Encerrar com mensagem</p>
                    <p className="text-sm text-muted-foreground">
                      Envia a mensagem de encerramento configurada ao cliente
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                <RadioGroupItem value="silent" id="silent" />
                <Label htmlFor="silent" className="flex items-center gap-3 cursor-pointer flex-1">
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Encerrar silenciosamente</p>
                    <p className="text-sm text-muted-foreground">
                      Encerra sem notificar o cliente
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {isPending 
                ? 'Deseja realmente ignorar este ticket?'
                : 'Deseja realmente encerrar este ticket? A mensagem de encerramento será enviada ao cliente (se configurada).'}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
