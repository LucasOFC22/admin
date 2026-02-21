import { useState, useMemo } from 'react';
import { useFlowExecutionLogs } from '@/hooks/useFlowExecutionLogs';
import { FlowExecutionLog, BLOCK_TYPE_LABELS, ACTION_LABELS } from '@/types/flowExecutionLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { 
  Activity, 
  RefreshCw, 
  Trash2, 
  Search, 
  ChevronDown, 
  ChevronRight,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FlowExecutionLogsPage = () => {
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const { logs, sessions, loading, refetch, clearLogs } = useFlowExecutionLogs({
    sessionId: selectedSession === 'all' ? undefined : selectedSession,
    realtime: true
  });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const logDataStr = JSON.stringify(log.log_data || {}).toLowerCase();
        return (
          logDataStr.includes(search) ||
          log.node_id?.toLowerCase().includes(search) ||
          log.node_type?.toLowerCase().includes(search) ||
          log.action?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [logs, filterAction, searchTerm]);

  const toggleExpanded = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

  const getActionIcon = (action: string | null) => {
    if (!action) return <Zap className="h-4 w-4 text-muted-foreground" />;
    if (action.includes('error')) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (action.includes('end') || action.includes('completed')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action.includes('waiting')) return <Clock className="h-4 w-4 text-yellow-500" />;
    if (action.includes('message')) return <MessageSquare className="h-4 w-4 text-blue-500" />;
    return <Zap className="h-4 w-4 text-primary" />;
  };

  const getActionBadgeVariant = (action: string | null): 'default' | 'destructive' | 'outline' | 'secondary' => {
    if (!action) return 'secondary';
    if (action.includes('error')) return 'destructive';
    if (action.includes('end') || action.includes('completed')) return 'default';
    if (action.includes('waiting')) return 'secondary';
    return 'outline';
  };

  return (
    
      <PermissionGuard 
        permissions="admin.flowbuilders.visualizar"
        showMessage={true}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Logs de Execução</h1>
            <p className="text-muted-foreground">Monitore a execução dos fluxos em tempo real</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => clearLogs(selectedSession ? { sessionId: selectedSession } : undefined)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por node, tipo, ação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Todas as sessões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as sessões</SelectItem>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {session.phone_number} - {session.status}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{sessions.length}</div>
            <div className="text-sm text-muted-foreground">Sessões</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <div className="text-sm text-muted-foreground">Logs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">
              {filteredLogs.filter(l => l.result === 'error').length}
            </div>
            <div className="text-sm text-muted-foreground">Erros</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">
              {filteredLogs.filter(l => l.action === 'flow_completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Concluídos</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Timeline de Execução
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log encontrado</p>
                <p className="text-sm">Os logs aparecerão aqui em tempo real</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <LogEntry
                    key={log.id}
                    log={log}
                    expanded={expandedLogs.has(log.id)}
                    onToggle={() => toggleExpanded(log.id)}
                    getActionIcon={getActionIcon}
                    getActionBadgeVariant={getActionBadgeVariant}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  
  );
};

interface LogEntryProps {
  log: FlowExecutionLog;
  expanded: boolean;
  onToggle: () => void;
  getActionIcon: (action: string) => React.ReactNode;
  getActionBadgeVariant: (action: string) => 'default' | 'destructive' | 'outline' | 'secondary';
}

const LogEntry = ({ log, expanded, onToggle, getActionIcon, getActionBadgeVariant }: LogEntryProps) => {
  const hasDetails = log.log_data || log.node_data;
  const isError = log.result === 'error';

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className={`border rounded-lg p-3 transition-colors ${isError ? 'border-destructive/50 bg-destructive/5' : 'hover:bg-muted/50'}`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer">
            {hasDetails ? (
              expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="w-4" />
            )}
            
            {getActionIcon(log.action)}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getActionBadgeVariant(log.action)}>
                  {ACTION_LABELS[log.action] || log.action}
                </Badge>
                {log.node_type && (
                  <Badge variant="outline">
                    {BLOCK_TYPE_LABELS[log.node_type] || log.node_type}
                  </Badge>
                )}
                {log.node_id && (
                  <span className="text-sm text-muted-foreground truncate">
                    {log.node_id}
                  </span>
                )}
              </div>
              {log.result && log.result !== 'success' && (
                <p className="text-sm mt-1 truncate">{log.result}</p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">
                {format(new Date(log.created_at), 'HH:mm:ss', { locale: ptBR })}
              </span>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {hasDetails && (
            <div className="mt-3 pt-3 border-t space-y-3">
              {log.log_data && Object.keys(log.log_data).length > 0 && (
                <div>
                  <strong className="text-sm">Log Data:</strong>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(log.log_data, null, 2)}
                  </pre>
                </div>
              )}
              {log.node_data && Object.keys(log.node_data).length > 0 && (
                <div>
                  <strong className="text-sm">Node Data:</strong>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(log.node_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default FlowExecutionLogsPage;
