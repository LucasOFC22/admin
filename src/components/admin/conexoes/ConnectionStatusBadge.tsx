import { 
  Signal, 
  SignalHigh, 
  SignalLow, 
  SignalZero, 
  QrCode, 
  Loader2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConnectionStatusBadgeProps {
  status: string;
}

const ConnectionStatusBadge = ({ status }: ConnectionStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'CONNECTED':
        return {
          icon: SignalHigh,
          label: 'Conectado',
          className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
          tooltip: 'Conexão estabelecida e funcionando'
        };
      case 'DISCONNECTED':
        return {
          icon: SignalZero,
          label: 'Desconectado',
          className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
          tooltip: 'Conexão perdida. Clique em "Reconectar" para tentar novamente'
        };
      case 'OPENING':
        return {
          icon: Loader2,
          label: 'Conectando...',
          className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
          tooltip: 'Estabelecendo conexão',
          spin: true
        };
      case 'qrcode':
        return {
          icon: QrCode,
          label: 'QR Code',
          className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
          tooltip: 'Aguardando leitura do QR Code'
        };
      case 'TIMEOUT':
      case 'PAIRING':
        return {
          icon: SignalLow,
          label: 'Timeout',
          className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
          tooltip: 'Tempo de conexão esgotado. Tente desconectar e conectar novamente'
        };
      default:
        return {
          icon: Signal,
          label: status,
          className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
          tooltip: 'Status desconhecido'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={config.className}>
            <Icon className={`h-3 w-3 mr-1 ${config.spin ? 'animate-spin' : ''}`} />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStatusBadge;
