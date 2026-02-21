
import { Button } from "@/components/ui/button";
import { Check, X } from 'lucide-react';

interface ConfirmationDialogProps {
  showConfirmation: 'aceita' | 'recusada' | null;
  isUpdating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationDialog = ({ showConfirmation, isUpdating, onCancel, onConfirm }: ConfirmationDialogProps) => {
  if (!showConfirmation) return null;

  const isAccept = showConfirmation === 'aceita';
  
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isAccept ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isAccept ? (
            <Check className={`h-8 w-8 text-green-600`} />
          ) : (
            <X className={`h-8 w-8 text-red-600`} />
          )}
        </div>
        
        <h3 className="text-xl font-bold text-center mb-4">
          {isAccept ? 'Aceitar Proposta?' : 'Recusar Proposta?'}
        </h3>
        
        <p className="text-gray-600 text-center mb-8">
          {isAccept 
            ? 'Ao aceitar esta proposta, você concorda com os termos e condições apresentados.'
            : 'Tem certeza que deseja recusar esta proposta? Esta ação não pode ser desfeita.'
          }
        </p>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onCancel}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button 
            className={`flex-1 ${isAccept ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            onClick={onConfirm}
            disabled={isUpdating}
          >
            {isUpdating ? 'Processando...' : (isAccept ? 'Aceitar' : 'Recusar')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
