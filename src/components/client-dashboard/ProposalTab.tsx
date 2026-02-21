
import { Button } from "@/components/ui/button";
import { FileText, Phone, Check, X } from "lucide-react";
import { QuoteDetails } from "@/types/quote";
import { useState } from 'react';
import ProposalModal from './ProposalModal';

interface ProposalTabProps {
  selectedQuote: QuoteDetails;
  onQuoteStatusUpdate?: () => void;
}

const ProposalTab = ({ selectedQuote, onQuoteStatusUpdate }: ProposalTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="h-[450px] overflow-auto">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          {selectedQuote.status === "proposta_enviada" ? (
            <div className="max-w-lg">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200 mb-6 shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <FileText size={36} />
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-3">Proposta Disponível</h3>
                <p className="text-green-700 mb-6 leading-relaxed">
                  Sua proposta está pronta! Clique no botão abaixo para visualizar todos os detalhes e responder.
                </p>
                
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full mb-4 bg-gradient-to-r from-corporate-600 to-corporate-700 hover:from-corporate-700 hover:to-corporate-800 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <FileText className="mr-2" size={20} />
                  Ver Proposta Completa
                </Button>

                <p className="text-sm text-green-600 font-medium">
                  ✓ Proposta detalhada com valores e prazos
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-lg mb-4 text-gray-800">Precisa de ajuda?</h4>
                <p className="text-gray-600 mb-6">
                  Para esclarecimentos ou dúvidas sobre a proposta, entre em contato:
                </p>
                <div className="flex items-center justify-center gap-2 text-corporate-600 font-semibold">
                  <Phone size={18} />
                  <span>(11) 4321-5678</span>
                </div>
              </div>
            </div>
          ) : selectedQuote.status === "aceita" ? (
            <div className="max-w-lg">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200 shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Check size={36} />
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-3">Proposta Aceita</h3>
                <p className="text-green-700 leading-relaxed">
                  Excelente! Você aceitou esta proposta. Nossa equipe comercial entrará em contato em breve para os próximos passos.
                </p>
                <div className="mt-6 p-4 bg-green-100 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    📞 Aguarde nosso contato nas próximas 24 horas
                  </p>
                </div>
              </div>
            </div>
          ) : selectedQuote.status === "recusada" ? (
            <div className="max-w-lg">
              <div className="bg-gradient-to-br from-red-50 to-rose-50 p-8 rounded-2xl border border-red-200 shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <X size={36} />
                </div>
                <h3 className="text-2xl font-bold text-red-800 mb-3">Proposta Recusada</h3>
                <p className="text-red-700 leading-relaxed">
                  Você recusou esta proposta. Agradecemos sua consideração e estaremos disponíveis para futuras cotações.
                </p>
                <div className="mt-6 p-4 bg-red-100 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    💼 Ficamos à disposição para novas oportunidades
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-lg mt-12">
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-slate-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <FileText size={36} />
                </div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">Aguardando Proposta</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Sua cotação está sendo analisada pela nossa equipe. Em breve você receberá uma proposta detalhada.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">
                    Status atual: {selectedQuote.status || "Em análise"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal da Proposta */}
      <ProposalModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedQuote={selectedQuote}
        onQuoteStatusUpdate={onQuoteStatusUpdate}
      />
    </>
  );
};

export default ProposalTab;
