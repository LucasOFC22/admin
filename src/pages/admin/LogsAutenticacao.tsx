import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { KeyRound, RefreshCw, LogIn, LogOut } from 'lucide-react';

import PageHeader from '@/components/admin/PageHeader';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { LogsTable, LogColumn, LogsFilters, LogsStats, LogsStatsData, FilterOption } from '@/components/admin/logging';
import LogsExport from '@/pages/admin/LogsExport';
import LogDetailsModal from '@/pages/admin/LogDetailsModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { toast } from '@/lib/toast';

const LogsAutenticacao: React.FC = () => {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Record<string, unknown> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarios, setUsuarios] = useState<FilterOption[]>([]);
  const { hasPermission } = usePermissionGuard();

  const canExport = hasPermission('admin.logs-autenticacao.exportar');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filtros
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');

  const tipoOptions: FilterOption[] = [
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
  ];

  const loadUsuarios = useCallback(async () => {
    const supabase = requireAuthenticatedClient();
    const { data } = await supabase
      .from('usuarios')
      .select('id, nome')
      .order('nome');
    setUsuarios((data || []).map(u => ({ value: u.id, label: u.nome })));
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = requireAuthenticatedClient();
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('logs_autenticacao')
        .select('*, usuarios:usuario_id(nome)', { count: 'exact' })
        .in('tipo_de_acao', ['login', 'logout'])
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (selectedUsuario) {
        query = query.eq('usuario_id', selectedUsuario);
      }
      if (selectedTipo) {
        query = query.eq('tipo_de_acao', selectedTipo);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      setLogs(data || []);
      setTotalLogs(count || 0);
    } catch (error) {
      toast.error('Erro ao carregar logs de autenticação');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedUsuario, selectedTipo, currentPage, pageSize]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleClearFilters = () => {
    setSelectedUsuario('');
    setSelectedTipo('');
    setStartDate(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setCurrentPage(1);
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

  const loginCount = logs.filter(l => l.tipo_de_acao === 'login').length;
  const logoutCount = logs.filter(l => l.tipo_de_acao === 'logout').length;

  const stats: LogsStatsData = {
    total: totalLogs,
    success: loginCount,
    info: logoutCount,
  };

  const columns: LogColumn[] = [
    { key: 'created_at', label: 'Data/Hora', width: '140px' },
    { 
      key: 'tipo_de_acao', 
      label: 'Evento', 
      width: '100px',
      render: (value) => {
        const isLogin = value === 'login';
        return (
          <div className="flex items-center gap-2">
            {isLogin ? <LogIn className="h-4 w-4 text-green-500" /> : <LogOut className="h-4 w-4 text-orange-500" />}
            <span>{isLogin ? 'Login' : 'Logout'}</span>
          </div>
        );
      }
    },
    { 
      key: 'usuarios', 
      label: 'Usuário',
      render: (value) => (value as any)?.nome || '-'
    },
    { key: 'ip_address', label: 'IP', width: '120px' },
    { 
      key: 'user_agent', 
      label: 'Dispositivo',
      render: (value) => {
        const ua = String(value || '');
        if (ua.includes('Mobile')) return 'Mobile';
        if (ua.includes('Tablet') || ua.includes('iPad')) return 'Tablet';
        return 'Desktop';
      }
    },
  ];

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    
      <PermissionGuard 
        permissions="admin.logs-autenticacao.visualizar"
        showMessage={true}
      >
        <div className="flex flex-col h-full p-6 space-y-6">
          <PageHeader
            title="Logs de Autenticação"
            subtitle="Monitore logins e logouts do sistema"
            icon={KeyRound}
            breadcrumbs={[
              { label: 'Dashboard', href: '/' },
              { label: 'Central de Logs', href: '/logs-central' },
              { label: 'Logs de Autenticação' }
            ]}
            actions={
              <div className="flex gap-2">
                <Button onClick={loadLogs} variant="outline" size="sm" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                {canExport && <LogsExport data={logs} filename="logs_autenticacao" />}
              </div>
            }
          />

          <LogsStats stats={stats} showLevels={false} />

          <LogsFilters
            usuarios={usuarios}
            selectedUsuario={selectedUsuario}
            onUsuarioChange={setSelectedUsuario}
            selectedTipo={selectedTipo}
            onTipoChange={setSelectedTipo}
            tipoOptions={tipoOptions}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onSearch={() => { setCurrentPage(1); loadLogs(); }}
            onClear={handleClearFilters}
            config={{ showUsuario: true, showTipo: true }}
          />

          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Registros</span>
                <Badge variant="secondary" className="font-normal">
                  {totalLogs} log{totalLogs !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LogsTable
                data={logs}
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
            </CardContent>
          </Card>

          <LogDetailsModal
            log={selectedLog}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        </div>
      </PermissionGuard>
    
  );
};

export default LogsAutenticacao;
