import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Package2, MapPin, Calendar, ArrowRight, Building2, User, Weight, Database } from "lucide-react";
import { QuoteDetails } from "@/types/quote";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDateValue } from "@/utils/dateUtils";

interface QuotesTabProps {
  quotes: QuoteDetails[];
  isLoadingQuotes: boolean;
  handleQuoteClick: (quote: QuoteDetails) => void;
}

const QuotesTab = ({
  quotes,
  isLoadingQuotes,
  handleQuoteClick
}: QuotesTabProps) => {
  const isMobile = useIsMobile();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "Aguardando análise":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "proposta_enviada":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "aceitar":
      case "aceita":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "rejeitar":
      case "recusada":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "proposta_enviada":
        return "Proposta Enviada";
      case "aceitar":
      case "aceita":
        return "Aceita";
      case "rejeitar":
      case "recusada":
        return "Recusada";
      default:
        return status || "Pendente";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "Aguardando análise":
        return <FileText size={14} className="text-amber-500" />;
      case "proposta_enviada":
        return <FileText size={14} className="text-purple-500" />;
      case "aceitar":
      case "aceita":
        return <FileText size={14} className="text-emerald-500" />;
      case "rejeitar":
      case "recusada":
        return <FileText size={14} className="text-red-500" />;
      default:
        return <FileText size={14} className="text-gray-500" />;
    }
  };

  const getOrigin = (quote: QuoteDetails) => {
    const remetenteEndereco = quote.remetente?.endereco;
    const remetenteAddress = quote.remetente?.address;
    
    let remetenteCity = '';
    let remetenteState = '';
    
    if (remetenteEndereco && typeof remetenteEndereco === 'object') {
      remetenteCity = remetenteEndereco.cidade || '';
      remetenteState = remetenteEndereco.estado || '';
    } else if (remetenteAddress && typeof remetenteAddress === 'object') {
      remetenteCity = remetenteAddress.city || '';
      remetenteState = remetenteAddress.state || '';
    }
    
    if (remetenteCity) {
      return remetenteState ? `${remetenteCity}, ${remetenteState}` : remetenteCity;
    }
    return quote.origin || 'N/A';
  };

  const getDestination = (quote: QuoteDetails) => {
    const destinatarioEndereco = quote.destinatario?.endereco;
    const destinatarioAddress = quote.destinatario?.address;
    
    let destinatarioCity = '';
    let destinatarioState = '';
    
    if (destinatarioEndereco && typeof destinatarioEndereco === 'object') {
      destinatarioCity = destinatarioEndereco.cidade || '';
      destinatarioState = destinatarioEndereco.estado || '';
    } else if (destinatarioAddress && typeof destinatarioAddress === 'object') {
      destinatarioCity = destinatarioAddress.city || '';
      destinatarioState = destinatarioAddress.state || '';
    }
    
    if (destinatarioCity) {
      return destinatarioState ? `${destinatarioCity}, ${destinatarioState}` : destinatarioCity;
    }
    return quote.destination || 'N/A';
  };

  const formatDate = (quote: QuoteDetails): string => {
    if (quote.criadoEm) {
      return formatDateValue(quote.criadoEm);
    }
    if (quote.date) {
      return typeof quote.date === 'string' ? quote.date : quote.date.toLocaleDateString('pt-BR');
    }
    return 'N/A';
  };

  const showInitialLoading = isLoadingQuotes && quotes.length === 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Package2 className="h-5 w-5 text-corporate-600" />
              Suas Cotações
            </CardTitle>
            <CardDescription className="text-sm md:text-base">
              Visualize e acompanhe suas solicitações de cotação. Clique em uma cotação para ver detalhes e chat.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? "p-0" : ""}>
        {showInitialLoading ? (
          <div className="flex justify-center py-8 md:py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-t-2 border-b-2 border-corporate-600"></div>
              <p className="text-xs md:text-sm text-gray-600">Carregando cotações do N8N...</p>
            </div>
          </div>
        ) : quotes.length > 0 ? (
          isMobile ? (
            <div className="space-y-3 p-3">
              {quotes.map(quote => (
                <Card 
                  key={quote.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-corporate-500 hover:border-l-corporate-600 bg-white" 
                  onClick={() => handleQuoteClick(quote)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 bg-corporate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package2 size={14} className="text-white" />
                          </div>
                          <span className="font-semibold text-corporate-600 text-sm truncate">#{quote.quoteId}</span>
                        </div>
                        <Badge className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(quote.status)} whitespace-nowrap`}>
                          {getStatusIcon(quote.status)}
                          <span className="hidden xs:inline">{getStatusText(quote.status)}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin size={14} className="text-blue-600" />
                            <span className="text-xs font-medium text-blue-800 uppercase tracking-wider">Rota</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-center flex-1 min-w-0">
                              <p className="font-medium text-xs text-gray-800 truncate">
                                {getOrigin(quote).split(',')[0]}
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-blue-600 flex-shrink-0" />
                            <div className="text-center flex-1 min-w-0">
                              <p className="font-medium text-xs text-gray-800 truncate">
                                {getDestination(quote).split(',')[0]}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={14} className="text-gray-500" />
                            <span className="text-xs font-medium text-gray-700">Data da Solicitação</span>
                          </div>
                          <p className="font-medium text-sm text-gray-900">{formatDate(quote)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold min-w-[120px]">ID da Cotação</TableHead>
                      <TableHead className="font-semibold min-w-[200px]">Rota</TableHead>
                      <TableHead className="font-semibold min-w-[140px]">Status</TableHead>
                      <TableHead className="font-semibold min-w-[120px]">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map(quote => (
                      <TableRow 
                        key={quote.id} 
                        onClick={() => handleQuoteClick(quote)} 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-corporate-600 rounded-lg flex items-center justify-center">
                              <Package2 size={14} className="text-white" />
                            </div>
                            <span className="text-corporate-600 font-semibold">#{quote.quoteId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-500 flex-shrink-0" />
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="text-center min-w-0">
                                <span className="font-medium text-sm truncate block">
                                  {getOrigin(quote).split(',')[0]}
                                </span>
                              </div>
                              <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                              <div className="text-center min-w-0">
                                <span className="font-medium text-sm truncate block">
                                  {getDestination(quote).split(',')[0]}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                            {getStatusIcon(quote.status)}
                            <span>{getStatusText(quote.status)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-500" />
                            <span className="text-sm">{formatDate(quote)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12 md:py-16 px-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 text-base md:text-lg">Nenhuma cotação encontrada</h3>
                <p className="text-gray-500 max-w-sm text-sm md:text-base">
                  Você ainda não tem cotações solicitadas no sistema N8N. Comece criando sua primeira cotação.
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link to="/cotacao">
                  <Package2 className="w-4 h-4 mr-2" />
                  Solicitar Cotação
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuotesTab;
