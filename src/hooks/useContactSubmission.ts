
import { useState } from "react";
import { toast } from '@/lib/toast';
import { ContactService } from "@/services/n8n/contactService";
import { FormValues } from "@/config/contactFormConfig";
import { useSupabaseContacts } from "./useSupabaseContacts";

export const useContactSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const { createContact } = useSupabaseContacts();

  const submitForm = async (data: FormValues, resetForm: () => void) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      
      // Primeiro salva no Supabase
      const supabaseContact = await createContact(data);
      
      // Depois envia para o n8n
      try {
        await ContactService.submitContactForm({
          ...data,
          supabaseId: supabaseContact.contact_id,
          timestamp: new Date().toISOString()
        });
      } catch (n8nError) {
        // Se n8n falhar, não quebra o processo
      }
      
      toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
      
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsSuccess(false);
        resetForm();
        setServerError(null);
      }, 3000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar sua mensagem. Tente novamente.";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    isSuccess,
    serverError,
    submitForm,
    setServerError
  };
};
