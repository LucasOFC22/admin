import { UseFormReturn } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientSenderForm } from "./forms/ClientSenderForm";
import { ClientRecipientForm } from "./forms/ClientRecipientForm";
import { ClientPickupForm } from "./forms/ClientPickupForm";
import { ClientCargoForm } from "./forms/ClientCargoForm";
import { ClientContactForm } from "./forms/ClientContactForm";
import { ClientQuoteReviewForm } from "./ClientQuoteReviewForm";
import { QUOTE_STEPS } from "@/hooks/use-quote-form.tsx";
import { QuoteFormValues } from "@/schemas/quoteFormSchema";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Truck, User, MapPin, Phone, ClipboardCheck } from "lucide-react";

interface ClientQuoteFormContentProps {
  form: UseFormReturn<QuoteFormValues>;
  activeStep: string;
  setActiveStep: (step: string) => void;
}

const stepIcons: Record<string, React.ReactNode> = {
  sender: <User className="h-5 w-5" />,
  recipient: <MapPin className="h-5 w-5" />,
  pickup: <Truck className="h-5 w-5" />,
  cargo: <Package className="h-5 w-5" />,
  contact: <Phone className="h-5 w-5" />,
  review: <ClipboardCheck className="h-5 w-5" />,
};

const stepTitles: Record<string, { title: string; subtitle: string }> = {
  sender: { title: "Remetente", subtitle: "Quem está enviando a carga" },
  recipient: { title: "Destinatário", subtitle: "Quem vai receber a carga" },
  pickup: { title: "Coleta", subtitle: "Local e horário de retirada" },
  cargo: { title: "Carga", subtitle: "Características da mercadoria" },
  contact: { title: "Contato", subtitle: "Dados para comunicação" },
  review: { title: "Revisão", subtitle: "Confirme as informações" },
};

export const ClientQuoteFormContent = ({
  form,
  activeStep,
  setActiveStep,
}: ClientQuoteFormContentProps) => {
  const currentStep = stepTitles[activeStep] || { title: "", subtitle: "" };

  return (
    <div className="space-y-6">
      {/* Header da etapa */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center gap-4 pb-4 border-b border-border"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
            {stepIcons[activeStep]}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {currentStep.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentStep.subtitle}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
        <TabsList className="hidden">
          {QUOTE_STEPS.map((step) => (
            <TabsTrigger key={step.id} value={step.id}>
              {step.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="sender" className="mt-0 space-y-4">
              <ClientSenderForm form={form} />
            </TabsContent>
            
            <TabsContent value="recipient" className="mt-0 space-y-4">
              <ClientRecipientForm form={form} />
            </TabsContent>
            
            <TabsContent value="pickup" className="mt-0 space-y-4">
              <ClientPickupForm form={form} />
            </TabsContent>
            
            <TabsContent value="cargo" className="mt-0 space-y-4">
              <ClientCargoForm form={form} />
            </TabsContent>
            
            <TabsContent value="contact" className="mt-0 space-y-4">
              <ClientContactForm form={form} />
            </TabsContent>
            
            <TabsContent value="review" className="mt-0 space-y-4">
              <ClientQuoteReviewForm form={form} />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};
