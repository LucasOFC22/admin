
import { Package } from 'lucide-react';
import { QuoteDetails } from "@/types/quote";

interface CargoDetailsSectionProps {
  selectedQuote: QuoteDetails;
}

const CargoDetailsSection = ({ selectedQuote }: CargoDetailsSectionProps) => {
  return (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Package className="h-5 w-5" />
        Detalhes da Carga
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <p><strong>Descrição:</strong> {selectedQuote.carga?.descricao || 'N/A'}</p>
        <p><strong>Peso:</strong> {selectedQuote.carga?.peso || 'N/A'} kg</p>
        <p><strong>Valor Declarado:</strong> R$ {parseFloat(String(selectedQuote.carga?.valorDeclarado || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <p><strong>Dimensões:</strong> {selectedQuote.carga?.altura || 'N/A'} x {selectedQuote.carga?.largura || 'N/A'} x {selectedQuote.carga?.profundidade || 'N/A'} cm</p>
      </div>
      {selectedQuote.carga?.notes && (
        <p className="mt-3 text-sm"><strong>Observações:</strong> {selectedQuote.carga.notes}</p>
      )}
    </div>
  );
};

export default CargoDetailsSection;
