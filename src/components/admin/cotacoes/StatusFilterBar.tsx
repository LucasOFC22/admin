import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CotacaoStats } from '@/types/supabase-cotacao';

interface StatusFilterBarProps {
  activeStatus: string;
  onStatusChange: (status: string) => void;
  stats: CotacaoStats;
}

const statusConfig = [
  { key: 'todos', label: 'Todos', getCount: (stats: CotacaoStats) => stats.total },
  { key: 'Pendente', label: 'Pendente', getCount: (stats: CotacaoStats) => stats.pendentes },
  { key: 'analise', label: 'Análise', getCount: (stats: CotacaoStats) => stats.analise },
  { key: 'proposta_enviada', label: 'Proposta Enviada', getCount: (stats: CotacaoStats) => stats.proposta_enviada },
  { key: 'aprovada', label: 'Aprovada', getCount: (stats: CotacaoStats) => stats.aprovadas },
  { key: 'rejeitada', label: 'Rejeitada', getCount: (stats: CotacaoStats) => stats.rejeitadas },
  { key: 'cancelada', label: 'Cancelada', getCount: (stats: CotacaoStats) => stats.canceladas },
];

export default function StatusFilterBar({ activeStatus, onStatusChange, stats }: StatusFilterBarProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide scroll-smooth">
      {statusConfig.map((status) => {
        const count = status.getCount(stats);
        const isActive = activeStatus === status.key;
        
        return (
          <Button
            key={status.key}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onStatusChange(status.key)}
            className={`whitespace-nowrap transition-all duration-200 text-xs px-2.5 h-7 rounded-md ${
              isActive 
                ? 'bg-muted text-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {status.label}
            {count > 0 && (
              <Badge 
                variant="secondary" 
                className={`ml-1.5 h-4 min-w-4 px-1 text-[10px] rounded ${
                  isActive 
                    ? 'bg-background text-foreground' 
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
