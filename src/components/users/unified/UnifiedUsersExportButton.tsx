import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { UsuarioComCargo } from '@/hooks/useUnifiedUsers';
import { exportToCSV, CsvColumn, formatDate, formatBoolean } from '@/utils/csvExport';
import { useToast } from '@/hooks/use-toast';

interface UnifiedUsersExportButtonProps {
  users: UsuarioComCargo[];
  loading?: boolean;
}

export const UnifiedUsersExportButton = ({ users, loading = false }: UnifiedUsersExportButtonProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    if (users.length === 0) {
      toast({
        title: 'Nenhum Dado',
        description: 'Não há usuários para exportar',
        variant: 'destructive'
      });
      return;
    }

    const columns: CsvColumn[] = [
      { key: 'id', header: 'ID' },
      { key: 'nome', header: 'Nome' },
      { key: 'email', header: 'Email' },
      { key: 'telefone', header: 'Telefone' },
      { key: 'cnpjcpf', header: 'CPF/CNPJ' },
      { 
        key: 'cargo_info', 
        header: 'Cargo',
        format: (cargo: unknown) => (cargo as { nome?: string } | null)?.nome || '-'
      },
      { 
        key: 'acesso_area_cliente', 
        header: 'Acesso Cliente',
        format: formatBoolean
      },
      { 
        key: 'acesso_area_admin', 
        header: 'Acesso Admin',
        format: formatBoolean
      },
      { 
        key: 'ativo', 
        header: 'Ativo',
        format: formatBoolean
      },
      { 
        key: 'email_verified', 
        header: 'Email Verificado',
        format: formatBoolean
      },
      { 
        key: 'data_criacao', 
        header: 'Data de Criação',
        format: formatDate
      },
      { 
        key: 'data_ultima_atividade', 
        header: 'Última Atividade',
        format: formatDate
      }
    ];

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `usuarios_${timestamp}.csv`;

    exportToCSV(users, columns, filename);

    toast({
      title: 'Exportação Concluída',
      description: `${users.length} usuário(s) exportado(s) com sucesso`
    });
  };

  return (
    <Button 
      onClick={handleExport} 
      variant="outline" 
      className="gap-2"
      disabled={loading}
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Exportar CSV</span>
      <span className="sm:hidden">CSV</span>
    </Button>
  );
};
