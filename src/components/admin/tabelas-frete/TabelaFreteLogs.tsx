import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TabelaFreteLogsProps {
  tabelaId: string;
  onBack: () => void;
}

const acaoLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  criacao: { label: 'Criação', variant: 'default' },
  edicao: { label: 'Edição', variant: 'secondary' },
  exclusao: { label: 'Exclusão', variant: 'destructive' },
  renomeacao: { label: 'Renomeação', variant: 'outline' },
  importacao: { label: 'Importação', variant: 'default' },
};

const TabelaFreteLogs = ({ tabelaId, onBack }: TabelaFreteLogsProps) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['tabelas-frete-logs', tabelaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logs_tabelas_frete' as any)
        .select('*')
        .eq('tabela_frete_id', tabelaId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum log encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => {
                  const acaoInfo = acaoLabels[log.acao] || { label: log.acao, variant: 'outline' as const };
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm">{log.usuario_nome || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={acaoInfo.variant}>{acaoInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {log.detalhes ? JSON.stringify(log.detalhes) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabelaFreteLogs;
