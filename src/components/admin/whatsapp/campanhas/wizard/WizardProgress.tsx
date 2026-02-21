import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, WizardStep } from './types';

interface WizardProgressProps {
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
  canNavigateTo?: (step: WizardStep) => boolean;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  onStepClick,
  canNavigateTo
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      {WIZARD_STEPS.map((stepInfo, index) => {
        const isCompleted = currentStep > stepInfo.id;
        const isCurrent = currentStep === stepInfo.id;
        const canClick = canNavigateTo?.(stepInfo.id as WizardStep) ?? isCompleted;
        
        return (
          <React.Fragment key={stepInfo.id}>
            <button
              type="button"
              onClick={() => canClick && onStepClick?.(stepInfo.id as WizardStep)}
              disabled={!canClick && !isCurrent}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                canClick && !isCurrent && "cursor-pointer hover:opacity-80",
                !canClick && !isCurrent && "cursor-not-allowed opacity-50"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepInfo.id}
              </div>
              <div className="text-center hidden sm:block">
                <p className={cn(
                  "text-xs font-medium",
                  isCurrent && "text-primary",
                  !isCurrent && "text-muted-foreground"
                )}>
                  {stepInfo.title}
                </p>
              </div>
            </button>
            
            {index < WIZARD_STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
