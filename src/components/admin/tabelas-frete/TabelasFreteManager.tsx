import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/admin/PageHeader';
import TabelaFreteList from './TabelaFreteList';
import TabelaFreteEditor from './TabelaFreteEditor';
import TabelaFreteLogs from './TabelaFreteLogs';

export interface TabelaFrete {
  id: string;
  nome: string;
  descricao: string | null;
  dados: any[][];
  colunas: string[];
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  atualizado_por: string | null;
  ativo: boolean;
}

const TabelasFreteManager = () => {
  const [selectedTabela, setSelectedTabela] = useState<TabelaFrete | null>(null);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { user } = useUnifiedAuth();
  const { canAccess } = usePermissionGuard();
  const queryClient = useQueryClient();

  const canView = canAccess('admin.tabelas-frete.visualizar');
  const canCreate = canAccess('admin.tabelas-frete.criar');
  const canEdit = canAccess('admin.tabelas-frete.editar');
  const canDelete = canAccess('admin.tabelas-frete.excluir');

  const { data: tabelas = [], isLoading } = useQuery({
    queryKey: ['tabelas-frete'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tabelas_frete' as any)
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TabelaFrete[];
    },
    enabled: canView,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const defaultColunas = ['Faixa de Peso', 'Valor Fixo (R$)', 'Frete Peso (R$/kg)', 'Frete Valor (%)', 'Taxa (R$)', 'Outros (%)'];
      const defaultDados = [
        ['01 a 30 Kg', '100,00', '', '', '', ''],
        ['31 a 50 Kg', '110,00', '', '', '', ''],
        ['51 a 70 Kg', '120,00', '', '', '', ''],
        ['71 a 100 Kg', '140,00', '', '', '', ''],
        ['101 a 150 Kg', '160,00', '', '', '', ''],
        ['151 a 200 Kg', '190,00', '', '', '', ''],
        ['Acima de 200 Kg', '', '0,98', '0,8', '50,00', '7'],
      ];
      const { data, error } = await supabase
        .from('tabelas_frete' as any)
        .insert({
          nome: 'Nova Tabela de Frete',
          descricao: 'Cubagem: 240 kg/m³. Mercadorias acima de R$ 1.000,00: frete cobrado sobre NF. Validade: 45 dias sem movimentação.',
          colunas: defaultColunas,
          dados: defaultDados,
          criado_por: user?.id || null,
          atualizado_por: user?.id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Log
      await supabase.from('logs_tabelas_frete' as any).insert({
        tabela_frete_id: (data as any).id,
        usuario_id: user?.id || null,
        usuario_nome: user?.nome || 'Sistema',
        acao: 'criacao',
        detalhes: { nome: 'Nova Tabela de Frete' },
      } as any);

      return data as unknown as TabelaFrete;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] });
      setSelectedTabela(data);
      setCreating(false);
      toast.success('Tabela criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar tabela'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tabelas_frete' as any)
        .update({ ativo: false, atualizado_por: user?.id } as any)
        .eq('id', id);
      if (error) throw error;

      await supabase.from('logs_tabelas_frete' as any).insert({
        tabela_frete_id: id,
        usuario_id: user?.id || null,
        usuario_nome: user?.nome || 'Sistema',
        acao: 'exclusao',
        detalhes: {},
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] });
      setSelectedTabela(null);
      toast.success('Tabela excluída');
    },
    onError: () => toast.error('Erro ao excluir tabela'),
  });

  if (selectedTabela) {
    return (
      <TabelaFreteEditor
        tabela={selectedTabela}
        canEdit={canEdit}
        onBack={() => {
          setSelectedTabela(null);
          queryClient.invalidateQueries({ queryKey: ['tabelas-frete'] });
        }}
        onShowLogs={() => setShowLogs(selectedTabela.id)}
      />
    );
  }

  if (showLogs) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Logs da Tabela de Frete"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Tabelas de Frete', href: '/tabelas-frete' },
            { label: 'Logs' },
          ]}
        />
        <TabelaFreteLogs tabelaId={showLogs} onBack={() => setShowLogs(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tabelas de Frete"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Operacional' },
          { label: 'Tabelas de Frete' },
        ]}
      />

      <div className="flex justify-end">
        {canCreate && (
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tabela
          </Button>
        )}
      </div>

      <TabelaFreteList
        tabelas={tabelas}
        isLoading={isLoading}
        onSelect={setSelectedTabela}
        onDelete={canDelete ? (id) => deleteMutation.mutate(id) : undefined}
        onShowLogs={(id) => setShowLogs(id)}
      />
    </div>
  );
};

export default TabelasFreteManager;
