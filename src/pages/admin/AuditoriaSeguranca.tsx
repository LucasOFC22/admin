import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import PageHeader from '@/components/admin/PageHeader';
import { ShieldAlert, AlertTriangle, Clock, KeyRound, RefreshCw, Search, Filter, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Horário comercial: 7h-19h (segunda a sexta)
const isOffHours = (dateStr: string): boolean => {
  const date = parseISO(dateStr);
  const hours = date.getHours();
  const day = date.getDay(); // 0=domingo, 6=sábado
  return day === 0 || day === 6 || hours < 7 || hours >= 19;
};

const severityColor = (level: string) => {
  switch (level) {
    case 'critico': return 'bg-destructive text-destructive-foreground';
    case 'alto': return 'bg-orange-500/15 text-orange-700 border-orange-500/30';
    case 'medio': return 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

const AuditoriaSeguranca = () => {
  const [periodo, setPeriodo] = useState('7');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const dataInicio = subDays(new Date(), parseInt(periodo));

  // === Query: Logs de autenticação ===
  const { data: authLogs = [], isLoading: loadingAuth, refetch: refetchAuth } = useQuery({
    queryKey: ['auditoria-auth-logs', periodo],
    queryFn: async () => {
      const client = requireAuthenticatedClient();
      const { data, error } = await client
        .from('logs_autenticacao')
        .select('*')
        .gte('created_at', dataInicio.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // === Query: Logs de cargos (alterações de permissões) ===
  const { data: cargoLogs = [], isLoading: loadingCargos, refetch: refetchCargos } = useQuery({
    queryKey: ['auditoria-cargo-logs', periodo],
    queryFn: async () => {
      const client = requireAuthenticatedClient();
      const { data, error } = await client
        .from('logs_cargos')
        .select('*')
        .gte('created_at', dataInicio.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // === Query: Logs de atividade (ações sensíveis) ===
  const { data: activityLogs = [], isLoading: loadingActivity, refetch: refetchActivity } = useQuery({
    queryKey: ['auditoria-activity-logs', periodo],
    queryFn: async () => {
      const client = requireAuthenticatedClient();
      const { data, error } = await client
        .from('logs_atividade')
        .select('*')
        .gte('created_at', dataInicio.toISOString())
        .in('tipo', ['seguranca', 'admin', 'critico'])
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  // === Métricas calculadas ===
  const failedLogins = authLogs.filter(l => l.sucesso === false);
  const offHoursLogins = authLogs.filter(l => l.sucesso === true && isOffHours(l.created_at));
  const permissionChanges = cargoLogs.filter(l => 
    l.tipo_de_acao === 'editar_permissoes' || l.tipo_de_acao === 'editar' || l.tipo_de_acao === 'criar'
  );
  
  // Tentativas suspeitas: múltiplas falhas do mesmo IP ou usuário
  const suspiciousAttempts = (() => {
    const ipCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    failedLogins.forEach(l => {
      if (l.ip_address) ipCounts[l.ip_address] = (ipCounts[l.ip_address] || 0) + 1;
      const email = (l.detalhes as any)?.email || l.usuario_id || 'desconhecido';
      userCounts[email] = (userCounts[email] || 0) + 1;
    });
    const suspiciousIPs = Object.entries(ipCounts).filter(([, c]) => c >= 3).map(([ip]) => ip);
    const suspiciousUsers = Object.entries(userCounts).filter(([, c]) => c >= 3).map(([u]) => u);
    return failedLogins.filter(l => 
      suspiciousIPs.includes(l.ip_address || '') || 
      suspiciousUsers.includes((l.detalhes as any)?.email || l.usuario_id || '')
    );
  })();

  // Filtro de busca
  const filterLogs = (logs: any[]) => {
    if (!searchTerm) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(l => 
      JSON.stringify(l).toLowerCase().includes(term)
    );
  };

  const handleRefresh = () => {
    refetchAuth();
    refetchCargos();
    refetchActivity();
  };

  const isLoading = loadingAuth || loadingCargos || loadingActivity;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Auditoria de Segurança"
        subtitle="Monitore tentativas de login, acessos suspeitos e alterações de permissões"
        icon={ShieldAlert}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Monitoramento' },
          { label: 'Auditoria de Segurança' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Últimas 24h</SelectItem>
                <SelectItem value="3">Últimos 3 dias</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      <main className="p-4 lg:p-6 space-y-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Logins com Falha"
            value={failedLogins.length}
            icon={AlertTriangle}
            description={`${suspiciousAttempts.length} suspeitos`}
            loading={loadingAuth}
            variant={suspiciousAttempts.length > 0 ? 'danger' : 'default'}
          />
          <SummaryCard
            title="Acessos Fora do Horário"
            value={offHoursLogins.length}
            icon={Clock}
            description="Fora do horário comercial (7h-19h)"
            loading={loadingAuth}
            variant={offHoursLogins.length > 5 ? 'warning' : 'default'}
          />
          <SummaryCard
            title="Alterações de Permissões"
            value={permissionChanges.length}
            icon={KeyRound}
            description="Cargos e permissões alterados"
            loading={loadingCargos}
            variant={permissionChanges.length > 10 ? 'warning' : 'default'}
          />
          <SummaryCard
            title="Ações Sensíveis"
            value={activityLogs.length}
            icon={ShieldAlert}
            description="Ações admin/segurança/críticas"
            loading={loadingActivity}
            variant={activityLogs.length > 20 ? 'warning' : 'default'}
          />
        </div>

        {/* Busca */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por IP, email, ação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs de conteúdo */}
        <Tabs defaultValue="suspeitos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="suspeitos" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Suspeitos</span>
              {suspiciousAttempts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  {suspiciousAttempts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="falhas" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Falhas Login</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{failedLogins.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="fora-horario" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Fora Horário</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{offHoursLogins.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="permissoes" className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Permissões</span>
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{permissionChanges.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Tentativas Suspeitas */}
          <TabsContent value="suspeitos">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Tentativas Suspeitas de Login
                </CardTitle>
                <CardDescription>
                  IPs ou usuários com 3+ tentativas de login falhadas no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAuth ? <TableSkeleton /> : (
                  <LogTable
                    logs={filterLogs(suspiciousAttempts)}
                    columns={['Data/Hora', 'Tipo', 'IP', 'Detalhes', 'User Agent', 'Severidade']}
                    renderRow={(log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                        <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                          {format(parseISO(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className="text-xs">{log.tipo_de_acao}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-sm font-mono text-muted-foreground">{log.ip_address || '—'}</td>
                        <td className="px-3 py-2.5 text-sm max-w-[200px] truncate">
                          {(log.detalhes as any)?.email || log.erro || log.tipo_de_acao}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{log.user_agent || '—'}</td>
                        <td className="px-3 py-2.5">
                          <Badge className={severityColor('critico')}>Crítico</Badge>
                        </td>
                      </tr>
                    )}
                    emptyMessage="Nenhuma tentativa suspeita detectada 🎉"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Falhas de Login */}
          <TabsContent value="falhas">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Todas as Falhas de Login
                </CardTitle>
                <CardDescription>Tentativas de login que falharam no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAuth ? <TableSkeleton /> : (
                  <LogTable
                    logs={filterLogs(failedLogins)}
                    columns={['Data/Hora', 'Tipo', 'IP', 'Erro', 'Email', '']}
                    renderRow={(log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                        <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                          {format(parseISO(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className="text-xs">{log.tipo_de_acao}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-sm font-mono text-muted-foreground">{log.ip_address || '—'}</td>
                        <td className="px-3 py-2.5 text-sm text-destructive max-w-[200px] truncate">{log.erro || '—'}</td>
                        <td className="px-3 py-2.5 text-sm max-w-[200px] truncate">{(log.detalhes as any)?.email || '—'}</td>
                        <td className="px-3 py-2.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )}
                    emptyMessage="Nenhuma falha de login no período"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Acessos Fora do Horário */}
          <TabsContent value="fora-horario">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Acessos Fora do Horário Comercial
                </CardTitle>
                <CardDescription>Logins bem-sucedidos fora do horário comercial (antes das 7h ou após as 19h, fins de semana)</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAuth ? <TableSkeleton /> : (
                  <LogTable
                    logs={filterLogs(offHoursLogins)}
                    columns={['Data/Hora', 'Tipo', 'IP', 'Email', 'Período', '']}
                    renderRow={(log) => {
                      const date = parseISO(log.created_at);
                      const hour = date.getHours();
                      const day = date.getDay();
                      const periodoLabel = day === 0 || day === 6 ? 'Fim de semana' : hour < 7 ? 'Madrugada' : 'Noite';
                      return (
                        <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                          <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                            {format(date, "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className="text-xs">{log.tipo_de_acao}</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-sm font-mono text-muted-foreground">{log.ip_address || '—'}</td>
                          <td className="px-3 py-2.5 text-sm">{(log.detalhes as any)?.email || '—'}</td>
                          <td className="px-3 py-2.5">
                            <Badge className={severityColor(periodoLabel === 'Madrugada' ? 'alto' : 'medio')}>
                              {periodoLabel}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    }}
                    emptyMessage="Nenhum acesso fora do horário comercial"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Alterações de Permissões */}
          <TabsContent value="permissoes">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Alterações de Permissões e Cargos
                </CardTitle>
                <CardDescription>Criação, edição e alteração de permissões de cargos</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCargos ? <TableSkeleton /> : (
                  <LogTable
                    logs={filterLogs(permissionChanges)}
                    columns={['Data/Hora', 'Ação', 'Cargo', 'Alterações', 'Responsável', '']}
                    renderRow={(log) => {
                      const dadosNovos = log.dados_novos as any;
                      const dadosAnteriores = log.dados_anteriores as any;
                      const adicionadas = dadosNovos?.permissoes_adicionadas?.length || 0;
                      const removidas = dadosNovos?.permissoes_removidas?.length || 0;
                      return (
                        <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                          <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                            {format(parseISO(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className="text-xs">{log.tipo_de_acao}</Badge>
                          </td>
                          <td className="px-3 py-2.5 text-sm font-medium">
                            {dadosNovos?.cargo_nome || dadosAnteriores?.cargo_nome || `Cargo #${log.cargo_id}`}
                          </td>
                          <td className="px-3 py-2.5 text-sm">
                            {adicionadas > 0 && <span className="text-green-600">+{adicionadas} </span>}
                            {removidas > 0 && <span className="text-destructive">-{removidas}</span>}
                            {adicionadas === 0 && removidas === 0 && <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-muted-foreground font-mono text-xs truncate max-w-[120px]">
                            {log.usuario_responsavel || '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    }}
                    emptyMessage="Nenhuma alteração de permissões no período"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog de detalhes */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Registro
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedLog && (
              <div className="space-y-3">
                <DetailRow label="ID" value={selectedLog.id} />
                <DetailRow label="Data/Hora" value={format(parseISO(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })} />
                <DetailRow label="Ação" value={selectedLog.tipo_de_acao} />
                {selectedLog.ip_address && <DetailRow label="IP" value={selectedLog.ip_address} />}
                {selectedLog.user_agent && <DetailRow label="User Agent" value={selectedLog.user_agent} />}
                {selectedLog.erro && <DetailRow label="Erro" value={selectedLog.erro} className="text-destructive" />}
                {selectedLog.usuario_responsavel && <DetailRow label="Responsável" value={selectedLog.usuario_responsavel} />}
                {selectedLog.usuario_id && <DetailRow label="Usuário ID" value={selectedLog.usuario_id} />}
                {selectedLog.detalhes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Detalhes</p>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedLog.detalhes, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.dados_anteriores && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Dados Anteriores</p>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedLog.dados_anteriores, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.dados_novos && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Dados Novos</p>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedLog.dados_novos, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// === Sub-componentes ===

const DetailRow = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className={`text-sm font-mono break-all ${className || ''}`}>{value}</p>
  </div>
);

interface SummaryCardProps {
  title: string;
  value: number;
  icon: any;
  description: string;
  loading: boolean;
  variant?: 'default' | 'danger' | 'warning';
}

const SummaryCard = ({ title, value, icon: Icon, description, loading, variant = 'default' }: SummaryCardProps) => {
  const borderClass = variant === 'danger' 
    ? 'border-destructive/50' 
    : variant === 'warning' 
    ? 'border-yellow-500/50' 
    : 'border-border';

  return (
    <Card className={`${borderClass}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`p-2 rounded-lg ${
            variant === 'danger' ? 'bg-destructive/10 text-destructive' :
            variant === 'warning' ? 'bg-yellow-500/10 text-yellow-600' :
            'bg-primary/10 text-primary'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface LogTableProps {
  logs: any[];
  columns: string[];
  renderRow: (log: any) => React.ReactNode;
  emptyMessage: string;
}

const LogTable = ({ logs, columns, renderRow, emptyMessage }: LogTableProps) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col, i) => (
              <th key={i} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{logs.map(renderRow)}</tbody>
      </table>
      {logs.length >= 500 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Mostrando os últimos 500 registros. Refine o período para ver dados específicos.
        </p>
      )}
    </div>
  );
};

const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
);

export default AuditoriaSeguranca;
