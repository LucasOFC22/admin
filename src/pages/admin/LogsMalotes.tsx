/**
 * Página de Logs de Malotes
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { requireAuthenticatedClient } from '@/config/supabaseAuth';
import { LogMalote } from '@/types/allLogs';
import { LogsTable, LogsFilters, LogsHeader } from '@/components/admin/logging';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package } from 'lucide-react';
import PermissionGuard from '@/components/admin/permissions/PermissionGuard';

const LogsMalotes = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    searchTerm: '',
    tipoAcao: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['logs-malotes', filters, currentPage, pageSize],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const supabase = requireAuthenticatedClient();
      let query = supabase
        .from('logs_malotes')
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
        query = query.eq('tipo_de_acao', filters.tipoAcao);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data as LogMalote[], total: count || 0 };
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
    { key: 'tipo_de_acao', label: 'Ação' },
    { key: 'usuario_responsavel', label: 'Responsável' },
    { key: 'malote_id', label: 'ID Malote' },
    { key: 'viagem_id', label: 'ID Viagem' }
  ];

  const tiposAcao = [
    { value: 'criar', label: 'Criar' },
    { value: 'editar', label: 'Editar' },
    { value: 'excluir', label: 'Excluir' },
    { value: 'enviar', label: 'Enviar' },
    { value: 'receber', label: 'Receber' }
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
      permissions="admin.logs-malotes.visualizar"
      showMessage={true}
    >
      <div className="space-y-6 p-6">
          <LogsHeader
          title="Logs de Malotes"
          description="Histórico de atividades de malotes e viagens"
          icon={<Package className="h-6 w-6" />}
          onRefresh={refetch}
          data={logs}
          filename="logs_malotes"
        />

        <LogsFilters
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(v) => setFilters({ ...filters, startDate: v })}
          onEndDateChange={(v) => setFilters({ ...filters, endDate: v })}
          selectedTipo={filters.tipoAcao}
          onTipoChange={(v) => setFilters({ ...filters, tipoAcao: v })}
          tipoOptions={tiposAcao}
          onSearch={refetch}
          onClear={handleClear}
          config={{ showTipo: true, showSearch: false }}
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

export default LogsMalotes;
