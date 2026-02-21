
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, MessageCircle, FileText, User } from "lucide-react";
import { QuoteDetails } from "@/types/quote";
import { User as AuthUser } from "@/lib/auth";
import QuotesTab from "../QuotesTab";
import QuoteChat from "../QuoteChat";

interface DashboardTabsProps {
  quotes: QuoteDetails[];
  isLoadingQuotes: boolean;
  handleQuoteClick: (quote: QuoteDetails) => void;
  selectedQuote: QuoteDetails | null;
  chatMessages: any[];
  isLoadingChat: boolean;
  currentUser: AuthUser | null;
  onMessageSent: (quoteId: string) => void;
  onQuoteStatusUpdate: () => void;
}

const DashboardTabs = ({
  quotes,
  isLoadingQuotes,
  handleQuoteClick,
  selectedQuote,
  chatMessages,
  isLoadingChat,
  currentUser,
  onMessageSent,
  onQuoteStatusUpdate
}: DashboardTabsProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <Tabs defaultValue="cotacoes" className="w-full">
        <div className="border-b bg-gray-50/50 px-6 py-4">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white shadow-sm border">
            <TabsTrigger 
              value="cotacoes" 
              className="data-[state=active]:bg-corporate-600 data-[state=active]:text-white flex items-center gap-2 font-medium"
            >
              <Package className="h-4 w-4" />
              Minhas Cotações
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="data-[state=active]:bg-corporate-600 data-[state=active]:text-white flex items-center gap-2 font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              Chat Geral
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-[400px]">
          <TabsContent value="cotacoes" className="m-0 p-6">
            <QuotesTab 
              quotes={quotes}
              isLoadingQuotes={isLoadingQuotes}
              handleQuoteClick={handleQuoteClick}
            />
          </TabsContent>

          <TabsContent value="chat" className="m-0 p-6">
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Chat Geral
                </h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                  Para conversar sobre uma cotação específica, clique em uma cotação e use a aba "Chat" no modal de detalhes.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium text-sm">Dica</span>
                  </div>
                  <p className="text-blue-600 text-xs">
                    Cada cotação tem seu próprio chat privado. Clique em uma cotação para acessar o chat específico.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default DashboardTabs;
