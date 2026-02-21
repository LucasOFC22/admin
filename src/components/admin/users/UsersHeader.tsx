
import { Users, Download, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../PageHeader';

const UsersHeader = () => {
  const breadcrumbs = [
    { label: 'Administração' },
    { label: 'Usuários' }
  ];

  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="gap-2 text-gray-600 border-gray-300 hover:bg-gray-50">
        <Download className="w-4 h-4" />
        Exportar
      </Button>
      <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
        <UserPlus className="w-4 h-4" />
        Novo Usuário
      </Button>
    </div>
  );

  return (
    <PageHeader
      title="Gestão de Usuários"
      subtitle="Gerencie usuários e suas permissões no sistema de forma centralizada e segura"
      icon={Users}
      breadcrumbs={breadcrumbs}
      actions={actions}
    />
  );
};

export default UsersHeader;
