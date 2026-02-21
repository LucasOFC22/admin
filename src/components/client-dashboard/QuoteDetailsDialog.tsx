import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, FileText, MessageCircle, Package, Truck, DollarSign } from "lucide-react";
import { QuoteDetails } from "@/types/quote";
import { User as AuthUser } from "@/lib/auth";
import QuoteDetailsTab from "./QuoteDetailsTab";
import QuoteChat from "./QuoteChat";
import ProposalTab from "./ProposalTab";

interface QuoteDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedQuote: QuoteDetails | null;
  chatMessages: any[];
  isLoadingChat: boolean;
  currentUser: AuthUser | null;
  onMessageSent: (quoteId: string) => void;
  onQuoteStatusUpdate: () => void;
}

const QuoteDetailsDialog = ({
  isOpen,
  onOpenChange,
  selectedQuote,
  chatMessages,
  isLoadingChat,
  currentUser,
  onMessageSent,
  onQuoteStatusUpdate
}: QuoteDetailsDialogProps) => {

  if (!selectedQuote) return null;

  // Helper functions to get origin and destination correctly
  const getOriginCity = () => {
    // Try multiple paths for origin city
    const remetenteEndereco = selectedQuote.remetente?.endereco;
    const remetenteAddress = selectedQuote.remetente?.address;
    const senderCity = (selectedQuote as any).sender?.address?.city;
    
    if (remetenteEndereco && typeof remetenteEndereco === 'object') {
      return remetenteEndereco.cidade;
    }
    if (remetenteAddress && typeof remetenteAddress === 'object') {
      return remetenteAddress.city;
    }
    
    return senderCity || selectedQuote.origin || 'N/A';
  };

  const getDestinationCity = () => {
    // Try multiple paths for destination city
    const destinatarioEndereco = selectedQuote.destinatario?.endereco;
    const destinatarioAddress = selectedQuote.destinatario?.address;
    const recipientCity = (selectedQuote as any).recipient?.address?.city;
    
    if (destinatarioEndereco && typeof destinatarioEndereco === 'object') {
      return destinatarioEndereco.cidade;
    }
    if (destinatarioAddress && typeof destinatarioAddress === 'object') {
      return destinatarioAddress.city;
    }
    
    return recipientCity || selectedQuote.destination || 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aguardando análise":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Analisada":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Aprovada":
        return "bg-green-100 text-green-800 border-green-300";
      case "proposta_enviada":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "aceita":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "recusada":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "proposta_enviada":
        return "Proposta Enviada";
      case "aceita":
        return "Aceita";
      case "recusada":
        return "Recusada";
      default:
        return status || "Pendente";
    }
  };

  // Determinar se deve mostrar a aba de proposta
  const shouldShowProposalTab = selectedQuote.status === "proposta_enviada" || 
                                selectedQuote.status === "aceita" || 
                                selectedQuote.status === "recusada";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-white">
        {/* Hidden description for accessibility */}
        <DialogDescription className="sr-only">
          Visualizar detalhes completos da cotação #{selectedQuote.quoteId}, incluindo informações de origem, destino, status e comunicação via chat.
        </DialogDescription>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-corporate-600 to-corporate-700 text-white p-6 flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl border border-white/30">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white mb-1">
                    Cotação #{selectedQuote.quoteId}
                  </DialogTitle>
                  <p className="text-corporate-100 text-sm">
                    Detalhes completos da sua solicitação
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className={`px-3 py-1 font-medium border ${getStatusColor(selectedQuote.status || '')}`}>
                  {getStatusText(selectedQuote.status || '')}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-white/80" />
                  <span className="text-xs text-white/80 font-medium">Origem</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {getOriginCity()}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-white/80" />
                  <span className="text-xs text-white/80 font-medium">Destino</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {getDestinationCity()}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-white/80" />
                  <span className="text-xs text-white/80 font-medium">Data</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {selectedQuote.date ? (typeof selectedQuote.date === 'string' ? selectedQuote.date : selectedQuote.date.toLocaleDateString('pt-BR')) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="detalhes" className="h-full flex flex-col">
            <div className="border-b bg-gray-50 px-6 py-3 flex-shrink-0">
              <TabsList className={`grid w-full ${shouldShowProposalTab ? 'max-w-lg grid-cols-3' : 'max-w-md grid-cols-2'} bg-white border border-gray-200`}>
                <TabsTrigger 
                  value="detalhes" 
                  className="data-[state=active]:bg-corporate-600 data-[state=active]:text-white flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Detalhes
                </TabsTrigger>
                {shouldShowProposalTab && (
                  <TabsTrigger 
                    value="proposta" 
                    className="data-[state=active]:bg-corporate-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Proposta
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="chat" 
                  className="data-[state=active]:bg-corporate-600 data-[state=active]:text-white flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0">
              <TabsContent value="detalhes" className="h-full m-0 p-6">
                <QuoteDetailsTab selectedQuote={selectedQuote} />
              </TabsContent>

              {shouldShowProposalTab && (
                <TabsContent value="proposta" className="h-full m-0 p-6">
                  <ProposalTab 
                    selectedQuote={selectedQuote}
                    onQuoteStatusUpdate={onQuoteStatusUpdate}
                  />
                </TabsContent>
              )}

              <TabsContent value="chat" className="h-full m-0 p-6">
                <QuoteChat 
                  quote={selectedQuote}
                  currentUser={currentUser}
                  onMessageSent={onMessageSent}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDetailsDialog;
