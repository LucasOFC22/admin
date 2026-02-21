import { MensagemRapida } from '@/services/mensagensRapidas/mensagensRapidasService';
import QuickMessageCard from './QuickMessageCard';
import { Loader2 } from 'lucide-react';

interface QuickMessagesGridProps {
  mensagens: MensagemRapida[];
  isLoading: boolean;
  onEdit?: (mensagem: MensagemRapida) => void;
  onDelete?: (mensagem: MensagemRapida) => void;
  onUse?: (mensagem: MensagemRapida) => void;
}

const QuickMessagesGrid: React.FC<QuickMessagesGridProps> = ({
  mensagens,
  isLoading,
  onEdit,
  onDelete,
  onUse
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mensagens.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nenhuma mensagem rápida encontrada</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mensagens.map((mensagem) => (
        <QuickMessageCard
          key={mensagem.id}
          mensagem={mensagem}
          onEdit={onEdit}
          onDelete={onDelete}
          onUse={onUse}
        />
      ))}
    </div>
  );
};

export default QuickMessagesGrid;
