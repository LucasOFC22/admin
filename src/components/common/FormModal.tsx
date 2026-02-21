import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FormActions } from './FormActions';
import { LucideIcon } from 'lucide-react';

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  loading?: boolean;
  submitText?: string;
  loadingText?: string;
  cancelText?: string;
  disabled?: boolean;
  showCancel?: boolean;
  variant?: 'default' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg', 
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-2xl'
};

export const FormModal = ({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  children,
  onSubmit,
  onCancel,
  loading = false,
  submitText = 'Salvar',
  loadingText = 'Salvando...',
  cancelText = 'Cancelar',
  disabled = false,
  showCancel = true,
  variant = 'default',
  size = 'lg',
  className = ''
}: FormModalProps) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${sizeClasses[size]} border-0 bg-gradient-to-br from-background via-background to-accent/5 shadow-2xl ${className}`}>
        <DialogHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="h-9 w-9 rounded-full bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
            <div>
              <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-6 pt-2">
          {children}
          
          <FormActions
            onCancel={handleCancel}
            loading={loading}
            submitText={submitText}
            loadingText={loadingText}
            cancelText={cancelText}
            disabled={disabled}
            showCancel={showCancel}
            variant={variant}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};