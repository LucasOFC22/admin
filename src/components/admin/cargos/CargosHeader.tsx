
import React from 'react';
import { Shield, Plus, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageHeader from '../PageHeader';

interface CargosHeaderProps {
  onRefresh: () => void;
  onCreateRole: () => void;
  stats?: {
    total: number;
    active: number;
    inactive: number;
    admin: number;
    custom: number;
  };
}

const CargosHeader = ({ onRefresh, onCreateRole, stats }: CargosHeaderProps) => {
  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'Cargos e Permissões' }
  ];

  const actions = (
    <div className="flex items-center gap-2">
      {stats && (
        <div className="flex items-center gap-2 mr-4">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Total: {stats.total}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Ativos: {stats.active}
          </Badge>
        </div>
      )}
      <Button variant="outline" onClick={onRefresh} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Atualizar
      </Button>
      <Button variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
        <Download className="w-4 h-4" />
        Exportar
      </Button>
      <Button onClick={onCreateRole} className="gap-2">
        <Plus className="w-4 h-4" />
        Novo Cargo
      </Button>
    </div>
  );

  return (
    <PageHeader
      title="Gestão de Cargos"
      subtitle="Gerencie cargos, níveis hierárquicos e permissões do sistema"
      icon={Shield}
      breadcrumbs={breadcrumbs}
      actions={actions}
    />
  );
};

export default CargosHeader;
