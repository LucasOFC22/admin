import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

interface ConfirmationModalProps {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onClose: (value: boolean) => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  children,
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{children}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => onClose(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onClose(false);
              onConfirm();
            }}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
