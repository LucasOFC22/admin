
import { FileSearch, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '../PageHeader';

const ConsultarNFeHeader = () => {
  const breadcrumbs = [
    { label: 'Administração' },
    { label: 'Consultar NF-e' }
  ];

  const actions = (
    <Button 
      variant="outline" 
      size="sm"
      className="gap-2"
    >
      <Search className="w-4 h-4" />
      Ajuda
    </Button>
  );

  return (
    <PageHeader
      title="Consultar NF-e"
      subtitle="Consulte informações de Notas Fiscais Eletrônicas pela chave de acesso"
      icon={FileSearch}
      breadcrumbs={breadcrumbs}
      actions={actions}
    />
  );
};

export default ConsultarNFeHeader;
