import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PickupFormData } from "@/schemas/pickupFormSchema";
import { backendService } from "@/services/api/backendService";
import { mapPickupFormToColetaPayload } from "@/utils/coletaMapper";

interface SubmissionOptions {
  notasFiscais?: string[];
  idRemetente?: number;
  idDestinatario?: number;
  idCidadeOrigem?: number;
  idCidadeDestino?: number;
}

export const usePickupSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [idColeta, setIdColeta] = useState<number | null>(null);
  const [nroColeta, setNroColeta] = useState<number | null>(null);
  const { toast } = useToast();

  const submitPickup = async (data: PickupFormData, options: SubmissionOptions = {}) => {
    setIsSubmitting(true);

    try {
      // Mapear dados do formulário para o payload da API
      const coletaPayload = mapPickupFormToColetaPayload(data, {
        idEmpresa: 2,
        idRemetente: options.idRemetente ?? 0,
        idDestinatario: options.idDestinatario ?? 0,
        idCidadeOrigem: options.idCidadeOrigem ?? 0,
        idCidadeDestino: options.idCidadeDestino ?? 0,
        notasFiscais: options.notasFiscais ?? []
      });

      // Enviar para a API backend
      const response = await backendService.criarColeta(coletaPayload);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar coleta');
      }

      // Salvar o ID e número da coleta retornados
      if (response.data?.idColeta) {
        setIdColeta(response.data.idColeta);
      }
      if (response.data?.nroColeta) {
        setNroColeta(response.data.nroColeta);
      }

      toast({
        title: "Solicitação enviada com sucesso!",
        description: response.data?.nroColeta 
          ? `Coleta Nº ${response.data.nroColeta} criada. Entraremos em contato em breve.`
          : "Entraremos em contato em breve para confirmar a coleta.",
      });

      setIsComplete(true);
    } catch (error) {
      console.error('Erro ao enviar coleta:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: error instanceof Error ? error.message : "Tente novamente ou entre em contato conosco.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmission = () => {
    setIsComplete(false);
    setIsSubmitting(false);
    setIdColeta(null);
    setNroColeta(null);
  };

  return {
    isSubmitting,
    isComplete,
    idColeta,
    nroColeta,
    submitPickup,
    resetSubmission
  };
};