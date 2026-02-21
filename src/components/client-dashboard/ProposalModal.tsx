
import { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Calendar, Package, Clock, Phone } from 'lucide-react';
import { QuoteDetails, ProposalData } from "@/types/quote";
import { useToast } from "@/hooks/use-toast";
import ProposalCard from './ProposalCard';
import ProposalHeader from './proposal/ProposalHeader';
import RouteDisplay from './proposal/RouteDisplay';
import CargoDetailsSection from './proposal/CargoDetailsSection';
import ConfirmationDialog from './proposal/ConfirmationDialog';
import ActionButtons from './proposal/ActionButtons';
import { n8nQuotesService } from '@/services/n8n/quotesService';

interface ProposalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedQuote: QuoteDetails;
  onQuoteStatusUpdate?: () => void;
}

type ProposalAction = 'aceita' | 'recusada';

const ProposalModal = ({ isOpen, onOpenChange, selectedQuote, onQuoteStatusUpdate }: ProposalModalProps) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<ProposalAction | null>(null);
  const { toast } = useToast();

  const calculateProposalValue = (): string => {
    const baseValue = parseFloat(String(selectedQuote.carga?.declaredValue || selectedQuote.carga?.valorDeclarado || 1000));
    const weight = parseFloat(String(selectedQuote.carga?.weight || selectedQuote.carga?.peso || 50));
    
    const transportValue = (baseValue * 0.02) + (weight * 5);
    return `R$ ${transportValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const calculateDeliveryTime = (): string => {
    const sameState = selectedQuote.originState === selectedQuote.destinationState;
    return sameState ? "1-2 dias úteis" : "3-5 dias úteis";
  };

  const proposalData: ProposalData = {
    valor: calculateProposalValue(),
    prazo: calculateDeliveryTime(),
    modalidade: "Rodoviário",
    seguro: "Incluído",
    observacoes: "Transporte com rastreamento em tempo real e seguro total da carga."
  };

  const handleQuoteResponse = async (action: ProposalAction): Promise<void> => {
    if (!selectedQuote.id) {
      toast({
        title: "Erro",
        description: "ID da cotação não encontrado.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await n8nQuotesService.updateQuote(selectedQuote.id, {
        status: action === 'aceita' ? 'aceita' : 'rejeitada',
      });

      toast({
        title: action === 'aceita' ? "Proposta Aceita!" : "Proposta Recusada",
        description: action === 'aceita' 
          ? "Sua proposta foi aceita. Nossa equipe entrará em contato em breve."
          : "Sua resposta foi registrada. Agradecemos sua consideração.",
      });

      if (onQuoteStatusUpdate) {
        onQuoteStatusUpdate();
      }

      onOpenChange(false);
      setShowConfirmation(null);
    } catch (error) {
      console.error("Erro ao atualizar status da cotação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar sua resposta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <ProposalHeader selectedQuote={selectedQuote} />

          <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
            <RouteDisplay selectedQuote={selectedQuote} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <ProposalCard 
                icon={DollarSign}
                title="Valor Total"
                value={String(proposalData.valor)}
                description="Incluindo todos os impostos"
              />
              <ProposalCard 
                icon={Clock}
                title="Prazo de Entrega"
                value={proposalData.prazo}
                description="A partir da coleta"
              />
              <ProposalCard 
                icon={Package}
                title="Modalidade"
                value={proposalData.modalidade}
                description="Porta a porta"
              />
            </div>

            <CargoDetailsSection selectedQuote={selectedQuote} />

            <Separator className="my-6" />

            <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Observações Importantes</h3>
              <p className="text-gray-700">{proposalData.observacoes}</p>
            </div>

            <div className="bg-corporate-50 p-6 rounded-xl border border-corporate-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Precisa de mais informações?
              </h3>
              <p className="text-gray-700 mb-3">
                Nossa equipe está disponível para esclarecer qualquer dúvida sobre esta proposta.
              </p>
              <div className="flex items-center gap-2 text-corporate-600 font-semibold">
                <Phone size={18} />
                <span>(11) 4321-5678</span>
              </div>
            </div>
          </div>

          <ActionButtons 
            isUpdating={isUpdating}
            onClose={() => onOpenChange(false)}
            onAccept={() => setShowConfirmation('aceita')}
            onReject={() => setShowConfirmation('recusada')}
          />
        </DialogContent>
      </Dialog>

      <ConfirmationDialog 
        showConfirmation={showConfirmation}
        isUpdating={isUpdating}
        onCancel={() => setShowConfirmation(null)}
        onConfirm={() => handleQuoteResponse(showConfirmation!)}
      />
    </>
  );
};

export default ProposalModal;
