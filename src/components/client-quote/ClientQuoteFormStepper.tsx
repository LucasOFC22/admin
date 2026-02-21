import { cn } from "@/lib/utils";
import { QUOTE_STEPS } from "@/hooks/use-quote-form.tsx";
import { motion } from "framer-motion";

interface ClientQuoteFormStepperProps {
  activeStep: string;
  currentStepIndex: number;
}

export const ClientQuoteFormStepper = ({ currentStepIndex }: ClientQuoteFormStepperProps) => {
  const progressPercentage = ((currentStepIndex + 1) / QUOTE_STEPS.length) * 100;

  return (
    <div className="mb-8">
      {/* Indicador compacto */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {QUOTE_STEPS.map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index <= currentStepIndex 
                    ? "bg-primary w-6" 
                    : "bg-muted w-2"
                )}
              />
            ))}
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {currentStepIndex + 1}/{QUOTE_STEPS.length}
        </span>
      </div>

      {/* Título da etapa atual */}
      <motion.div
        key={currentStepIndex}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <span className="text-sm font-semibold text-foreground">
          {QUOTE_STEPS[currentStepIndex]?.title}
        </span>
        <span className="text-xs text-muted-foreground">
          — {QUOTE_STEPS[currentStepIndex]?.description}
        </span>
      </motion.div>
    </div>
  );
};
