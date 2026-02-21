import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOcorrenciaHistorico } from '@/hooks/useOcorrenciaHistorico';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User } from 'lucide-react';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface OcorrenciaHistoricoTabProps {
  ocorrenciaId: string;
}

const OcorrenciaHistoricoTab = ({ ocorrenciaId }: OcorrenciaHistoricoTabProps) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    usuarioId: undefined as number | undefined
  });

  const { historico, isLoading } = useOcorrenciaHistorico(ocorrenciaId, filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma atividade registrada para esta ocorrência
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <Input
          type="date"
          placeholder="Data inicial"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="w-full md:w-auto"
        />
        <Input
          type="date"
          placeholder="Data final"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="w-full md:w-auto"
        />
      </div>

      <div className="space-y-4">
        {historico.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {item.usuario?.nome || 'Usuário desconhecido'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
              
              <div className="text-sm">
                <span className="font-medium">{item.acao.replace(/_/g, ' ')}</span>
                {item.valor_anterior && item.valor_novo && (
                  <div className="mt-2 text-muted-foreground">
                    <span className="line-through">{item.valor_anterior}</span>
                    {' → '}
                    <span className="font-medium text-foreground">{item.valor_novo}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OcorrenciaHistoricoTab;
