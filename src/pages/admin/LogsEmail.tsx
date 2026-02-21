import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Mail, RefreshCw, Send, Reply, Users, AlertCircle, CheckCircle, User, Hash } from 'lucide-react';
import { onEmailSent } from '@/lib/emailEvents';

import PageHeader from '@/components/admin/PageHeader';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { LogsTable, LogColumn, FilterOption } from '@/components/admin/logging';
import LogsExport from '@/pages/admin/LogsExport';
import EmailLogDetailsModal from '@/components/admin/email/EmailLogDetailsModal';
import EmailLogsFilters from '@/components/admin/email/EmailLogsFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from '@/lib/toast';
import { logErrorToDatabase } from '@/hooks/useErrorLogger';
import {
  getEmailLogs,
  getEmailLogsStats,
  getContasEmail,
  getUsuariosResponsaveis,
  type EmailLogDB,
  type EmailLogsStats
} from '@/services/emailLogsService';

const tipoAcaoOptions: FilterOption[] = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'respondido', label: 'Respondido' },
  { value: 'cc', label: 'CC' },
  { value: 'cco', label: 'CCO' },
];

const statusOptions: FilterOption[] = [
  { value: 'all', label: 'Todos' },
  { value: 'success', label: 'Sucesso' },
  { value: 'error', label: 'Com erro' },
];

const LogsEmail: React.FC = () => {
  const [logs, setLogs] = useState<EmailLogDB[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLogDB | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [contasEmail, setContasEmail] = useState<FilterOption[]>([]);
  const [usuariosResponsaveis, setUsuariosResponsaveis] = useState<FilterOption[]>([]);
  const [stats, setStats] = useState<EmailLogsStats>({
    total: 0,
    enviados: 0,
    respondidos: 0,
    cc: 0,
    cco: 0,
    erros: 0
  });
  const { hasPermission } = usePermissionGuard();

  const canExport = hasPermission('admin.logs-email.exportar');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filtros
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tipoAcao, setTipoAcao] = useState('all');
  const [status, setStatus] = useState<'all' | 'success' | 'error'>('all');
  const [contaEmailId, setContaEmailId] = useState('all');
  const [usuarioResponsavelId, setUsuarioResponsavelId] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [uidSearch, setUidSearch] = useState('');

  const loadContasEmail = useCallback(async () => {
    const [contas, usuarios] = await Promise.all([
      getContasEmail(),
      getUsuariosResponsaveis()
    ]);
    setContasEmail([{ value: 'all', label: 'Todas as contas' }, ...contas]);
    setUsuariosResponsaveis([{ value: 'all', label: 'Todos os usuários' }, ...usuarios]);
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        startDate,
        endDate,
        tipoAcao: tipoAcao !== 'all' ? tipoAcao : undefined,
        status: status as 'all' | 'success' | 'error',
        contaEmailId: contaEmailId !== 'all' ? contaEmailId : undefined,
        usuarioResponsavelId: usuarioResponsavelId !== 'all' ? usuarioResponsavelId : undefined,
        search: searchValue || undefined,
        uid: uidSearch || undefined
      };

      const [logsResult, statsResult] = await Promise.all([
        getEmailLogs(filters, currentPage, pageSize),
        getEmailLogsStats(filters)
      ]);

      setLogs(logsResult.data);
      setTotalLogs(logsResult.count);
      setStats(statsResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao carregar logs de email');
      
      await logErrorToDatabase({
        titulo: 'Falha ao carregar página de logs de email',
        descricao: errorMessage,
        categoria: 'logs_email',
        nivel: 'error',
        pagina: '/admin/logs-email',
        dados_extra: { error }
      });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, tipoAcao, status, contaEmailId, usuarioResponsavelId, searchValue, uidSearch, currentPage, pageSize]);

  useEffect(() => {
    loadContasEmail();
  }, [loadContasEmail]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Ouvir eventos de email enviado para atualizar a lista automaticamente
  useEffect(() => {
    const handleEmailSent = () => {
      // Aguardar um pouco para o banco processar o log
      setTimeout(() => {
        loadLogs();
      }, 1500);
    };

    const unsubscribe = onEmailSent(handleEmailSent);
    
    return () => unsubscribe();
  }, [loadLogs]);

  const handleClearFilters = () => {
    setTipoAcao('all');
    setStatus('all');
    setContaEmailId('all');
    setUsuarioResponsavelId('all');
    setSearchValue('');
    setUidSearch('');
    setStartDate(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadLogs();
  };

  const handleRowClick = (id: string) => {
    const log = logs.find(l => l.id === id);
    if (log) {
      setSelectedLog(log);
      setModalOpen(true);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getTipoAcaoIcon = (tipo: string | null) => {
    const tipoLower = (tipo || '').toLowerCase();
    if (tipoLower.includes('enviad') || tipoLower === 'send') {
      return <Send className="h-4 w-4 text-green-500 shrink-0" />;
    }
    if (tipoLower.includes('respond') || tipoLower === 'reply') {
      return <Reply className="h-4 w-4 text-blue-500 shrink-0" />;
    }
    if (tipoLower === 'cc' || tipoLower === 'cco' || tipoLower === 'bcc') {
      return <Users className="h-4 w-4 text-purple-500 shrink-0" />;
    }
    return <Mail className="h-4 w-4 text-muted-foreground shrink-0" />;
  };

  const columns: LogColumn[] = [
    { key: 'created_at', label: 'Data/Hora', width: '130px' },
    { 
      key: 'tipo_de_acao', 
      label: 'Tipo',
      width: '110px',
      render: (value) => (
        <div className="flex items-center gap-1.5">
          {getTipoAcaoIcon(String(value))}
          <span className="capitalize text-xs">{String(value || '-')}</span>
        </div>
      )
    },
    { 
      key: 'uid', 
      label: 'UID',
      width: '70px',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="font-mono text-xs">{String(value || '-')}</span>
        </div>
      )
    },
    { 
      key: 'destinatario', 
      label: 'Destinatário',
      width: '180px',
      render: (value) => (
        <span className="truncate block text-xs" title={String(value || '-')}>{String(value || '-')}</span>
      )
    },
    { 
      key: 'assunto', 
      label: 'Assunto',
      width: '200px',
      render: (value) => (
        <span className="truncate block text-xs" title={String(value || '-')}>{String(value || '-')}</span>
      )
    },
    { 
      key: 'pasta', 
      label: 'Pasta',
      width: '90px',
      render: (value) => <Badge variant="outline" className="text-xs">{String(value || '-')}</Badge>
    },
    { 
      key: 'erro', 
      label: 'Status',
      width: '80px',
      render: (value) => value ? (
        <Badge variant="destructive" className="gap-1 text-xs">
          <AlertCircle className="h-3 w-3" />
          Erro
        </Badge>
      ) : (
        <Badge className="bg-green-500/20 text-green-700 border-green-500/30 gap-1 text-xs">
          <CheckCircle className="h-3 w-3" />
          OK
        </Badge>
      )
    },
    { 
      key: 'usuario', 
      label: 'Responsável',
      width: '120px',
      render: (value) => (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="truncate block text-xs" title={(value as any)?.nome || '-'}>
            {(value as any)?.nome || '-'}
          </span>
        </div>
      )
    },
    { 
      key: 'conta_email', 
      label: 'Conta',
      width: '150px',
      render: (value) => (
        <span className="truncate block text-xs text-muted-foreground" title={(value as any)?.email || '-'}>
          {(value as any)?.email || '-'}
        </span>
      )
    },
  ];

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <PermissionGuard 
      permissions="admin.logs-email.visualizar"
      showMessage={true}
    >
      <div className="flex flex-col h-full p-3 sm:p-4 md:p-6 space-y-4">
        <PageHeader
          title="Logs de Email"
          subtitle="Monitore emails enviados, respondidos, CC e CCO"
          icon={Mail}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Central de Logs', href: '/logs-central' },
            { label: 'Logs de Email' }
          ]}
          actions={
            <div className="flex gap-2 flex-wrap">
              <Button onClick={loadLogs} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              {canExport && <LogsExport data={logs as unknown as Record<string, unknown>[]} filename="logs_email" />}
            </div>
          }
        />

        {/* Stats Cards - Scrollable on mobile */}
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2 min-w-max sm:grid sm:grid-cols-3 md:grid-cols-6 sm:min-w-0">
            <Card className="min-w-[120px] sm:min-w-0">
              <CardContent className="pt-3 pb-2 px-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[120px] sm:min-w-0">
              <CardContent className="pt-3 pb-2 px-3">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-green-600">{stats.enviados}</p>
                    <p className="text-xs text-muted-foreground">Enviados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[120px] sm:min-w-0">
              <CardContent className="pt-3 pb-2 px-3">
                <div className="flex items-center gap-2">
                  <Reply className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-blue-600">{stats.respondidos}</p>
                    <p className="text-xs text-muted-foreground">Respondidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[120px] sm:min-w-0">
              <CardContent className="pt-3 pb-2 px-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-purple-600">{stats.cc}</p>
                    <p className="text-xs text-muted-foreground">CC</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[120px] sm:min-w-0">
              <CardContent className="pt-3 pb-2 px-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-orange-600">{stats.cco}</p>
                    <p className="text-xs text-muted-foreground">CCO</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[120px] sm:min-w-0">
              <CardContent className="pt-3 pb-2 px-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-destructive">{stats.erros}</p>
                    <p className="text-xs text-muted-foreground">Erros</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <ScrollBar orientation="horizontal" className="sm:hidden" />
        </ScrollArea>

        {/* Filtros */}
        <EmailLogsFilters
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          tipoAcao={tipoAcao}
          onTipoAcaoChange={setTipoAcao}
          tipoAcaoOptions={tipoAcaoOptions}
          status={status}
          onStatusChange={setStatus}
          statusOptions={statusOptions}
          contaEmailId={contaEmailId}
          onContaEmailIdChange={setContaEmailId}
          contasEmail={contasEmail}
          usuarioResponsavelId={usuarioResponsavelId}
          onUsuarioResponsavelIdChange={setUsuarioResponsavelId}
          usuariosResponsaveis={usuariosResponsaveis}
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          uidSearch={uidSearch}
          onUidSearchChange={setUidSearch}
          onSearch={handleSearch}
          onClear={handleClearFilters}
        />

        {/* Tabela */}
        <Card className="flex-1 min-h-0 overflow-hidden">
          <CardHeader className="pb-3 px-3 sm:px-6">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Registros</span>
              <Badge variant="secondary" className="font-normal">
                {totalLogs} log{totalLogs !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[900px] sm:min-w-0">
                <LogsTable
                  data={logs as unknown as Record<string, unknown>[]}
                  columns={columns}
                  loading={loading}
                  onRowClick={handleRowClick}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalLogs}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <EmailLogDetailsModal
          log={selectedLog}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </PermissionGuard>
  );
};

export default LogsEmail;
