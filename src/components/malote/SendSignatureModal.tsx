import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Phone, Check, X } from "lucide-react";
import { Malote } from "@/types/malote";

interface SendSignatureModalProps {
  open: boolean;
  onClose: () => void;
  malote: Malote | null;
  onSend: (maloteId: string, telefone: string) => Promise<void>;
}

type ModalState = 'confirm' | 'input';

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const SendSignatureModal = ({ open, onClose, malote, onSend }: SendSignatureModalProps) => {
  const [telefone, setTelefone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>('confirm');

  // Reset state when modal opens with new malote
  useEffect(() => {
    if (open && malote) {
      const hasPhone = malote.telefoneMotorista && malote.telefoneMotorista.trim() !== '';
      setTelefone(malote.telefoneMotorista || '');
      setModalState(hasPhone ? 'confirm' : 'input');
    }
  }, [open, malote]);

  const handleSend = async (phoneToUse?: string) => {
    if (!malote) return;
    
    const finalPhone = phoneToUse || telefone;
    if (!finalPhone.trim()) return;
    
    setIsLoading(true);
    try {
      await onSend(malote.id, finalPhone);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmNumber = () => {
    handleSend(malote?.telefoneMotorista || '');
  };

  const handleUseOtherNumber = () => {
    setModalState('input');
    setTelefone('');
  };

  const handleBack = () => {
    if (malote?.telefoneMotorista) {
      setModalState('confirm');
      setTelefone(malote.telefoneMotorista);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar para Assinatura</DialogTitle>
          <DialogDescription>
            O motorista receberá um link via WhatsApp para assinar o malote digitalmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm text-muted-foreground">Motorista</Label>
            <p className="font-medium">{malote?.motorista}</p>
          </div>

          {modalState === 'confirm' && malote?.telefoneMotorista ? (
            // Estado 1: Confirmação do número
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Número cadastrado
                </Label>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold">
                    {formatPhone(malote.telefoneMotorista)}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                É este o número correto para envio?
              </p>
            </div>
          ) : (
            // Estado 2: Campo de input
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm text-muted-foreground">
                Número do WhatsApp
              </Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Informe o número com DDD (ex: 11999999999)
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {modalState === 'confirm' && malote?.telefoneMotorista ? (
            // Botões para confirmação
            <>
              <Button 
                variant="outline" 
                onClick={handleUseOtherNumber} 
                disabled={isLoading}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Não, usar outro
              </Button>
              <Button 
                onClick={handleConfirmNumber} 
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Sim, enviar
              </Button>
            </>
          ) : (
            // Botões para input
            <>
              {malote?.telefoneMotorista && (
                <Button 
                  variant="ghost" 
                  onClick={handleBack} 
                  disabled={isLoading}
                >
                  Voltar
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => handleSend()} 
                disabled={isLoading || !telefone.trim()} 
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar Link
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendSignatureModal;
