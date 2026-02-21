import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Monitor, Smartphone, Tablet, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SessionHistoryProps {
  userId: string | undefined;
}

const DeviceIcon = ({ device }: { device: string }) => {
  switch (device) {
    case 'Mobile':
      return <Smartphone className="h-4 w-4 text-muted-foreground" />;
    case 'Tablet':
      return <Tablet className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Monitor className="h-4 w-4 text-muted-foreground" />;
  }
};

const StatusBadge = ({ variant, label }: { variant: 'success' | 'warning' | 'error' | 'info'; label: string }) => {
  const styles = {
    success: 'bg-green-500/10 text-green-600 border-green-500/20',
    warning: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    error: 'bg-red-500/10 text-red-600 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  return (
    <Badge variant="outline" className={`${styles[variant]} text-xs font-medium`}>
      {label}
    </Badge>
  );
};

export const SessionHistory = ({ userId }: SessionHistoryProps) => {
  const { data: sessions, isLoading } = useSessionHistory(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Histórico de Sessões
        </CardTitle>
        <CardDescription>
          Suas últimas atividades de autenticação
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background">
                      {session.sucesso ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <StatusBadge variant={session.actionInfo.variant} label={session.actionInfo.label} />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(session.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <DeviceIcon device={session.device} />
                      <span className="hidden sm:inline">{session.device}</span>
                    </div>
                    {session.ip_address && (
                      <span className="font-mono text-xs hidden md:block">{session.ip_address}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <History className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">Nenhum registro de sessão encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
