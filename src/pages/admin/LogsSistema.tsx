/**
 * Página de Logs de Sistema
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { LogSistema } from '@/types/allLogs';
import { LogsTable, LogsFilters, LogsHeader } from '@/components/admin/logging';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const LogsSistema = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    searchTerm: '',
    tipoAcao: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['logs-sistema', filters, currentPage, pageSize],
    queryFn: async () => {
      const supabase = requireAuthenticatedClient();
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('logs_sistema')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.tipoAcao) {
        query = query.eq('nivel', filters.tipoAcao);
      }
      if (filters.searchTerm) {
        query = query.or(`mensagem.ilike.%${filters.searchTerm}%,modulo.ilike.%${filters.searchTerm}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data as LogSistema[], total: count || 0 };
    }
  });

  const logs = data?.logs || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const columns = [
    {
      key: 'created_at',
      label: 'Data/Hora',
      render: (value: unknown) => {
        if (!value) return '-';
        return format(new Date(value as string), "dd/MM/yy HH:mm", { locale: ptBR });
      }
    },
    { key: 'nivel', label: 'Nível' },
    { key: 'modulo', label: 'Módulo' },
    { key: 'mensagem', label: 'Mensagem' },
    { key: 'usuario_id', label: 'Usuário' }
  ];

  const tiposAcao = [
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Critical' }
  ];

  const handleClear = () => {
    setFilters({ startDate: '', endDate: '', searchTerm: '', tipoAcao: '' });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <PermissionGuard 
      permissions="admin.logs-sistema.visualizar"
      showMessage={true}
    >
      <div className="space-y-6 p-6">
          <LogsHeader
          title="Logs de Sistema"
          description="Erros, avisos e eventos do sistema"
          icon={<AlertTriangle className="h-6 w-6" />}
          onRefresh={refetch}
          data={logs}
          filename="logs_sistema"
        />

        <LogsFilters
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(v) => setFilters({ ...filters, startDate: v })}
          onEndDateChange={(v) => setFilters({ ...filters, endDate: v })}
          selectedTipo={filters.tipoAcao}
          onTipoChange={(v) => setFilters({ ...filters, tipoAcao: v })}
          tipoOptions={tiposAcao}
          searchValue={filters.searchTerm}
          onSearchChange={(v) => setFilters({ ...filters, searchTerm: v })}
          onSearch={refetch}
          onClear={handleClear}
          config={{ showTipo: true, showSearch: true }}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registros</CardTitle>
            <CardDescription>
              {totalItems} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LogsTable
              data={logs as unknown as Record<string, unknown>[]}
              columns={columns}
              loading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default LogsSistema;
