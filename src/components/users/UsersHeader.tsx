
import { Users, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../admin/PageHeader';

const UsersHeader = () => {
  const breadcrumbs = [
    { label: 'Administração' },
    { label: 'Usuários' }
  ];

  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm">
        <Download className="w-4 h-4" />
        Exportar
      </Button>
    </div>
  );

  return (
    <PageHeader
      title="Gestão de Usuários"
      subtitle="Gerencie usuários e suas permissões no sistema de forma centralizada"
      icon={Users}
      breadcrumbs={breadcrumbs}
      actions={actions}
    />
  );
};

export default UsersHeader;
