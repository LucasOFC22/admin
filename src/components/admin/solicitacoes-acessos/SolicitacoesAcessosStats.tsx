import { Card } from '@/components/ui/card';
import { Users, Clock, Calendar } from 'lucide-react';

interface SolicitacoesAcessosStatsProps {
  stats: {
    total: number;
    novas: number;
    ultimos7dias: number;
  };
}

export const SolicitacoesAcessosStats = ({ stats }: SolicitacoesAcessosStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Solicitações</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <Clock className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Novas Hoje</p>
            <p className="text-2xl font-bold text-foreground">{stats.novas}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Últimos 7 Dias</p>
            <p className="text-2xl font-bold text-foreground">{stats.ultimos7dias}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
