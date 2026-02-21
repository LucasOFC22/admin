import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ClientQuoteFormNavigationProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  handlePrevious: () => void;
  handleNext: () => void;
  onSubmit?: () => void;
}

export const ClientQuoteFormNavigation = ({
  isFirstStep,
  isLastStep,
  isSubmitting,
  handlePrevious,
  handleNext,
  onSubmit,
}: ClientQuoteFormNavigationProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between pt-6 mt-6 border-t border-border"
    >
      <Button
        type="button"
        variant="ghost"
        onClick={handlePrevious}
        disabled={isFirstStep || isSubmitting}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      {isLastStep ? (
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="gap-2 bg-primary hover:bg-primary/90 px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar Cotação
              <Send className="h-4 w-4" />
            </>
          )}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleNext}
          className="gap-2 px-6"
        >
          Próximo
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
};
