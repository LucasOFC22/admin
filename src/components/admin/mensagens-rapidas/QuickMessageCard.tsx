import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MensagemRapida } from '@/services/mensagensRapidas/mensagensRapidasService';
import { Edit, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/lib/toast';

interface QuickMessageCardProps {
  mensagem: MensagemRapida;
  onEdit?: (mensagem: MensagemRapida) => void;
  onDelete?: (mensagem: MensagemRapida) => void;
  onUse?: (mensagem: MensagemRapida) => void;
}

const QuickMessageCard: React.FC<QuickMessageCardProps> = ({
  mensagem,
  onEdit,
  onDelete,
  onUse
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(mensagem.conteudo);
    toast.success('Conteúdo copiado!');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{mensagem.titulo}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="font-mono text-xs">
                /{mensagem.comando}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(mensagem)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(mensagem)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {mensagem.conteudo.substring(0, 150)}
            {mensagem.conteudo.length > 150 && '...'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            <Copy className="h-3 w-3 mr-2" />
            Copiar
          </Button>
          {onUse && (
            <Button
              size="sm"
              onClick={() => onUse(mensagem)}
              className="flex-1"
            >
              Usar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickMessageCard;
