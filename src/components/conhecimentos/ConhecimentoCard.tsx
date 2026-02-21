import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Download,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  ArrowRight,
  Weight
} from 'lucide-react';
import { formatTimestamp } from '@/utils/dateFormatters';
import { formatCurrency } from '@/lib/formatters';
import type { Conhecimento } from '@/pages/Conhecimentos';

interface ConhecimentoCardProps {
  conhecimento: Conhecimento;
  index: number;
  onViewDetails: (conhecimento: Conhecimento) => void;
  getStatusInfo: (status: string) => {
    icon: any;
    label: string;
    color: string;
    textColor: string;
  };
}

const ConhecimentoCard = ({
  conhecimento,
  index,
  onViewDetails,
  getStatusInfo
}: ConhecimentoCardProps) => {
  const statusInfo = getStatusInfo(conhecimento.status);
  const StatusIcon = statusInfo.icon;

  // formatCurrency imported from @/lib/formatters

  const formatDate = (dateString: string) => formatTimestamp(dateString);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card className="hover:shadow-xl transition-all duration-300 border-l-4 overflow-hidden group"
        style={{ borderLeftColor: statusInfo.color.replace('bg-', '#') }}
      >
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">{conhecimento.numero}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Emitido em {formatDate(conhecimento.data_emissao)}
              </p>
            </div>
            <Badge className={`${statusInfo.color} text-white flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>

          {/* Route */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2 flex-1">
                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Origem</p>
                  <p className="font-semibold text-sm">{conhecimento.origem}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 flex-shrink-0" />
              <div className="flex items-start gap-2 flex-1">
                <MapPin className="h-4 w-4 text-destructive mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Destino</p>
                  <p className="font-semibold text-sm">{conhecimento.destino}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Package className="h-4 w-4" />
                <span className="text-xs font-medium">Volume</span>
              </div>
              <p className="text-lg font-bold mt-1">{conhecimento.volume}</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Weight className="h-4 w-4" />
                <span className="text-xs font-medium">Peso</span>
              </div>
              <p className="text-lg font-bold mt-1">{conhecimento.peso}kg</p>
            </div>
          </div>

          {/* Valor do Frete */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Valor do Frete</span>
              </div>
              <p className="text-xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(conhecimento.valor_frete)}
              </p>
            </div>
          </div>

          {/* Previsão de Entrega */}
          {conhecimento.previsao_entrega && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Previsão: {formatDate(conhecimento.previsao_entrega)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onViewDetails(conhecimento)}
              className="flex-1 gap-2"
              variant="default"
            >
              <Eye className="h-4 w-4" />
              Ver Detalhes
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ConhecimentoCard;
