import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, AlertTriangle, PackageX, AlertCircle, FileX, HelpCircle } from 'lucide-react';
import { Ocorrencia, TIPO_OCORRENCIA_LABELS, STATUS_OCORRENCIA_LABELS } from '@/types/ocorrencias';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OcorrenciasCardProps {
  ocorrencia: Ocorrencia;
  onViewDetails: (ocorrencia: Ocorrencia) => void;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    em_analise: 'bg-blue-100 text-blue-800 border-blue-300',
    resolvido: 'bg-green-100 text-green-800 border-green-300',
    cancelado: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const getTipoIcon = (tipo: string) => {
  const icons: Record<string, any> = {
    atraso_entrega: AlertCircle,
    extravio: PackageX,
    mercadoria_danificada: AlertTriangle,
    problema_documentacao: FileX,
    outros: HelpCircle
  };
  return icons[tipo] || HelpCircle;
};

const OcorrenciasCard = ({ ocorrencia, onViewDetails }: OcorrenciasCardProps) => {
  const TipoIcon = getTipoIcon(ocorrencia.tipo_ocorrencia);
  
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border hover:border-primary/50 cursor-pointer" onClick={() => onViewDetails(ocorrencia)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <TipoIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {TIPO_OCORRENCIA_LABELS[ocorrencia.tipo_ocorrencia]}
              </p>
              <p className="text-xs text-muted-foreground">
                {ocorrencia.numero_cte || ocorrencia.numero_nfe || 'Sem documento'}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(ocorrencia.status)}>
            {STATUS_OCORRENCIA_LABELS[ocorrencia.status]}
          </Badge>
        </div>

        <div className="space-y-2.5 mb-4 min-h-[80px]">
          {ocorrencia.email_resposta && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="text-muted-foreground truncate">{ocorrencia.email_resposta}</span>
            </div>
          )}
          {ocorrencia.resumo && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {ocorrencia.resumo}
            </div>
          )}
          {ocorrencia.fotos && ocorrencia.fotos.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span>📷 {ocorrencia.fotos.length} foto(s) anexada(s)</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            {ocorrencia.criado_em && format(new Date(ocorrencia.criado_em), "dd/MM/yy HH:mm", { locale: ptBR })}
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(ocorrencia);
            }}
            variant="ghost"
            size="sm"
            className="group-hover:bg-primary/10"
          >
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OcorrenciasCard;
