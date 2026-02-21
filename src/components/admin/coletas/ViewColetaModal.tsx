import { 
  AdminDialog, 
  AdminDialogContent, 
  AdminDialogHeader, 
  AdminDialogTitle, 
  AdminDialogDescription 
} from '@/components/admin/ui/AdminDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Truck, User, Phone, Mail, Building, MapPin, Calendar, 
  Package, Weight, DollarSign, FileText, Clock, Navigation, 
  Download, CheckCircle, Hash, Eye, Ruler, Box, CreditCard,
  PhoneCall, AtSign, MapPinIcon, Building2, Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency as formatCurrencyBase } from '@/lib/formatters';
import { useState } from 'react';
import { useSupabaseColetas } from '@/hooks/useSupabaseColetas';
import { useCustomNotifications } from '@/hooks/useCustomNotifications';
import { authActivityLogService } from '@/services/auth/activityLogService';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

// PDF carregado on-demand para reduzir bundle inicial
const getPDFRenderer = async () => {
  const [{ pdf }, { FormalColetaPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/pdf/FormalColetaPDF')
  ]);
  return { pdf, FormalColetaPDF };
};

interface ViewColetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coleta: any;
  onStatusUpdate?: () => void;
}

const ViewColetaModal = ({ open, onOpenChange, coleta, onStatusUpdate }: ViewColetaModalProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { notify } = useCustomNotifications();
  const { user } = useUnifiedAuth();
  const { updateStatus } = useSupabaseColetas();

  if (!coleta) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const { formatDateLong } = require('@/utils/dateFormatters');
    return formatDateLong(dateString);
  };

  const formatCurrency = (value: number) => {
    if (!value) return 'Não informado';
    return formatCurrencyBase(value);
  };

  const formatDimensions = (comprimento: number, largura: number, altura: number) => {
    if (!comprimento && !largura && !altura) return 'Não informado';
    return `${comprimento || 0} x ${largura || 0} x ${altura || 0} cm`;
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      // Carrega PDF renderer on-demand
      const { pdf, FormalColetaPDF } = await getPDFRenderer();
      const doc = <FormalColetaPDF coleta={coleta} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ordem-coleta-entrega-${coleta.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      if (user?.id) {
        await authActivityLogService.logActivity({
          usuario_id: user.id,
          acao: 'pdf_coleta_baixado',
          modulo: 'coletas',
          detalhes: {
            coleta_id: coleta.id,
            arquivo: `ordem-coleta-entrega-${coleta.id}.pdf`,
            formato: 'PDF'
          }
        });
      }
      
      notify.success('PDF Baixado', 'O PDF da coleta foi baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      notify.error('Erro', 'Não foi possível gerar o PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };


  const handleUpdateStatus = async () => {
    try {
      setIsUpdatingStatus(true);
      
      const statusAnterior = coleta.status;
      await updateStatus(coleta.id, 'Implantado');
      
      if (user?.id) {
        await authActivityLogService.logActivity({
          usuario_id: user.id,
          acao: 'status_coleta_atualizado',
          modulo: 'coletas',
          detalhes: {
            coleta_id: coleta.id,
            status_anterior: statusAnterior,
            status_novo: 'Implantado',
            remetente: coleta.remetente,
            destinatario: coleta.destinatario
          }
        });
      }
      
      if (onStatusUpdate) {
        onStatusUpdate();
      }
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('❌ Erro ao atualizar status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  return (
    <>
      <AdminDialog open={open} onOpenChange={onOpenChange}>
        <AdminDialogContent className="max-w-full sm:max-w-6xl max-h-[95vh] sm:max-h-[85vh] overflow-hidden p-0">
          <div className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white p-4 sm:p-6">
            <AdminDialogHeader>
              <AdminDialogTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl font-semibold flex-wrap">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-sm sm:text-xl">Coleta #{coleta.id}</span>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {coleta.status}
                </Badge>
              </AdminDialogTitle>
              <AdminDialogDescription className="text-blue-100 mt-1 text-xs sm:text-sm">
                Solicitada em {formatDate(coleta.criado_em)}
              </AdminDialogDescription>
            </AdminDialogHeader>
          </div>

          <div className="p-4 sm:p-6 bg-gray-50">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white border border-gray-200 h-auto">
                <TabsTrigger value="geral" className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Geral</span>
                </TabsTrigger>
                <TabsTrigger value="enderecos" className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5">
                  <Navigation className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Endereços</span>
                </TabsTrigger>
                <TabsTrigger value="carga" className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Carga</span>
                </TabsTrigger>
                <TabsTrigger value="contato" className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Contato</span>
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[55vh] sm:h-[60vh] mt-4">
                <TabsContent value="geral" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-l-[#2563eb] shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-[#2563eb]/5 to-transparent">
                        <CardTitle className="flex items-center gap-2 text-[#2563eb]">
                          <div className="p-1.5 bg-[#2563eb] rounded-md">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          Status da Coleta
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-[#2563eb]/5 rounded-lg">
                            <span className="font-medium text-gray-700">Status Atual:</span>
                            <Badge className="bg-[#2563eb] text-white">{coleta.status}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-[#2563eb]" />
                            <span className="text-sm">{formatDate(coleta.criado_em)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-[#2563eb] shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-[#2563eb]/5 to-transparent">
                        <CardTitle className="flex items-center gap-2 text-[#2563eb]">
                          <div className="p-1.5 bg-[#2563eb] rounded-md">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          Solicitante
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="p-3 bg-[#2563eb]/5 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Nome:</span>
                            <p className="font-medium text-gray-900">{coleta.solicitante_nome || 'Não informado'}</p>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[#2563eb]" />
                              <span className="text-sm text-gray-600">{coleta.solicitante_telefone || 'Não informado'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-[#2563eb]" />
                              <span className="text-sm text-gray-600">{coleta.solicitante_email || 'Não informado'}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-l-4 border-l-[#2563eb] shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-[#2563eb]/5 to-transparent">
                      <CardTitle className="flex items-center gap-2 text-[#2563eb]">
                        <div className="p-1.5 bg-[#2563eb] rounded-md">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        Ações Disponíveis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <Button
                          onClick={handleDownloadPDF}
                          disabled={isGeneratingPDF}
                          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {isGeneratingPDF ? 'Preparando...' : 'Baixar PDF'}
                        </Button>
                        
                        <Button
                          onClick={handleUpdateStatus}
                          disabled={isUpdatingStatus || coleta.status === 'Implantado'}
                          variant="outline"
                          className="border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb] hover:text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isUpdatingStatus ? 'Atualizando...' : 'Marcar como Implantado'}
                        </Button>
                      </div>
                      <p className="text-gray-600 mt-3 text-sm">
                        Visualize o PDF da coleta ou atualize o status conforme necessário.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba: Endereços */}
                <TabsContent value="enderecos" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Remetente */}
                    <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-orange-900">
                          <div className="p-2 bg-orange-500 rounded-lg">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          Remetente (Origem)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-white/60 rounded-lg">
                            <p className="font-semibold text-orange-800 mb-1">Empresa</p>
                            <p className="text-orange-700">{coleta.remetente || 'Não informado'}</p>
                          </div>
                          <div className="p-4 bg-white/40 rounded-lg">
                            <p className="font-semibold text-orange-800 mb-1">Documento</p>
                            <p className="text-orange-700">{coleta.remetente_documento || 'Não informado'}</p>
                          </div>
                          <div className="p-4 bg-white/40 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MapPinIcon className="h-5 w-5 text-orange-600 mt-1" />
                              <div>
                                <p className="font-semibold text-orange-800 mb-2">Endereço Completo</p>
                                <div className="space-y-1 text-orange-700">
                                  <p>{coleta.remetente_rua}, {coleta.remetente_numero}</p>
                                  {coleta.remetente_complemento && <p>{coleta.remetente_complemento}</p>}
                                  <p>{coleta.remetente_bairro}, {coleta.remetente_cidade}</p>
                                  <p>CEP: {coleta.remetente_cep}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-white/40 rounded-lg">
                            <p className="font-semibold text-orange-800 mb-1">Telefone</p>
                            <p className="text-orange-700">{coleta.remetente_telefone || 'Não informado'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Destinatário */}
                    <Card className="bg-gradient-to-br from-teal-50 to-cyan-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-teal-900">
                          <div className="p-2 bg-teal-500 rounded-lg">
                            <MapPinIcon className="h-5 w-5 text-white" />
                          </div>
                          Destinatário (Destino)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-white/60 rounded-lg">
                            <p className="font-semibold text-teal-800 mb-1">Empresa</p>
                            <p className="text-teal-700">{coleta.destinatario || 'Não informado'}</p>
                          </div>
                          <div className="p-4 bg-white/40 rounded-lg">
                            <p className="font-semibold text-teal-800 mb-1">Documento</p>
                            <p className="text-teal-700">{coleta.destinatario_documento || 'Não informado'}</p>
                          </div>
                          <div className="p-4 bg-white/40 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MapPinIcon className="h-5 w-5 text-teal-600 mt-1" />
                              <div>
                                <p className="font-semibold text-teal-800 mb-2">Endereço Completo</p>
                                <div className="space-y-1 text-teal-700">
                                  <p>{coleta.destinatario_rua}, {coleta.destinatario_numero}</p>
                                  {coleta.destinatario_complemento && <p>{coleta.destinatario_complemento}</p>}
                                  <p>{coleta.destinatario_bairro}, {coleta.destinatario_cidade}</p>
                                  <p>CEP: {coleta.destinatario_cep}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-white/40 rounded-lg">
                            <p className="font-semibold text-teal-800 mb-1">Telefone</p>
                            <p className="text-teal-700">{coleta.destinatario_telefone || 'Não informado'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Aba: Carga */}
                <TabsContent value="carga" className="space-y-6 mt-0">
                  <Card className="bg-gradient-to-br from-violet-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-violet-900">
                        <div className="p-2 bg-violet-500 rounded-lg">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        Informações da Carga
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Peso */}
                        <div className="p-6 bg-white/60 rounded-xl text-center hover:bg-white/80 transition-all duration-300">
                          <div className="flex justify-center mb-3">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full">
                              <Weight className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <p className="font-semibold text-violet-800 mb-1">Peso</p>
                          <p className="text-2xl font-bold text-violet-900">
                            {coleta.mercadoria_peso ? `${coleta.mercadoria_peso} kg` : 'N/I'}
                          </p>
                        </div>

                        {/* Dimensões */}
                        <div className="p-6 bg-white/60 rounded-xl text-center hover:bg-white/80 transition-all duration-300">
                          <div className="flex justify-center mb-3">
                            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
                              <Ruler className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <p className="font-semibold text-violet-800 mb-1">Dimensões</p>
                          <p className="text-sm font-bold text-violet-900">
                            {formatDimensions(coleta.mercadoria_comprimento, coleta.mercadoria_largura, coleta.mercadoria_altura)}
                          </p>
                        </div>

                        {/* Valor */}
                        <div className="p-6 bg-white/60 rounded-xl text-center hover:bg-white/80 transition-all duration-300">
                          <div className="flex justify-center mb-3">
                            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full">
                              <Banknote className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <p className="font-semibold text-violet-800 mb-1">Valor</p>
                          <p className="text-lg font-bold text-violet-900">
                            {formatCurrency(coleta.mercadoria_valor)}
                          </p>
                        </div>

                        {/* Quantidade */}
                        <div className="p-6 bg-white/60 rounded-xl text-center hover:bg-white/80 transition-all duration-300">
                          <div className="flex justify-center mb-3">
                            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full">
                              <Box className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <p className="font-semibold text-violet-800 mb-1">Quantidade</p>
                          <p className="text-2xl font-bold text-violet-900">
                            {coleta.mercadoria_quantidade || 'N/I'}
                          </p>
                        </div>
                      </div>

                      {coleta.mercadoria_descricao && (
                        <div className="mt-6 p-6 bg-white/40 rounded-xl">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-violet-600 mt-1" />
                            <div>
                              <p className="font-semibold text-violet-800 mb-2">Descrição da Mercadoria</p>
                              <p className="text-violet-700">{coleta.mercadoria_descricao}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba: Contato */}
                <TabsContent value="contato" className="space-y-6 mt-0">
                  <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-rose-900">
                        <div className="p-2 bg-rose-500 rounded-lg">
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        Informações de Contato
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-white/60 rounded-xl">
                          <div className="flex items-center gap-3 mb-3">
                            <PhoneCall className="h-5 w-5 text-rose-600" />
                            <p className="font-semibold text-rose-800">Telefone de Contato</p>
                          </div>
                          <p className="text-rose-700 text-lg">
                            {coleta.remetente_telefone || coleta.solicitante_telefone || 'Não informado'}
                          </p>
                        </div>
                        
                        <div className="p-6 bg-white/60 rounded-xl">
                          <div className="flex items-center gap-3 mb-3">
                            <AtSign className="h-5 w-5 text-rose-600" />
                            <p className="font-semibold text-rose-800">E-mail de Contato</p>
                          </div>
                          <p className="text-rose-700 text-lg">
                            {coleta.solicitante_email || 'Não informado'}
                          </p>
                        </div>
                      </div>

                      {coleta.observacoes && (
                        <div className="mt-6 p-6 bg-white/40 rounded-xl">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-rose-600 mt-1" />
                            <div>
                              <p className="font-semibold text-rose-800 mb-2">Observações</p>
                              <p className="text-rose-700">{coleta.observacoes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </AdminDialogContent>
      </AdminDialog>

    </>
  );
};

export default ViewColetaModal;