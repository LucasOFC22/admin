
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { estruturarCarga } from '@/utils/cargoCalculations';

export const useQuoteSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cotacaoId, setCotacaoId] = useState<string | null>(null);
  const [adminQuoteLink, setAdminQuoteLink] = useState<string | null>(null);
  const { toast } = useToast();

  const submitQuote = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Processar itens da carga (NF-e)
      let cargaEstruturada;
      let itensNFe = [];
      
      try {
        // Tentar parsear cargo.notes como JSON (lista de itens NF-e)
        itensNFe = JSON.parse(data.cargo.notes || '[]');
      } catch (e) {
        // Se não for JSON, criar um único item com os dados totais
        itensNFe = [];
      }
      
      // Se há itens NF-e, criar estrutura com múltiplos itens
      if (Array.isArray(itensNFe) && itensNFe.length > 0) {
        const itens = itensNFe.map((item: any) => ({
          nfe: `${item.nfe}`,
          peso: parseFloat(item.peso?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          quantidade: parseInt(item.unidade) || 1,
          valor: parseFloat(item.valor?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
          dimensoes: {
            altura: parseFloat(item.altura?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
            comprimento: parseFloat(item.comprimento?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
            largura: parseFloat(item.profundidade?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
          },
          pesoCubado: parseFloat(item.m3) || 0,
          observacoes: item.observacoes || ''
        }));
        
        cargaEstruturada = {
          descricao: data.cargo.description || '',
          pesoTotal: parseFloat(data.cargo.weight) || 0,
          quantidadeTotal: itens.reduce((sum: number, item: any) => sum + item.quantidade, 0),
          valorTotal: parseFloat(data.cargo.declaredValue) || 0,
          pesoCubadoTotal: itens.reduce((sum: number, item: any) => sum + item.pesoCubado, 0),
          itens
        };
      } else {
        // Fallback: criar estrutura única
        cargaEstruturada = estruturarCarga(
          data.cargo.description || '',
          parseFloat(data.cargo.weight) || 0,
          1,
          parseFloat(data.cargo.declaredValue) || 0,
          {
            altura: parseFloat(data.cargo.height) || 0,
            comprimento: parseFloat(data.cargo.length) || 0,
            largura: parseFloat(data.cargo.depth) || 0
          }
        );
      }
      
      // Formatar observações com informações de contato
      const observacoesFormatadas = `Contato:

Nome: ${data.contact.name}
Telefone: ${data.contact.phone}
Email: ${data.contact.email}
Obs: ${data.contact.notes || ''}`;

      // Enviar cotação via backend
      const { backendService } = await import('@/services/api/backendService');
      
      const response = await backendService.criarCotacao({
        remetente: data.sender,
        destinatario: data.recipient,
        coleta: data.pickup,
        carga: cargaEstruturada,
        contato: data.contact,
        tipoFrete: data.cargo.freightType,
        observacoes: observacoesFormatadas
      });

      if (response.success) {
        // Extrair o primeiro item do array (a API retorna um array)
        const responseData = Array.isArray(response.data) 
          ? response.data[0] 
          : response.data;
        
        // Usar nroOrcamento como ID principal
        const nroOrcamento = responseData?.nroOrcamento || responseData?.idOrcamento || responseData?.cotacao_id || responseData?.id || null;
        
        setCotacaoId(nroOrcamento);
        
        // Generate admin link
        const baseAdminLink = `${window.location.origin}/cotacoes/cotacao=${nroOrcamento}`;
        setAdminQuoteLink(baseAdminLink);
        
        toast({
          title: "Cotação enviada com sucesso!",
          description: `Sua cotação foi processada e você receberá uma resposta em breve.`,
        });

        setIsComplete(true);
        
      } else {
        toast({
          title: "Erro ao enviar cotação",
          description: "Não foi possível processar sua cotação. Tente novamente.",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "Erro ao enviar cotação",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmission = () => {
    setIsComplete(false);
    setIsSubmitting(false);
    setCotacaoId(null);
    setAdminQuoteLink(null);
  };

  return {
    isSubmitting,
    isComplete,
    cotacaoId,
    adminQuoteLink,
    submitQuote,
    resetSubmission
  };
};
