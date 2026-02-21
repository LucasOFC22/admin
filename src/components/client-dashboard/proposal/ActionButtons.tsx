
import { Button } from "@/components/ui/button";
import { Check, X } from 'lucide-react';

interface ActionButtonsProps {
  isUpdating: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

const ActionButtons = ({ isUpdating, onClose, onAccept, onReject }: ActionButtonsProps) => {
  return (
    <div className="border-t border-gray-200 p-6 bg-gray-50">
      <div className="flex gap-4 justify-end">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="px-8"
        >
          Fechar
        </Button>
        <Button 
          variant="destructive"
          onClick={onReject}
          disabled={isUpdating}
          className="px-8 flex items-center gap-2"
        >
          <X size={16} />
          Recusar
        </Button>
        <Button 
          onClick={onAccept}
          disabled={isUpdating}
          className="px-8 bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          <Check size={16} />
          Aceitar Proposta
        </Button>
      </div>
    </div>
  );
};

export default ActionButtons;
