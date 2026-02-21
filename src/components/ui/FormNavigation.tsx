import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormNavigationProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  handlePrevious: () => void;
  handleNext: () => void;
  onSubmit?: () => void;
  // Styling variants
  variant?: "default" | "professional";
  // Custom text
  previousText?: string;
  nextText?: string;
  submitText?: string;
  loadingText?: string;
  // Custom classes
  containerClassName?: string;
  buttonClassName?: string;
}

export const FormNavigation = ({
  isFirstStep,
  isLastStep,
  isSubmitting,
  handlePrevious,
  handleNext,
  onSubmit,
  variant = "default",
  previousText = "Anterior",
  nextText = "Próximo",
  submitText = "Enviar",
  loadingText = "Enviando...",
  containerClassName,
  buttonClassName,
}: FormNavigationProps) => {
  
  const isProfessional = variant === "professional";
  
  const baseContainerClass = isProfessional 
    ? "flex justify-between items-center mt-12 pt-8 border-t border-gray-200"
    : "flex justify-between mt-8 pt-4 border-t border-gray-100";
    
  const baseButtonClass = isProfessional
    ? "h-12 px-8 transition-all duration-200"
    : "";
    
  const primaryButtonClass = isProfessional
    ? "h-12 px-10 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 text-white"
    : "bg-corporate-600 hover:bg-corporate-700";
    
  const outlineButtonClass = isProfessional
    ? "border-2 border-gray-300 hover:border-gray-600 hover:text-gray-800 text-gray-600"
    : "";

  return (
    <div className={cn(baseContainerClass, containerClassName)}>
      <Button
        type="button"
        variant="outline"
        onClick={handlePrevious}
        disabled={isFirstStep}
        className={cn(
          baseButtonClass,
          outlineButtonClass,
          !isFirstStep ? "visible" : "invisible",
          buttonClassName
        )}
      >
        <ArrowLeft size={isProfessional ? 18 : 16} className="mr-2" />
        {isProfessional ? "Voltar" : previousText}
      </Button>
      
      {isLastStep ? (
        <Button 
          type="button"
          onClick={onSubmit}
          className={cn(primaryButtonClass, buttonClassName)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            isProfessional ? (
              <span className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                {loadingText}
              </span>
            ) : (
              loadingText
            )
          ) : (
            isProfessional ? (
              <span className="flex items-center gap-3">
                <Send size={18} />
                {submitText}
              </span>
            ) : (
              submitText
            )
          )}
        </Button>
      ) : (
        <Button 
          type="button" 
          onClick={handleNext}
          className={cn(primaryButtonClass, buttonClassName)}
        >
          {isProfessional ? (
            <span className="flex items-center gap-3">
              Continuar
              <ArrowRight size={18} />
            </span>
          ) : (
            <>
              {nextText}
              <ArrowRight size={16} className="ml-2" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};