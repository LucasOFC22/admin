import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pickupFormSchema } from "@/schemas/pickupFormSchema";
import { useSupabasePickupSubmission } from "./use-supabase-pickup-submission";
import { User, MapPin, Package, Users, UserCheck, FileText } from "lucide-react";

export const PICKUP_STEPS = [
  { id: "solicitante", title: "Solicitante", description: "Dados do solicitante", icon: User },
  { id: "coleta", title: "Coleta", description: "Local e horários", icon: MapPin },
  { id: "mercadoria", title: "Mercadoria", description: "Informações da carga", icon: Package },
  { id: "remetente", title: "Remetente", description: "Dados do remetente", icon: UserCheck },
  { id: "destinatario", title: "Destinatário", description: "Dados do destinatário", icon: Users },
  { id: "review", title: "Revisar", description: "Confirmar informações", icon: FileText }
];

export const usePickupForm = () => {
  const [activeStep, setActiveStep] = useState("solicitante");
  const [notasFiscais, setNotasFiscais] = useState<string[]>([]);
  const { isSubmitting, isComplete, submitPickup, resetSubmission } = useSupabasePickupSubmission();

  const form = useForm({
    resolver: zodResolver(pickupFormSchema),
    defaultValues: {
      solicitante: {
        nome: "",
        telefone: "",
        email: "",
      },
      coleta: {
        rua: "",
        numero: "",
        complemento: "",
        cidade: "",
        bairro: "",
        cep: "",
        pontoReferencia: "",
        horarioFuncionamento: {
          inicio: "",
          fim: "",
        },
        horarioAlmoco: {
          inicio: "",
          fim: "",
        },
      },
      mercadoria: {
        descricao: "",
        peso: "",
        valor: "",
        quantidade: "",
        dimensoes: {
          comprimento: "",
          largura: "",
          altura: "",
        },
      },
      remetente: {
        empresa: "",
        telefone: "",
        documento: "",
        rua: "",
        numero: "",
        complemento: "",
        cidade: "",
        bairro: "",
        cep: "",
      },
      destinatario: {
        empresa: "",
        telefone: "",
        documento: "",
        rua: "",
        numero: "",
        complemento: "",
        cidade: "",
        bairro: "",
        cep: "",
      },
      observacoes: "",
    },
  });

  const currentStepIndex = PICKUP_STEPS.findIndex(step => step.id === activeStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === PICKUP_STEPS.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      const nextStep = PICKUP_STEPS[currentStepIndex + 1];
      setActiveStep(nextStep.id);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const previousStep = PICKUP_STEPS[currentStepIndex - 1];
      setActiveStep(previousStep.id);
    }
  };

  // Função para submit direto (bypass validation temporário)
  const handleDirectSubmit = async () => {
    const formValues = form.getValues();
    
    if (activeStep === "review") {
      await submitPickup(formValues, notasFiscais);
    }
  };

  const onSubmit = form.handleSubmit(async (data: any) => {
    // Só enviar se estivermos no último step (review)
    if (activeStep === "review") {
      await submitPickup(data, notasFiscais);
    }
  });

  const handleNewRequest = () => {
    // Resetar o formulário para os valores iniciais
    form.reset();
    // Voltar para o primeiro step
    setActiveStep("solicitante");
    // Resetar notas fiscais
    setNotasFiscais([]);
    // Resetar o estado de submissão
    resetSubmission();
  };

  return {
    form,
    activeStep,
    setActiveStep,
    isSubmitting,
    isComplete,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    handleNext,
    handlePrevious,
    onSubmit,
    handleDirectSubmit,
    handleNewRequest,
    resetSubmission,
    notasFiscais,
    setNotasFiscais
  };
};