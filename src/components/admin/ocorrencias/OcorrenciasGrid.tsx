import { Ocorrencia } from '@/types/ocorrencias';
import OcorrenciasCard from './OcorrenciasCard';

interface OcorrenciasGridProps {
  ocorrencias: Ocorrencia[];
  onViewDetails: (ocorrencia: Ocorrencia) => void;
}

const OcorrenciasGrid = ({ ocorrencias, onViewDetails }: OcorrenciasGridProps) => {
  if (ocorrencias.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma ocorrência encontrada
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ocorrencias.map((ocorrencia) => (
        <OcorrenciasCard
          key={ocorrencia.id}
          ocorrencia={ocorrencia}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default OcorrenciasGrid;
