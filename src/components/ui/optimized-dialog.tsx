

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface OptimizedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  unmountOnClose?: boolean;
  className?: string;
}

/**
 * OptimizedDialog - Modal otimizado para performance
 * SIMPLIFIED VERSION - Removida lógica complexa para debugging
 */
export const OptimizedDialog: React.FC<OptimizedDialogProps> = ({
  open,
  onOpenChange,
  children,
  unmountOnClose = true,
  className
}) => {
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Cleanup: aborta requisições pendentes ao fechar
  React.useEffect(() => {
    if (open) {
      abortControllerRef.current = new AbortController();
    } else {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[11000] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-opacity duration-150"
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[11001] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-white p-6 shadow-lg duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg focus:outline-none",
            className
          )}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

// Re-export componentes do dialog original para compatibilidade
export { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";
