
import { MapPin, ArrowRight } from 'lucide-react';
import { QuoteDetails } from "@/types/quote";

interface RouteDisplayProps {
  selectedQuote: QuoteDetails;
}

const RouteDisplay = ({ selectedQuote }: RouteDisplayProps) => {
  // Função para extrair origem e destino corretamente dos endereços
  const getOriginCity = () => {
    // Priorizar sender.address.city, depois remetente.address.city, depois fallback para origin
    const senderCity = (selectedQuote as any).sender?.address?.city;
    const remetenteAddress = selectedQuote.remetente?.address;
    
    if (senderCity) return senderCity;
    if (remetenteAddress && typeof remetenteAddress === 'object') {
      return remetenteAddress.city;
    }
    return selectedQuote.origin || 'N/A';
  };

  const getDestinationCity = () => {
    // Priorizar recipient.address.city, depois destinatario.address.city, depois fallback para destination
    const recipientCity = (selectedQuote as any).recipient?.address?.city;
    const destinatarioAddress = selectedQuote.destinatario?.address;
    
    if (recipientCity) return recipientCity;
    if (destinatarioAddress && typeof destinatarioAddress === 'object') {
      return destinatarioAddress.city;
    }
    return selectedQuote.destination || 'N/A';
  };

  const originCity = getOriginCity();
  const destinationCity = getDestinationCity();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Rota de Transporte</h3>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <p className="text-sm text-blue-600 font-medium mb-2">ORIGEM</p>
            <p className="font-bold text-lg text-gray-800">
              {originCity}
            </p>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center px-8">
          <div className="flex items-center gap-2">
            <div className="h-px bg-gradient-to-r from-blue-400 to-indigo-400 w-16"></div>
            <ArrowRight className="h-6 w-6 text-blue-500" />
            <div className="h-px bg-gradient-to-r from-blue-400 to-indigo-400 w-16"></div>
          </div>
        </div>
        
        <div className="text-center flex-1">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <p className="text-sm text-blue-600 font-medium mb-2">DESTINO</p>
            <p className="font-bold text-lg text-gray-800">
              {destinationCity}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDisplay;
