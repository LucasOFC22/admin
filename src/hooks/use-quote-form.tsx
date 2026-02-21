import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quoteFormSchema } from "@/schemas/quoteFormSchema";
import { useQuoteSubmission } from "./use-quote-submission";

export const QUOTE_STEPS = [
  { id: "sender", title: "Remetente", description: "Dados do remetente" },
  { id: "recipient", title: "Destinatário", description: "Dados do destinatário" },
  { id: "pickup", title: "Coleta", description: "Informações de origem" },
  { id: "cargo", title: "Carga", description: "Detalhes da mercadoria" },
  { id: "contact", title: "Contato", description: "Informações de contato" },
  { id: "review", title: "Revisar", description: "Confirmar informações" }
];

export const useQuoteForm = () => {
  const [activeStep, setActiveStep] = useState("sender");
  const { isSubmitting, isComplete, cotacaoId, submitQuote, resetSubmission } = useQuoteSubmission();

  const form = useForm({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      pickup: {
        needsPickup: true,
        contactName: "",
        address: {
          zipcode: "",
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
        },
        workingHours: {
          from: "",
          to: "",
        },
        lunchBreak: {
          from: "",
          to: "",
        },
      },
      cargo: {
        description: "",
        weight: "",
        height: "",
        length: "",
        depth: "",
        declaredValue: "",
        freightType: "fob" as const,
        notes: "",
        priceTable: {
          idTabela: undefined,
          descricao: "",
          validade: "",
          somaIcm: undefined,
        },
      },
      sender: {
        name: "",
        document: "",
        address: {
          zipcode: "",
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
        },
      },
      recipient: {
        name: "",
        document: "",
        address: {
          zipcode: "",
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
        },
      },
      contact: {
        name: "",
        email: "",
        phone: "",
        requestorType: "Remetente" as const,
        message: "",
      },
    },
  });

  const currentStepIndex = QUOTE_STEPS.findIndex(step => step.id === activeStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === QUOTE_STEPS.length - 1;

  const handleNext = async () => {
    if (!isLastStep) {
      // Validar campos da etapa atual antes de avançar
      let fieldsToValidate: string[] = [];
      
      switch (activeStep) {
        case "cargo":
          fieldsToValidate = [
            "cargo.description",
            "cargo.weight", 
            "cargo.height",
            "cargo.length",
            "cargo.depth",
            "cargo.declaredValue"
          ];
          break;
        case "pickup":
          fieldsToValidate = [
            "pickup.address.zipcode",
            "pickup.address.street",
            "pickup.address.number",
            "pickup.address.city",
            "pickup.address.state"
          ];
          break;
        case "sender":
          fieldsToValidate = [
            "sender.name",
            "sender.document",
            "sender.address.zipcode",
            "sender.address.street", 
            "sender.address.number",
            "sender.address.city",
            "sender.address.state"
          ];
          break;
        case "recipient":
          fieldsToValidate = [
            "recipient.name",
            "recipient.document",
            "recipient.address.zipcode",
            "recipient.address.street",
            "recipient.address.number", 
            "recipient.address.city",
            "recipient.address.state"
          ];
          break;
        case "contact":
          fieldsToValidate = [
            "contact.name",
            "contact.email",
            "contact.phone"
          ];
          break;
      }

      // Executar validação dos campos da etapa atual
      const isValid = await form.trigger(fieldsToValidate as any);
      
      if (isValid) {
        const nextStep = QUOTE_STEPS[currentStepIndex + 1];
        setActiveStep(nextStep.id);
      }
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const previousStep = QUOTE_STEPS[currentStepIndex - 1];
      setActiveStep(previousStep.id);
    }
  };

  const onSubmit = form.handleSubmit(async (data: any) => {
    await submitQuote(data);
  });

  return {
    form,
    activeStep,
    setActiveStep,
    isSubmitting,
    isComplete,
    cotacaoId,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    handleNext,
    handlePrevious,
    onSubmit,
    resetSubmission
  };
};
