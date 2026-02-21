import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  variant?: 'default' | 'destructive';
  showIcon?: boolean;
}

/**
 * Dialog de confirmação reutilizável
 * 
 * @example
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Excluir item?"
 *   description="Esta ação não pode ser desfeita."
 *   confirmText="Excluir"
 *   onConfirm={handleDelete}
 *   loading={loading}
 *   variant="destructive"
 * />
 */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  loading = false,
  variant = 'default',
  showIcon = true
}: ConfirmDialogProps) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showIcon && variant === 'destructive' && (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant}
            onClick={handleConfirm} 
            disabled={loading}
          >
            {loading ? 'Processando...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
