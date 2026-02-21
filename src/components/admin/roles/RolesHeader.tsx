
import { Shield, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../PageHeader';

const RolesHeader = () => {
  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'Cargos' }
  ];

  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="gap-2">
        <Settings className="w-4 h-4" />
        Configurar
      </Button>
      <Button className="gap-2">
        <Plus className="w-4 h-4" />
        Novo Cargo
      </Button>
    </div>
  );

  return (
    <PageHeader
      title="Gestão de Cargos"
      subtitle="Gerencie cargos e hierarquia organizacional"
      icon={Shield}
      breadcrumbs={breadcrumbs}
      actions={actions}
    />
  );
};

export default RolesHeader;
