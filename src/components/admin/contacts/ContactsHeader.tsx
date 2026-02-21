
import { Users, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../PageHeader';

const ContactsHeader = () => {
  const breadcrumbs = [
    { label: 'Admin' },
    { label: 'Contatos' }
  ];

  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="gap-2">
        <Download className="w-4 h-4" />
        Exportar
      </Button>
      <Button className="gap-2">
        <Plus className="w-4 h-4" />
        Novo Contato
      </Button>
    </div>
  );

  return (
    <PageHeader
      title="Gestão de Contatos"
      subtitle="Gerencie mensagens e contatos dos clientes"
      icon={Users}
      breadcrumbs={breadcrumbs}
      actions={actions}
    />
  );
};

export default ContactsHeader;
