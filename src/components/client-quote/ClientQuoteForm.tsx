import { Form } from "@/components/ui/form";
import { ClientQuoteFormStepper } from "./ClientQuoteFormStepper";
import { ClientQuoteFormContent } from "./ClientQuoteFormContent";
import { ClientQuoteFormNavigation } from "./ClientQuoteFormNavigation";
import { ClientQuoteSuccess } from "./ClientQuoteSuccess";
import { useQuoteForm } from "@/hooks/use-quote-form.tsx";
import { motion } from "framer-motion";

const ClientQuoteForm = () => {
  const {
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
    onSubmit
  } = useQuoteForm();

  if (isComplete) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <ClientQuoteSuccess cotacaoId={cotacaoId} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <ClientQuoteFormStepper 
          activeStep={activeStep} 
          currentStepIndex={currentStepIndex} 
        />

        <Form {...form}>
          <form onSubmit={onSubmit}>
            <ClientQuoteFormContent 
              form={form as any} 
              activeStep={activeStep} 
              setActiveStep={setActiveStep} 
            />
            
            <ClientQuoteFormNavigation 
              isFirstStep={isFirstStep} 
              isLastStep={isLastStep} 
              isSubmitting={isSubmitting} 
              handlePrevious={handlePrevious} 
              handleNext={handleNext} 
              onSubmit={onSubmit} 
            />
          </form>
        </Form>
      </div>
    </motion.div>
  );
};

export default ClientQuoteForm;
