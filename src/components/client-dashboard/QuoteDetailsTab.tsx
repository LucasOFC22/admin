
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, User, Building2, Calendar, Truck, Weight, FileText } from "lucide-react";
import { QuoteDetails } from "@/types/quote";
import { formatDateValue } from "@/utils/dateUtils";

interface QuoteDetailsTabProps {
  selectedQuote: QuoteDetails;
}

const QuoteDetailsTab = ({ selectedQuote }: QuoteDetailsTabProps) => {
  // Helper functions to get correct data with proper type handling
  const getSenderName = () => {
    return selectedQuote.remetente?.nome || (selectedQuote as any).sender?.name || (selectedQuote as any).senderName || 'Não informado';
  };

  const getSenderDocument = () => {
    return selectedQuote.remetente?.documento || selectedQuote.remetente?.cnpj || (selectedQuote as any).sender?.document || (selectedQuote as any).sender?.cnpj || (selectedQuote as any).senderDocument || 'Não informado';
  };

  const getRecipientName = () => {
    return selectedQuote.destinatario?.nome || (selectedQuote as any).recipient?.name || (selectedQuote as any).recipientName || 'Não informado';
  };

  const getRecipientDocument = () => {
    return selectedQuote.destinatario?.documento || selectedQuote.destinatario?.cnpj || (selectedQuote as any).recipient?.document || (selectedQuote as any).recipient?.cnpj || (selectedQuote as any).recipientDocument || 'Não informado';
  };

  const getOrigin = () => {
    const remetenteEndereco = selectedQuote.remetente?.endereco;
    if (remetenteEndereco && typeof remetenteEndereco === 'object') {
      const parts = [];
      if (remetenteEndereco.cidade) parts.push(remetenteEndereco.cidade);
      if (remetenteEndereco.estado) parts.push(remetenteEndereco.estado);
      if (remetenteEndereco.cep) parts.push(`CEP: ${remetenteEndereco.cep}`);
      return parts.length > 0 ? parts.join(', ') : 'Não informado';
    }

    const senderAddress = (selectedQuote as any).sender?.address;
    if (senderAddress) {
      const parts = [];
      if (senderAddress.city) parts.push(senderAddress.city);
      if (senderAddress.state) parts.push(senderAddress.state);
      if (senderAddress.zipcode) parts.push(`CEP: ${senderAddress.zipcode}`);
      return parts.length > 0 ? parts.join(', ') : 'Não informado';
    }

    return selectedQuote.origin || 'Não informado';
  };

  const getDestination = () => {
    const destinatarioEndereco = selectedQuote.destinatario?.endereco;
    if (destinatarioEndereco && typeof destinatarioEndereco === 'object') {
      const parts = [];
      if (destinatarioEndereco.cidade) parts.push(destinatarioEndereco.cidade);
      if (destinatarioEndereco.estado) parts.push(destinatarioEndereco.estado);
      if (destinatarioEndereco.cep) parts.push(`CEP: ${destinatarioEndereco.cep}`);
      return parts.length > 0 ? parts.join(', ') : 'Não informado';
    }

    const recipientAddress = (selectedQuote as any).recipient?.address;
    if (recipientAddress) {
      const parts = [];
      if (recipientAddress.city) parts.push(recipientAddress.city);
      if (recipientAddress.state) parts.push(recipientAddress.state);
      if (recipientAddress.zipcode) parts.push(`CEP: ${recipientAddress.zipcode}`);
      return parts.length > 0 ? parts.join(', ') : 'Não informado';
    }

    return selectedQuote.destination || 'Não informado';
  };

  const getCargoDescription = () => {
    return selectedQuote.carga?.descricao || (selectedQuote as any).cargo?.description || (selectedQuote as any).cargoType || 'Não informado';
  };

  const getCargoWeight = () => {
    const peso = selectedQuote.carga?.peso || (selectedQuote as any).cargo?.weight;
    return peso ? `${peso} kg` : 'Não informado';
  };

  const getCargoValue = () => {
    const valor = selectedQuote.carga?.valorDeclarado || (selectedQuote as any).cargo?.declaredValue;
    if (valor) {
      const numValue = typeof valor === 'string' ? parseFloat(valor) : valor;
      return `R$ ${numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2
      })}`;
    }
    return 'Não informado';
  };

  const getDimensions = () => {
    const carga = selectedQuote.carga || (selectedQuote as any).cargo;
    if (carga && carga.altura && carga.largura && carga.profundidade) {
      return `${carga.altura} x ${carga.largura} x ${carga.profundidade} cm`;
    }
    if (carga && carga.height && carga.length && carga.depth) {
      return `${carga.height} x ${carga.length} x ${carga.depth} cm`;
    }
    return 'Não informado';
  };

  const getContactName = () => {
    return selectedQuote.contato?.nome || (selectedQuote as any).contact?.name || (selectedQuote as any).contactName || 'Não informado';
  };

  const getContactEmail = () => {
    return selectedQuote.contato?.email || (selectedQuote as any).contact?.email || (selectedQuote as any).contactEmail || 'Não informado';
  };

  const getContactPhone = () => {
    return selectedQuote.contato?.telefone || (selectedQuote as any).contact?.phone || (selectedQuote as any).contactPhone || 'Não informado';
  };

  const formatDate = (): string => {
    if (selectedQuote.criadoEm) {
      return formatDateValue(selectedQuote.criadoEm);
    }
    if (selectedQuote.date) {
      return typeof selectedQuote.date === 'string' ? selectedQuote.date : selectedQuote.date.toLocaleDateString('pt-BR');
    }
    return 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "Aguardando análise":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "proposta_enviada":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "aceitar":
      case "aceita":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "rejeitar":
      case "recusada":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
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

  return (
    <div className="h-[450px] overflow-auto space-y-6">
      {/* Header com Status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cotação #{selectedQuote.quoteId}</h3>
          <p className="text-sm text-gray-500">Criada em {formatDate()}</p>
        </div>
        <Badge className={`px-3 py-1 font-medium border ${getStatusColor(selectedQuote.status || '')}`}>
          {getStatusText(selectedQuote.status || '')}
        </Badge>
      </div>

      {/* Rota */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-blue-600" />
            Rota de Transporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Origem</p>
              <p className="text-sm text-gray-700">{getOrigin()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">Destino</p>
              <p className="text-sm text-gray-700">{getDestination()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-green-600" />
              Remetente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Nome/Razão Social</p>
              <p className="text-sm text-gray-600">{getSenderName()}</p>
            </div>
            {getSenderDocument() !== 'Não informado' && (
              <div>
                <p className="text-sm font-medium">CNPJ/CPF</p>
                <p className="text-sm text-gray-600 font-mono">{getSenderDocument()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-blue-600" />
              Destinatário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Nome/Razão Social</p>
              <p className="text-sm text-gray-600">{getRecipientName()}</p>
            </div>
            {getRecipientDocument() !== 'Não informado' && (
              <div>
                <p className="text-sm font-medium">CNPJ/CPF</p>
                <p className="text-sm text-gray-600 font-mono">{getRecipientDocument()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações da Carga */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-orange-600" />
            Informações da Carga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Descrição</p>
              <p className="text-sm text-gray-600">{getCargoDescription()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Peso</p>
              <p className="text-sm text-gray-600">{getCargoWeight()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Dimensões</p>
              <p className="text-sm text-gray-600">{getDimensions()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Valor Declarado</p>
              <p className="text-sm text-gray-600">{getCargoValue()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Contato */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-purple-600" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Nome</p>
              <p className="text-sm text-gray-600">{getContactName()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">E-mail</p>
              <p className="text-sm text-gray-600 break-all">{getContactEmail()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Telefone</p>
              <p className="text-sm text-gray-600">{getContactPhone()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuoteDetailsTab;
