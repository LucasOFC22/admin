
import { FileSearch } from 'lucide-react';
import PageHeader from '../PageHeader';

const ConsultarNFeHeaderMinimal = () => {
  const breadcrumbs = [
    { label: 'Admin', href: '/' },
    { label: 'Consultar NF-e' }
  ];

  return (
    <PageHeader
      title="Consultar NF-e"
      subtitle="Consulte informações de Notas Fiscais Eletrônicas"
      icon={FileSearch}
      breadcrumbs={breadcrumbs}
    />
  );
};

export default ConsultarNFeHeaderMinimal;
